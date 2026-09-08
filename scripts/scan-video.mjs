#!/usr/bin/env node
/**
 * Scans public/assets/video and writes src/content/video-manifest.ts.
 *
 * The manifest is what the player reads to know whether a nugget has a rendered
 * visualizer to play instead of the CSS stage. Files are matched to segments by name
 * — u<unit>-n<nugget>.mp4, the same ids the Remotion compositions use — so producing
 * a nugget's video and running this script is all it takes to switch that nugget over.
 *
 * Durations come from the MP4 movie header rather than being trusted from anywhere
 * else: a truncated or placeholder file reports a length that will not match the
 * segment, and the player refuses it instead of putting the scrub bar in the wrong
 * place. The same lesson the audio scanner learned the hard way.
 *
 * NOT wired into prebuild, unlike the audio scanner. Once the renders live in a blob
 * store the local directory is empty, and a build-time scan would write an empty
 * manifest and silently drop every nugget back to the CSS stage. So the manifest is a
 * committed artifact: run this while the renders are still in public/assets/video,
 * commit the result, then upload and remove the files.
 *
 * Which is why the scan MERGES into the committed manifest rather than replacing it.
 * The blob store holds the renders; this directory is a staging area that holds
 * whichever nugget was produced most recently. A replacing scan would list that one
 * file and drop every nugget already shipped — the same accident the prebuild wiring
 * would have caused, one file at a time instead of all at once. A scanned track
 * replaces the entry for its own unit and nugget and leaves the rest alone.
 *
 * Pass `--prune` to write only what is on disk, for the case where a nugget is being
 * withdrawn on purpose. That is the only way an entry leaves the manifest.
 *
 * Run via `npm run scan:video`.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readDuration } from './lib/mp4.mjs';

const DIR = 'public/assets/video';
const OUT = 'src/content/video-manifest.ts';

const tracks = [];
if (existsSync(DIR)) {
  for (const name of readdirSync(DIR).sort()) {
    const match = /^u(\d+)-n(\d+)\.mp4$/.exec(name);
    if (!match) {
      // Explainer episodes stage through the same directory on their way to the store,
      // and they belong to src/content/explainers.ts, not to this manifest. Saying so
      // keeps a routine scan from reading like something went wrong.
      const other = /^claude-ep\d+\.mp4$/.test(name)
        ? 'explainer episode, declared in src/content/explainers.ts'
        : 'expected u<unit>-n<nugget>.mp4';
      console.log(`not a nugget track: ${name} — ${other}`);
      continue;
    }
    const path = join(DIR, name);
    const bytes = statSync(path).size;
    const duration = readDuration(path);
    tracks.push({ unit: match[1], n: Number(match[2]), file: `assets/video/${name}`, bytes, duration });
    console.log(`${name}  ${bytes} bytes  ${duration}s`);
  }
}

const prune = process.argv.includes('--prune');

/**
 * The tracks the committed manifest already lists.
 *
 * The generated file holds the array as plain JSON, so it is read back rather than
 * re-derived. A file that does not parse is a hand-edit or a partial write, and
 * merging into a guess would be worse than stopping.
 */
function committedTracks() {
  if (!existsSync(OUT)) return [];
  const current = readFileSync(OUT, 'utf8');
  // Anchored on the assignment itself: searching for the next '[' would find the one
  // in `VideoTrack[]`, two characters earlier.
  const MARK = 'videoTracks: VideoTrack[] = ';
  const at = current.indexOf(MARK);
  if (at < 0) return [];
  const open = at + MARK.length;
  const close = current.indexOf('\n];', open);
  if (current[open] !== '[' || close < 0) {
    console.error(`Could not read the track list out of ${OUT}. Fix or delete it first.`);
    process.exit(1);
  }
  try {
    return JSON.parse(current.slice(open, close + 2));
  } catch (err) {
    console.error(`${OUT} does not parse: ${err.message}\nFix or delete it first.`);
    process.exit(1);
  }
}

const key = (t) => `${t.unit}/${t.n}`;
let merged = tracks;
if (!prune) {
  const scanned = new Set(tracks.map(key));
  const kept = committedTracks().filter((t) => !scanned.has(key(t)));
  for (const t of kept) console.log(`kept ${t.file} (in the blob store, not on disk)`);
  merged = [...kept, ...tracks];
}
merged.sort((a, b) => a.unit.localeCompare(b.unit) || a.n - b.n);

// A scan that finds nothing and is asked to prune anyway would drop every nugget back
// to the CSS stage. That is the accident this script must not enable.
if (merged.length === 0 && existsSync(OUT)) {
  const current = readFileSync(OUT, 'utf8');
  if (/"file":\s*"assets\/video\//.test(current)) {
    console.error(
      `No files in ${DIR}, but ${OUT} lists renders already.\n` +
        'Refusing to write an empty manifest — that would drop every nugget back to the\n' +
        'CSS stage. The renders live in the blob store; the manifest is committed.\n' +
        'To rebuild it, restore the files to that directory first.',
    );
    process.exit(1);
  }
}

const body = `// GENERATED by scripts/scan-video.mjs — do not edit by hand.
// Regenerate with \`npm run scan:video\` after rendering or replacing a nugget video.

export interface VideoTrack {
  /** Unit number as written in the content, e.g. "01". */
  unit: string;
  /** 1-based nugget number inside the unit. */
  n: number;
  /** Path relative to the site root. */
  file: string;
  bytes: number;
  /** Playable length in seconds, read from the MP4 movie header. */
  duration: number;
}

export const videoTracks: VideoTrack[] = ${JSON.stringify(merged, null, 2)};

const byKey = new Map(videoTracks.map((v) => [\`\${v.unit}/\${v.n}\`, v]));

/**
 * The rendered visualizer for a nugget, when there is one long enough to cover it.
 *
 * \`needSeconds\` is the segment's own length. A file shorter than that is a truncated
 * or partial render, and playing it would strand the learner before the narration
 * ends — so it is treated as absent and the nugget falls back to the CSS stage.
 */
export function videoTrack(unit: string, n: number, needSeconds: number): VideoTrack | undefined {
  const track = byKey.get(\`\${unit}/\${n}\`);
  if (!track || track.duration <= 0) return undefined;
  // The render carries a short end card past the narration, so it is always longer.
  return track.duration >= needSeconds - 0.5 ? track : undefined;
}
`;

writeFileSync(OUT, body);
console.log(`\n${merged.length} video track(s) -> ${OUT}`);

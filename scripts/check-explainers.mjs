#!/usr/bin/env node
/**
 * Checks the declared length and size of each explainer episode against its file.
 *
 * Episodes are declared in src/content/explainers.ts rather than scanned, because an
 * episode is a finished film with editorial metadata around it, not a render the build
 * discovers. The cost of declaring is that the numbers can quietly stop matching the
 * file — a re-encode, a re-cut, a replaced upload — and the running time on screen is
 * the learner's promise about how long this will take.
 *
 * So: for every episode whose file is staged locally, the duration and byte count are
 * re-read and compared. An episode whose file is not staged is reported as unchecked
 * rather than passed, because the file lives in the blob store and there is nothing
 * here to compare against. Staging one is how you check it.
 *
 * Run via `npm run check:explainers`.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readDuration } from './lib/mp4.mjs';

const SRC = 'src/content/explainers.ts';
const src = readFileSync(SRC, 'utf8');

/**
 * Episodes as declared, read out of the module text.
 *
 * Anchored on `id` immediately followed by `n`, which is the episode shape — the
 * series object above them also opens with an `id`, and a looser pattern reads the
 * series id with the first episode's file. The count is then checked against the
 * number of declared files, so a change to the module's shape fails here instead of
 * quietly checking fewer episodes than exist.
 */
function declared() {
  const out = [];
  // Lazy between the fields, so optional ones (a poster, say) can sit among them
  // without the pattern going stale — but anchored on the three that must be there.
  const block =
    /id: '([^']+)',\s*\n\s*n: \d+,[\s\S]*?file: '([^']+)',[\s\S]*?duration: ([\d.]+),[\s\S]*?bytes: (\d+),/g;
  for (const m of src.matchAll(block)) {
    out.push({ id: m[1], file: m[2], duration: Number(m[3]), bytes: Number(m[4]) });
  }
  return out;
}

const episodes = declared();
const files = (src.match(/file: 'assets\/video\//g) ?? []).length;
if (episodes.length !== files) {
  console.error(
    `Read ${episodes.length} episode(s) out of ${SRC} but it declares ${files} file(s).\n` +
      'The module shape has changed and this check can no longer read it reliably.',
  );
  process.exit(1);
}
if (episodes.length === 0) {
  console.error(`Could not read any episode out of ${SRC}. Has its shape changed?`);
  process.exit(1);
}

let bad = 0;
let unchecked = 0;
for (const ep of episodes) {
  const local = `public/${ep.file}`;
  if (!existsSync(local)) {
    unchecked++;
    console.log(`  --   ${ep.id}  not staged at ${local}, unchecked`);
    continue;
  }
  const bytes = statSync(local).size;
  const duration = readDuration(local);
  const okBytes = bytes === ep.bytes;
  // Two decimals declared, so allow the rounding but nothing more.
  const okDuration = Math.abs(duration - ep.duration) < 0.011;
  if (okBytes && okDuration) {
    console.log(`  ok   ${ep.id}  ${duration}s  ${bytes} bytes`);
    continue;
  }
  bad++;
  if (!okDuration) console.log(`  BAD  ${ep.id}  duration: file=${duration}s  declared=${ep.duration}s`);
  if (!okBytes) console.log(`  BAD  ${ep.id}  bytes: file=${bytes}  declared=${ep.bytes}`);
}

console.log(
  `\n${episodes.length} episode(s): ${episodes.length - bad - unchecked} verified, ${unchecked} unchecked, ${bad} wrong`,
);
if (bad) {
  console.error(`\nUpdate ${SRC} to match the files, or restage the right ones.`);
  process.exit(1);
}

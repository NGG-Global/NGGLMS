/**
 * Turns a unit segment into a shot list on the frame clock.
 *
 * Cue positions come from src/player/timeline.ts — the same resolver the web player
 * uses — so a nugget's video and its in-app playback cut at identical moments. Nothing
 * about timing is re-authored here; this module only converts seconds to frames,
 * groups the cue run that shares a scene key into one shot, and covers the title read
 * that the cue list leaves out (see `leadShot`).
 */

import type { Scene, Segment } from '../../src/content/types';
import { buildTimeline, type Cue } from '../../src/player/timeline';
import { FPS } from '../theme';

export interface Shot {
  /** Scene key inside the segment, e.g. 'e'. */
  key: string;
  scene: Scene;
  from: number;
  durationInFrames: number;
  /** Cue starts relative to this shot's first frame, one entry per narration line. */
  cueAt: number[];
  /** The cue lines themselves, for captioning inside the shot. */
  cues: Cue[];
}

export interface Reel {
  shots: Shot[];
  /** Narration length in frames, before any outro. */
  narrationFrames: number;
  /** Trim window into the source mp3, in frames. */
  audio: { src: string; trimBefore: number; trimAfter: number };
  cues: Cue[];
}

const toFrames = (seconds: number) => Math.round(seconds * FPS);

/**
 * The shot for the read title, when the cue list has no line for it.
 *
 * Segments whose transcript arrived with timestamps open on a cue with empty text
 * pointing at the title scene, so it becomes a shot like any other. Segments on the
 * weighted path have no such cue — they carry `body` instead, the second the narration
 * stops reading the title — and their title scene ends up declared but never
 * referenced. Nugget 4 opened on four and a half seconds of empty stage under a spoken
 * title before this existed.
 *
 * So: if the first cue starts late and exactly one scene is unreferenced, that scene
 * covers the gap. Anything less certain (nothing unreferenced, or several) is left
 * alone rather than guessed at.
 */
function leadShot(segment: Segment, cues: Cue[], firstFrame: number): Shot | null {
  if (firstFrame < 15) return null;
  const used = new Set(cues.map((cue) => cue.scene));
  const spare = Object.keys(segment.scenes).filter((key) => !used.has(key));
  if (spare.length !== 1) return null;
  const key = spare[0];
  return {
    key,
    scene: segment.scenes[key],
    from: 0,
    durationInFrames: firstFrame,
    cueAt: [0],
    cues: [],
  };
}

export function buildReel(segment: Segment): Reel {
  const { cues, duration } = buildTimeline(segment);
  const shots: Shot[] = [];

  const lead = cues.length ? leadShot(segment, cues, toFrames(cues[0].t0)) : null;
  if (lead) shots.push(lead);

  for (const cue of cues) {
    const last = shots[shots.length - 1];
    if (last && last.key === cue.scene) {
      last.cues.push(cue);
      last.cueAt.push(toFrames(cue.t0) - last.from);
      last.durationInFrames = toFrames(cue.t1) - last.from;
      continue;
    }
    const scene = segment.scenes[cue.scene];
    // A cue pointing at a missing scene key would render an empty stage for its whole
    // run, so fail the render instead of shipping a hole.
    if (!scene) {
      throw new Error(`Segment ${segment.id} has no scene "${cue.scene}" for cue ${cue.index}`);
    }
    const from = toFrames(cue.t0);
    shots.push({
      key: cue.scene,
      scene,
      from,
      durationInFrames: toFrames(cue.t1) - from,
      cueAt: [0],
      cues: [cue],
    });
  }

  // Round-tripping each boundary through toFrames can leave a one-frame seam between
  // shots; butt them together so no background shows through on a cut.
  for (let i = 0; i < shots.length - 1; i++) {
    shots[i].durationInFrames = shots[i + 1].from - shots[i].from;
  }
  const tail = shots[shots.length - 1];
  if (tail) tail.durationInFrames = toFrames(duration) - tail.from;

  return {
    shots,
    narrationFrames: toFrames(duration),
    audio: {
      src: segment.src,
      trimBefore: toFrames(segment.start),
      trimAfter: toFrames(segment.end),
    },
    cues,
  };
}

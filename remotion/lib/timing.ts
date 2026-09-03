/**
 * Turns a unit segment into a shot list on the frame clock.
 *
 * Cue positions come from src/player/timeline.ts — the same resolver the web player
 * uses — so a nugget's video and its in-app playback cut at identical moments. Nothing
 * about timing is re-authored here; this module only converts seconds to frames and
 * groups the cue run that shares a scene key into one shot.
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

export function buildReel(segment: Segment): Reel {
  const { cues, duration } = buildTimeline(segment);
  const shots: Shot[] = [];

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

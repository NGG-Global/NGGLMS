/**
 * Motion vocabulary.
 *
 * Three rules hold across every scene, and they are what makes a stack of reveals
 * read as one film rather than a slide deck:
 *
 *   1. Everything enters on the same curve. `EASE_OUT` is a decelerating bezier —
 *      fast off the mark, long settle — so an element is legible early in its own
 *      entrance instead of arriving as the narrator moves on.
 *   2. Nothing enters instantly and nothing enters slowly. Entrances run 18-26
 *      frames; below ~12 the eye reads a pop, above ~34 the motion outlives the
 *      sentence that prompted it.
 *   3. Nothing is ever fully still. Long shots — scene 'e' holds for 31 seconds —
 *      carry a slow drift, well under the threshold where it becomes a distraction,
 *      because a frozen frame under live narration reads as a stall.
 */

import { Easing, interpolate } from 'remotion';

/** The house entrance curve. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** For anything that leaves, or travels between two resting places. */
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
/** A touch of overshoot, for marks that should feel struck rather than placed. */
export const EASE_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

export interface RevealOptions {
  /** Frames to wait before starting. */
  delay?: number;
  /** Frames the entrance runs for. */
  duration?: number;
  easing?: (t: number) => number;
}

/** Eased 0 -> 1 progress for an entrance starting at `delay`. */
export const reveal = (frame: number, { delay = 0, duration = 22, easing = EASE_OUT }: RevealOptions = {}) =>
  interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/**
 * Fades a shot in at its head and out at its tail.
 *
 * Cuts between shots are crossfades rather than hard cuts: the narration runs
 * continuously across a scene change, so a hard cut lands as a jolt against
 * unbroken audio. 10 frames is long enough to feel deliberate and short enough
 * that two scenes are never both legible.
 */
export const shotFade = (frame: number, durationInFrames: number, fade = 10) =>
  interpolate(
    frame,
    [0, fade, Math.max(fade + 1, durationInFrames - fade), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT },
  );

/** Slow sinusoidal drift, in px, that keeps a long shot alive. See rule 3. */
export const drift = (frame: number, amplitude = 6, periodInFrames = 420, phase = 0) =>
  Math.sin(((frame / periodInFrames) * Math.PI * 2) + phase) * amplitude;

/**
 * Staggers a list so items land in sequence.
 *
 * Reveals are keyed to the narration cue that mentions them wherever the copy makes
 * that possible, and this only spaces items inside one cue.
 */
export const stagger = (index: number, step = 7) => index * step;

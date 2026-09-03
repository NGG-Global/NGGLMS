import type { RawCue, Segment } from '../content/types';

/** A caption line with its resolved position on the segment clock (seconds from segment start). */
export interface Cue {
  index: number;
  text: string;
  scene: string;
  t0: number;
  t1: number;
}

export interface Timeline {
  cues: Cue[];
  /** Segment length in seconds. */
  duration: number;
  /** Ordered scene keys as they first appear, for prefetch and for the scene strip. */
  sceneOrder: string[];
  /** How cue positions were derived — surfaced in the player as a sync-quality note. */
  source: 'transcript' | 'speech-map' | 'weighted';
}

/**
 * A speech-density map for one narration file: `cum[i]` is the number of seconds of
 * actual speech before second `i * step`. Used to spread captions over speech time
 * rather than wall time, so a long pause does not swallow the next three lines.
 */
export interface SpeechMap {
  step: number;
  cum: number[];
}

/** Weight a cue by its own hint if given, else by text length; empty title cards get a floor. */
function cueWeight(cue: RawCue): number {
  if (cue[2] != null) return cue[2];
  return Math.max(14, cue[0].length);
}

/** Keeps cues strictly increasing and never shorter than `min`, without drifting past `duration`. */
function normalise(cues: Cue[], duration: number, min = 0.25): Cue[] {
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].t0 < cues[i - 1].t0 + min) cues[i].t0 = cues[i - 1].t0 + min;
  }
  // If the floor pushed the tail past the end, pull the whole tail back proportionally.
  const last = cues[cues.length - 1];
  if (last && last.t0 > duration - min) {
    const overshoot = last.t0 - (duration - min);
    const span = last.t0 - cues[0].t0;
    if (span > 0) {
      for (let i = 1; i < cues.length; i++) {
        cues[i].t0 -= overshoot * ((cues[i].t0 - cues[0].t0) / span);
      }
    }
  }
  for (let i = 0; i < cues.length - 1; i++) cues[i].t1 = cues[i + 1].t0;
  if (last) last.t1 = duration;
  return cues;
}

/**
 * Resolves a segment's caption cues onto the segment clock.
 *
 * Three strategies, best first:
 *   1. `timed` — the transcript arrived with block timestamps. Blocks are anchored
 *      verbatim (after applying tcBase/tcRate) and cues are spread inside each block
 *      by speech weight. This is accurate to roughly a line.
 *   2. `speechMap` — no block timestamps, but we know where the speech actually is in
 *      the audio, so cues are spread over speech time.
 *   3. weighted — neither, so cues are spread linearly by weight across the segment.
 */
export function buildTimeline(segment: Segment, speechMap?: SpeechMap): Timeline {
  const duration = segment.end - segment.start;
  const cues: Cue[] = [];

  if (segment.timed) {
    const base = (segment.tcBase != null ? segment.tcBase : segment.start) - segment.start;
    const rate = segment.tcRate ?? 1;
    for (const [blockStart, blockEnd, lines] of segment.timed) {
      const from = base + blockStart * rate;
      const to = base + blockEnd * rate;
      const weights = lines.map(cueWeight);
      const total = weights.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      lines.forEach((line, i) => {
        const t0 = from + (to - from) * (acc / total);
        acc += weights[i];
        cues.push({
          index: cues.length,
          text: line[0],
          scene: line[1],
          t0,
          t1: from + (to - from) * (acc / total),
        });
      });
    }
    return finish(cues, duration, 'transcript');
  }

  const raw = segment.cues ?? [];
  const weights = raw.map(cueWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  // Segments that open with a read title start their captions at `body`. `body` is on
  // the same clock as `start`, so re-pointing a segment at a different narration file
  // has to move both. Clamped because a `body` outside the segment would push every cue
  // past the end and the segment would play with no captions at all — a silent failure
  // that is much worse than starting the captions a little early.
  const rawBody = (segment.body != null ? segment.body : segment.start) - segment.start;
  const bodyStart = Math.min(Math.max(0, rawBody), Math.max(0, duration - 1));

  let at: (fraction: number) => number;
  let source: Timeline['source'] = 'weighted';

  const speech = speechMap && speechMap.cum.length > 1 ? speechMap : undefined;
  if (speech) {
    const { step, cum } = speech;
    const index = (t: number) => Math.max(0, Math.min(cum.length - 1, Math.round(t / step)));
    const lo0 = index(segment.start + bodyStart);
    const hi0 = index(segment.end);
    const from = cum[lo0];
    const span = cum[hi0] - from;
    if (span > 0) {
      source = 'speech-map';
      at = (fraction) => {
        const target = from + fraction * span;
        let lo = lo0;
        let hi = hi0;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cum[mid] < target) lo = mid + 1;
          else hi = mid;
        }
        return Math.max(0, Math.min(duration, lo * step - segment.start));
      };
    } else {
      at = (fraction) => bodyStart + fraction * (duration - bodyStart);
    }
  } else {
    at = (fraction) => bodyStart + fraction * (duration - bodyStart);
  }

  let acc = 0;
  raw.forEach((line, i) => {
    const t0 = at(acc / total);
    acc += weights[i];
    cues.push({
      index: i,
      text: line[0],
      scene: line[1],
      // Lead the caption very slightly so it is on screen as the line is spoken.
      t0: Math.max(0, t0 - 0.14),
      t1: at(acc / total),
    });
  });

  return finish(cues, duration, source);
}

function finish(cues: Cue[], duration: number, source: Timeline['source']): Timeline {
  const normalised = normalise(cues, duration);
  const sceneOrder: string[] = [];
  for (const cue of normalised) {
    if (!sceneOrder.includes(cue.scene)) sceneOrder.push(cue.scene);
  }
  return { cues: normalised, duration, sceneOrder, source };
}

/** Index of the cue on screen at time `t`; binary search, so it is cheap per frame. */
export function cueAt(cues: Cue[], t: number): number {
  if (!cues.length) return 0;
  let lo = 0;
  let hi = cues.length - 1;
  if (t < cues[0].t0) return 0;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cues[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

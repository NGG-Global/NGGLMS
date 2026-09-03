/**
 * Content model for an NGG learning unit.
 *
 * A unit is a narrated lesson split into five "nuggets" (segments). Each segment
 * carries three tracks that play against one clock:
 *   1. narration  — a slice [start, end] of an mp3 file
 *   2. captions    — Hebrew cue lines, anchored to the transcript timeline
 *   3. scenes      — full-frame animated stage cards, one per cue
 *
 * Cue timing lives in `timed` when the transcript came with timestamps, and in
 * `cues` otherwise; `buildTimeline` normalises both into a single cue list.
 */

/** A single caption line: [text, sceneKey, weight?]. Empty text = read title, shown as a title card. */
export type RawCue = [text: string, scene: string, weight?: number];

/** A transcript block: [startSec, endSec, cues] on the transcript clock, relative to segment start. */
export type TimedBlock = [start: number, end: number, cues: RawCue[]];

export type SceneTone = 'dark' | 'light';

export type Scene =
  | { kind: 'type'; tone?: SceneTone; head: string; sub?: string; accent?: string; logo?: boolean }
  | { kind: 'chips'; tone?: SceneTone; head: string; items: string[] }
  | { kind: 'flow'; tone?: SceneTone; head: string; nodes: string[]; foot?: string }
  | { kind: 'negspace'; tone?: SceneTone; head: string; items: string[] }
  | { kind: 'questions'; tone?: SceneTone; head: string; items: string[] }
  | { kind: 'principle'; tone?: SceneTone; label: string; off: string; on: string }
  | { kind: 'gauge'; tone?: SceneTone; head: string; items: string[] }
  | { kind: 'butlist'; tone?: SceneTone; head: string; items: [string, string][] }
  | { kind: 'twoq'; tone?: SceneTone; head: string; items: [string, string][] }
  | { kind: 'dial'; tone?: SceneTone; head: string; low: string; high: string }
  | { kind: 'quote'; tone?: SceneTone; head?: string; quote: string; foot?: string }
  | { kind: 'stairs'; tone?: SceneTone; head: string; items: [string, string][] }
  | { kind: 'mock'; tone?: SceneTone; prompt: string; reply: string; label?: string };

/** Sort rows into two columns; `items` is [label, correctColumnIndex]. */
export interface ExSort {
  kind: 'sort';
  head: string;
  sub: string;
  cols: string[];
  items: [string, number][];
  after: string;
}

/** Assign rows to a control level; `items` is [label, correctLevelIndex]. */
export interface ExAssign {
  kind: 'assign';
  head: string;
  sub: string;
  levels: string[];
  items: [string, number][];
  after: string;
}

/** Two judgement axes; the summed answer picks one of `levels` as the verdict. */
export interface ExSliders {
  kind: 'sliders';
  head: string;
  sub: string;
  axes: { label: string; opts: string[] }[];
  levels: string[];
  after: string;
}

/** Multi-select; `items` is [label, isCorrect]. */
export interface ExMulti {
  kind: 'multi';
  head: string;
  sub: string;
  items: [string, boolean][];
  after: string;
}

/** Build a prompt by picking context chips; `chips` is [label, _unused, isCorrect]. */
export interface ExBuilder {
  kind: 'builder';
  head: string;
  sub: string;
  prompt: string;
  chips: [string, unknown, boolean][];
  after: string;
}

export type Exercise = ExSort | ExAssign | ExSliders | ExMulti | ExBuilder;

export interface Segment {
  id: string;
  /** 1-based nugget number inside the unit. */
  n: number;
  title: string;
  /** Short eyebrow label shown over the stage. */
  kicker: string;
  /** Path to the narration file, relative to the site root. */
  src: string;
  /** Slice of the narration file this segment occupies, in seconds. */
  start: number;
  end: number;
  /** Transcript-clock origin, when it differs from `start`. */
  tcBase?: number;
  /** Transcript-to-audio clock ratio, when the transcript ran at a different rate. */
  tcRate?: number;
  /** First second of narration body, when the segment opens with a read title. */
  body?: number;
  timed?: TimedBlock[];
  cues?: RawCue[];
  scenes: Record<string, Scene>;
  /** Reflection prompt shown when the narration ends. */
  think: string;
  ex: Exercise;
}

export interface UnitIntro {
  src: string;
  start: number;
  end: number;
}

export interface UnitHeader {
  n: string;
  title: string;
  lead: string;
  intro: UnitIntro;
}

export interface UnitContent {
  unit: UnitHeader;
  segments: Segment[];
}

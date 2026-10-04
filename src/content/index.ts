import type { Segment, UnitContent } from './types';
import { unit01 } from './unit-01';
import { unit02 } from './unit-02';
import { library, libraryUnit, type LibraryUnit } from './library';
import { hasNarration } from './narration-manifest';
import { videoTrack, videoTracks } from './video-manifest';
import { explainerSeries } from './explainers';

export * from './types';
export * from './library';
export * from './topics';
export { hasNarration, narrationTrack, narrationTracks } from './narration-manifest';

/**
 * Playable units, keyed by the `contentId` referenced from the library.
 *
 * The ids are new with the Copilot Essentials films. Saved progress is keyed by
 * contentId, and records made against the retired units ('unit-01', 'unit-02') must not
 * be read as scores on the new ones, so the ids were changed rather than reused.
 */
export const builtUnits: Record<string, UnitContent> = {
  'copilot-01': unit01,
  'copilot-02': unit02,
};

export interface SegmentHealth {
  segmentId: string;
  n: number;
  title: string;
  /** Narration file this segment plays from. */
  src: string;
  /** Second the segment must reach inside that file. */
  needsUntil: number;
  durationSec: number;
  cueCount: number;
  sceneCount: number;
  hasAudio: boolean;
  /** A rendered visualizer exists, so this nugget plays video instead of the stage. */
  hasVideo: boolean;
}

export interface UnitHealth {
  contentId: string;
  unitNumber: string;
  title: string;
  segments: SegmentHealth[];
  /** Segments whose narration file is missing or too short. */
  silentSegments: SegmentHealth[];
  /** Segments playing a rendered visualizer rather than the CSS stage. */
  videoSegments: SegmentHealth[];
  totalSec: number;
  introHasAudio: boolean;
}

/** A film the player can stream: its store path and measured length. */
export interface FilmTrack {
  file: string;
  duration: number;
}

/**
 * Every film in the blob store whose length is known, by store path: the nugget renders
 * in the video manifest, and the Claude episodes declared in explainers.ts (which the
 * video scan deliberately leaves to that file).
 */
const filmsByFile = new Map<string, FilmTrack>([
  ...videoTracks.map((t) => [t.file, { file: t.file, duration: t.duration }] as const),
  ...explainerSeries.episodes.map((e) => [e.file, { file: e.file, duration: e.duration }] as const),
]);

/**
 * The film a nugget plays, if any.
 *
 * A nugget produced as a finished film names that film in `src`, and is matched by it.
 * That keeps courses apart: two units can both be numbered "01" without one picking up
 * the other's videos. Only a narrated nugget (an audio `src`) falls back to the older
 * match by unit and nugget number, for a render made to play over its narration.
 * Either way a film shorter than the nugget is refused, as in `videoTrack`.
 */
export function segmentVideo(unitN: string, s: Segment): FilmTrack | undefined {
  const need = s.end - s.start;
  if (s.src.startsWith('assets/video/')) {
    const film = filmsByFile.get(s.src);
    return film && film.duration > 0 && film.duration >= need - 0.5 ? film : undefined;
  }
  return videoTrack(unitN, s.n, need);
}

/**
 * True when a learner will hear this nugget: its narration file is delivered, or a
 * film covers it. A film carries its own voice track, so a nugget produced as a
 * finished film needs no separate narration file.
 */
export function segmentHasVoice(unitN: string, s: Segment): boolean {
  return hasNarration(s.src, s.end) || Boolean(segmentVideo(unitN, s));
}

function cueCount(s: Segment): number {
  if (s.timed) return s.timed.reduce((sum, block) => sum + block[2].length, 0);
  return s.cues?.length ?? 0;
}

export function unitHealth(contentId: string): UnitHealth | null {
  const content = builtUnits[contentId];
  if (!content) return null;
  const segments: SegmentHealth[] = content.segments.map((s) => ({
    segmentId: s.id,
    n: s.n,
    title: s.title,
    src: s.src,
    needsUntil: s.end,
    durationSec: s.end - s.start,
    cueCount: cueCount(s),
    sceneCount: Object.keys(s.scenes).length,
    hasAudio: segmentHasVoice(content.unit.n, s),
    hasVideo: Boolean(segmentVideo(content.unit.n, s)),
  }));
  return {
    contentId,
    unitNumber: content.unit.n,
    title: content.unit.title,
    segments,
    silentSegments: segments.filter((s) => !s.hasAudio),
    videoSegments: segments.filter((s) => s.hasVideo),
    totalSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
    introHasAudio: content.unit.intro ? hasNarration(content.unit.intro.src, content.unit.intro.end) : false,
  };
}

/** Health for every produced unit — what the admin content-health panel renders. */
export function allUnitHealth(): UnitHealth[] {
  return Object.keys(builtUnits)
    .map(unitHealth)
    .filter((h): h is UnitHealth => h !== null);
}

/** True when the library entry has narrated content a learner can actually play. */
export function isPlayable(unit: LibraryUnit): boolean {
  return Boolean(unit.contentId && builtUnits[unit.contentId]);
}

/**
 * Runtime minutes for a library unit: measured from the produced segments when the
 * unit is built, and falling back to the catalogue estimate when it is not.
 */
export function unitMinutes(unit: LibraryUnit): number {
  const content = unit.contentId ? builtUnits[unit.contentId] : undefined;
  if (!content) return unit.minutes;
  const seconds = content.segments.reduce((sum, s) => sum + (s.end - s.start), 0);
  return Math.round(seconds / 60);
}

/** Nugget list for a library unit, preferring produced segments over catalogue copy. */
export function unitNuggets(unit: LibraryUnit): { title: string; type: string; minutes: number; summary?: string }[] {
  const content = unit.contentId ? builtUnits[unit.contentId] : undefined;
  if (!content) return unit.nuggets;
  return content.segments.map((s) => ({
    title: s.title,
    type: s.kicker,
    minutes: Math.max(1, Math.round((s.end - s.start) / 60)),
    summary: s.think,
  }));
}

/**
 * Relative length of each nugget, for bars drawn to scale. Produced units use the
 * measured segment lengths in seconds; catalogue units use their planned minutes.
 * Only the ratios within one unit matter, so the two scales never need to agree.
 */
export function nuggetWeights(unit: LibraryUnit): number[] {
  const content = unit.contentId ? builtUnits[unit.contentId] : undefined;
  if (content) return content.segments.map((s) => Math.max(1, s.end - s.start));
  return unit.nuggets.map((n) => Math.max(1, n.minutes));
}

export const playableLibrary: LibraryUnit[] = library.filter(isPlayable);

export { library, libraryUnit };
export type { LibraryUnit };

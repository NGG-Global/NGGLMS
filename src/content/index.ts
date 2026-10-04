import type { Segment, UnitContent } from './types';
import { unit01 } from './unit-01';
import { unit02 } from './unit-02';
import { library, libraryUnit, type LibraryUnit } from './library';
import { hasNarration } from './narration-manifest';
import { videoTrack } from './video-manifest';

export * from './types';
export * from './library';
export * from './topics';
export { hasNarration, narrationTrack, narrationTracks } from './narration-manifest';

/** Playable units, keyed by the `contentId` referenced from the library. */
export const builtUnits: Record<string, UnitContent> = {
  'unit-01': unit01,
  'unit-02': unit02,
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

/**
 * True when a learner will hear this nugget: its narration file is delivered, or a
 * rendered video covers it. A video carries its own voice track, so a nugget produced
 * as a finished film needs no separate narration file.
 */
export function segmentHasVoice(unitN: string, s: Segment): boolean {
  return hasNarration(s.src, s.end) || Boolean(videoTrack(unitN, s.n, s.end - s.start));
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
    hasVideo: Boolean(videoTrack(content.unit.n, s.n, s.end - s.start)),
  }));
  return {
    contentId,
    unitNumber: content.unit.n,
    title: content.unit.title,
    segments,
    silentSegments: segments.filter((s) => !s.hasAudio),
    videoSegments: segments.filter((s) => s.hasVideo),
    totalSec: segments.reduce((sum, s) => sum + s.durationSec, 0),
    introHasAudio: hasNarration(content.unit.intro.src, content.unit.intro.end),
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

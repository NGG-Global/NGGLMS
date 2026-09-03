import type { Segment, UnitContent } from './types';
import { unit01 } from './unit-01';
import { unit02 } from './unit-02';
import { library, libraryUnit, type LibraryUnit } from './library';
import { hasNarration } from './narration-manifest';

export * from './types';
export * from './library';
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
}

export interface UnitHealth {
  contentId: string;
  unitNumber: string;
  title: string;
  segments: SegmentHealth[];
  /** Segments whose narration file is missing or too short. */
  silentSegments: SegmentHealth[];
  totalSec: number;
  introHasAudio: boolean;
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
    hasAudio: hasNarration(s.src, s.end),
  }));
  return {
    contentId,
    unitNumber: content.unit.n,
    title: content.unit.title,
    segments,
    silentSegments: segments.filter((s) => !s.hasAudio),
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

export const playableLibrary: LibraryUnit[] = library.filter(isPlayable);

export { library, libraryUnit };
export type { LibraryUnit };

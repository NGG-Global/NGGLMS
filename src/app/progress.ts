import { builtUnits, libraryUnit, type LibraryUnit } from '../content';
import type { LearnerProgress, Program } from '../state/types';

export interface UnitCompletion {
  /** Segments whose exercise has been checked. */
  practised: number;
  /** Segments watched to the end. */
  watched: number;
  total: number;
  pct: number;
  complete: boolean;
  /** Index of the first unfinished segment, for "continue where you left off". */
  resumeIndex: number;
  score?: { correct: number; outOf: number };
}

const EMPTY: UnitCompletion = { practised: 0, watched: 0, total: 0, pct: 0, complete: false, resumeIndex: 0 };

export function unitCompletion(progress: LearnerProgress, contentId?: string): UnitCompletion {
  if (!contentId) return EMPTY;
  const content = builtUnits[contentId];
  if (!content) return EMPTY;
  const records = progress[contentId] ?? {};
  const segments = content.segments;
  let practised = 0;
  let watched = 0;
  let correct = 0;
  let outOf = 0;
  let resumeIndex = -1;
  segments.forEach((segment, i) => {
    const record = records[segment.id];
    if (record?.practised) practised += 1;
    else if (resumeIndex < 0) resumeIndex = i;
    if (record?.watched) watched += 1;
    if (record?.outOf) {
      correct += record.score ?? 0;
      outOf += record.outOf;
    }
  });
  const total = segments.length;
  return {
    practised,
    watched,
    total,
    pct: total ? Math.round((practised / total) * 100) : 0,
    complete: total > 0 && practised === total,
    resumeIndex: resumeIndex < 0 ? Math.max(0, total - 1) : resumeIndex,
    score: outOf ? { correct, outOf } : undefined,
  };
}

export interface ProgramCompletion {
  /** Units in the programme that have produced content and can actually be completed. */
  playable: LibraryUnit[];
  /** Units still in production; visible to the learner but not counted. */
  pending: LibraryUnit[];
  /** Units finished end to end. */
  done: number;
  /** Percentage of the programme's nuggets completed. */
  pct: number;
  complete: boolean;
  /** Next unit the learner should open. */
  nextUnitId?: string;
}

export function programUnits(program: Program): LibraryUnit[] {
  return program.units.map((id) => libraryUnit(id)).filter((u): u is LibraryUnit => Boolean(u));
}

export function programCompletion(program: Program, progress: LearnerProgress): ProgramCompletion {
  const units = programUnits(program);
  const playable = units.filter((u) => u.contentId && builtUnits[u.contentId]);
  const pending = units.filter((u) => !u.contentId || !builtUnits[u.contentId]);
  let done = 0;
  let segmentsDone = 0;
  let segmentsTotal = 0;
  let nextUnitId: string | undefined;
  for (const unit of playable) {
    const completion = unitCompletion(progress, unit.contentId);
    segmentsDone += completion.practised;
    segmentsTotal += completion.total;
    if (completion.complete) done += 1;
    else if (!nextUnitId) nextUnitId = unit.id;
  }
  const total = playable.length;
  return {
    playable,
    pending,
    done,
    // Weighted by nugget, not by unit: someone four nuggets into a five-nugget unit has
    // made real progress, and a unit-only count would report that as zero.
    pct: segmentsTotal ? Math.round((segmentsDone / segmentsTotal) * 100) : 0,
    complete: total > 0 && done === total,
    nextUnitId: nextUnitId ?? playable[0]?.id,
  };
}

/**
 * Whether a unit is open to the learner.
 *
 * Sequential programmes unlock one unit at a time; units still in production are never
 * open, because there is nothing to play.
 */
export function unitLocked(program: Program, unit: LibraryUnit, progress: LearnerProgress): boolean {
  if (!unit.contentId || !builtUnits[unit.contentId]) return true;
  if (!program.sequential) return false;
  const units = programUnits(program).filter((u) => u.contentId && builtUnits[u.contentId]);
  const position = units.findIndex((u) => u.id === unit.id);
  if (position <= 0) return false;
  return !unitCompletion(progress, units[position - 1].contentId).complete;
}

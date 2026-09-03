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

/* ============================================================================
   Derived analytics.

   The redesign's dashboard and analytics screens read these rather than carrying
   figures of their own. Everything here comes out of the workspace: cohort sizes and
   completion from progress records, idle days from `Learner.lastActiveAt`, exercise
   accuracy from the per-segment scores.

   One thing is deliberately not here: activity over past weeks. The workspace stores
   current state, not an event log, so a 12-week active-learners series cannot be derived
   from it — see src/content/demo-analytics.ts.
   ========================================================================== */

import type { Learner, Milestone, Workspace } from '../state/types';

/** Whole days since the learner last touched a nugget; Infinity if they never have. */
export function idleDays(learner: Learner, now = Date.now()): number {
  if (!learner.lastActiveAt) return Number.POSITIVE_INFINITY;
  return Math.floor((now - new Date(learner.lastActiveAt).getTime()) / 86_400_000);
}

export function learnersOf(workspace: Workspace, programId: string): Learner[] {
  return workspace.learners.filter((l) => l.programIds.includes(programId));
}

/** Learners who touched something inside the window. */
export function activeLearners(workspace: Workspace, withinDays = 7, now = Date.now()): Learner[] {
  return workspace.learners.filter((l) => idleDays(l, now) <= withinDays);
}

export type ProgramScope = 'mine' | 'team' | 'all';

/** The שלי / של הצוות split, which is what `Program.owner` exists for. */
export function programsByScope(programs: Program[], owner: string, scope: ProgramScope): Program[] {
  if (scope === 'all') return programs;
  return programs.filter((p) => (scope === 'mine' ? p.owner === owner : p.owner !== owner));
}

export interface ProgramStats {
  program: Program;
  learners: number;
  /** Learners who have completed every playable unit. */
  completed: number;
  /** Mean nugget-level progress across the cohort. */
  avgPct: number;
  started: boolean;
}

export function programStats(workspace: Workspace, program: Program): ProgramStats {
  const cohort = learnersOf(workspace, program.id);
  const values = cohort.map((l) => programCompletion(program, workspace.progress[l.id] ?? {}));
  const avgPct = values.length ? Math.round(values.reduce((a, b) => a + b.pct, 0) / values.length) : 0;
  return {
    program,
    learners: cohort.length,
    completed: values.filter((v) => v.complete).length,
    avgPct,
    started: values.some((v) => v.pct > 0),
  };
}

/** Mean exercise accuracy for one produced unit, across everyone who has attempted it. */
export function unitScore(workspace: Workspace, contentId: string): number | null {
  let correct = 0;
  let outOf = 0;
  for (const perLearner of Object.values(workspace.progress)) {
    for (const record of Object.values(perLearner[contentId] ?? {})) {
      if (!record.outOf) continue;
      correct += record.score ?? 0;
      outOf += record.outOf;
    }
  }
  return outOf ? Math.round((correct / outOf) * 100) : null;
}

/** Mean exercise accuracy across every produced unit. */
export function overallScore(workspace: Workspace): number | null {
  let correct = 0;
  let outOf = 0;
  for (const perLearner of Object.values(workspace.progress)) {
    for (const perUnit of Object.values(perLearner)) {
      for (const record of Object.values(perUnit)) {
        if (!record.outOf) continue;
        correct += record.score ?? 0;
        outOf += record.outOf;
      }
    }
  }
  return outOf ? Math.round((correct / outOf) * 100) : null;
}

/** Where a learner stopped inside a programme, as the at-risk table phrases it. */
export function stallPoint(program: Program, progress: LearnerProgress): string {
  const units = programUnits(program).filter((u) => u.contentId && builtUnits[u.contentId]);
  for (let i = 0; i < units.length; i++) {
    const completion = unitCompletion(progress, units[i].contentId);
    if (completion.complete) continue;
    if (completion.practised === 0) return i === 0 ? 'לא התחיל' : `יחידה ${i + 1} · נאגט 1`;
    if (completion.practised >= completion.total) return `יחידה ${i + 1} · תרגיל`;
    return `יחידה ${i + 1} · נאגט ${completion.practised + 1}`;
  }
  return 'הושלם';
}

export interface AtRiskLearner {
  learner: Learner;
  program?: Program;
  days: number;
  stuck: string;
  /** Exercise accuracy, or null when they have not attempted one. */
  score: number | null;
}

/**
 * Learners idle for `threshold` days or more, worst first.
 *
 * Never-active learners are excluded: they are a separate problem (never invited in, or
 * never opened the link) and lumping them in would hide the people who started and
 * stalled, who are the ones a reminder can still reach.
 */
export function atRiskLearners(workspace: Workspace, threshold = 10, now = Date.now()): AtRiskLearner[] {
  const byId = new Map(workspace.programs.map((p) => [p.id, p]));
  return workspace.learners
    .filter((l) => {
      const days = idleDays(l, now);
      return Number.isFinite(days) && days >= threshold;
    })
    .map((learner) => {
      const progress = workspace.progress[learner.id] ?? {};
      const program = learner.programIds.map((id) => byId.get(id)).find((p): p is Program => Boolean(p));
      let correct = 0;
      let outOf = 0;
      for (const perUnit of Object.values(progress)) {
        for (const record of Object.values(perUnit)) {
          if (!record.outOf) continue;
          correct += record.score ?? 0;
          outOf += record.outOf;
        }
      }
      return {
        learner,
        program,
        days: idleDays(learner, now),
        stuck: program ? stallPoint(program, progress) : '—',
        score: outOf ? Math.round((correct / outOf) * 100) : null,
      };
    })
    .sort((a, b) => b.days - a.days);
}

/** Total nuggets completed across the workspace — the "יחידות שהושלמו" style figures. */
export function totalNuggetsCompleted(workspace: Workspace): number {
  let total = 0;
  for (const perLearner of Object.values(workspace.progress)) {
    for (const perUnit of Object.values(perLearner)) {
      total += Object.values(perUnit).filter((r) => r.practised).length;
    }
  }
  return total;
}

/** Learning time actually delivered, from produced nugget lengths times completions. */
export function learningHours(workspace: Workspace): number {
  let seconds = 0;
  for (const perLearner of Object.values(workspace.progress)) {
    for (const [contentId, perUnit] of Object.entries(perLearner)) {
      const content = builtUnits[contentId];
      if (!content) continue;
      for (const segment of content.segments) {
        if (perUnit[segment.id]?.practised) seconds += segment.end - segment.start;
      }
    }
  }
  return Math.round(seconds / 3600);
}

export function milestonesFor(workspace: Workspace): Milestone[] {
  return workspace.milestones ?? [];
}

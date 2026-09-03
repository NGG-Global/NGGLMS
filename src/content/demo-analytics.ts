/**
 * Figures the workspace cannot derive.
 *
 * Everything else on the dashboard and analytics screens is computed from real records
 * (see the derived-analytics section of src/app/progress.ts). These are not, because the
 * workspace stores current state and not an event log: there is no record of who was
 * active in week 6, so a 12-week series cannot be reconstructed from it.
 *
 * They are demo data, matching the approved design, and the analytics screen labels them
 * as such. Making them real needs an activity log — a row per learner per nugget
 * completion with a timestamp — which is a larger change than the redesign itself and is
 * not in scope here.
 */

export interface DaySlice {
  /** Single-letter Hebrew weekday. */
  label: string;
  nuggets: number;
}

/** Nuggets completed per day over the last week. */
export const weekActivity: DaySlice[] = [
  { label: 'א', nuggets: 34 },
  { label: 'ב', nuggets: 61 },
  { label: 'ג', nuggets: 48 },
  { label: 'ד', nuggets: 72 },
  { label: 'ה', nuggets: 55 },
  { label: 'ו', nuggets: 18 },
  { label: 'ש', nuggets: 9 },
];

export interface WeekSlice {
  /** Learners active that week. */
  active: number;
  /** Of those, how many finished a unit. */
  completed: number;
}

/** Twelve weeks of engagement, oldest first; the last entry is the current week. */
export const engagementWeeks: WeekSlice[] = [
  { active: 38, completed: 9 },
  { active: 52, completed: 14 },
  { active: 61, completed: 18 },
  { active: 55, completed: 16 },
  { active: 74, completed: 22 },
  { active: 88, completed: 29 },
  { active: 96, completed: 31 },
  { active: 79, completed: 24 },
  { active: 104, completed: 33 },
  { active: 118, completed: 38 },
  { active: 131, completed: 44 },
  { active: 141, completed: 52 },
];

/** Median minutes a learner spends on one unit. Needs per-session timing to be real. */
export const medianUnitMinutes = 19;

/**
 * Learning time expected this month, against which delivered hours are shown.
 * A target, not a measurement — the delivered figure beside it is computed from real
 * completions in src/app/progress.ts.
 */
export const monthlyHoursTarget = 120;

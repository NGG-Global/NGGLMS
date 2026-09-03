export type ProgramStatus = 'draft' | 'ready' | 'published' | 'archived';

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  draft: 'טיוטה',
  ready: 'מוכן לפרסום',
  published: 'פורסם',
  archived: 'בארכיון',
};

export interface Program {
  id: string;
  /** Content manager who created and manages it — drives the שלי / של הצוות split. */
  owner: string;
  /** Display label for the current cohort, e.g. "מחזור 2 · ספטמבר". */
  cohort: string;
  /** Client or internal organisation the programme is built for. */
  client: string;
  /** Internal project reference; optional. */
  internalName: string;
  /** Programme name, shown to admins. */
  title: string;
  /** Course name, shown to learners. */
  course: string;
  description: string;
  audience: string;
  role: string;
  language: string;
  /** Library unit ids, in learning order. */
  units: string[];
  welcome: string;
  closing: string;
  /** Learners must finish units in order. */
  sequential: boolean;
  /** Every unit must be completed for the programme to count as done. */
  requireAll: boolean;
  /** Every unit's exercise must be checked, not just watched. */
  requireAssessment: boolean;
  status: ProgramStatus;
  /** Short code appended to the learner link. */
  accessCode: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  /** Business unit or department. */
  org: string;
  programIds: string[];
  createdAt: string;
  /**
   * Last time this learner touched a nugget. Written whenever progress is recorded,
   * and what the idle-days and at-risk figures are derived from — without it there is
   * no way to tell a learner who finished last week from one who stalled a month ago.
   */
  lastActiveAt?: string;
}

/** A dated point in a programme's cohort calendar. */
export interface Milestone {
  /** Day of month. */
  day: number;
  /** Short month label, e.g. "ספט". */
  month: string;
  title: string;
  subtitle: string;
  kind: 'קיקאוף' | 'דדליין' | 'דוח';
}

export interface SegmentRecord {
  watched?: boolean;
  practised?: boolean;
  score?: number;
  outOf?: number;
  lastT?: number;
}

/** contentId → segmentId → record */
export type LearnerProgress = Record<string, Record<string, SegmentRecord>>;

/**
 * Which unit openings a learner has already heard.
 *
 * Keyed by contentId. Decides whether starting a unit routes through the opening
 * screen or straight to a nugget.
 */
export type IntroHeard = Record<string, true>;

export interface Workspace {
  programs: Program[];
  learners: Learner[];
  /** Progress for every learner the workspace knows about. */
  progress: Record<string, LearnerProgress>;
  /** Openings heard, per learner. */
  introsHeard: Record<string, IntroHeard>;
  /** Cohort calendar for the workspace. */
  milestones: Milestone[];
  updatedAt: string;
}

export interface Identity {
  id: string;
  name: string;
  email: string;
  org: string;
  role: 'admin' | 'learner';
}

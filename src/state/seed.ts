import { seedFlagshipProgram } from '../content/library';
import { builtUnits, libraryUnit } from '../content';
import type { Learner, LearnerProgress, Milestone, Program, ProgramStatus, Workspace } from './types';

/** The signed-in content manager in the seeded workspace. */
export const SEED_OWNER = 'מאיה כהן';

const STATUS: Record<string, ProgramStatus> = {
  פורסם: 'published',
  טיוטה: 'draft',
  'מוכן לפרסום': 'ready',
  בארכיון: 'archived',
};

/**
 * The seven programmes from the approved design, with the owner and cohort the redesign
 * introduced. `learnerTarget` and `avgPct` shape the generated roster below so the
 * headline numbers are computed from real records rather than written into the screens.
 */
const SEED_PROGRAMS: {
  id: string;
  title: string;
  course: string;
  client: string;
  audience: string;
  role: string;
  units: string[];
  status: string;
  owner: string;
  cohort: string;
  learnerTarget: number;
  avgPct: number;
}[] = [
  {
    id: 'p1',
    title: 'יסודות AI לכל העובדים',
    course: seedFlagshipProgram.course,
    client: 'נורת׳ווינד',
    audience: 'כל העובדים',
    role: 'כללי',
    units: seedFlagshipProgram.units,
    status: 'פורסם',
    owner: SEED_OWNER,
    cohort: 'מחזור 2 · ספטמבר',
    learnerTarget: 320,
    avgPct: 54,
  },
  {
    id: 'p2',
    title: 'הטמעת AI בצוות משאבי אנוש',
    course: 'AI בעבודת משאבי אנוש',
    client: 'פבריקם',
    audience: 'שותפי HR',
    role: 'משאבי אנוש',
    units: ['u1', 'u2', 'u12'],
    status: 'טיוטה',
    owner: SEED_OWNER,
    cohort: 'מחזור טרם נקבע',
    learnerTarget: 0,
    avgPct: 0,
  },
  {
    id: 'p3',
    title: 'ספרינט AI למכירות',
    course: 'למכור טוב יותר עם AI',
    client: 'אדוונצ׳ר וורקס',
    audience: 'מנהלי לקוחות',
    role: 'מכירות',
    units: ['u1', 'u2', 'u4', 'u6', 'u13'],
    status: 'מוכן לפרסום',
    owner: SEED_OWNER,
    cohort: 'קיקאוף 8 בספטמבר',
    learnerTarget: 0,
    avgPct: 0,
  },
  {
    id: 'p4',
    title: 'יסודות למנהלים — מחזור 2',
    course: 'להוביל צוות בעידן ה-AI',
    client: 'קונטוסו',
    audience: 'מנהלים בדרג ראשון',
    role: 'מנהל עובדים',
    units: ['u1', 'u2', 'u3', 'u7', 'u8', 'u11', 'u6'],
    status: 'פורסם',
    owner: SEED_OWNER,
    cohort: 'דדליין 14 בספטמבר',
    learnerTarget: 88,
    avgPct: 91,
  },
  {
    id: 'p5',
    title: 'יסודות Copilot לכספים',
    course: 'Copilot לצוותי כספים',
    client: 'טיילספין',
    audience: 'פיננסים',
    role: 'כספים',
    units: ['u1', 'u9', 'u15', 'u6'],
    status: 'בארכיון',
    owner: 'רון שגב',
    cohort: 'הסתיים',
    learnerTarget: 41,
    avgPct: 100,
  },
  {
    id: 'p6',
    title: 'AI בשירות לקוחות',
    course: 'AI במוקד השירות',
    client: 'נורת׳ווינד',
    audience: 'מוקד שירות',
    role: 'כללי',
    units: ['u1', 'u2', 'u6', 'u5', 'u7'],
    status: 'פורסם',
    owner: 'רון שגב',
    cohort: 'מחזור 1 · אוגוסט',
    learnerTarget: 112,
    avgPct: 38,
  },
  {
    id: 'p7',
    title: 'Copilot לצוותי תוכן',
    course: 'Copilot לשיווק ותוכן',
    client: 'פבריקם',
    audience: 'שיווק ותוכן',
    role: 'שיווק',
    units: ['u1', 'u2', 'u4', 'u14'],
    status: 'טיוטה',
    owner: 'ליאת ברק',
    cohort: 'מחזור טרם נקבע',
    learnerTarget: 0,
    avgPct: 0,
  },
];

export const SEED_MILESTONES: Milestone[] = [
  { day: 8, month: 'ספט', title: 'קיקאוף · נורת׳ווינד מחזור 3', subtitle: '280 לומדים מוזמנים', kind: 'קיקאוף' },
  { day: 14, month: 'ספט', title: 'דדליין · יסודות למנהלים', subtitle: 'קונטוסו · מחזור 2', kind: 'דדליין' },
  { day: 21, month: 'ספט', title: 'דוח לקוח · פבריקם', subtitle: 'סיכום רבעוני', kind: 'דוח' },
  { day: 30, month: 'ספט', title: 'דדליין · ספרינט AI למכירות', subtitle: 'אדוונצ׳ר וורקס', kind: 'דדליין' },
];

/**
 * The learners the design calls out by name, in the order the at-risk table lists them.
 * Their idle days and stall points are what that table renders, so they are seeded to
 * match; the rest of the roster is generated around them.
 */
const NAMED: { name: string; org: string; program: string; idleDays: number; pct: number }[] = [
  { name: 'מריה סילבה', org: 'שיווק', program: 'p1', idleDays: 12, pct: 70 },
  { name: 'פטר נובק', org: 'אספקה', program: 'p1', idleDays: 16, pct: 0 },
  { name: 'יונתן וייס', org: 'מכירות', program: 'p1', idleDays: 11, pct: 24 },
  { name: 'עמית דגן', org: 'תפעול', program: 'p4', idleDays: 10, pct: 30 },
  { name: 'רות אלמוג', org: 'משאבי אנוש', program: 'p1', idleDays: 10, pct: 38 },
  { name: 'דנה רביד', org: 'תפעול', program: 'p1', idleDays: 1, pct: 100 },
  { name: 'תומר לוי', org: 'כספים', program: 'p1', idleDays: 2, pct: 62 },
  { name: 'עאישה כרים', org: 'משאבי אנוש', program: 'p1', idleDays: 3, pct: 48 },
  { name: 'קרן אדרי', org: 'תפעול', program: 'p4', idleDays: 1, pct: 100 },
];

const FIRST = [
  'נועה', 'איתי', 'שירה', 'יואב', 'תמר', 'עומר', 'מיכל', 'אורי', 'הילה', 'אסף',
  'ליאור', 'רוני', 'גיא', 'אביגיל', 'דניאל', 'יעל', 'אלון', 'נטע', 'עדי', 'מאור',
  'שני', 'אמיר', 'ענת', 'ניר', 'גלית', 'רועי', 'סיון', 'יובל', 'אורלי', 'תום',
];
const LAST = [
  'כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'שפירא', 'אזולאי',
  'גבאי', 'חדד', 'ברק', 'שמש', 'נחום', 'אשכנזי', 'הראל', 'סגל', 'רוזן', 'אלוני',
];
const ORGS = ['תפעול', 'כספים', 'משאבי אנוש', 'מכירות', 'שיווק', 'אספקה', 'מוקד שירות', 'ניהול פרויקטים', 'הנדסה'];

/** Deterministic, so every machine renders the same workspace. */
function rng(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;
/**
 * Dates are relative to when the workspace is seeded, not to a fixed instant — the idle
 * figures are read against the real clock, so a hard-coded origin drifts by a day and
 * moves learners between the active and at-risk buckets.
 * Half a day is added so flooring cannot round an N-day gap down to N-1.
 */
const daysAgo = (n: number) => new Date(Date.now() - n * DAY - DAY / 2).toISOString();

function code(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash.toString(36).slice(0, 6).toUpperCase().padEnd(6, 'X');
}

/** Nuggets of a programme that can actually be completed, in learning order. */
function playableNuggets(program: Program): { contentId: string; segmentId: string }[] {
  const out: { contentId: string; segmentId: string }[] = [];
  for (const unitId of program.units) {
    const contentId = libraryUnit(unitId)?.contentId;
    const content = contentId ? builtUnits[contentId] : undefined;
    if (!contentId || !content) continue;
    for (const segment of content.segments) out.push({ contentId, segmentId: segment.id });
  }
  return out;
}

/**
 * Builds the seeded workspace: the seven programmes plus a 449-strong roster whose
 * progress and last-active dates are generated so the dashboard and analytics figures
 * are computed from records, not written into the components.
 *
 * It is demo data. The admin learners and settings screens say so, and every address is
 * on the reserved .invalid domain.
 */
export function seedWorkspace(): Workspace {
  const programs: Program[] = SEED_PROGRAMS.map((p) => ({
    id: p.id,
    owner: p.owner,
    cohort: p.cohort,
    client: p.client,
    internalName: '',
    title: p.title,
    course: p.course,
    description:
      p.id === 'p1' ? seedFlagshipProgram.description : `תוכנית ${p.title} עבור ${p.client}.`,
    audience: p.audience,
    role: p.role,
    language: 'עברית',
    units: p.units,
    welcome: p.id === 'p1' ? seedFlagshipProgram.welcome : 'ברוכים הבאים. עשו יחידה אחת בכל פעם.',
    closing: 'סיימתם את התוכנית. אישור ההשתתפות יישלח אליכם במייל.',
    // The flagship programme is open order; the managers' programme locks units in
    // sequence, so both completion models are visible in the workspace.
    sequential: p.id !== 'p1',
    requireAll: true,
    requireAssessment: true,
    status: STATUS[p.status] ?? 'draft',
    accessCode: code(p.id + p.title),
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
    publishedAt: STATUS[p.status] === 'published' ? daysAgo(40) : undefined,
  }));

  const nuggetsOf = new Map(programs.map((p) => [p.id, playableNuggets(p)]));

  const learners: Learner[] = [];
  const progress: Record<string, LearnerProgress> = {};
  const random = rng(20260903);

  /**
   * Average exercise accuracy per produced unit, so the per-unit scores on the analytics
   * screen come out at the figures the design shows (91% and 68% — unit 02 is the weak one).
   */
  const UNIT_ACCURACY: Record<string, number> = { 'unit-01': 91, 'unit-02': 68 };

  const add = (
    name: string,
    org: string,
    programIds: string[],
    idleDays: number | null,
    pct: number,
  ) => {
    const index = learners.length + 1;
    const email = `learner${index}@example.invalid`;
    const id = email.replace(/[^a-z0-9._@+-]/g, '-');
    learners.push({
      id,
      name,
      email,
      org,
      programIds,
      createdAt: daysAgo(60),
      lastActiveAt: idleDays === null ? undefined : daysAgo(idleDays),
    });
    if (pct <= 0) return;
    const record: LearnerProgress = {};
    for (const programId of programIds) {
      const nuggets = nuggetsOf.get(programId) ?? [];
      if (!nuggets.length) continue;
      const reached = Math.round((pct / 100) * nuggets.length);
      nuggets.slice(0, reached).forEach(({ contentId, segmentId }) => {
        const unit = record[contentId] ?? (record[contentId] = {});
        const outOf = 6;
        // Jitter around the unit's target accuracy; averaged over the cohort it lands on it.
        const target = UNIT_ACCURACY[contentId] ?? 80;
        const accuracy = target + (random() - 0.5) * 30;
        const score = Math.max(0, Math.min(outOf, Math.round((accuracy / 100) * outOf)));
        unit[segmentId] = { watched: true, practised: true, score, outOf };
      });
    }
    if (Object.keys(record).length) progress[id] = record;
  };

  // Cohort sizes are filled to exact remaining counts, so each published programme lands
  // on the size the design states even though the named learners are seeded first.
  // p6 is layered on top of the others, which is why the four cohorts sum to more than
  // the 449-strong roster.
  const TOTAL = 449;
  const P6 = { id: 'p6', count: 112, avg: 38 };
  const remaining: { id: string; left: number; avg: number }[] = [
    { id: 'p1', left: 320, avg: 54 },
    { id: 'p4', left: 88, avg: 91 },
    { id: 'p5', left: 41, avg: 100 },
  ];
  const takeSlot = () => {
    for (const slot of remaining) {
      if (slot.left > 0) {
        slot.left -= 1;
        return slot;
      }
    }
    return remaining[0];
  };

  /** Exactly 141 active within a week and 18 stalled at ten days or more, as designed. */
  const ACTIVE = 141;
  const AT_RISK = 18;

  for (const person of NAMED) {
    const slot = remaining.find((r) => r.id === person.program);
    if (slot && slot.left > 0) slot.left -= 1;
    add(person.name, person.org, [person.program], person.idleDays, person.pct);
  }

  let active = NAMED.filter((n) => n.idleDays <= 7).length;
  let atRisk = NAMED.filter((n) => n.idleDays >= 10).length;
  let inP6 = 0;

  for (let i = learners.length; i < TOTAL; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
    const org = ORGS[i % ORGS.length];

    const slot = takeSlot();
    const ids = [slot.id];
    // Spread p6 across the roster so it reads as a second programme people also sit on.
    if (inP6 < P6.count && (i * P6.count) % TOTAL < P6.count) {
      ids.push(P6.id);
      inP6 += 1;
    }

    let idle: number | null;
    if (active < ACTIVE) {
      idle = Math.floor(random() * 7);
      active++;
    } else if (atRisk < AT_RISK) {
      idle = 10;
      atRisk++;
    } else if (random() < 0.22) {
      idle = null;
    } else {
      // Between the two buckets: idle but not yet flagged.
      idle = 8 + Math.floor(random() * 2);
    }

    const pct = idle === null ? 0 : Math.max(0, Math.min(100, Math.round(slot.avg + (random() - 0.5) * 40)));
    add(name, org, ids, idle, pct);
  }

  // Top up p6 on learners who are not on it yet, in case the spread above fell short.
  for (const learner of learners) {
    if (inP6 >= P6.count) break;
    if (learner.programIds.includes(P6.id)) continue;
    learner.programIds.push(P6.id);
    inP6 += 1;
  }

  return {
    programs,
    learners,
    progress,
    introsHeard: {},
    milestones: SEED_MILESTONES,
    updatedAt: new Date().toISOString(),
  };
}

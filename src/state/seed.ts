import { seedFlagshipProgram, seedLearners, seedPrograms } from '../content/library';
import { builtUnits, libraryUnit } from '../content';
import type { Learner, LearnerProgress, Program, ProgramStatus, Workspace } from './types';

const STATUS_FROM_HEBREW: Record<string, ProgramStatus> = {
  פורסם: 'published',
  טיוטה: 'draft',
  'מוכן לפרסום': 'ready',
  בארכיון: 'archived',
};

/** Unit line-ups for the seeded programmes, using real library ids. */
const SEED_UNITS: Record<string, string[]> = {
  p1: seedFlagshipProgram.units,
  p2: ['u1', 'u2', 'u12'],
  p3: ['u1', 'u2', 'u4', 'u6', 'u13'],
  p4: ['u1', 'u2', 'u3', 'u7', 'u8', 'u11', 'u6'],
  p5: ['u1', 'u9', 'u15', 'u6'],
};

const SEED_COURSE: Record<string, string> = {
  p1: seedFlagshipProgram.course,
  p2: 'AI בעבודת משאבי אנוש',
  p3: 'למכור טוב יותר עם AI',
  p4: 'להוביל צוות בעידן ה-AI',
  p5: 'Copilot לצוותי כספים',
};

function code(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash.toString(36).slice(0, 6).toUpperCase().padEnd(6, 'X');
}

function slug(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9._@+-]/g, '-');
}

function learnerEmail(name: string): string {
  // Seed learners are illustrative; addresses are synthetic and non-routable.
  const n = seedLearners.findIndex((l) => l.name === name);
  return `learner${n + 1}@example.invalid`;
}

const NOW = '2026-08-01T08:00:00.000Z';

export function seedWorkspace(): Workspace {
  const programs: Program[] = seedPrograms.map((p) => ({
    id: p.id,
    client: p.client,
    internalName: '',
    title: p.title,
    course: SEED_COURSE[p.id] ?? p.title,
    description: p.id === 'p1' ? seedFlagshipProgram.description : `תוכנית ${p.title} עבור ${p.client}.`,
    audience: p.audience,
    role: p.role,
    language: 'עברית',
    units: SEED_UNITS[p.id] ?? ['u1', 'u2'],
    welcome: p.id === 'p1' ? seedFlagshipProgram.welcome : 'ברוכים הבאים. עשו יחידה אחת בכל פעם.',
    closing: 'סיימתם את התוכנית. אישור ההשתתפות יישלח אליכם במייל.',
    // The flagship programme is open order, the managers' programme locks units in
    // sequence — so both completion models are visible in the workspace. New programmes
    // still default to sequential.
    sequential: p.id !== 'p1',
    requireAll: true,
    requireAssessment: true,
    status: STATUS_FROM_HEBREW[p.status] ?? 'draft',
    accessCode: code(p.id + p.title),
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: STATUS_FROM_HEBREW[p.status] === 'published' ? NOW : undefined,
  }));

  // Half the cohort also sits on the managers' programme, so both published programmes
  // have learners on them during a walkthrough.
  const ALSO_ON_P4 = new Set([1, 3, 6]);
  const learners: Learner[] = seedLearners.map((l, i) => {
    const email = learnerEmail(l.name);
    return {
      id: slug(email),
      name: l.name,
      email,
      org: l.org,
      programIds: ALSO_ON_P4.has(i) ? ['p1', 'p4'] : ['p1'],
      createdAt: NOW,
    };
  });

  return { programs, learners, progress: demoProgress(programs), updatedAt: NOW };
}

/**
 * Progress for the pre-loaded demo cohort.
 *
 * These eight learners ship with the workspace so the admin side has something to show
 * on day one — the percentages come from the platform design, not from real people, and
 * their addresses are on the reserved .invalid domain. Real learners are recorded from
 * actual playback. The admin UI labels the cohort as demo data.
 */
function demoProgress(programs: Program[]): Record<string, LearnerProgress> {
  const flagship = programs.find((p) => p.id === 'p1');
  if (!flagship) return {};

  // Every nugget in the programme, in learning order.
  const nuggets: { contentId: string; segmentId: string }[] = [];
  for (const unitId of flagship.units) {
    const contentId = libraryUnit(unitId)?.contentId;
    const content = contentId ? builtUnits[contentId] : undefined;
    if (!contentId || !content) continue;
    for (const segment of content.segments) nuggets.push({ contentId, segmentId: segment.id });
  }
  if (!nuggets.length) return {};

  const out: Record<string, LearnerProgress> = {};
  for (const person of seedLearners) {
    const reached = Math.round((person.progress / 100) * nuggets.length);
    if (!reached) continue;
    const record: LearnerProgress = {};
    nuggets.slice(0, reached).forEach(({ contentId, segmentId }, i) => {
      const unitRecord = record[contentId] ?? (record[contentId] = {});
      // A plausible spread of exercise scores, deterministic so the demo looks the same
      // on every machine.
      const outOf = 6;
      unitRecord[segmentId] = {
        watched: true,
        practised: true,
        score: outOf - (i % 3 === 2 ? 1 : 0),
        outOf,
      };
    });
    out[slug(learnerEmail(person.name))] = record;
  }
  return out;
}


import { seedFlagshipProgram, seedLearners, seedPrograms } from '../content/library';
import type { Learner, Program, ProgramStatus, Workspace } from './types';

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
    sequential: true,
    requireAll: true,
    requireAssessment: true,
    status: STATUS_FROM_HEBREW[p.status] ?? 'draft',
    accessCode: code(p.id + p.title),
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: STATUS_FROM_HEBREW[p.status] === 'published' ? NOW : undefined,
  }));

  const learners: Learner[] = seedLearners.map((l) => {
    const email = learnerEmail(l.name);
    return {
      id: slug(email),
      name: l.name,
      email,
      org: l.org,
      programIds: ['p1'],
      createdAt: NOW,
    };
  });

  return { programs, learners, progress: {}, updatedAt: NOW };
}


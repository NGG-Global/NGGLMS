import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { persistence, type PersistenceStatus } from './api';
import { SEED_MILESTONES, SEED_OWNER, seedWorkspace } from './seed';
import type { Identity, IntroHeard, Learner, LearnerProgress, Program, SegmentRecord, Workspace } from './types';

const IDENTITY_KEY = 'ngglms:identity:v1';

interface StoreValue {
  ready: boolean;
  persistenceStatus: PersistenceStatus;
  workspace: Workspace;
  identity: Identity | null;

  signIn: (identity: Omit<Identity, 'id'>) => void;
  signOut: () => void;

  saveProgram: (program: Program) => void;
  setProgramStatus: (id: string, status: Program['status']) => void;
  newProgramDraft: () => Program;

  upsertLearner: (learner: Omit<Learner, 'id' | 'createdAt'> & { id?: string }) => Learner;
  enrol: (learnerId: string, programId: string) => void;

  progressFor: (learnerId: string) => LearnerProgress;
  recordSegment: (learnerId: string, contentId: string, segmentId: string, patch: Partial<SegmentRecord>) => void;

  /** Which unit openings this learner has already heard. */
  introHeardFor: (learnerId: string) => IntroHeard;
  markIntroHeard: (learnerId: string, contentId: string) => void;

  /**
   * Restores the demo seed. Only exposed when persistence is browser-local, so it can
   * never clear a server-backed workspace that has real learner records in it.
   */
  resetToDemoSeed: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function id(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function accessCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function readIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>(() => seedWorkspace());
  const [identity, setIdentity] = useState<Identity | null>(() => readIdentity());
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(() =>
    persistence.currentStatus(),
  );
  const saveTimer = useRef<number | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await persistence.probe();
      const loaded = await persistence.load();
      if (cancelled) return;
      setPersistenceStatus(status);
      if (loaded && Array.isArray(loaded.programs)) {
        setWorkspace({
          programs: loaded.programs,
          learners: loaded.learners ?? [],
          progress: loaded.progress ?? {},
          introsHeard: loaded.introsHeard ?? {},
          milestones: loaded.milestones?.length ? loaded.milestones : SEED_MILESTONES,
          updatedAt: loaded.updatedAt ?? new Date().toISOString(),
        });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced write-behind: keeps typing in the programme builder responsive.
  useEffect(() => {
    if (!ready || !dirty.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      dirty.current = false;
      void persistence.save(workspace);
    }, 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [workspace, ready]);

  const mutate = useCallback((next: (current: Workspace) => Workspace) => {
    dirty.current = true;
    setWorkspace((current) => ({ ...next(current), updatedAt: new Date().toISOString() }));
  }, []);

  const signIn = useCallback((next: Omit<Identity, 'id'>) => {
    const person: Identity = { ...next, id: next.email.toLowerCase().replace(/[^a-z0-9._@+-]/g, '-') };
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(person));
    } catch {
      // Non-persistent session; the app still works for this tab.
    }
    setIdentity(person);
    // A learner signing in for the first time joins the workspace roster.
    if (person.role === 'learner') {
      mutate((current) => {
        if (current.learners.some((l) => l.id === person.id)) return current;
        const published = current.programs.filter((p) => p.status === 'published').map((p) => p.id);
        return {
          ...current,
          learners: [
            ...current.learners,
            {
              id: person.id,
              name: person.name,
              email: person.email,
              org: person.org || '—',
              programIds: published.slice(0, 1),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });
    }
  }, [mutate]);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(IDENTITY_KEY);
    } catch {
      // Nothing to clear.
    }
    setIdentity(null);
  }, []);

  const newProgramDraft = useCallback((): Program => {
    const now = new Date().toISOString();
    return {
      id: id('p_'),
      owner: identity?.name ?? SEED_OWNER,
      cohort: 'מחזור טרם נקבע',
      client: '',
      internalName: '',
      title: '',
      course: '',
      description: '',
      audience: '',
      role: 'כללי',
      language: 'עברית',
      units: [],
      welcome: 'ברוכים הבאים לתוכנית. עשו יחידה אחת בכל פעם — החלקים המעשיים הם אלה שנשארים.',
      closing: 'סיימתם את התוכנית. אישור ההשתתפות יישלח אליכם במייל.',
      sequential: true,
      requireAll: true,
      requireAssessment: true,
      status: 'draft',
      accessCode: accessCode(),
      createdAt: now,
      updatedAt: now,
    };
  }, [identity]);

  const saveProgram = useCallback(
    (program: Program) => {
      mutate((current) => {
        const at = new Date().toISOString();
        const next = { ...program, updatedAt: at };
        const exists = current.programs.some((p) => p.id === program.id);
        return {
          ...current,
          programs: exists
            ? current.programs.map((p) => (p.id === program.id ? next : p))
            : [next, ...current.programs],
        };
      });
    },
    [mutate],
  );

  const setProgramStatus = useCallback(
    (programId: string, status: Program['status']) => {
      mutate((current) => ({
        ...current,
        programs: current.programs.map((p) =>
          p.id === programId
            ? {
                ...p,
                status,
                updatedAt: new Date().toISOString(),
                publishedAt: status === 'published' ? p.publishedAt ?? new Date().toISOString() : p.publishedAt,
              }
            : p,
        ),
      }));
    },
    [mutate],
  );

  const upsertLearner = useCallback(
    (input: Omit<Learner, 'id' | 'createdAt'> & { id?: string }): Learner => {
      const learnerId = input.id ?? input.email.toLowerCase().replace(/[^a-z0-9._@+-]/g, '-');
      const learner: Learner = {
        id: learnerId,
        name: input.name,
        email: input.email,
        org: input.org,
        programIds: input.programIds,
        createdAt: new Date().toISOString(),
      };
      mutate((current) => {
        const exists = current.learners.some((l) => l.id === learnerId);
        return {
          ...current,
          learners: exists
            ? current.learners.map((l) => (l.id === learnerId ? { ...l, ...learner, createdAt: l.createdAt } : l))
            : [...current.learners, learner],
        };
      });
      return learner;
    },
    [mutate],
  );

  const enrol = useCallback(
    (learnerId: string, programId: string) => {
      mutate((current) => ({
        ...current,
        learners: current.learners.map((l) =>
          l.id === learnerId && !l.programIds.includes(programId)
            ? { ...l, programIds: [...l.programIds, programId] }
            : l,
        ),
      }));
    },
    [mutate],
  );

  const progressFor = useCallback(
    (learnerId: string): LearnerProgress => workspace.progress[learnerId] ?? {},
    [workspace.progress],
  );

  const recordSegment = useCallback(
    (learnerId: string, contentId: string, segmentId: string, patch: Partial<SegmentRecord>) => {
      mutate((current) => {
        const forLearner = current.progress[learnerId] ?? {};
        const forUnit = forLearner[contentId] ?? {};
        const existing = forUnit[segmentId] ?? {};
        const merged: SegmentRecord = {
          ...existing,
          ...patch,
          // lastT only ever moves forward, so re-watching does not lose the resume point.
          lastT: Math.max(existing.lastT ?? 0, patch.lastT ?? existing.lastT ?? 0),
        };
        const at = new Date().toISOString();
        return {
          ...current,
          learners: current.learners.map((l) => (l.id === learnerId ? { ...l, lastActiveAt: at } : l)),
          progress: {
            ...current.progress,
            [learnerId]: { ...forLearner, [contentId]: { ...forUnit, [segmentId]: merged } },
          },
        };
      });
    },
    [mutate],
  );

  const introHeardFor = useCallback(
    (learnerId: string): IntroHeard => workspace.introsHeard[learnerId] ?? {},
    [workspace.introsHeard],
  );

  const markIntroHeard = useCallback(
    (learnerId: string, contentId: string) => {
      mutate((current) => ({
        ...current,
        introsHeard: {
          ...current.introsHeard,
          [learnerId]: { ...(current.introsHeard[learnerId] ?? {}), [contentId]: true },
        },
      }));
    },
    [mutate],
  );

  const resetToDemoSeed = useCallback(() => {
    if (persistenceStatus.mode !== 'local') return;
    dirty.current = true;
    setWorkspace({ ...seedWorkspace(), updatedAt: new Date().toISOString() });
  }, [persistenceStatus.mode]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      persistenceStatus,
      workspace,
      identity,
      signIn,
      signOut,
      saveProgram,
      setProgramStatus,
      newProgramDraft,
      upsertLearner,
      enrol,
      progressFor,
      recordSegment,
      introHeardFor,
      markIntroHeard,
      resetToDemoSeed,
    }),
    [
      ready,
      persistenceStatus,
      workspace,
      identity,
      signIn,
      signOut,
      saveProgram,
      setProgramStatus,
      newProgramDraft,
      upsertLearner,
      enrol,
      progressFor,
      recordSegment,
      introHeardFor,
      markIntroHeard,
      resetToDemoSeed,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside <StoreProvider>');
  return value;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { builtUnits, libraryUnit } from '../content';
import { unitCompletion, programCompletion } from '../app/progress';
import { UnitPlayer, type SegmentProgress } from '../player/UnitPlayer';
import { Shell } from '../app/Shell';
import './learner.css';

/** The player screen. Progress is written through the store on every beat. */
export function UnitPlay() {
  const { programId, unitId } = useParams();
  const [params, setParams] = useSearchParams();
  const { identity, workspace, progressFor, recordSegment } = useStore();
  const [finished, setFinished] = useState(false);

  const program = workspace.programs.find((p) => p.id === programId);
  const unit = unitId ? libraryUnit(unitId) : undefined;
  const contentId = unit?.contentId;
  const content = contentId ? builtUnits[contentId] : undefined;

  const learnerId = identity?.id ?? '';
  const segmentCount = content?.segments.length ?? 0;

  // Frozen per unit: the resume point is only a landing spot for a learner arriving
  // without ?n. Recomputing it live would yank the view as they finish each nugget.
  const resumeAt = useRef(0);
  const resumeFor = useRef<string | null>(null);
  if (contentId && resumeFor.current !== contentId) {
    resumeFor.current = contentId;
    resumeAt.current = learnerId
      ? unitCompletion(progressFor(learnerId), contentId).resumeIndex
      : 0;
  }

  const onProgress = useCallback(
    (segmentId: string, patch: Partial<SegmentProgress>) => {
      if (!contentId || !learnerId) return;
      recordSegment(learnerId, contentId, segmentId, patch);
    },
    [contentId, learnerId, recordSegment],
  );

  // The route owns which nugget is open, so a deep link like ?n=3 lands on nugget 3 and
  // the address bar always matches what is on screen. Functional update keeps this
  // callback's identity stable across URL writes.
  const setSegment = useCallback(
    (index: number) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('n', String(index + 1));
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // ?n is 1-based in the URL and the single source of truth for which nugget is open.
  const rawN = params.get('n');
  const parsedN = rawN === null ? Number.NaN : Number(rawN) - 1;
  const fromUrl = Number.isInteger(parsedN) && parsedN >= 0 && parsedN < segmentCount ? parsedN : null;

  // Seed ?n when the learner arrives without one, so the address bar is never a lie.
  const needsSeed = Boolean(contentId) && fromUrl === null;
  useEffect(() => {
    if (needsSeed) setSegment(resumeAt.current);
  }, [needsSeed, setSegment]);

  if (!identity) return null;

  if (!program || !unit || !content || !contentId) {
    return (
      <Shell crumb="יחידה">
        <main className="page">
          <p className="empty">
            {unit && !content ? 'היחידה הזאת עדיין בהפקה ואין לה תוכן להשמעה.' : 'היחידה לא נמצאה.'}
          </p>
          <p style={{ marginTop: 12 }}>
            <Link className="btn btn--quiet" to={program ? `/learn/${program.id}` : '/learn'}>
              ← למסלול הלמידה
            </Link>
          </p>
        </main>
      </Shell>
    );
  }

  const progress = progressFor(identity.id);
  const segmentIndex = fromUrl ?? resumeAt.current;

  if (finished) {
    const programState = programCompletion(program, progress);
    return (
      <Shell crumb={`${program.course || program.title} · ${unit.title}`}>
        <main className="page page--narrow">
          <section className="card finish">
            <i>✓</i>
            <h1>היחידה הושלמה</h1>
            <p>
              {unit.objective}
            </p>
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-4)' }}>
              {programState.done} מתוך {programState.playable.length} יחידות בתוכנית הושלמו.
            </p>
            <div className="finish__btns">
              {programState.nextUnitId && programState.nextUnitId !== unit.id ? (
                <Link className="btn btn--primary" to={`/learn/${program.id}/${programState.nextUnitId}`}>
                  ליחידה הבאה ←
                </Link>
              ) : (
                <Link className="btn btn--primary" to={`/learn/${program.id}`}>
                  למסלול הלמידה ←
                </Link>
              )}
              <button type="button" className="btn btn--ghost" onClick={() => setFinished(false)}>
                חזרה ליחידה
              </button>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  return (
    <Shell crumb={`${program.course || program.title} · ${unit.title}`}>
      <main className="page">
        <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <Link className="btn btn--quiet" to={`/learn/${program.id}/${unit.id}`}>
            ← ליחידה
          </Link>
          <span className="topbar__sep" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            יחידה {content.unit.n} · {content.unit.title}
          </span>
          <span className="spacer" />
          <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
            {unitCompletion(progress, contentId).practised} מתוך {content.segments.length} מקטעים הושלמו
          </span>
        </div>

        <UnitPlayer
          key={contentId}
          content={content}
          progress={progress[contentId] ?? {}}
          onProgress={onProgress}
          onUnitComplete={() => setFinished(true)}
          segmentIndex={segmentIndex}
          onSegmentChange={setSegment}
        />
      </main>
    </Shell>
  );
}

import { useCallback, useState } from 'react';
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

  const onProgress = useCallback(
    (segmentId: string, patch: Partial<SegmentProgress>) => {
      if (!contentId || !learnerId) return;
      recordSegment(learnerId, contentId, segmentId, patch);
    },
    [contentId, learnerId, recordSegment],
  );

  // Functional update so this callback keeps a stable identity; otherwise every URL
  // write would change the callback and re-fire the player's segment-change effect.
  const onSegmentChange = useCallback(
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
  const initial = Math.max(0, Number(params.get('n') ?? '0') - 1);
  const resumeAt = Number.isFinite(initial) && initial > 0 ? initial : unitCompletion(progress, contentId).resumeIndex;

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
          initialSegment={resumeAt}
          onSegmentChange={onSegmentChange}
        />
      </main>
    </Shell>
  );
}

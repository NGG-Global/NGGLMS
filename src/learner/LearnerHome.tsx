import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { programCompletion, programUnits, unitCompletion, unitLocked } from '../app/progress';
import { unitMinutes } from '../content';
import { assetUrl } from '../app/paths';
import { Shell } from '../app/Shell';
import './learner.css';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

/** The learner's home: the programme in progress, then the journey through its units. */
export function LearnerHome() {
  const { identity, workspace, progressFor } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  if (!identity) return null;

  const progress = progressFor(identity.id);
  const learner = workspace.learners.find((l) => l.id === identity.id);
  const enrolled = learner?.programIds ?? [];

  // Admins previewing the learner side see every published programme.
  const programs = workspace.programs.filter((p) =>
    identity.role === 'admin' ? p.status === 'published' || p.status === 'ready' : p.status === 'published' && enrolled.includes(p.id),
  );

  const active = programs
    .map((program) => ({ program, completion: programCompletion(program, progress) }))
    .sort((a, b) => (a.completion.complete ? 1 : 0) - (b.completion.complete ? 1 : 0));

  const current = active.find((x) => !x.completion.complete) ?? active[0];

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <Shell crumb="מסלול הלמידה שלי">
      <main className="page page--narrow" style={{ margin: '0 auto' }}>
        <div className="hero">
          <div>
            <h1>
              {greeting()}, {identity.name.split(' ')[0]}
            </h1>
            <p>
              {active.length
                ? `${active.length === 1 ? 'תוכנית אחת פעילה' : `${active.length} תוכניות פעילות`} · המשיכו מאיפה שעצרתם.`
                : 'עוד לא שויכתם לתוכנית.'}
            </p>
          </div>
        </div>

        {current && (
          <section className="lhero">
            <img className="lhero__mark" src={assetUrl('assets/ngg-mark-white.png')} alt="" />
            <div className="lhero__body">
              <div>
                <div className="lhero__k">
                  {current.completion.pct === 0 ? 'התוכנית שלך' : 'להמשיך מאיפה שעצרת'}
                </div>
                <div className="lhero__t">{current.program.course || current.program.title}</div>
                <div className="lhero__s">
                  {current.program.client} · {current.completion.done} מתוך {current.completion.playable.length} יחידות הושלמו
                </div>
                <div className="lhero__meter">
                  <span className="meter">
                    <i style={{ width: `${current.completion.pct}%` }} />
                  </span>
                  <span>{current.completion.pct}%</span>
                </div>
              </div>
              {current.completion.nextUnitId && (
                <Link className="btn btn--primary" to={`/learn/${current.program.id}/${current.completion.nextUnitId}`}>
                  {current.completion.pct === 0
                    ? 'להתחיל ללמוד ←'
                    : current.completion.complete
                      ? 'לצפייה חוזרת ←'
                      : 'להמשיך בלמידה ←'}
                </Link>
              )}
            </div>
          </section>
        )}

        {current?.program.welcome && (
          <div className="softnote" style={{ marginTop: 16 }}>
            {current.program.welcome}
          </div>
        )}

        {current && (
          <section className="section">
            <div className="section__head" style={{ marginBottom: 12 }}>
              <h2>מסלול הלמידה שלי</h2>
              <span className="spacer" />
              <Link className="btn btn--quiet" to={`/learn/${current.program.id}`}>
                לתוכנית המלאה ←
              </Link>
            </div>

            <div className="journeylist">
              {[...current.completion.playable, ...current.completion.pending].map((unit, i) => {
                const completion = unitCompletion(progress, unit.contentId);
                const inProduction = !unit.contentId;
                const locked = inProduction || unitLocked(current.program, unit, progress);
                const state = completion.complete
                  ? 'done'
                  : locked
                    ? 'locked'
                    : completion.practised > 0 || i === current.completion.playable.findIndex((u) => u.id === current.completion.nextUnitId)
                      ? 'current'
                      : 'todo';

                const body = (
                  <>
                    <span className="jrow2__state" data-state={state}>
                      {state === 'done' ? '✓' : state === 'current' ? '▶' : state === 'locked' ? '🔒' : i + 1}
                    </span>
                    <span className="jrow2__b">
                      <b>{unit.title}</b>
                      <span>{unit.summary}</span>
                    </span>
                    <span className="jrow2__meta">
                      {inProduction ? (
                        <span className="chip chip--amber">בהכנה</span>
                      ) : completion.practised > 0 && !completion.complete ? (
                        <span className="chip chip--pink">
                          {completion.practised}/{completion.total}
                        </span>
                      ) : null}
                      <span className="chip">{unitMinutes(unit)} דק׳</span>
                    </span>
                  </>
                );

                return locked ? (
                  <button
                    key={unit.id}
                    type="button"
                    className="jrow2"
                    data-state="locked"
                    onClick={() =>
                      flash(inProduction ? 'היחידה נמצאת בהפקה' : 'היחידה תיפתח לאחר השלמת היחידה הקודמת')
                    }
                  >
                    {body}
                  </button>
                ) : (
                  <Link key={unit.id} className="jrow2" data-state={state} to={`/learn/${current.program.id}/${unit.id}`}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {active.length > 1 && (
          <section className="section">
            <div className="section__head" style={{ marginBottom: 12 }}>
              <h2>התוכניות שלי</h2>
            </div>
            <div className="journeylist">
              {active.map(({ program, completion }) => {
                const units = programUnits(program);
                return (
                  <Link key={program.id} className="jrow2" to={`/learn/${program.id}`}>
                    <span className="jrow2__state" data-state={completion.complete ? 'done' : 'current'}>
                      {completion.complete ? '✓' : '▶'}
                    </span>
                    <span className="jrow2__b">
                      <b>{program.course || program.title}</b>
                      <span>
                        {program.client} · {units.length} יחידות · {program.cohort}
                      </span>
                    </span>
                    <span className="jrow2__meta">
                      <span className="meter">
                        <i style={{ width: `${completion.pct}%` }} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{completion.pct}%</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {active.length === 0 && (
          <p className="empty">אין תוכניות משויכות. פנו למנהל התוכן ב-NGG כדי לקבל גישה למסלול למידה.</p>
        )}

        {toast && <div className="toast">{toast}</div>}
      </main>
    </Shell>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { PROGRAM_STATUS_LABEL } from '../state/types';
import { programCompletion, programUnits, unitCompletion } from '../app/progress';
import { isPlayable, unitMinutes } from '../content';
import { AdminLayout } from './AdminLayout';

/** A published programme: who is on it, where they are, and where they stall. */
export function ProgramDashboard() {
  const { programId } = useParams();
  const { workspace, progressFor, setProgramStatus } = useStore();
  const [copied, setCopied] = useState(false);

  const program = workspace.programs.find((p) => p.id === programId);
  if (!program) {
    return (
      <AdminLayout crumb="תוכנית">
        <main className="page">
          <p className="empty">התוכנית לא נמצאה.</p>
        </main>
      </AdminLayout>
    );
  }

  const learners = workspace.learners.filter((l) => l.programIds.includes(program.id));
  const units = programUnits(program);
  const link = `${location.origin}${location.pathname}#/learn/${program.id}?c=${program.accessCode}`;

  const perUnit = units.map((unit) => {
    const playable = isPlayable(unit);
    const started = playable
      ? learners.filter((l) => unitCompletion(progressFor(l.id), unit.contentId).practised > 0).length
      : 0;
    const done = playable
      ? learners.filter((l) => unitCompletion(progressFor(l.id), unit.contentId).complete).length
      : 0;
    return { unit, started, done, playable };
  });

  const averages = learners.map((l) => programCompletion(program, progressFor(l.id)).pct);
  const avg = averages.length ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length) : 0;
  const completed = learners.filter((l) => programCompletion(program, progressFor(l.id)).complete).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AdminLayout crumb={`${program.client} · ${program.title}`}>
      <main className="page">
        <div className="page__head">
          <div>
            <span className={`pill${program.status === 'published' ? ' pill--ok' : ''}`}>
              {PROGRAM_STATUS_LABEL[program.status]}
            </span>
            <h1 style={{ marginTop: 8 }}>{program.title}</h1>
            <p>
              {program.client} · {program.audience} · {units.length} יחידות
            </p>
          </div>
          <span className="spacer" />
          <Link className="btn btn--ghost" to={`/learn/${program.id}`}>
            צפייה כלומד
          </Link>
          <Link className="btn btn--primary" to={`/admin/programs/${program.id}/build`}>
            עריכת המסלול ←
          </Link>
        </div>

        <div className="tiles">
          <div className="card tile">
            <div className="tile__k">לומדים</div>
            <div className="tile__v">{learners.length}</div>
            <div className="tile__n">{completed} סיימו את התוכנית</div>
          </div>
          <div className="card tile">
            <div className="tile__k">התקדמות ממוצעת</div>
            <div className="tile__v">{avg}%</div>
            <div className="tile__n">על פני יחידות מופקות בלבד</div>
          </div>
          <div className="card tile">
            <div className="tile__k">משך המסלול</div>
            <div className="tile__v">{units.reduce((s, u) => s + unitMinutes(u), 0)}</div>
            <div className="tile__n">דקות תוכן</div>
          </div>
          <div className="card tile">
            <div className="tile__k">יחידות בהפקה</div>
            <div className="tile__v">{units.filter((u) => !isPlayable(u)).length}</div>
            <div className="tile__n">מסומנות ללומד כ"בהכנה"</div>
          </div>
        </div>

        {program.status === 'published' && (
          <section className="section">
            <div className="section__head">
              <h2>קישור גישה ללומדים</h2>
            </div>
            <div className="linkbox">
              <code>{link}</code>
              <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
                {copied ? '✓ הועתק' : 'העתקה'}
              </button>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-4)' }}>
              הקישור מפנה לתוכנית בלבד. הוא אינו מהווה אימות — הגנת הגישה נעשית בשכבת הפריסה.
            </p>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <h2>התקדמות לפי יחידה</h2>
            <span className="spacer" />
            <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
              סיימו / התחילו, מתוך {learners.length} לומדים
            </span>
          </div>
          <div className="card card--pad">
            {perUnit.length === 0 ? (
              <p className="empty">אין יחידות במסלול.</p>
            ) : (
              <div className="bars">
                {perUnit.map(({ unit, started, done, playable }) => {
                  const pct = learners.length ? Math.round((done / learners.length) * 100) : 0;
                  return (
                    <div key={unit.id} className="barrow">
                      <b title={unit.title}>{unit.title}</b>
                      {playable ? (
                        <span className="meter meter--tall">
                          <i style={{ width: `${pct}%` }} />
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                          היחידה בהפקה — לא נספרת בהתקדמות
                        </span>
                      )}
                      <span className="v">{playable ? `${done}/${started}` : '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2>משתתפים</h2>
          </div>
          {learners.length === 0 ? (
            <p className="empty">עדיין אין לומדים משויכים לתוכנית.</p>
          ) : (
            <div className="card card--flush">
              <table className="grid">
                <thead>
                  <tr>
                    <th>משתתף</th>
                    <th>יחידה ארגונית</th>
                    <th>סטטוס</th>
                    <th>התקדמות</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((learner) => {
                    const completion = programCompletion(program, progressFor(learner.id));
                    return (
                      <tr key={learner.id}>
                        <td>
                          {learner.name}
                          <div style={{ fontSize: 12, color: 'var(--ink-4)' }} dir="ltr">
                            {learner.email}
                          </div>
                        </td>
                        <td>{learner.org}</td>
                        <td>
                          <span
                            className={`pill${completion.complete ? ' pill--ok' : completion.pct > 0 ? ' pill--pink' : ''}`}
                          >
                            {completion.complete ? 'הושלם' : completion.pct > 0 ? 'בתהליך' : 'לא התחיל'}
                          </span>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <span className="row" style={{ gap: 8 }}>
                            <span className="meter" style={{ width: 72 }}>
                              <i style={{ width: `${completion.pct}%` }} />
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{completion.pct}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {program.status !== 'published' && (
          <div className="banner banner--info" style={{ marginTop: 18 }}>
            <span>
              התוכנית עדיין לא פורסמה, ולכן אינה גלויה ללומדים.{' '}
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => setProgramStatus(program.id, 'published')}
              >
                לפרסם עכשיו
              </button>
            </span>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

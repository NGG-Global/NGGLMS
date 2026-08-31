import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { programCompletion, programUnits, unitCompletion } from '../app/progress';
import { unitMinutes } from '../content';
import { Shell } from '../app/Shell';
import './learner.css';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

/** The learner's home: enrolled programmes, and a single obvious next step. */
export function LearnerHome() {
  const { identity, workspace, progressFor } = useStore();
  if (!identity) return null;

  const progress = progressFor(identity.id);
  const learner = workspace.learners.find((l) => l.id === identity.id);
  const enrolledIds = learner?.programIds ?? [];

  // Admins previewing the learner side see every published programme.
  const programs = workspace.programs.filter((p) =>
    identity.role === 'admin'
      ? p.status === 'published' || p.status === 'ready'
      : p.status === 'published' && enrolledIds.includes(p.id),
  );

  const active = programs
    .map((program) => ({ program, completion: programCompletion(program, progress) }))
    .sort((a, b) => (a.completion.complete ? 1 : 0) - (b.completion.complete ? 1 : 0));

  const resume = active.find((x) => !x.completion.complete) ?? active[0];

  return (
    <Shell crumb="מסלול הלמידה שלי">
      <main className="page page--narrow">
        <div className="hero">
          <div>
            <h1>
              {greeting()}, {identity.name.split(' ')[0]}
            </h1>
            <p>
              {active.length
                ? `${active.length} ${active.length === 1 ? 'תוכנית פעילה' : 'תוכניות פעילות'} · המשיכו מאיפה שעצרתם.`
                : 'עוד לא שויכתם לתוכנית.'}
            </p>
          </div>
        </div>

        {resume && !resume.completion.complete && resume.completion.nextUnitId && (
          <section className="card resume">
            <div>
              <div className="resume__k">להמשיך מאיפה שעצרת</div>
              <div className="resume__t">{resume.program.course || resume.program.title}</div>
              <div className="resume__s">
                {resume.completion.done} מתוך {resume.completion.playable.length} יחידות הושלמו · {resume.program.client}
              </div>
              <div className="resume__m">
                <span className="meter meter--tall">
                  <i style={{ width: `${resume.completion.pct}%` }} />
                </span>
                <span>{resume.completion.pct}%</span>
              </div>
            </div>
            <Link
              className="btn btn--primary"
              to={`/learn/${resume.program.id}/${resume.completion.nextUnitId}`}
            >
              להמשיך ←
            </Link>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <h2>התוכניות שלי</h2>
          </div>

          {active.length === 0 ? (
            <p className="empty">
              אין תוכניות משויכות. פנו למנהל התוכן ב-NGG כדי לקבל גישה למסלול למידה.
            </p>
          ) : (
            <div className="card card--flush pathlist">
              {active.map(({ program, completion }) => {
                const units = programUnits(program);
                const minutes = units.reduce((sum, u) => sum + unitMinutes(u), 0);
                return (
                  <Link key={program.id} className="pathrow" to={`/learn/${program.id}`}>
                    <span
                      className={`pathrow__n ${completion.complete ? 'pathrow__n--done' : 'pathrow__n--now'}`}
                    >
                      {completion.complete ? '✓' : `${completion.pct}`}
                    </span>
                    <span className="pathrow__b">
                      <b>{program.course || program.title}</b>
                      <span>
                        {program.client} · {units.length} יחידות · כ־{Math.round(minutes)} דקות
                        {completion.pending.length ? ` · ${completion.pending.length} בהכנה` : ''}
                      </span>
                    </span>
                    <span className="pathrow__meta">
                      <span className="meter">
                        <i style={{ width: `${completion.pct}%` }} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{completion.pct}%</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {resume && (
          <section className="section">
            <div className="section__head">
              <h2>היחידות במסלול</h2>
              <span className="spacer" />
              <Link className="btn btn--quiet" to={`/learn/${resume.program.id}`}>
                לתוכנית המלאה ←
              </Link>
            </div>
            <div className="card card--flush pathlist">
              {resume.completion.playable.slice(0, 5).map((unit, i) => {
                const completion = unitCompletion(progress, unit.contentId);
                return (
                  <Link
                    key={unit.id}
                    className="pathrow"
                    to={`/learn/${resume.program.id}/${unit.id}`}
                  >
                    <span className={`pathrow__n${completion.complete ? ' pathrow__n--done' : ''}`}>
                      {completion.complete ? '✓' : i + 1}
                    </span>
                    <span className="pathrow__b">
                      <b>{unit.title}</b>
                      <span>{unit.summary}</span>
                    </span>
                    <span className="pathrow__meta">
                      <span className="pill">{unitMinutes(unit)} דק׳</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}

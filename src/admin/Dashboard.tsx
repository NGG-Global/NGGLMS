import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { allUnitHealth, library, unitMinutes } from '../content';
import { PROGRAM_STATUS_LABEL } from '../state/types';
import { programCompletion } from '../app/progress';
import { AdminLayout } from './AdminLayout';

function statusPill(status: string) {
  const cls =
    status === 'published' ? 'pill pill--ok' : status === 'ready' ? 'pill pill--pink' : 'pill';
  return <span className={cls}>{PROGRAM_STATUS_LABEL[status as keyof typeof PROGRAM_STATUS_LABEL]}</span>;
}

/** Workspace overview: what is live, who is learning, and what needs attention. */
export function Dashboard() {
  const { identity, workspace, progressFor } = useStore();
  const health = allUnitHealth();
  const silent = health.flatMap((h) => h.silentSegments);

  const live = workspace.programs.filter((p) => p.status === 'published');
  const drafts = workspace.programs.filter((p) => p.status === 'draft' || p.status === 'ready');

  const averages = live.map((program) => {
    const learners = workspace.learners.filter((l) => l.programIds.includes(program.id));
    const values = learners.map((l) => programCompletion(program, progressFor(l.id)).pct);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return { program, learners: learners.length, avg };
  });

  // Averaged over learners, not over programmes: a programme with no cohort yet should
  // not pull the headline number down.
  const enrolled = live.flatMap((program) =>
    workspace.learners
      .filter((l) => l.programIds.includes(program.id))
      .map((l) => programCompletion(program, progressFor(l.id)).pct),
  );
  const overallAvg = enrolled.length
    ? Math.round(enrolled.reduce((a, b) => a + b, 0) / enrolled.length)
    : 0;

  return (
    <AdminLayout crumb="סקירת מרחב העבודה">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>בוקר טוב{identity ? `, ${identity.name.split(' ')[0]}` : ''}</h1>
            <p>מצב התוכניות, הלומדים והתוכן במרחב העבודה של NGG.</p>
          </div>
          <span className="spacer" />
          <Link className="btn btn--primary" to="/admin/programs/new">
            + תוכנית חדשה
          </Link>
        </div>

        <div className="tiles">
          <div className="card tile">
            <div className="tile__k">תוכניות פעילות</div>
            <div className="tile__v">{live.length}</div>
            <div className="tile__n">{drafts.length} בטיוטה או מוכנות לפרסום</div>
          </div>
          <div className="card tile">
            <div className="tile__k">לומדים רשומים</div>
            <div className="tile__v">{workspace.learners.length}</div>
            <div className="tile__n">בכל התוכניות הפעילות</div>
          </div>
          <div className="card tile">
            <div className="tile__k">התקדמות ממוצעת</div>
            <div className="tile__v">{overallAvg}%</div>
            <div className="tile__n">
              ממוצע על פני {enrolled.length} רישומים בתוכניות שפורסמו
            </div>
          </div>
          <div className="card tile">
            <div className="tile__k">יחידות בספרייה</div>
            <div className="tile__v">{library.length}</div>
            <div className="tile__n">{health.length} מהן מופקות ומוכנות להשמעה</div>
          </div>
        </div>

        {silent.length > 0 && (
          <div className="banner banner--warn" style={{ marginTop: 16 }}>
            <span>
              <strong>תוכן חסר:</strong> {silent.length} מקטעים מופיעים במסלול אך אין להם קובץ קריינות
              ({silent.map((s) => s.src.split('/').pop()).filter((v, i, a) => a.indexOf(v) === i).join(', ')}).
              הלומדים רואים כתוביות ואנימציה מסונכרנות, ללא קול.{' '}
              <Link to="/admin/settings">לפרטים בהגדרות ←</Link>
            </span>
          </div>
        )}

        <section className="section">
          <div className="section__head">
            <h2>תוכניות פעילות</h2>
            <span className="spacer" />
            <Link className="btn btn--quiet" to="/admin/programs">
              כל התוכניות ←
            </Link>
          </div>
          <div className="card card--flush">
            <table className="grid">
              <thead>
                <tr>
                  <th>תוכנית / לקוח</th>
                  <th>קהל יעד</th>
                  <th>יחידות</th>
                  <th>לומדים</th>
                  <th>סטטוס</th>
                  <th>התקדמות</th>
                </tr>
              </thead>
              <tbody>
                {workspace.programs
                  .filter((p) => p.status !== 'archived')
                  .slice(0, 6)
                  .map((program) => {
                    const row = averages.find((a) => a.program.id === program.id);
                    return (
                      <tr key={program.id}>
                        <td>
                          <Link to={`/admin/programs/${program.id}`}>{program.title}</Link>
                          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{program.client}</div>
                        </td>
                        <td>{program.audience || '—'}</td>
                        <td>{program.units.length}</td>
                        <td>{row?.learners ?? 0}</td>
                        <td>{statusPill(program.status)}</td>
                        <td style={{ minWidth: 130 }}>
                          {program.status === 'published' ? (
                            <span className="row" style={{ gap: 8 }}>
                              <span className="meter" style={{ width: 68 }}>
                                <i style={{ width: `${row?.avg ?? 0}%` }} />
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{row?.avg ?? 0}%</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--ink-5)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2>מוכן להשמעה בספריית NGG</h2>
            <span className="spacer" />
            <Link className="btn btn--quiet" to="/admin/library">
              לספריית התוכן ←
            </Link>
          </div>
          <div className="libgrid">
            {library
              .filter((u) => u.contentId)
              .map((unit) => {
                const unitHealthRow = health.find((h) => h.contentId === unit.contentId);
                return (
                  <article key={unit.id} className="card libcard">
                    <div className="libcard__top">
                      <h3>{unit.title}</h3>
                      <span className="spacer" />
                      <span className="pill pill--ok">מופק</span>
                    </div>
                    <p>{unit.summary}</p>
                    <div className="libcard__meta">
                      <span className="pill pill--outline">{unit.topic}</span>
                      <span className="pill pill--outline">{unitMinutes(unit)} דק׳</span>
                      <span className="pill pill--outline">{unitHealthRow?.segments.length ?? 0} נאגטים</span>
                      {unitHealthRow && unitHealthRow.silentSegments.length > 0 && (
                        <span className="pill pill--warn">{unitHealthRow.silentSegments.length} ללא קריינות</span>
                      )}
                    </div>
                    <div className="libcard__foot">
                      <Link className="btn btn--quiet" to={`/admin/library/${unit.id}`}>
                        לפרטי היחידה ←
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}

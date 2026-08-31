import { useStore } from '../state/store';
import { programCompletion, programUnits, unitCompletion } from '../app/progress';
import { isPlayable } from '../content';
import { AdminLayout } from './AdminLayout';

/** Where cohorts are, and where they stall. */
export function Analytics() {
  const { workspace, progressFor } = useStore();
  const live = workspace.programs.filter((p) => p.status === 'published');

  const perProgram = live.map((program) => {
    const learners = workspace.learners.filter((l) => l.programIds.includes(program.id));
    const values = learners.map((l) => programCompletion(program, progressFor(l.id)).pct);
    return {
      program,
      learners: learners.length,
      avg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
      complete: learners.filter((l) => programCompletion(program, progressFor(l.id)).complete).length,
    };
  });

  // Drop-off across the flagship programme: how many learners reach each unit.
  const flagship = live[0];
  const dropOff = flagship
    ? programUnits(flagship)
        .filter(isPlayable)
        .map((unit) => {
          const learners = workspace.learners.filter((l) => l.programIds.includes(flagship.id));
          const reached = learners.filter((l) => unitCompletion(progressFor(l.id), unit.contentId).practised > 0).length;
          return { unit, reached, of: learners.length };
        })
    : [];

  return (
    <AdminLayout crumb="אנליטיקה">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>אנליטיקה</h1>
            <p>התקדמות לפי תוכנית, ונשירה לפי יחידה במסלול המרכזי.</p>
          </div>
        </div>

        <section className="section" style={{ marginTop: 0 }}>
          <div className="section__head">
            <h2>התקדמות ממוצעת לפי תוכנית</h2>
          </div>
          <div className="card card--pad">
            {perProgram.length === 0 ? (
              <p className="empty">אין תוכניות שפורסמו.</p>
            ) : (
              <div className="bars">
                {perProgram.map((row) => (
                  <div key={row.program.id} className="barrow">
                    <b title={row.program.title}>{row.program.title}</b>
                    <span className="meter meter--tall">
                      <i style={{ width: `${row.avg}%` }} />
                    </span>
                    <span className="v">{row.avg}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {flagship && dropOff.length > 0 && (
          <section className="section">
            <div className="section__head">
              <h2>נשירה לפי יחידה — {flagship.title}</h2>
              <span className="spacer" />
              <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
                כמה לומדים הגיעו לכל יחידה
              </span>
            </div>
            <div className="card card--pad">
              <div className="bars">
                {dropOff.map((row) => {
                  const pct = row.of ? Math.round((row.reached / row.of) * 100) : 0;
                  return (
                    <div key={row.unit.id} className="barrow">
                      <b title={row.unit.title}>{row.unit.title}</b>
                      <span className="meter meter--tall">
                        <i style={{ width: `${pct}%` }} />
                      </span>
                      <span className="v">
                        {row.reached}/{row.of}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <h2>סיכום</h2>
          </div>
          <div className="tiles">
            <div className="card tile">
              <div className="tile__k">תוכניות שפורסמו</div>
              <div className="tile__v">{live.length}</div>
            </div>
            <div className="card tile">
              <div className="tile__k">לומדים</div>
              <div className="tile__v">{workspace.learners.length}</div>
            </div>
            <div className="card tile">
              <div className="tile__k">סיימו תוכנית</div>
              <div className="tile__v">{perProgram.reduce((sum, r) => sum + r.complete, 0)}</div>
            </div>
          </div>
        </section>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-4)', maxWidth: '72ch' }}>
          הנתונים מחושבים מהתקדמות שנרשמה בפועל בנגן. תוכניות בטיוטה ויחידות שעדיין בהפקה אינן
          נכללות בחישוב, כדי שהאחוזים ישקפו תוכן שאפשר להשלים.
        </p>
      </main>
    </AdminLayout>
  );
}

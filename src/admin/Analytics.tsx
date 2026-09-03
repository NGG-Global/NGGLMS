import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { builtUnits, library, type LibraryUnit } from '../content';
import { engagementWeeks, medianUnitMinutes } from '../content/demo-analytics';
import {
  activeLearners,
  atRiskLearners,
  learnersOf,
  overallScore,
  programStats,
  unitScore,
} from '../app/progress';
import { AdminLayout } from './AdminLayout';
import { StatTiles, type StatTileProps } from './StatTile';

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('');
}

/** Where cohorts are, and where they stall. */
export function Analytics() {
  const { workspace } = useStore();
  const [programId, setProgramId] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const published = workspace.programs.filter((p) => p.status === 'published');
  const scoped = programId === 'all' ? published : published.filter((p) => p.id === programId);

  const active = activeLearners(workspace, 7);
  const atRisk = atRiskLearners(workspace, 10);
  const score = overallScore(workspace);

  const completed = scoped.reduce((sum, p) => sum + programStats(workspace, p).completed, 0);
  const cohort = new Set(scoped.flatMap((p) => learnersOf(workspace, p.id).map((l) => l.id))).size;

  // Produced units first — they are the only ones with real scores — then the rest of
  // the catalogue that appears in a published programme.
  const unitRows = useMemo(() => {
    const inScope = new Set(scoped.flatMap((p) => p.units));
    const rows: { unit: LibraryUnit; score: number | null }[] = [];
    for (const unit of library) {
      if (!inScope.has(unit.id)) continue;
      const value = unit.contentId && builtUnits[unit.contentId] ? unitScore(workspace, unit.contentId) : null;
      rows.push({ unit, score: value });
    }
    return rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [workspace, scoped]);

  const weakest = unitRows.filter((r) => r.score != null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  const tiles: StatTileProps[] = [
    {
      label: 'ציון תרגילים ממוצע',
      value: score == null ? '—' : `${score}%`,
      pct: score ?? 0,
      sub: weakest ? `${weakest.unit.title} החלשה — ${weakest.score}%` : 'אין עדיין נתוני תרגילים',
      tone: 'magenta',
    },
    {
      label: 'מעורבות שבועית',
      value: String(active.length),
      pct: workspace.learners.length ? Math.round((active.length / workspace.learners.length) * 100) : 0,
      sub: `${Math.round((active.length / Math.max(1, workspace.learners.length)) * 100)}% מהרשומים · 7 ימים`,
      tone: 'green',
    },
    {
      label: 'לומדים בסיכון',
      value: String(atRisk.length),
      pct: workspace.learners.length ? Math.round((atRisk.length / workspace.learners.length) * 100) : 0,
      sub: `${Math.round((atRisk.length / Math.max(1, workspace.learners.length)) * 100)}% מהקהל · מעל 10 ימים`,
      tone: 'amber',
    },
    {
      label: 'השלמת תוכנית',
      value: String(completed),
      pct: cohort ? Math.round((completed / cohort) * 100) : 0,
      sub: `מתוך ${cohort} · ${cohort ? Math.round((completed / cohort) * 100) : 0}%`,
      tone: 'violet',
    },
  ];

  const engMax = Math.max(...engagementWeeks.map((w) => w.active));
  const totalCompleted = engagementWeeks.reduce((a, w) => a + w.completed, 0);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1900);
  };

  return (
    <AdminLayout crumb="אנליטיקה">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>אנליטיקה</h1>
            <p>איך התוכניות מתקדמות בפועל — ומה צריך תשומת לב השבוע.</p>
          </div>
          <span className="spacer" />
          <select
            className="select-pill"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            aria-label="סינון לפי תוכנית"
          >
            <option value="all">כל התוכניות שפורסמו</option>
            {published.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--primary" onClick={() => flash('דוח הלקוח נוצר · PDF + גיליון')}>
            ייצוא דוח לקוח
          </button>
        </div>

        <StatTiles tiles={tiles} />

        <div className="anpair">
          <section className="card card--pad">
            <div className="section__head">
              <div>
                <h3>מעורבות לאורך זמן</h3>
                <p>לומדים פעילים לשבוע · 12 השבועות האחרונים</p>
              </div>
              <span className="spacer" />
              <div className="legend">
                <span>
                  <i style={{ background: 'var(--accent)' }} /> פעילים
                </span>
                <span>
                  <i style={{ background: 'var(--accent-tint-edge)' }} /> השלימו יחידה
                </span>
              </div>
            </div>

            <div className="engchart">
              {engagementWeeks.map((week, i) => {
                const last = i === engagementWeeks.length - 1;
                const label = last ? 'עכשיו' : i % 3 === 0 ? `ש${i + 1}` : '';
                return (
                  <div key={i}>
                    <i data-part="done" style={{ height: `${Math.round((week.completed / engMax) * 118)}px` }} />
                    <i
                      data-part="active"
                      data-last={last || undefined}
                      style={{ height: `${Math.round(((week.active - week.completed) / engMax) * 118)}px` }}
                    />
                    <span data-last={last || undefined}>{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="factrow">
              <div>
                <span>שיא שבועי</span>
                <b>{engMax} לומדים</b>
              </div>
              <div>
                <span>יחידות שהושלמו · 12 שבועות</span>
                <b>{totalCompleted}</b>
              </div>
              <div>
                <span>זמן חציוני ליחידה</span>
                <b>{medianUnitMinutes} דק׳</b>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-5)' }}>
              הסדרה הזאת היא נתוני הדגמה. למרחב העבודה אין יומן פעילות, ולכן היסטוריה שבועית
              אינה נגזרת ממנו — נדרשת רשומת אירוע לכל השלמת נאגט.
            </p>
          </section>

          <section className="card card--pad">
            <div className="section__head">
              <div>
                <h3>ציוני תרגילים לפי יחידה</h3>
                <p>אחוז תשובות נכונות בבוחן או בתרגיל המסכם</p>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {unitRows.map(({ unit, score: value }) => {
                const low = value != null && value < 75;
                return (
                  <div key={unit.id} className="scorerow">
                    <div className="scorerow__top">
                      <b>{unit.title}</b>
                      <span className="spacer" />
                      {value == null ? (
                        <span className="chip">בהפקה</span>
                      ) : (
                        <span className={`chip ${low ? 'chip--amber' : 'chip--green'}`}>{value}%</span>
                      )}
                    </div>
                    <span className="meter">
                      <i style={{ width: `${value ?? 0}%` }} data-tone={low ? 'amber' : undefined} data-empty={value == null} />
                    </span>
                    {low && (
                      <p className="scorerow__note">
                        היחידה החלשה במסלול — כדאי לבדוק את ניסוח השאלות ואת המקטע שלפניהן.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="section">
          <div className="section__head">
            <h3>לומדים בסיכון</h3>
            <span className="chip chip--count">{atRisk.length}</span>
            <span className="spacer" />
            <p>ללא פעילות מעל 10 ימים, הגרוע ראשון</p>
          </div>

          {atRisk.length === 0 ? (
            <p className="empty">אין לומדים בסיכון.</p>
          ) : (
            <div className="card card--flush card--scroll">
              <div className="gridtable">
                <div className="gridtable__head" style={{ gridTemplateColumns: '1.6fr 1.2fr 1fr .9fr .8fr', minWidth: 680 }}>
                  <span>לומד</span>
                  <span>תוכנית</span>
                  <span>נעצר ב</span>
                  <span>ללא פעילות</span>
                  <span>ציון תרגילים</span>
                </div>
                {atRisk.slice(0, 12).map((row) => (
                  <div
                    key={row.learner.id}
                    className="gridtable__row"
                    style={{ gridTemplateColumns: '1.6fr 1.2fr 1fr .9fr .8fr', minWidth: 680 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="initials">{initials(row.learner.name)}</span>
                      <span style={{ minWidth: 0 }}>
                        <b style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                          {row.learner.name}
                        </b>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-4)' }}>{row.learner.org}</span>
                      </span>
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.program?.title ?? '—'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{row.stuck}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: row.days >= 14 ? 'var(--danger)' : 'var(--amber-ink)' }}>
                      {row.days} ימים
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{row.score == null ? '—' : `${row.score}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-4)', maxWidth: '76ch' }}>
          ציוני התרגילים, המעורבות השבועית, ימי חוסר הפעילות ואחוזי ההשלמה מחושבים מרשומות
          ההתקדמות שנרשמו בפועל בנגן. יחידות שעדיין בהפקה אינן נכללות בציון.
        </p>

        {toast && <div className="toast">{toast}</div>}
      </main>
    </AdminLayout>
  );
}

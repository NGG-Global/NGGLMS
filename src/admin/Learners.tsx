import { useState, type FormEvent } from 'react';
import { useStore } from '../state/store';
import { programCompletion } from '../app/progress';
import { AdminLayout } from './AdminLayout';

/** The learner roster, and the one form that adds someone to a programme. */
export function Learners() {
  const { workspace, progressFor, upsertLearner } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [programId, setProgramId] = useState(workspace.programs[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const rows = workspace.learners.filter((l) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return [l.name, l.email, l.org].some((v) => v.toLowerCase().includes(q));
  });

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    upsertLearner({
      name: name.trim(),
      email: email.trim(),
      org: org.trim() || '—',
      programIds: programId ? [programId] : [],
    });
    setToast(`${name.trim()} נוסף לרשימה`);
    setName('');
    setEmail('');
    setOrg('');
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <AdminLayout crumb="לומדים">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>לומדים ומשתתפים</h1>
            <p>משתתפים בכל התוכניות במרחב העבודה.</p>
          </div>
          <span className="spacer" />
          <input
            type="search"
            placeholder="חיפוש לפי שם, דוא״ל או יחידה"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש לומדים"
            style={{ padding: '7px 11px', border: '1px solid var(--line)', borderRadius: 'var(--r)', fontSize: 13 }}
          />
        </div>

        <form className="card card--pad" onSubmit={add} style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            הוספת משתתף
          </div>
          <div className="form2">
            <div className="field">
              <label htmlFor="ln-name">שם מלא</label>
              <input id="ln-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="ln-email">דוא״ל</label>
              <input id="ln-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="ln-org">יחידה ארגונית</label>
              <input id="ln-org" type="text" value={org} onChange={(e) => setOrg(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ln-prog">שיוך לתוכנית</label>
              <select id="ln-prog" value={programId} onChange={(e) => setProgramId(e.target.value)}>
                <option value="">ללא שיוך</option>
                {workspace.programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title} · {program.client}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn--primary" style={{ marginTop: 12 }}>
            הוספה
          </button>
        </form>

        {rows.length === 0 ? (
          <p className="empty">אין לומדים שמתאימים לחיפוש.</p>
        ) : (
          <div className="card card--flush">
            <table className="grid">
              <thead>
                <tr>
                  <th>משתתף</th>
                  <th>יחידה ארגונית</th>
                  <th>תוכניות</th>
                  <th>סטטוס</th>
                  <th>התקדמות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((learner) => {
                  const programs = workspace.programs.filter((p) => learner.programIds.includes(p.id));
                  const values = programs.map((p) => programCompletion(p, progressFor(learner.id)).pct);
                  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                  return (
                    <tr key={learner.id}>
                      <td>
                        {learner.name}
                        <div style={{ fontSize: 12, color: 'var(--ink-4)' }} dir="ltr">
                          {learner.email}
                        </div>
                      </td>
                      <td>{learner.org}</td>
                      <td>{programs.length ? programs.map((p) => p.title).join(', ') : '—'}</td>
                      <td>
                        <span className={`pill${avg === 100 ? ' pill--ok' : avg > 0 ? ' pill--pink' : ''}`}>
                          {avg === 100 ? 'הושלם' : avg > 0 ? 'בתהליך' : 'לא התחיל'}
                        </span>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <span className="row" style={{ gap: 8 }}>
                          <span className="meter" style={{ width: 72 }}>
                            <i style={{ width: `${avg}%` }} />
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{avg}%</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-4)', maxWidth: '72ch' }}>
          מרחב העבודה נטען עם קבוצת הדגמה של שמונה משתתפים (כתובות בדומיין השמור
          <code className="mono"> .invalid</code>), כדי שמסכי הניהול והאנליטיקה יהיו מלאים
          מהרגע הראשון. משתתפים אמיתיים נרשמים מהתקדמות שנמדדת בפועל בנגן.
        </p>

        {toast && <div className="toast">{toast}</div>}
      </main>
    </AdminLayout>
  );
}

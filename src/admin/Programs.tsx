import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { PROGRAM_STATUS_LABEL, type ProgramStatus } from '../state/types';
import { programCompletion } from '../app/progress';
import { AdminLayout } from './AdminLayout';

const FILTERS: { key: ProgramStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'הכול' },
  { key: 'published', label: 'פורסם' },
  { key: 'ready', label: 'מוכן לפרסום' },
  { key: 'draft', label: 'טיוטה' },
  { key: 'archived', label: 'בארכיון' },
];

/** All programmes in the workspace, with the one action that matters per row. */
export function Programs() {
  const { workspace, progressFor, setProgramStatus } = useStore();
  const [filter, setFilter] = useState<ProgramStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const rows = workspace.programs
    .filter((p) => (filter === 'all' ? true : p.status === filter))
    .filter((p) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return [p.title, p.client, p.course, p.audience].some((v) => v.toLowerCase().includes(q));
    });

  return (
    <AdminLayout crumb="תוכניות">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>תוכניות</h1>
            <p>כל מסלולי הלמידה במרחב העבודה, לפי לקוח וסטטוס.</p>
          </div>
          <span className="spacer" />
          <Link className="btn btn--primary" to="/admin/programs/new">
            + תוכנית חדשה
          </Link>
        </div>

        <div className="filters">
          <div className="chipset">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="spacer" />
          <input
            type="search"
            placeholder="חיפוש לפי שם, לקוח או קהל"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש תוכניות"
          />
        </div>

        {rows.length === 0 ? (
          <p className="empty">אין תוכניות שמתאימות לסינון.</p>
        ) : (
          <div className="card card--flush">
            <table className="grid">
              <thead>
                <tr>
                  <th>תוכנית</th>
                  <th>לקוח</th>
                  <th>קהל יעד</th>
                  <th>יחידות</th>
                  <th>לומדים</th>
                  <th>התקדמות</th>
                  <th>סטטוס</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((program) => {
                  const learners = workspace.learners.filter((l) => l.programIds.includes(program.id));
                  const values = learners.map((l) => programCompletion(program, progressFor(l.id)).pct);
                  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                  return (
                    <tr key={program.id}>
                      <td>
                        <Link to={`/admin/programs/${program.id}`}>{program.title || 'ללא שם'}</Link>
                        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{program.course}</div>
                      </td>
                      <td>{program.client || '—'}</td>
                      <td>{program.audience || '—'}</td>
                      <td>{program.units.length}</td>
                      <td>{learners.length}</td>
                      <td>{program.status === 'published' ? `${avg}%` : '—'}</td>
                      <td>
                        <span
                          className={`pill${program.status === 'published' ? ' pill--ok' : program.status === 'ready' ? ' pill--pink' : ''}`}
                        >
                          {PROGRAM_STATUS_LABEL[program.status]}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <Link className="btn btn--quiet" to={`/admin/programs/${program.id}/build`}>
                          עריכה
                        </Link>
                        {program.status === 'archived' ? (
                          <button
                            type="button"
                            className="btn btn--quiet"
                            style={{ marginInlineStart: 10 }}
                            onClick={() => setProgramStatus(program.id, 'draft')}
                          >
                            שחזור
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--quiet"
                            style={{ marginInlineStart: 10, color: 'var(--ink-4)' }}
                            onClick={() => setProgramStatus(program.id, 'archived')}
                          >
                            לארכיון
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-4)' }}>
          תוכניות מועברות לארכיון ולא נמחקות, כדי לשמור על היסטוריית הלמידה של הלומדים.
        </p>
      </main>
    </AdminLayout>
  );
}

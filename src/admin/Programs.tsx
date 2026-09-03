import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { PROGRAM_STATUS_LABEL, type ProgramStatus } from '../state/types';
import { programStats, programsByScope, type ProgramScope } from '../app/progress';
import { AdminLayout } from './AdminLayout';

const STATUS_CHIP: Record<ProgramStatus, string> = {
  published: 'chip chip--green',
  draft: 'chip chip--plain',
  ready: 'chip chip--amber',
  archived: 'chip chip--outline',
};

const SCOPE_NOTE: Record<ProgramScope, string> = {
  mine: 'תוכניות שאת יצרת ומנהלת',
  team: 'תוכניות של מנהלי תוכן אחרים ב-NGG',
  all: 'כל התוכניות במרחב העבודה',
};

/** Every programme in the workspace, as client-branded cards split by ownership. */
export function Programs() {
  const { identity, workspace } = useStore();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<ProgramScope>('mine');
  const query = params.get('q') ?? '';

  const owner = identity?.name ?? '';
  const counts = {
    mine: programsByScope(workspace.programs, owner, 'mine').length,
    team: programsByScope(workspace.programs, owner, 'team').length,
    all: workspace.programs.length,
  };

  const rows = useMemo(() => {
    const scoped = programsByScope(workspace.programs, owner, scope);
    if (!query.trim()) return scoped;
    const q = query.trim().toLowerCase();
    return scoped.filter((p) =>
      [p.title, p.client, p.course, p.audience, p.cohort, p.owner].some((v) => v.toLowerCase().includes(q)),
    );
  }, [workspace.programs, owner, scope, query]);

  const stats = useMemo(
    () => new Map(workspace.programs.map((p) => [p.id, programStats(workspace, p)])),
    [workspace],
  );

  return (
    <AdminLayout crumb="תוכניות">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>תוכניות</h1>
            <p>{SCOPE_NOTE[scope]}</p>
          </div>
          <span className="spacer" />
          <Link className="btn btn--primary" to="/admin/programs/new">
            + תוכנית חדשה
          </Link>
        </div>

        <div className="filters">
          <div className="seg seg--ink">
            {(['mine', 'team', 'all'] as ProgramScope[]).map((key) => (
              <button key={key} type="button" aria-pressed={scope === key} onClick={() => setScope(key)}>
                {key === 'mine' ? 'שלי' : key === 'team' ? 'של הצוות' : 'הכול'} · {counts[key]}
              </button>
            ))}
          </div>
          <span className="spacer" />
          <input
            type="search"
            placeholder="חיפוש לפי שם, לקוח, קהל או מחזור"
            value={query}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('q', e.target.value);
              else next.delete('q');
              setParams(next, { replace: true });
            }}
            aria-label="חיפוש תוכניות"
          />
        </div>

        {rows.length === 0 ? (
          <p className="empty">אין תוכניות שמתאימות לסינון.</p>
        ) : (
          <div className="progcards">
            {rows.map((program) => {
              const s = stats.get(program.id);
              const to =
                program.status === 'draft' || program.status === 'ready'
                  ? `/admin/programs/${program.id}/build`
                  : `/admin/programs/${program.id}`;
              return (
                <Link key={program.id} className="card progcard" to={to}>
                  <div className="progcard__top">
                    <span className="mono-badge">{program.client[0]}</span>
                    <span className="progcard__client">
                      <b>{program.client}</b>
                      <span>{program.cohort}</span>
                    </span>
                    <span className={STATUS_CHIP[program.status]}>{PROGRAM_STATUS_LABEL[program.status]}</span>
                  </div>

                  <div className="progcard__name">{program.title}</div>
                  <div className="progcard__aud">{program.audience}</div>

                  <span className="meter">
                    <i style={{ width: `${s?.avgPct ?? 0}%` }} data-empty={!s?.started} />
                  </span>

                  <div className="progcard__foot">
                    <span>{program.units.length} יחידות</span>
                    <span>{s?.learners ? `${s.learners} לומדים` : 'טרם פורסם'}</span>
                    <b>{s?.started ? `${s.avgPct}%` : '—'}</b>
                    <em>{program.owner}</em>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-4)' }}>
          תוכניות מועברות לארכיון ולא נמחקות, כדי לשמור על היסטוריית הלמידה של הלומדים.
        </p>
      </main>
    </AdminLayout>
  );
}

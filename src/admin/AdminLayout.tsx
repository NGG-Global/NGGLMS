import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { library } from '../content';
import { useStore } from '../state/store';
import { Shell } from '../app/Shell';
import './admin.css';

interface Props {
  crumb?: string;
  children: ReactNode;
}

/** Admin shell: workspace navigation plus the shared header. */
export function AdminLayout({ crumb, children }: Props) {
  const { workspace } = useStore();
  const programCount = workspace.programs.length;
  const draft = workspace.programs.find((p) => p.status === 'draft');

  const items: { to: string; label: string; count?: number; end?: boolean }[] = [
    { to: '/admin', label: 'דשבורד', end: true },
    { to: '/admin/programs', label: 'תוכניות', count: programCount },
    { to: '/admin/library', label: 'ספריית תוכן', count: library.length },
    { to: '/admin/learners', label: 'לומדים ומשתתפים', count: workspace.learners.length },
    { to: '/admin/analytics', label: 'אנליטיקה' },
    { to: '/admin/settings', label: 'הגדרות' },
  ];

  return (
    <Shell crumb={crumb}>
      <div className="admin">
        <nav className="admin__nav" aria-label="ניווט ניהול">
          <span className="micro">NGG CONSULTING</span>
          {items.map((item) => (
            <NavLink key={item.to} className="navitem" to={item.to} end={item.end}>
              <span className="navitem__glyph" aria-hidden />
              <span>{item.label}</span>
              {item.count != null && <span className="navitem__count">{item.count}</span>}
            </NavLink>
          ))}

          <span className="spacer" />

          {draft && (
            <div className="draftcard">
              <div className="draftcard__k">טיוטה בעבודה</div>
              <div className="draftcard__t">{draft.title}</div>
              <div className="draftcard__m">
                {draft.client} · {draft.units.length} יחידות
              </div>
              <Link className="btn btn--primary btn--sm btn--block" to={`/admin/programs/${draft.id}/build`}>
                להמשיך בבנייה
              </Link>
            </div>
          )}
        </nav>
        <div className="admin__body">{children}</div>
      </div>
    </Shell>
  );
}

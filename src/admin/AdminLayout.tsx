import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
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
  const active = workspace.programs.filter((p) => p.status !== 'archived').length;

  const items: { to: string; label: string; count?: number; end?: boolean }[] = [
    { to: '/admin', label: 'סקירה', end: true },
    { to: '/admin/programs', label: 'תוכניות', count: active },
    { to: '/admin/library', label: 'ספריית תוכן', count: library.length },
    { to: '/admin/learners', label: 'לומדים', count: workspace.learners.length },
    { to: '/admin/analytics', label: 'אנליטיקה' },
    { to: '/admin/settings', label: 'הגדרות' },
  ];

  return (
    <Shell crumb={crumb}>
      <div className="admin">
        <nav className="admin__nav" aria-label="ניווט ניהול">
          <span className="eyebrow">WORKSPACE</span>
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <span>{item.label}</span>
              {item.count != null && <span className="count">{item.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin__body">{children}</div>
      </div>
    </Shell>
  );
}

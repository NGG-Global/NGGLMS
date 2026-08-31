import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../state/store';
import { assetUrl } from './paths';
import './shell.css';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('') || '·';
}

interface Props {
  crumb?: string;
  children: ReactNode;
}

/** Header shared by both sides. The mode switch only appears for admins. */
export function Shell({ crumb, children }: Props) {
  const { identity, signOut } = useStore();
  const isAdmin = identity?.role === 'admin';

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="topbar__brand" to={isAdmin ? '/admin' : '/learn'}>
          <img src={assetUrl('assets/ngg-mark.png')} alt="NGG" />
          <b>פלטפורמת הלמידה</b>
        </Link>
        <span className="topbar__sep" />
        <span className="topbar__crumb">{crumb}</span>
        <span className="spacer" />
        {isAdmin && (
          <nav className="topbar__modes" aria-label="מצב תצוגה">
            <NavLink to="/admin" aria-current={location.hash.startsWith('#/admin')}>
              ניהול
            </NavLink>
            <NavLink to="/learn" aria-current={location.hash.startsWith('#/learn')}>
              לומד
            </NavLink>
          </nav>
        )}
        {identity && (
          <>
            <button
              type="button"
              className="btn btn--quiet"
              style={{ fontSize: 12.5, color: 'var(--ink-3)' }}
              onClick={signOut}
            >
              יציאה
            </button>
            <span className="topbar__who" title={`${identity.name} · ${identity.email}`}>
              {initials(identity.name)}
            </span>
          </>
        )}
      </header>
      {children}
    </div>
  );
}

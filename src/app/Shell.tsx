import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { assetUrl } from './paths';
import './shell.css';

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('') || '·'
  );
}

interface Props {
  crumb?: string;
  children: ReactNode;
}

/**
 * Header shared by both sides: brand, crumb, workspace search, the ניהול/לומד switch,
 * notifications and identity. The mode switch only appears for admins.
 */
export function Shell({ crumb, children }: Props) {
  const { identity, signOut } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const isAdmin = identity?.role === 'admin';
  const onLearner = location.hash.startsWith('#/learn');

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    // Search lands on the library or programme list, whichever the admin can act on.
    navigate(isAdmin ? `/admin/programs?q=${encodeURIComponent(query.trim())}` : '/learn');
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="topbar__brand" to={isAdmin && !onLearner ? '/admin' : '/learn'}>
          <img src={assetUrl('assets/ngg-mark.png')} alt="NGG" />
          <b>פלטפורמת הלמידה</b>
        </Link>
        <span className="topbar__sep" />
        <span className="topbar__crumb">{crumb}</span>

        <form className="topbar__search" onSubmit={submitSearch} role="search">
          <span className="magnifier" aria-hidden />
          <input
            className="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש תוכניות, לקוחות, יחידות…"
            aria-label="חיפוש במרחב העבודה"
          />
        </form>

        {isAdmin ? (
          <nav className="seg" aria-label="מצב תצוגה">
            <Link to="/admin" aria-current={!onLearner}>
              ניהול
            </Link>
            <Link to="/learn" aria-current={onLearner}>
              לומד
            </Link>
          </nav>
        ) : (
          <span className="spacer" />
        )}

        <button type="button" className="topbar__bell" aria-label="עדכונים">
          ●<i />
        </button>

        {identity && (
          <div className="topbar__me">
            <b>{identity.name}</b>
            <button
              type="button"
              className="topbar__avatar"
              title={`${identity.name} · ${identity.email} — יציאה`}
              onClick={signOut}
            >
              {initials(identity.name)}
            </button>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  contentTypes,
  isPlayable,
  library,
  libraryUnit,
  roles,
  topics,
  unitHealth,
  unitMinutes,
  unitNuggets,
} from '../content';
import { formatTime } from '../player/timeline';
import { AdminLayout } from './AdminLayout';

const SORTS = ['הנפוץ ביותר', 'נוסף לאחרונה', 'הקצר ביותר'] as const;

/** Content library: what NGG can put into a programme. */
export function Library() {
  const [role, setRole] = useState('הכול');
  const [topic, setTopic] = useState('הכול');
  const [type, setType] = useState('הכול');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('הנפוץ ביותר');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const filtered = library
      .filter((u) => (role === 'הכול' ? true : u.roles.includes(role)))
      .filter((u) => (topic === 'הכול' ? true : u.topic === topic))
      .filter((u) => (type === 'הכול' ? true : u.contentType === type))
      .filter((u) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return [u.title, u.summary, u.objective, ...u.tags].some((v) => v.toLowerCase().includes(q));
      });
    const sorted = [...filtered];
    if (sort === 'הנפוץ ביותר') sorted.sort((a, b) => b.usedInPrograms - a.usedInPrograms);
    if (sort === 'נוסף לאחרונה') sorted.sort((a, b) => b.recencyRank - a.recencyRank);
    if (sort === 'הקצר ביותר') sorted.sort((a, b) => unitMinutes(a) - unitMinutes(b));
    return sorted;
  }, [role, topic, type, sort, query]);

  return (
    <AdminLayout crumb="ספריית התוכן">
      <main className="page">
        <div className="page__head">
          <div>
            <h1>ספריית התוכן של NGG</h1>
            <p>
              {library.length} יחידות בקטלוג, {library.filter(isPlayable).length} מהן מופקות ומוכנות
              לשילוב בתוכנית.
            </p>
          </div>
        </div>

        <div className="filters">
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="תפקיד">
            <option>הכול</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="נושא">
            <option>הכול</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="סוג תוכן">
            <option>הכול</option>
            {contentTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            aria-label="מיון"
          >
            {SORTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="search"
            placeholder="חיפוש ביחידות"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש"
          />
        </div>

        {rows.length === 0 ? (
          <p className="empty">
            אין יחידות שמתאימות לסינון.{' '}
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setRole('הכול');
                setTopic('הכול');
                setType('הכול');
                setQuery('');
              }}
            >
              ניקוי הסינון
            </button>
          </p>
        ) : (
          <div className="libgrid">
            {rows.map((unit) => {
              const health = unit.contentId ? unitHealth(unit.contentId) : null;
              return (
                <article key={unit.id} className="card libcard">
                  <div className="libcard__top">
                    <h3>{unit.title}</h3>
                    <span className="spacer" />
                    {isPlayable(unit) ? (
                      <span className="pill pill--ok">מופק</span>
                    ) : (
                      <span className="pill pill--warn">בהפקה</span>
                    )}
                  </div>
                  <p>{unit.summary}</p>
                  <div className="libcard__meta">
                    <span className="pill pill--outline">{unit.topic}</span>
                    <span className="pill pill--outline">{unitMinutes(unit)} דק׳</span>
                    <span className="pill pill--outline">{unit.contentType}</span>
                    {unit.usedInPrograms > 0 && (
                      <span className="pill pill--outline">ב־{unit.usedInPrograms} תוכניות</span>
                    )}
                    {health && health.silentSegments.length > 0 && (
                      <span className="pill pill--warn">{health.silentSegments.length} ללא קריינות</span>
                    )}
                  </div>
                  <div className="libcard__foot">
                    <Link className="btn btn--quiet" to={`/admin/library/${unit.id}`}>
                      פרטי היחידה ←
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

/** One library unit in full: who it is for, its structure, and its assessment. */
export function LibraryUnitPage() {
  const { unitId } = useParams();
  const unit = unitId ? libraryUnit(unitId) : undefined;

  if (!unit) {
    return (
      <AdminLayout crumb="יחידה">
        <main className="page">
          <p className="empty">היחידה לא נמצאה בספרייה.</p>
        </main>
      </AdminLayout>
    );
  }

  const health = unit.contentId ? unitHealth(unit.contentId) : null;
  const nuggets = unitNuggets(unit);

  return (
    <AdminLayout crumb={`ספריית התוכן · ${unit.title}`}>
      <main className="page page--narrow">
        <p>
          <Link className="btn btn--quiet" to="/admin/library">
            ← לספריית התוכן
          </Link>
        </p>

        <div className="page__head">
          <div>
            <span className="eyebrow eyebrow--pink">{unit.topic}</span>
            <h1 style={{ marginTop: 6 }}>{unit.title}</h1>
            <p>{unit.summary}</p>
          </div>
          <span className="spacer" />
          {isPlayable(unit) ? <span className="pill pill--ok">מופק</span> : <span className="pill pill--warn">בהפקה</span>}
        </div>

        <div className="unitpage">
          <div className="stack" style={{ gap: 18 }}>
            <section className="card card--pad">
              <div className="eyebrow">מטרת הלמידה</div>
              <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>{unit.objective}</p>
            </section>

            <section className="card card--pad">
              <div className="eyebrow">מבנה היחידה · יחידה → נאגטים → הערכה</div>
              <ul className="blocklist" style={{ marginTop: 10 }}>
                {nuggets.map((nugget, i) => {
                  const segment = health?.segments[i];
                  return (
                    <li key={i}>
                      <i>{String(i + 1).padStart(2, '0')}</i>
                      <span>
                        <b>{nugget.title}</b>
                        {nugget.summary && <em>{nugget.summary}</em>}
                      </span>
                      <span className="t">
                        {segment ? formatTime(segment.durationSec) : `${nugget.minutes} דק׳`}
                        {segment && !segment.hasAudio ? ' · ללא קריינות' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {unit.quiz && (
              <section className="card card--pad">
                <div className="eyebrow">בוחן</div>
                <ol className="stack" style={{ gap: 12, marginTop: 10 }}>
                  {unit.quiz.map((item, i) => (
                    <li key={i}>
                      <p style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {i + 1}. {item.q}
                      </p>
                      <ul className="stack" style={{ gap: 3, marginTop: 5 }}>
                        {item.opts.map((opt, j) => (
                          <li
                            key={j}
                            style={{
                              fontSize: 12.5,
                              color: j === item.answer ? 'var(--green)' : 'var(--ink-3)',
                              fontWeight: j === item.answer ? 600 : 400,
                            }}
                          >
                            {j === item.answer ? '✓ ' : '· '}
                            {opt}
                          </li>
                        ))}
                      </ul>
                      <p style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-4)' }}>{item.why}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {unit.task && (
              <section className="card card--pad">
                <div className="eyebrow">{unit.task.title}</div>
                <p style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6 }}>{unit.task.lead}</p>
                {unit.task.quote && (
                  <blockquote
                    style={{
                      marginTop: 10,
                      padding: '10px 13px',
                      borderRadius: 'var(--r-well)',
                      background: 'var(--accent-tint)',
                      fontSize: 13.5,
                      fontWeight: 600,
                    }}
                  >
                    “{unit.task.quote}”
                  </blockquote>
                )}
                {unit.task.items && (
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {unit.task.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <aside className="stack" style={{ gap: 14, position: 'sticky', top: 'calc(var(--topbar-h) + 22px)' }}>
            <div className="card card--pad">
              <div className="eyebrow">למי היחידה מיועדת</div>
              <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {unit.recommendedFor}
              </p>
              <div className="chipset" style={{ marginTop: 10 }}>
                {unit.roles.map((r) => (
                  <span key={r} className="pill pill--outline">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="card card--pad">
              <div className="eyebrow">בסיום היחידה הלומד יוכל</div>
              <ul className="ticks" style={{ marginTop: 8 }}>
                {unit.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>

            <div className="card card--pad stack" style={{ gap: 7, fontSize: 13 }}>
              <div className="eyebrow">נתוני היחידה</div>
              <Row k="משך" v={`${unitMinutes(unit)} דק׳`} />
              <Row k="נאגטים" v={String(nuggets.length)} />
              <Row k="הערכה" v={unit.assessment} />
              <Row k="סוג תוכן" v={unit.contentType} />
              <Row k="בשימוש" v={`${unit.usedInPrograms} תוכניות`} />
              {unit.prerequisite && <Row k="קדם" v={unit.prerequisite} />}
            </div>

            {health && health.silentSegments.length > 0 && (
              <div className="banner banner--warn">
                <span>
                  <strong>{health.silentSegments.length} מקטעים ללא קריינות.</strong> חסרים הקבצים:{' '}
                  {[...new Set(health.silentSegments.map((s) => s.src.split('/').pop()))].join(', ')}.
                </span>
              </div>
            )}
          </aside>
        </div>
      </main>
    </AdminLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <span className="row" style={{ gap: 8 }}>
      <span style={{ color: 'var(--ink-4)', minWidth: 70 }}>{k}</span>
      <span style={{ fontWeight: 500 }}>{v}</span>
    </span>
  );
}

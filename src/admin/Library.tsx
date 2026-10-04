import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  builtUnits,
  isPlayable,
  library,
  libraryUnit,
  roles,
  topicStyle,
  topicStyles,
  topicVars,
  unitCode,
  unitHealth,
  unitMinutes,
  unitNuggets,
  nuggetWeights,
  type LibraryUnit,
} from '../content';
import { formatTime } from '../player/timeline';
import { useStore } from '../state/store';
import { programUnits } from '../app/progress';
import { PROGRAM_STATUS_LABEL, type Program } from '../state/types';
import { ClientLogo } from '../app/ClientLogo';
import { AdminLayout } from './AdminLayout';
import { NuggetBar, StatusChip, UnitCover, programHref, totalMinutes } from './catalog';
import '../learner/learner.css';

const unitsLabel = (n: number) => (n === 1 ? 'יחידה אחת' : `${n} יחידות`);

/** Topics in curriculum order, then any the palette does not know yet. */
const catalogTopics = [
  ...topicStyles.map((t) => t.name),
  ...[...new Set(library.map((u) => u.topic))].filter((t) => !topicStyles.some((s) => s.name === t)),
];

function matches(unit: LibraryUnit, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [unit.title, unit.summary, unit.objective, unit.topic, unitCode(unit), ...unit.tags].some((v) =>
    v.toLowerCase().includes(q),
  );
}

function topicAnchor(topic: string): string {
  return `topic-${topicStyle(topic).code}-${catalogTopics.indexOf(topic)}`;
}

/**
 * Content library as a curriculum map: every topic in order, each unit showing its
 * nuggets to scale, so an admin can see what exists and what is still in production
 * before opening a single unit.
 */
export function Library() {
  const [role, setRole] = useState('הכול');
  const [onlyProduced, setOnlyProduced] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      library.filter(
        (u) => (role === 'הכול' || u.roles.includes(role)) && (!onlyProduced || isPlayable(u)) && matches(u, query),
      ),
    [role, onlyProduced, query],
  );

  const groups = catalogTopics
    .map((topic) => ({ topic, units: filtered.filter((u) => u.topic === topic) }))
    .filter((g) => g.units.length > 0);

  const produced = library.filter(isPlayable).length;
  const coveredTopics = catalogTopics.filter((t) => library.some((u) => u.topic === t)).length;
  const inProduction = library.length - produced;

  const clear = () => {
    setRole('הכול');
    setOnlyProduced(false);
    setQuery('');
  };

  return (
    <AdminLayout crumb="ספריית התוכן">
      <main className="page">
        <div className="page__head" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <h1>ספריית התוכן של NGG</h1>
            <p>
              {unitsLabel(library.length)}{' '}
              {coveredTopics === catalogTopics.length
                ? coveredTopics === 1
                  ? 'בנושא אחד.'
                  : `ב-${coveredTopics} נושאים.`
                : `ב-${coveredTopics} מתוך ${catalogTopics.length} נושאים.`}{' '}
              {inProduction === 0
                ? 'כל היחידות מופקות ומוכנות להשמעה.'
                : `${produced} מופקות ומוכנות להשמעה, ${inProduction} בהפקה ומוצגות ללומד כ״בהכנה״.`}
            </p>
          </div>
          <span className="spacer" />
          <div className="catlegend" aria-hidden>
            <span>
              <i className="catlegend__made" />
              מופק
            </span>
            {inProduction > 0 && (
              <span>
                <i className="catlegend__hatch" />
                בהפקה
              </span>
            )}
            <span className="mono">כל פס = נאגט, רוחב לפי דקות</span>
          </div>
        </div>

        <nav className="topicindex" aria-label="נושאים">
          {catalogTopics.map((topic) => {
            const all = library.filter((u) => u.topic === topic);
            const shown = filtered.some((u) => u.topic === topic);
            return (
              <button
                key={topic}
                type="button"
                className="topictile"
                style={topicVars(topic)}
                disabled={!shown}
                title={shown ? undefined : all.length ? 'אין יחידות בנושא הזה שמתאימות לסינון' : 'עדיין אין יחידות בנושא הזה'}
                onClick={() =>
                  document.getElementById(topicAnchor(topic))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                <span className="topictile__code">{topicStyle(topic).code}</span>
                <b>{topic}</b>
                <span>{all.length ? `${unitsLabel(all.length)} · ${totalMinutes(all)} דק׳` : 'אין עדיין יחידות'}</span>
              </button>
            );
          })}
        </nav>

        <div className="catbar">
          <span className="catbar__k">קהל</span>
          <div className="seg catbar__seg" role="group" aria-label="קהל">
            {['הכול', ...roles].map((r) => (
              <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className="chipset">
            <button type="button" aria-pressed={onlyProduced} onClick={() => setOnlyProduced(!onlyProduced)}>
              מופק בלבד
            </button>
          </div>
          <span className="spacer" />
          <input
            type="search"
            placeholder="חיפוש ביחידות"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש ביחידות"
          />
        </div>

        {groups.length === 0 ? (
          <p className="empty">
            אין יחידות שמתאימות לסינון.{' '}
            <button type="button" className="btn btn--quiet" onClick={clear}>
              ניקוי הסינון
            </button>
          </p>
        ) : (
          <div className="catgroups">
            {groups.map(({ topic, units }) => {
              const made = units.filter(isPlayable).length;
              return (
                <section key={topic} id={topicAnchor(topic)} className="catgroup" style={topicVars(topic)}>
                  <div className="catgroup__head">
                    <div className="catgroup__code">{topicStyle(topic).code}</div>
                    <h2>{topic}</h2>
                    <p>
                      {unitsLabel(units.length)} · {totalMinutes(units)} דק׳
                      {made ? ` · ${made === 1 ? 'מופקת אחת' : `${made} מופקות`}` : ''}
                    </p>
                  </div>
                  <div className="ucards">
                    {units.map((unit) => (
                      <UnitCard key={unit.id} unit={unit} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

function UnitCard({ unit }: { unit: LibraryUnit }) {
  const to = `/admin/library/${unit.id}`;
  return (
    <article className="card ucard">
      <UnitCover unit={unit} />
      <div className="ucard__body">
        <h3>
          <Link to={to}>{unit.title}</Link>
        </h3>
        <p>{unit.summary}</p>
        <NuggetBar unit={unit} style={{ marginTop: 'auto' }} />
        <div className="ucard__meta">
          <b>{unitMinutes(unit)} דק׳</b>
          <span aria-hidden>·</span>
          <span>{unitNuggets(unit).length} נאגטים</span>
          <span aria-hidden>·</span>
          <span>{unit.assessment}</span>
        </div>
        <div className="ucard__foot">
          {unit.roles.map((r) => (
            <span key={r} className="rolechip">
              {r}
            </span>
          ))}
          <span className="spacer" />
          <Link className="btn btn--quiet" to={to} aria-label={`פרטי היחידה ${unit.title}`}>
            פרטים ←
          </Link>
        </div>
      </div>
    </article>
  );
}

/** One library unit in full: who it is for, its structure, and its assessment. */
export function LibraryUnitPage() {
  const { unitId } = useParams();
  const { workspace } = useStore();
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
  const content = unit.contentId ? builtUnits[unit.contentId] : undefined;
  const intro = content?.unit.intro;
  const nuggets = unitNuggets(unit);
  const weights = nuggetWeights(unit);
  const playable = isPlayable(unit);

  const usedBy = workspace.programs
    .filter((p) => p.units.includes(unit.id))
    .sort((a, b) => (a.status === 'published' ? -1 : 0) - (b.status === 'published' ? -1 : 0));
  // "View as learner" needs a programme the unit sits in; prefer a live one.
  const previewIn = usedBy.find((p) => p.status === 'published') ?? usedBy[0];

  return (
    <AdminLayout crumb={`ספריית התוכן · ${unit.title}`}>
      <main className="page page--unit" style={topicVars(unit.topic)}>
        <Link className="btn btn--quiet" to="/admin/library">
          ← לספריית התוכן
        </Link>

        <section className="card uhero">
          <div className="uhero__body">
            <div className="uhero__tags">
              <span className="topicchip">{unit.topic}</span>
              <span className="ucode">{unitCode(unit)}</span>
              <StatusChip unit={unit} />
            </div>
            <h1>{unit.title}</h1>
            <p className="uhero__lead">{unit.summary}</p>
            <div className="statstrip">
              <div>
                <span>משך</span>
                <b>{unitMinutes(unit)} דק׳</b>
              </div>
              <div>
                <span>נאגטים</span>
                <b>{nuggets.length}</b>
              </div>
              <div>
                <span>הערכה</span>
                <b>{unit.assessment}</b>
              </div>
              <div>
                <span>משובצת ב</span>
                <b>{usedBy.length === 1 ? 'תוכנית אחת' : `${usedBy.length} תוכניות`}</b>
              </div>
            </div>
            <div className="uhero__acts">
              <AddToProgram unit={unit} />
              {playable && previewIn && (
                <Link className="btn btn--ghost" to={`/learn/${previewIn.id}/${unit.id}`}>
                  צפייה כלומד ←
                </Link>
              )}
            </div>
          </div>
          <UnitCover unit={unit} className="uhero__cover" showStatus={false} showCode={false} />
        </section>

        {!playable && (
          <div className="banner banner--warn" style={{ marginTop: 14 }}>
            <span>
              <strong>היחידה בהפקה.</strong> אפשר לשבץ אותה בתוכנית כבר עכשיו. עד שתופק, הלומדים יראו אותה מסומנת
              ״בהכנה״ והיא לא תיספר באחוזי ההתקדמות.
            </span>
          </div>
        )}

        <div className="unitpage" style={{ marginTop: 18 }}>
          <div className="stack" style={{ gap: 18 }}>
            <section className="card card--pad">
              <div className="section__head">
                <h2>מבנה היחידה</h2>
                <p>
                  {intro ? 'פתיח → ' : ''}נאגטים → {unit.assessment}
                </p>
              </div>
              <div className="structbar" data-made={playable} aria-hidden>
                {/* Same scale as the nuggets: seconds for a produced unit, minutes otherwise.
                    The assessment has no measured length, so it takes an average nugget's width. */}
                {intro && (
                  <span className="structbar__open" style={{ flex: intro.end - intro.start }}>
                    פתיח
                  </span>
                )}
                {weights.map((w, i) => (
                  <span key={i} className="structbar__n" style={{ flex: w }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                ))}
                <span className="structbar__assess" style={{ flex: weights.reduce((a, b) => a + b, 0) / weights.length }}>
                  {unit.assessment}
                </span>
              </div>
              <ol className="nlist">
                {intro && (
                  <li>
                    <span className="nlist__n nlist__n--open">▶</span>
                    <span>
                      <b>פתיח היחידה</b>
                    </span>
                    <span className="t">{formatTime(intro.end - intro.start)}</span>
                  </li>
                )}
                {nuggets.map((nugget, i) => {
                  const segment = health?.segments[i];
                  return (
                    <li key={i}>
                      <span className="nlist__n">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <b>{nugget.title}</b>
                        {nugget.summary && <em>{nugget.summary}</em>}
                      </span>
                      <span className="t">
                        {segment ? formatTime(segment.durationSec) : `${nugget.minutes} דק׳`}
                        {segment && !segment.hasAudio ? ' · ללא קריינות' : ''}
                        {segment?.hasVideo ? ' · סרטון' : ''}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="card card--pad">
              <h2 className="cardtitle">מטרת הלמידה</h2>
              <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65 }}>{unit.objective}</p>
              <h3 className="cardtitle cardtitle--sm" style={{ marginTop: 16 }}>
                בסיום היחידה הלומד יוכל
              </h3>
              <ul className="ticks ticks--2col" style={{ marginTop: 8 }}>
                {unit.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </section>

            {(unit.quiz || unit.task) && <Assessment unit={unit} />}
          </div>

          <aside className="stack unitpage__side">
            <div className="card card--pad">
              <div className="micro">למי היחידה מיועדת</div>
              <div className="chipset" style={{ marginTop: 10 }}>
                {unit.roles.map((r) => (
                  <span key={r} className="chip chip--ink">
                    {r}
                  </span>
                ))}
              </div>
              <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {unit.recommendedFor}
              </p>
              {unit.prerequisite && (
                <p className="uprereq">
                  דרישת קדם: <b>{unit.prerequisite}</b>
                </p>
              )}
            </div>

            <div className="card card--pad">
              <div className="micro">משובצת בתוכניות במרחב העבודה</div>
              {usedBy.length ? (
                <ul className="usedby">
                  {usedBy.map((p) => (
                    <li key={p.id}>
                      <Link to={programHref(p)}>
                        <ClientLogo client={p.client} size={26} radius={8} />
                        <span className="usedby__t">
                          <b>{p.title}</b>
                          <span>
                            {p.client} · {PROGRAM_STATUS_LABEL[p.status]}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-4)' }}>
                  עדיין לא משובצת באף תוכנית במרחב העבודה.
                </p>
              )}
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

/** The unit's quiz or task, as the learner meets it at the end of the unit. */
function Assessment({ unit }: { unit: LibraryUnit }) {
  return (
    <section className="card card--pad">
      <div className="section__head">
        <h2>הערכה</h2>
        <p>{unit.assessment}</p>
      </div>
      {unit.quiz && (
        <ol className="stack" style={{ gap: 12, marginTop: 12 }}>
          {unit.quiz.map((item, i) => (
            <li key={i}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
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
      )}
      {unit.task && (
        <div style={{ marginTop: unit.quiz ? 16 : 10 }}>
          <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{unit.task.title}</b>
          <p style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.6 }}>{unit.task.lead}</p>
          {unit.task.quote && <blockquote className="uquote">“{unit.task.quote}”</blockquote>}
          {unit.task.listLead && <p style={{ marginTop: 10, fontSize: 13.5 }}>{unit.task.listLead}</p>}
          {unit.task.items && (
            <ul className="ticks" style={{ marginTop: 8 }}>
              {unit.task.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {unit.task.ask && <p style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600 }}>{unit.task.ask}</p>}
        </div>
      )}
    </section>
  );
}

/**
 * "+ Add to programme": drafts and ready programmes, or a new one. Live programmes are
 * left out on purpose — changing a published path belongs in the builder, where the
 * change is reviewed before it reaches learners.
 */
function AddToProgram({ unit }: { unit: LibraryUnit }) {
  const { workspace, saveProgram } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const editable = workspace.programs.filter((p) => p.status === 'draft' || p.status === 'ready');

  const addTo = (program: Program) => {
    saveProgram({ ...program, units: [...program.units, unit.id] });
    navigate(`/admin/programs/${program.id}/build?step=1&sel=${unit.id}`);
  };

  return (
    <div className="addmenu" ref={box}>
      <button type="button" className="btn btn--primary" aria-expanded={open} onClick={() => setOpen(!open)}>
        + הוספה לתוכנית
      </button>
      {open && (
        <div className="addmenu__panel card">
          <div className="micro" style={{ padding: '4px 10px 6px' }}>
            טיוטות ותוכניות מוכנות לפרסום
          </div>
          {editable.map((p) => {
            const already = p.units.includes(unit.id);
            return (
              <button key={p.id} type="button" disabled={already} onClick={() => addTo(p)}>
                <ClientLogo client={p.client} size={26} radius={8} />
                <span className="addmenu__t">
                  <b>{p.title || 'תוכנית ללא שם'}</b>
                  <span>
                    {p.client || 'לקוח לא הוגדר'} · {already ? 'כבר במסלול' : `${programUnits(p).length} יחידות`}
                  </span>
                </span>
              </button>
            );
          })}
          {editable.length === 0 && (
            <p style={{ padding: '4px 10px 8px', fontSize: 12.5, color: 'var(--ink-4)' }}>אין טיוטות פתוחות.</p>
          )}
          <Link className="addmenu__new" to={`/admin/programs/new?add=${unit.id}`}>
            + תוכנית חדשה עם היחידה
          </Link>
        </div>
      )}
    </div>
  );
}

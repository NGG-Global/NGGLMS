import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { contentTypes, isPlayable, languages, library, libraryUnit, roles, topics, unitMinutes } from '../content';
import type { Program } from '../state/types';
import { AdminLayout } from './AdminLayout';

const STEPS = ['פרטי התוכנית', 'מסלול הלמידה', 'הגדרות', 'סקירה ופרסום'];

const AUDIENCES = [
  'כל העובדים',
  'מנהלים בדרג ראשון',
  'מנהלים בדרג ביניים',
  'שותפי HR',
  'מנהלי לקוחות',
  'צוותי כספים',
];

function minutesLabel(total: number): string {
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${total} דק׳`;
  return `${hours} שע׳${rest ? ` ${rest} דק׳` : ''}`;
}

/** Four-step programme builder: details → path → settings → review and publish. */
export function ProgramBuilder() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { workspace, saveProgram, setProgramStatus, newProgramDraft } = useStore();

  const existing = workspace.programs.find((p) => p.id === programId);
  const [draft, setDraft] = useState<Program>(() => existing ?? newProgramDraft());
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (existing && existing.id !== draft.id) setDraft(existing);
  }, [existing, draft.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const set = <K extends keyof Program>(key: K, value: Program[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const persist = (next?: Partial<Program>) => {
    const merged = { ...draft, ...next };
    setDraft(merged);
    saveProgram(merged);
    return merged;
  };

  const units = draft.units.map((id) => libraryUnit(id)).filter(Boolean) as NonNullable<
    ReturnType<typeof libraryUnit>
  >[];
  const totalMinutes = units.reduce((sum, u) => sum + unitMinutes(u), 0);
  const pendingUnits = units.filter((u) => !isPlayable(u));

  const checks = [
    { ok: Boolean(draft.client.trim()), label: 'הוגדר לקוח', hint: 'שם הארגון שעבורו נבנית התוכנית.' },
    { ok: Boolean(draft.title.trim()), label: 'הוגדר שם תוכנית', hint: 'השם שמופיע בניהול.' },
    { ok: Boolean(draft.course.trim()), label: 'הוגדר שם קורס ללומד', hint: 'הכותרת שהלומדים יראו.' },
    { ok: Boolean(draft.audience.trim()), label: 'הוגדר קהל יעד', hint: 'משמש למיון ההמלצות בספרייה.' },
    { ok: units.length >= 2, label: 'המסלול כולל לפחות שתי יחידות', hint: `כרגע ${units.length}.` },
    {
      ok: pendingUnits.length === 0,
      label: 'כל היחידות במסלול מופקות',
      hint: pendingUnits.length
        ? `${pendingUnits.length} יחידות עדיין בהפקה: ${pendingUnits.map((u) => u.title).join(', ')}. הלומדים יראו אותן מסומנות כ"בהכנה".`
        : 'כל היחידות ניתנות להשמעה.',
    },
    { ok: Boolean(draft.welcome.trim()), label: 'נכתב מסר פתיחה', hint: 'ההודעה הראשונה שהלומד רואה.' },
  ];
  const blocking = checks.filter((c) => !c.ok && c.label !== 'כל היחידות במסלול מופקות');
  const canPublish = blocking.length === 0;

  return (
    <AdminLayout crumb={existing ? `עריכת ${draft.title || 'תוכנית'}` : 'יצירת תוכנית חדשה'}>
      <main className="page">
        <div className="page__head">
          <div>
            <h1>{existing ? 'עריכת תוכנית' : 'יצירת תוכנית חדשה'}</h1>
            <p>ארבעה שלבים: פרטים, מסלול הלמידה, הגדרות חוויית הלומד, ואז סקירה ופרסום.</p>
          </div>
          <span className="spacer" />
          <button type="button" className="btn btn--ghost" onClick={() => { persist(); setToast('נשמר כטיוטה'); }}>
            שמירה כטיוטה
          </button>
        </div>

        <nav className="steps" aria-label="שלבי הבנייה">
          {STEPS.map((label, i) => (
            <span key={label} style={{ display: 'contents' }}>
              {i > 0 && <span className="steps__arrow">←</span>}
              <button
                type="button"
                className="steps__i"
                data-state={i === step ? 'current' : i < step ? 'done' : 'todo'}
                onClick={() => setStep(i)}
              >
                <i>{String(i + 1).padStart(2, '0')}</i>
                {label}
              </button>
            </span>
          ))}
        </nav>

        <div className="builder">
          <div>
            {step === 0 && <DetailsStep draft={draft} set={set} />}
            {step === 1 && <PathStep draft={draft} set={set} />}
            {step === 2 && <SettingsStep draft={draft} set={set} />}
            {step === 3 && (
              <ReviewStep
                draft={draft}
                checks={checks}
                canPublish={canPublish}
                onPublish={() => {
                  const saved = persist({ status: 'published' });
                  setProgramStatus(saved.id, 'published');
                  navigate(`/admin/programs/${saved.id}`);
                }}
                onMarkReady={() => {
                  const saved = persist({ status: 'ready' });
                  setProgramStatus(saved.id, 'ready');
                  setToast('סומן כמוכן לפרסום');
                }}
              />
            )}

            <div className="row" style={{ gap: 9, marginTop: 18, flexWrap: 'wrap' }}>
              {step > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
                  → חזרה
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    persist();
                    setStep(step + 1);
                  }}
                >
                  {STEPS[step + 1]} ←
                </button>
              )}
            </div>
          </div>

          <aside className="builder__side">
            <div className="card card--pad">
              <div className="eyebrow">סיכום התוכנית</div>
              <p style={{ marginTop: 7, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {draft.course || draft.title || 'תוכנית ללא שם'}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>{draft.client || 'לקוח לא הוגדר'}</p>
              <div className="stack" style={{ gap: 6, marginTop: 12, fontSize: 13 }}>
                <Fact k="קהל יעד" v={draft.audience || '—'} />
                <Fact k="תפקיד" v={draft.role} />
                <Fact k="שפה" v={draft.language} />
                <Fact k="יחידות" v={String(units.length)} />
                <Fact k="משך משוער" v={minutesLabel(totalMinutes)} />
              </div>
            </div>

            {units.length > 0 && (
              <div className="card card--pad">
                <div className="eyebrow">מסלול הלמידה</div>
                <ol className="stack" style={{ gap: 5, marginTop: 8 }}>
                  {units.map((unit, i) => (
                    <li key={unit.id} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 11 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ flex: 1 }}>{unit.title}</span>
                      {!isPlayable(unit) && <span className="pill pill--warn">בהכנה</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="card card--pad">
              <div className="eyebrow">תצוגת חוויית הלומד</div>
              <p style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                אפשר לצפות במסלול בדיוק כפי שהלומד יראה אותו, כולל הנגן והתרגילים.
              </p>
              <Link className="btn btn--ghost" style={{ marginTop: 10 }} to={`/learn/${draft.id}`}>
                צפייה כלומד ←
              </Link>
            </div>
          </aside>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </main>
    </AdminLayout>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <span className="row" style={{ gap: 8 }}>
      <span style={{ color: 'var(--ink-4)', minWidth: 74 }}>{k}</span>
      <span style={{ fontWeight: 500 }}>{v}</span>
    </span>
  );
}

type SetFn = <K extends keyof Program>(key: K, value: Program[K]) => void;

function DetailsStep({ draft, set }: { draft: Program; set: SetFn }) {
  return (
    <section className="card card--pad">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>פרטי התוכנית</h2>
      <div className="form2">
        <div className="field">
          <label htmlFor="pb-client">לקוח / ארגון</label>
          <input id="pb-client" type="text" value={draft.client} onChange={(e) => set('client', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pb-internal">
            שם פרויקט פנימי <span>· אופציונלי</span>
          </label>
          <input
            id="pb-internal"
            type="text"
            value={draft.internalName}
            onChange={(e) => set('internalName', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pb-title">שם התוכנית</label>
          <input id="pb-title" type="text" value={draft.title} onChange={(e) => set('title', e.target.value)} />
          <span className="hint">השם שמופיע בניהול ובדוחות.</span>
        </div>
        <div className="field">
          <label htmlFor="pb-course">שם הקורס / מסלול הלמידה</label>
          <input id="pb-course" type="text" value={draft.course} onChange={(e) => set('course', e.target.value)} />
          <span className="hint">זו הכותרת שהלומדים יראו.</span>
        </div>
        <div className="field span2">
          <label htmlFor="pb-desc">תיאור קצר</label>
          <textarea id="pb-desc" rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pb-aud">קהל יעד</label>
          <input
            id="pb-aud"
            type="text"
            list="pb-audiences"
            value={draft.audience}
            onChange={(e) => set('audience', e.target.value)}
          />
          <datalist id="pb-audiences">
            {AUDIENCES.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="pb-role">תפקיד</label>
          <select id="pb-role" value={draft.role} onChange={(e) => set('role', e.target.value)}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pb-lang">שפה</label>
          <select id="pb-lang" value={draft.language} onChange={(e) => set('language', e.target.value)}>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function PathStep({ draft, set }: { draft: Program; set: SetFn }) {
  const [role, setRole] = useState('הכול');
  const [topic, setTopic] = useState('הכול');
  const [type, setType] = useState('הכול');
  const [query, setQuery] = useState('');
  const [onlyPlayable, setOnlyPlayable] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const chosen = draft.units;

  const candidates = useMemo(
    () =>
      library
        .filter((u) => !chosen.includes(u.id))
        .filter((u) => (role === 'הכול' ? true : u.roles.includes(role)))
        .filter((u) => (topic === 'הכול' ? true : u.topic === topic))
        .filter((u) => (type === 'הכול' ? true : u.contentType === type))
        .filter((u) => (onlyPlayable ? isPlayable(u) : true))
        .filter((u) => {
          if (!query.trim()) return true;
          const q = query.trim().toLowerCase();
          return [u.title, u.summary, ...u.tags].some((v) => v.toLowerCase().includes(q));
        })
        .sort((a, b) => b.usedInPrograms - a.usedInPrograms),
    [chosen, role, topic, type, query, onlyPlayable],
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= chosen.length) return;
    const next = [...chosen];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set('units', next);
  };

  const addCore = () => {
    const core = library.filter((u) => u.tags.includes('ליבה')).map((u) => u.id);
    set('units', [...chosen, ...core.filter((id) => !chosen.includes(id))]);
  };

  return (
    <>
      <section className="card card--pad" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>מסלול הלמידה</h2>
          <span className="pill">{chosen.length} יחידות</span>
          <span className="spacer" />
          <button type="button" className="btn btn--quiet" onClick={addCore}>
            + הוספת מקבץ הליבה המומלץ
          </button>
        </div>

        {chosen.length === 0 ? (
          <p className="empty">המסלול עדיין ריק. הוסיפו יחידות מהספרייה שלמטה.</p>
        ) : (
          <ol className="journey">
            {chosen.map((id, i) => {
              const unit = libraryUnit(id);
              if (!unit) return null;
              return (
                <li
                  key={id}
                  className="jrow"
                  draggable
                  data-dragging={dragFrom === i}
                  data-over={dragOver === i && dragFrom !== i}
                  onDragStart={() => setDragFrom(i)}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(i);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragFrom != null) move(dragFrom, i);
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                >
                  <span className="jrow__grip" aria-hidden>
                    ⠿
                  </span>
                  <span className="jrow__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="jrow__b">
                    <b>{unit.title}</b>
                    <span>
                      {unit.topic} · {unitMinutes(unit)} דק׳ · {unit.assessment}
                      {isPlayable(unit) ? '' : ' · בהפקה'}
                    </span>
                  </span>
                  <span className="jrow__acts">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="להעלות">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === chosen.length - 1}
                      aria-label="להוריד"
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => set('units', chosen.filter((x) => x !== id))}>
                      הסרה
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="card card--pad">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>ספריית התוכן של NGG</h2>
        <div className="filters">
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="סינון לפי תפקיד">
            <option>הכול</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="סינון לפי נושא">
            <option>הכול</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="סינון לפי סוג">
            <option>הכול</option>
            {contentTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <div className="chipset">
            <button type="button" aria-pressed={onlyPlayable} onClick={() => setOnlyPlayable(!onlyPlayable)}>
              מופק בלבד
            </button>
          </div>
          <input
            type="search"
            placeholder="חיפוש ביחידות"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="חיפוש ביחידות"
          />
        </div>

        {candidates.length === 0 ? (
          <p className="empty">אין יחידות שמתאימות לסינון.</p>
        ) : (
          <div className="libgrid">
            {candidates.map((unit) => (
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
                  <span className="pill pill--outline">{unit.assessment}</span>
                </div>
                <div className="libcard__foot">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => set('units', [...chosen, unit.id])}
                  >
                    למסלול ←
                  </button>
                  <Link className="btn btn--quiet" to={`/admin/library/${unit.id}`}>
                    פרטים
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function SettingsStep({ draft, set }: { draft: Program; set: SetFn }) {
  return (
    <section className="card card--pad">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>חוויית הלומד</h2>
      <div className="stack" style={{ gap: 14 }}>
        <div className="field">
          <label htmlFor="pb-welcome">מסר פתיחה ללומד</label>
          <textarea id="pb-welcome" rows={3} value={draft.welcome} onChange={(e) => set('welcome', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pb-closing">מסר סיום</label>
          <textarea id="pb-closing" rows={2} value={draft.closing} onChange={(e) => set('closing', e.target.value)} />
        </div>

        <div className="stack" style={{ gap: 9 }}>
          <span className="eyebrow">תנאי השלמה</span>
          <Toggle
            checked={draft.sequential}
            onChange={(v) => set('sequential', v)}
            label="יחידות נפתחות לפי הסדר"
            hint="הלומד חייב לסיים יחידה לפני שהבאה נפתחת."
          />
          <Toggle
            checked={draft.requireAll}
            onChange={(v) => set('requireAll', v)}
            label="נדרשת השלמת כל היחידות"
            hint="התוכנית נחשבת הושלמה רק כשכל היחידות המופקות הושלמו."
          />
          <Toggle
            checked={draft.requireAssessment}
            onChange={(v) => set('requireAssessment', v)}
            label="נדרשת השלמת התרגיל בכל מקטע"
            hint="צפייה לבדה אינה מספיקה — צריך לבדוק את התרגיל."
          />
        </div>
      </div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: 'var(--pink)' }}
      />
      <span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-4)' }}>{hint}</span>
      </span>
    </label>
  );
}

function ReviewStep({
  draft,
  checks,
  canPublish,
  onPublish,
  onMarkReady,
}: {
  draft: Program;
  checks: { ok: boolean; label: string; hint: string }[];
  canPublish: boolean;
  onPublish: () => void;
  onMarkReady: () => void;
}) {
  return (
    <section className="card card--pad">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>סקירה ופרסום</h2>
      <ul className="checklist">
        {checks.map((check) => (
          <li key={check.label}>
            <i data-ok={check.ok}>{check.ok ? '✓' : '!'}</i>
            <span>
              {check.label}
              <em>{check.hint}</em>
            </span>
          </li>
        ))}
      </ul>

      <div className="row" style={{ gap: 9, marginTop: 18, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--primary" disabled={!canPublish} onClick={onPublish}>
          {draft.status === 'published' ? 'עדכון התוכנית שפורסמה' : 'פרסום התוכנית'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onMarkReady}>
          סימון כמוכן לפרסום
        </button>
      </div>
      {!canPublish && (
        <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--warn)' }}>
          יש להשלים את הסעיפים המסומנים לפני הפרסום.
        </p>
      )}
    </section>
  );
}

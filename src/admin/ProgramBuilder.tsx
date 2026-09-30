import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  isPlayable,
  languages,
  library,
  libraryUnit,
  roles,
  topicStyles,
  topicVars,
  unitCode,
  unitMinutes,
  unitNuggets,
  type LibraryUnit,
} from '../content';
import type { Program } from '../state/types';
import type { SaveResult } from '../state/api';
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  LOGO_ACCEPT,
  LogoError,
  MIN_ACCENT_CONTRAST,
  accentVars,
  normalizeHex,
  onAccent,
  prepareLogo,
} from '../app/brand';
import { ClientLogo } from '../app/ClientLogo';
import { ProgramHero } from '../learner/ProgramHero';
import { AdminLayout } from './AdminLayout';
import { NuggetBar, StatusChip, UnitCover, minutesLabel, totalMinutes } from './catalog';
import '../learner/learner.css';

const STEPS = ['פרטי התוכנית', 'מסלול הלמידה', 'חוויית הלומד', 'סקירה ופרסום'] as const;

const AUDIENCES = [
  'כל העובדים',
  'מנהלים בדרג ראשון',
  'מנהלים בדרג ביניים',
  'שותפי HR',
  'מנהלי לקוחות',
  'צוותי כספים',
];

type SetFn = <K extends keyof Program>(key: K, value: Program[K]) => void;

interface Check {
  ok: boolean;
  label: string;
  hint: string;
  /** A failing check that stops publishing. Units in production warn but do not block. */
  blocking: boolean;
}

interface CheckGroup {
  step: number;
  label: string;
  items: Check[];
}

function check(ok: boolean, label: string, hint: string, blocks = true): Check {
  return { ok, label, hint, blocking: !ok && blocks };
}

function rulesSummary(p: Program): string {
  return [
    p.sequential ? 'לפי הסדר' : 'סדר חופשי',
    p.requireAll ? 'כל היחידות' : null,
    p.requireAssessment ? 'תרגיל בכל מקטע' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function reviewGroups(p: Program, units: LibraryUnit[]): CheckGroup[] {
  const pending = units.filter((u) => !isPlayable(u));
  return [
    {
      step: 0,
      label: 'פרטי התוכנית',
      items: [
        check(Boolean(p.client.trim()), 'הוגדר לקוח', p.client.trim() || 'שם הארגון שעבורו נבנית התוכנית.'),
        check(Boolean(p.title.trim()), 'הוגדר שם תוכנית', p.title.trim() || 'השם שמופיע בניהול ובדוחות.'),
        check(Boolean(p.course.trim()), 'הוגדר שם קורס ללומד', p.course.trim() || 'הכותרת שהלומדים יראו.'),
        check(
          Boolean(p.audience.trim()),
          'הוגדר קהל יעד',
          p.audience.trim() ? `${p.audience} · ${p.role}` : 'משמש למיון ההמלצות בספרייה.',
        ),
      ],
    },
    {
      step: 1,
      label: 'מסלול הלמידה',
      items: [
        check(units.length >= 2, 'המסלול כולל לפחות שתי יחידות', `כרגע ${units.length}.`),
        check(
          pending.length === 0,
          'כל היחידות במסלול מופקות',
          pending.length
            ? `${pending.map((u) => u.title).join(', ')} בהפקה. הלומדים יראו אותן כ״בהכנה״. לא חוסם פרסום.`
            : 'כל היחידות ניתנות להשמעה.',
          false,
        ),
      ],
    },
    {
      step: 2,
      label: 'חוויית הלומד',
      items: [
        check(Boolean(p.welcome.trim()), 'נכתב מסר פתיחה', p.welcome.trim() || 'ההודעה הראשונה שהלומד רואה.'),
        check(true, 'תנאי השלמה', rulesSummary(p)),
      ],
    },
  ];
}

/** Fields the store owns (timestamps, publish state) are left out of "has this changed". */
function sameProgram(a: Program, b: Program): boolean {
  const strip = ({ updatedAt: _u, publishedAt: _p, status: _s, ...rest }: Program) => rest;
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

/** Enough typed to be worth keeping; an untouched new draft is never written. */
function hasContent(p: Program): boolean {
  return Boolean(p.client.trim() || p.title.trim() || p.course.trim() || p.units.length);
}

function saveMessage(result: SaveResult): string {
  if (result.ok) return '';
  if (result.reason === 'too-large') return 'אין מקום לעוד לוגו במאגר. הסירו לוגו שאינו בשימוש או העלו קובץ פשוט יותר.';
  if (result.reason === 'quota') return 'הדפדפן לא מאפשר לשמור את הלוגו (אחסון מלא או מצב פרטי).';
  return 'השמירה נכשלה. בדקו את החיבור ונסו שוב.';
}

/**
 * Guided four-step builder: details → path → learner experience → review and publish.
 *
 * Drafts and programmes marked ready save themselves as they are edited. A live
 * programme does not: its learners see every saved change, so edits there wait for an
 * explicit save.
 */
export function ProgramBuilder() {
  const { programId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { workspace, saveProgram, setProgramStatus, newProgramDraft } = useStore();

  const fromUrl = workspace.programs.find((p) => p.id === programId);
  const [draft, setDraft] = useState<Program>(() => {
    if (fromUrl) return fromUrl;
    const fresh = newProgramDraft();
    const add = params.get('add');
    return add && libraryUnit(add) ? { ...fresh, units: [add] } : fresh;
  });
  const [step, setStep] = useState(() => {
    const n = Number(params.get('step'));
    return Number.isInteger(n) && n >= 0 && n < STEPS.length ? n : params.get('add') ? 1 : 0;
  });
  const [sel, setSel] = useState<string | null>(() => params.get('sel') ?? params.get('add'));
  const [toast, setToast] = useState<string | null>(null);

  // The route keys the builder by programme id (see App.tsx), so this only covers a
  // programme that was not in the workspace yet on the first render.
  useEffect(() => {
    if (fromUrl && fromUrl.id !== draft.id) setDraft(fromUrl);
  }, [fromUrl, draft.id]);

  // A link into the builder while it is already open (?step=1&sel=u3) does not remount
  // it, so the initial state above would miss it.
  const stepParam = params.get('step');
  const selParam = params.get('sel');
  useEffect(() => {
    const n = Number(stepParam);
    if (stepParam !== null && Number.isInteger(n) && n >= 0 && n < STEPS.length) setStep(n);
  }, [stepParam]);
  useEffect(() => {
    if (selParam) setSel(selParam);
  }, [selParam]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const saved = workspace.programs.find((p) => p.id === draft.id);
  const live = saved?.status === 'published' || saved?.status === 'archived';
  const autosaves = Boolean(saved) && !live;
  const dirty = saved ? !sameProgram(draft, saved) : hasContent(draft);

  // Autosave for drafts and ready programmes. Store-owned fields are taken from the
  // saved copy, so a debounced write can never undo a publish or a status change.
  useEffect(() => {
    if (!autosaves || !dirty || !saved) return;
    const timer = window.setTimeout(
      () => saveProgram({ ...draft, status: saved.status, publishedAt: saved.publishedAt }),
      600,
    );
    return () => window.clearTimeout(timer);
  }, [draft, autosaves, dirty, saved, saveProgram]);

  const set: SetFn = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const persist = (patch?: Partial<Program>) => {
    const merged = { ...draft, ...patch };
    setDraft(merged);
    saveProgram(merged);
    return merged;
  };

  /** Moves between steps. A new programme is created the first time there is something in it. */
  const goTo = (next: number) => {
    if (!saved && hasContent(draft)) {
      const created = persist();
      navigate(`/admin/programs/${created.id}/build?step=${next}`, { replace: true });
    }
    setStep(next);
  };

  const units = draft.units.map((id) => libraryUnit(id)).filter((u): u is LibraryUnit => Boolean(u));
  const total = totalMinutes(units);
  const pending = units.filter((u) => !isPlayable(u));
  const groups = reviewGroups(draft, units);
  const checks = groups.flatMap((g) => g.items);
  const blocking = checks.filter((c) => c.blocking).length;

  const selected = sel && draft.units.includes(sel) ? sel : draft.units[0] ?? null;

  const summaries = [
    `${draft.client.trim() || 'לקוח לא הוגדר'} · ${draft.audience.trim() || 'קהל לא הוגדר'}`,
    `${units.length} יחידות · ${minutesLabel(total)}${pending.length ? ` · ${pending.length} בהפקה` : ''}`,
    rulesSummary(draft),
    blocking ? `${blocking} ${blocking === 1 ? 'פריט חוסם' : 'פריטים חוסמים'}` : 'מוכן לפרסום',
  ];

  return (
    <AdminLayout crumb={saved ? `עריכת ${draft.title || 'תוכנית'}` : 'יצירת תוכנית חדשה'}>
      <main className="page">
        <div className="bhead">
          <ClientLogo client={draft.client} size={52} radius={12} />
          <div className="bhead__t">
            <div className="bhead__k">
              {draft.client.trim() || 'לקוח לא הוגדר'} · {saved ? 'עריכת תוכנית' : 'יצירת תוכנית חדשה'}
            </div>
            <h1>{draft.title.trim() || (saved ? 'תוכנית ללא שם' : 'תוכנית חדשה')}</h1>
          </div>
          <span className="spacer" />
          <SaveState
            saved={Boolean(saved)}
            live={live}
            dirty={dirty}
            onSave={() => {
              if (!saved && !hasContent(draft)) {
                setToast('אין עדיין מה לשמור');
                return;
              }
              const created = persist();
              if (!saved) navigate(`/admin/programs/${created.id}/build?step=${step}`, { replace: true });
              setToast(live ? 'השינויים נשמרו ומוצגים ללומדים' : 'נשמר כטיוטה');
            }}
          />
          {saved ? (
            <Link className="btn btn--ghost btn--sm" to={`/learn/${draft.id}`}>
              צפייה כלומד
            </Link>
          ) : (
            <span className="btn btn--ghost btn--sm" aria-disabled title="זמין אחרי השמירה הראשונה" data-disabled>
              צפייה כלומד
            </span>
          )}
        </div>

        <nav className="bsteps" aria-label="שלבי הבנייה">
          {STEPS.map((label, i) => {
            const done = i < 3 && groups[i].items.every((c) => !c.blocking);
            const current = i === step;
            return (
              <button
                key={label}
                type="button"
                className="bstep"
                data-state={current ? 'current' : done ? 'done' : 'todo'}
                aria-current={current ? 'step' : undefined}
                onClick={() => goTo(i)}
              >
                <span className="bstep__dot">{done && !current ? '✓' : String(i + 1).padStart(2, '0')}</span>
                <span className="bstep__t">
                  <b>{label}</b>
                  <span>{summaries[i]}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="bpath">
          <span className="bpath__k">
            המסלול
            <br />
            {units.length} יחידות · {minutesLabel(total)}
          </span>
          {units.length ? (
            <div className="bpath__strip">
              {units.map((unit, i) => (
                <button
                  key={unit.id}
                  type="button"
                  style={{ ...topicVars(unit.topic), flex: Math.max(1, unitMinutes(unit)) }}
                  data-made={isPlayable(unit)}
                  data-selected={step === 1 && selected === unit.id}
                  title={`${unit.title} · ${unitMinutes(unit)} דק׳`}
                  onClick={() => {
                    setSel(unit.id);
                    if (step !== 1) goTo(1);
                  }}
                >
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="bpath__title">{unit.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <span className="bpath__empty">המסלול ריק. מוסיפים יחידות בשלב ״מסלול הלמידה״.</span>
          )}
        </div>

        {step === 0 && <DetailsStep draft={draft} set={set} flash={setToast} units={units} />}
        {step === 1 && <PathStep draft={draft} set={set} selected={selected} setSel={setSel} />}
        {step === 2 && <ExperienceStep draft={draft} set={set} units={units} />}
        {step === 3 && (
          <ReviewStep
            draft={draft}
            groups={groups}
            blocking={blocking}
            onEdit={goTo}
            onPublish={() => {
              const next = persist({ status: 'published' });
              setProgramStatus(next.id, 'published');
              navigate(`/admin/programs/${next.id}`);
            }}
            onMarkReady={() => {
              const next = persist({ status: 'ready' });
              setProgramStatus(next.id, 'ready');
              if (!saved) navigate(`/admin/programs/${next.id}/build?step=3`, { replace: true });
              setToast('סומן כמוכן לפרסום');
            }}
          />
        )}

        <div className="row" style={{ gap: 9, marginTop: 18, flexWrap: 'wrap' }}>
          {step > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
              → {STEPS[step - 1]}
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" className="btn btn--primary" onClick={() => goTo(step + 1)}>
              {STEPS[step + 1]} ←
            </button>
          )}
        </div>

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

function SaveState({
  saved,
  live,
  dirty,
  onSave,
}: {
  saved: boolean;
  live: boolean;
  dirty: boolean;
  onSave: () => void;
}) {
  if (!saved) {
    return (
      <>
        <span className="bhead__state">טיוטה חדשה · טרם נשמרה</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onSave}>
          שמירה כטיוטה
        </button>
      </>
    );
  }
  if (live) {
    return dirty ? (
      <>
        <span className="bhead__state" data-tone="warn">
          שינויים שטרם נשמרו · התוכנית פעילה
        </span>
        <button type="button" className="btn btn--primary btn--sm" onClick={onSave}>
          שמירת השינויים
        </button>
      </>
    ) : (
      <span className="bhead__state">כל השינויים נשמרו</span>
    );
  }
  return <span className="bhead__state">{dirty ? 'שומר…' : 'נשמר אוטומטית'}</span>;
}

/* ------------------------------------------------------------ step 1 --- */

function DetailsStep({
  draft,
  set,
  flash,
  units,
}: {
  draft: Program;
  set: SetFn;
  flash: (m: string) => void;
  units: LibraryUnit[];
}) {
  const roleOptions = roles.includes(draft.role) ? roles : [...roles, draft.role];
  const playable = units.filter(isPlayable);
  return (
    <div className="bgrid">
      <section className="card card--pad bcard-pad">
        <h2 className="cardtitle">הלקוח והתוכנית</h2>
        <p className="bnote">
          השדות המסומנים ב־<span className="learnermark">◐</span> מופיעים ללומד. השאר משמשים לניהול ולדוחות.
        </p>
        <div className="form2">
          <div className="field">
            <label htmlFor="pb-client">לקוח / ארגון</label>
            <input id="pb-client" type="text" value={draft.client} onChange={(e) => set('client', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pb-title">
              שם התוכנית <span>· בניהול ובדוחות</span>
            </label>
            <input id="pb-title" type="text" value={draft.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="field span2">
            <label htmlFor="pb-course">
              <span className="learnermark">◐</span> שם הקורס שהלומדים יראו
            </label>
            <input
              id="pb-course"
              type="text"
              className="field__learner"
              value={draft.course}
              onChange={(e) => set('course', e.target.value)}
            />
          </div>
          <div className="field span2">
            <label htmlFor="pb-desc">
              <span className="learnermark">◐</span> תיאור קצר
            </label>
            <textarea id="pb-desc" rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
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

        <h3 className="cardtitle cardtitle--sm" style={{ marginTop: 22 }}>
          קהל היעד
        </h3>
        <p className="bnote" style={{ marginBottom: 10 }}>
          התפקיד קובע אילו יחידות יומלצו בשלב המסלול.
        </p>
        <div className="chipset" role="group" aria-label="תפקיד">
          {roleOptions.map((role) => (
            <button key={role} type="button" aria-pressed={draft.role === role} onClick={() => set('role', role)}>
              {role}
            </button>
          ))}
        </div>
        <div className="field" style={{ marginTop: 14, maxWidth: 420 }}>
          <label htmlFor="pb-aud">תיאור הקהל</label>
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
      </section>

      <aside className="stack bside">
        <BrandPanel draft={draft} set={set} flash={flash} />
        <div className="micro" style={{ padding: '0 4px' }}>
          כך הלומד יראה את התוכנית
        </div>
        <div style={accentVars(draft.accent)}>
          <ProgramHero
            preview
            program={draft}
            completion={{ pct: 0, done: 0, complete: false, playableCount: playable.length, nextUnitId: playable[0]?.id }}
          />
        </div>
      </aside>
    </div>
  );
}

/** Client logo (per client, shared by all its programmes) and this programme's accent. */
function BrandPanel({ draft, set, flash }: { draft: Program; set: SetFn; flash: (m: string) => void }) {
  const { logoFor, setClientLogo } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const client = draft.client.trim();
  const logo = logoFor(client);
  const accent = normalizeHex(draft.accent) ?? DEFAULT_ACCENT;
  const custom = !ACCENT_PRESETS.some((p) => p.hex === accent);
  const text = onAccent(accent);

  const upload = async (file: File | undefined) => {
    if (!file || !client) return;
    setError(null);
    setBusy(true);
    try {
      const src = await prepareLogo(file);
      const result = await setClientLogo(client, src);
      if (result.ok) flash(`הלוגו של ${client} נשמר`);
      else setError(saveMessage(result));
    } catch (e) {
      setError(e instanceof LogoError ? e.message : 'העלאת הלוגו נכשלה.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm(`להסיר את הלוגו של ${client}? הוא יוסר מכל התוכניות של הלקוח.`)) return;
    setBusy(true);
    const result = await setClientLogo(client, null);
    setBusy(false);
    if (result.ok) flash('הלוגו הוסר');
    else setError(saveMessage(result));
  };

  const pickAccent = (hex: string) => set('accent', hex === DEFAULT_ACCENT ? undefined : hex);

  return (
    <section className="card card--pad">
      <h2 className="cardtitle cardtitle--sm">מיתוג הלקוח</h2>
      <div className="brand">
        <button
          type="button"
          className="brand__drop"
          data-over={over}
          disabled={!client || busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (client) setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void upload(e.dataTransfer.files[0]);
          }}
          aria-label={logo ? `החלפת הלוגו של ${client}` : 'העלאת לוגו'}
        >
          {logo ? (
            <img src={logo.src} alt="" />
          ) : (
            <span>{busy ? 'מעבד…' : client ? 'גררו לוגו או לחצו' : 'הזינו שם לקוח'}</span>
          )}
        </button>
        <input ref={input} type="file" accept={LOGO_ACCEPT} hidden onChange={(e) => void upload(e.target.files?.[0])} />
        <div className="brand__side">
          <span className="brand__k">צבע הדגשה</span>
          <div className="swatches" role="group" aria-label="צבע הדגשה">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.hex}
                type="button"
                aria-pressed={accent === p.hex}
                aria-label={p.label}
                title={p.label}
                className="swatch"
                style={{ background: p.hex, color: p.hex }}
                onClick={() => pickAccent(p.hex)}
              />
            ))}
            <label
              className="swatch swatch--custom"
              data-checked={custom}
              title="צבע מותאם"
              style={custom ? { background: accent, color: accent } : undefined}
            >
              <input
                type="color"
                value={accent}
                aria-label="צבע מותאם"
                onChange={(e) => pickAccent(e.target.value.toLowerCase())}
              />
            </label>
          </div>
          <p className="bnote">מופיע בכותרת הפתיחה ובכפתורים של הלומד.</p>
        </div>
      </div>
      {logo && (
        <div className="brand__foot">
          <span>הלוגו משותף לכל התוכניות של {client}.</span>
          <button type="button" className="btn btn--quiet" onClick={() => input.current?.click()} disabled={busy}>
            החלפה
          </button>
          <button type="button" className="btn btn--quiet brand__remove" onClick={remove} disabled={busy}>
            הסרה
          </button>
        </div>
      )}
      {text.ratio < MIN_ACCENT_CONTRAST ? (
        <p className="brand__warn" role="status">
          הצבע חלש מדי לטקסט על כפתורים (ניגודיות {text.ratio.toFixed(1)}:1). מומלץ לבחור גוון כהה או בהיר יותר.
        </p>
      ) : text.color !== '#ffffff' ? (
        <p className="bnote" style={{ marginTop: 10 }}>
          הצבע בהיר, ולכן טקסט הכפתורים יוצג בכהה כדי שיישאר קריא.
        </p>
      ) : null}
      {error && (
        <p className="brand__warn" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ step 2 --- */

function PathStep({
  draft,
  set,
  selected,
  setSel,
}: {
  draft: Program;
  set: SetFn;
  selected: string | null;
  setSel: (id: string | null) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const shelfRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const chosen = draft.units;
  const units = chosen.map((id) => libraryUnit(id)).filter((u): u is LibraryUnit => Boolean(u));
  const index = selected ? chosen.indexOf(selected) : -1;
  const current = index >= 0 ? libraryUnit(chosen[index]) : undefined;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= chosen.length || from === to) return;
    const next = [...chosen];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set('units', next);
  };

  const add = (id: string) => {
    if (chosen.includes(id)) return;
    set('units', [...chosen, id]);
    setSel(id);
  };

  const addCore = () => {
    const core = library.filter((u) => u.tags.includes('ליבה')).map((u) => u.id);
    set('units', [...chosen, ...core.filter((id) => !chosen.includes(id))]);
  };

  return (
    <>
      <section className="card card--pad bcard-pad">
        <div className="section__head" style={{ marginBottom: 14 }}>
          <h2>מסלול הלמידה</h2>
          <p>לחיצה על יחידה פותחת את פרטיה. הסדר כאן הוא הסדר שהלומד יראה; אפשר לגרור כדי לסדר.</p>
          <span className="spacer" />
          <button type="button" className="btn btn--quiet" onClick={addCore}>
            + מקבץ הליבה המומלץ
          </button>
        </div>

        <ol className="bcards">
          {units.map((unit, i) => (
            <li
              key={unit.id}
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
              <button
                type="button"
                className="bunit"
                data-selected={unit.id === selected}
                style={topicVars(unit.topic)}
                aria-pressed={unit.id === selected}
                onClick={() => setSel(unit.id)}
              >
                <UnitCover unit={unit} className="bunit__cover" showStatus={false} showCode={false}>
                  <span className="bunit__n">{String(i + 1).padStart(2, '0')}</span>
                  {!isPlayable(unit) && <span className="chip chip--amber bunit__pending">בהפקה</span>}
                </UnitCover>
                <span className="bunit__body">
                  <span className="ucode">{unitCode(unit)}</span>
                  <b>{unit.title}</b>
                  <span className="bunit__meta">
                    {unitMinutes(unit)} דק׳ · {unit.assessment}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="bunit bunit--add"
              onClick={() => {
                shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                searchRef.current?.focus({ preventScroll: true });
              }}
            >
              + יחידה
              <br />
              מהספרייה
            </button>
          </li>
        </ol>

        {current && (
          <div className="bsel" style={topicVars(current.topic)}>
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="ucode">
                  {String(index + 1).padStart(2, '0')} · {unitCode(current)}
                </span>
                <span className="topicchip">{current.topic}</span>
                <StatusChip unit={current} />
              </div>
              <b className="bsel__t">{current.title}</b>
              <p className="bsel__s">{current.summary}</p>
              <NuggetBar unit={current} />
              <div className="bsel__acts">
                <button type="button" className="btn btn--well" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  → מוקדם יותר
                </button>
                <button
                  type="button"
                  className="btn btn--well"
                  disabled={index === chosen.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  מאוחר יותר ←
                </button>
                <span className="spacer" />
                <Link className="btn btn--quiet" to={`/admin/library/${current.id}`}>
                  פרטי היחידה
                </Link>
                <button
                  type="button"
                  className="btn btn--quiet bsel__remove"
                  onClick={() => {
                    const next = chosen.filter((x) => x !== current.id);
                    set('units', next);
                    setSel(next[Math.min(index, next.length - 1)] ?? null);
                  }}
                >
                  הסרה מהמסלול
                </button>
              </div>
            </div>
            <div>
              <div className="micro">מה ביחידה</div>
              <ol className="bsel__nuggets">
                {unitNuggets(current).map((n, i) => (
                  <li key={i}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    <span>{n.title}</span>
                    <span className="t">{n.minutes} דק׳</span>
                  </li>
                ))}
                <li className="bsel__assess">
                  <span aria-hidden>◆</span>
                  <span>{current.assessment}</span>
                  <span />
                </li>
              </ol>
            </div>
          </div>
        )}
      </section>

      <Shelf draft={draft} onAdd={add} shelfRef={shelfRef} searchRef={searchRef} />
    </>
  );
}

/** The library, as a shelf to add from: recommended for the audience, or by topic. */
function Shelf({
  draft,
  onAdd,
  shelfRef,
  searchRef,
}: {
  draft: Program;
  onAdd: (id: string) => void;
  shelfRef: React.RefObject<HTMLElement>;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  const [tab, setTab] = useState<string>('rec');
  const [query, setQuery] = useState('');
  const [onlyPlayable, setOnlyPlayable] = useState(false);

  // For the programme's role first, then whatever NGG uses most; a general role
  // leaves the ordering to usage alone.
  const recommended = useMemo(
    () =>
      library
        .filter((u) => u.roles.includes(draft.role) || u.usedInPrograms >= 14)
        .sort(
          (a, b) =>
            Number(b.roles.includes(draft.role) && draft.role !== 'כללי') -
              Number(a.roles.includes(draft.role) && draft.role !== 'כללי') || b.usedInPrograms - a.usedInPrograms,
        ),
    [draft.role],
  );

  const q = query.trim().toLowerCase();
  const base = q
    ? library.filter((u) =>
        [u.title, u.summary, u.topic, unitCode(u), ...u.tags].some((v) => v.toLowerCase().includes(q)),
      )
    : tab === 'rec'
      ? recommended
      : library.filter((u) => u.topic === tab);
  const list = onlyPlayable ? base.filter(isPlayable) : base;
  const audience = draft.audience.trim() || draft.role;

  const tabs = [
    { key: 'rec', label: `מומלץ ל${audience}`, count: recommended.length, dot: 'var(--accent)' },
    ...topicStyles.map((t) => ({
      key: t.name,
      label: t.name,
      count: library.filter((u) => u.topic === t.name).length,
      dot: t.mid,
    })),
  ];

  return (
    <section className="card card--pad bcard-pad shelf" ref={shelfRef}>
      <div className="section__head" style={{ marginBottom: 12 }}>
        <h2>הוספה מהספרייה</h2>
        <p>{q ? `תוצאות חיפוש בכל הספרייה · ${list.length}` : 'לפי נושא. הלשונית הראשונה מסננת לפי קהל היעד שהוגדר.'}</p>
        <span className="spacer" />
        <div className="chipset">
          <button type="button" aria-pressed={onlyPlayable} onClick={() => setOnlyPlayable(!onlyPlayable)}>
            מופק בלבד
          </button>
        </div>
        <input
          ref={searchRef}
          type="search"
          className="shelf__search"
          placeholder="חיפוש ביחידות"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש ביחידות"
        />
      </div>

      {!q && (
        <div className="shelf__tabs" role="group" aria-label="מדף">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              <i style={{ background: t.dot }} />
              {t.label}
              <span>{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="empty">אין יחידות שמתאימות לסינון.</p>
      ) : (
        <div className="shelf__grid">
          {list.map((unit) => {
            const inPath = draft.units.includes(unit.id);
            return (
              <div key={unit.id} className="shelfrow" data-in={inPath} style={topicVars(unit.topic)}>
                <UnitCover unit={unit} className="shelfrow__thumb" showStatus={false} showCode={false} />
                <div className="shelfrow__b">
                  <div className="row" style={{ gap: 6 }}>
                    <span className="ucode">{unitCode(unit)}</span>
                    <span className="shelfrow__st" data-made={isPlayable(unit)}>
                      {isPlayable(unit) ? 'מופק' : 'בהפקה'}
                    </span>
                  </div>
                  <b>{unit.title}</b>
                  <span>
                    {unitMinutes(unit)} דק׳ · {unit.assessment} · {unit.roles.join(', ')}
                  </span>
                </div>
                {inPath ? (
                  <span className="shelfrow__in">במסלול ✓</span>
                ) : (
                  <button type="button" className="shelfrow__add" onClick={() => onAdd(unit.id)}>
                    + הוספה
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ step 3 --- */

const RULES: { key: 'sequential' | 'requireAll' | 'requireAssessment'; label: string; hint: string }[] = [
  { key: 'sequential', label: 'יחידות נפתחות לפי הסדר', hint: 'הלומד מסיים יחידה לפני שהבאה נפתחת.' },
  { key: 'requireAll', label: 'נדרשת השלמת כל היחידות', hint: 'רק יחידות מופקות נספרות.' },
  { key: 'requireAssessment', label: 'נדרש תרגיל בכל מקטע', hint: 'צפייה לבדה אינה מספיקה.' },
];

function ExperienceStep({ draft, set, units }: { draft: Program; set: SetFn; units: LibraryUnit[] }) {
  // Mirrors the learner's journey list: units in production are always closed, the
  // first playable unit is where they start, and a sequential programme locks the rest.
  const firstPlayable = units.findIndex(isPlayable);
  const shown = units.slice(0, 5);
  return (
    <div className="bgrid">
      <section className="card card--pad bcard-pad stack" style={{ gap: 16 }}>
        <h2 className="cardtitle">חוויית הלומד</h2>
        <div className="field">
          <label htmlFor="pb-welcome">
            <span className="learnermark">◐</span> מסר פתיחה
          </label>
          <textarea id="pb-welcome" rows={3} value={draft.welcome} onChange={(e) => set('welcome', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pb-closing">
            <span className="learnermark">◐</span> מסר סיום
          </label>
          <textarea id="pb-closing" rows={2} value={draft.closing} onChange={(e) => set('closing', e.target.value)} />
        </div>
        <div>
          <h3 className="cardtitle cardtitle--sm">תנאי השלמה</h3>
          <div className="rules">
            {RULES.map((rule) => (
              <button
                key={rule.key}
                type="button"
                role="switch"
                aria-checked={draft[rule.key]}
                className="rule"
                onClick={() => set(rule.key, !draft[rule.key])}
              >
                <span className="switch" aria-hidden>
                  <i />
                </span>
                <b>{rule.label}</b>
                <span>{rule.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="stack bside" style={accentVars(draft.accent)}>
        <div className="micro" style={{ padding: '0 4px' }}>
          תצוגה מקדימה · מסלול הלמידה של הלומד
        </div>
        {draft.welcome.trim() && <div className="softnote">{draft.welcome}</div>}
        {shown.length === 0 ? (
          <p className="empty">עדיין אין יחידות במסלול.</p>
        ) : (
          <div className="journeylist">
            {shown.map((unit, i) => {
              const made = isPlayable(unit);
              const state = !made ? 'locked' : i === firstPlayable ? 'current' : draft.sequential ? 'locked' : 'todo';
              return (
                <div key={unit.id} className="jrow2" data-state={state}>
                  <span className="jrow2__state" data-state={state}>
                    {state === 'current' ? '▶' : state === 'locked' ? '🔒' : i + 1}
                  </span>
                  <span className="jrow2__b">
                    <b>{unit.title}</b>
                    <span>{unit.summary}</span>
                  </span>
                  <span className="jrow2__meta">
                    {!made && <span className="chip chip--amber">בהכנה</span>}
                    <span className="chip">{unitMinutes(unit)} דק׳</span>
                  </span>
                </div>
              );
            })}
            {units.length > shown.length && (
              <p className="bnote" style={{ padding: '0 4px' }}>
                ועוד {units.length - shown.length} יחידות.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------ step 4 --- */

function ReviewStep({
  draft,
  groups,
  blocking,
  onEdit,
  onPublish,
  onMarkReady,
}: {
  draft: Program;
  groups: CheckGroup[];
  blocking: number;
  onEdit: (step: number) => void;
  onPublish: () => void;
  onMarkReady: () => void;
}) {
  const checks = groups.flatMap((g) => g.items);
  const ok = checks.filter((c) => c.ok).length;
  const published = draft.status === 'published';
  return (
    <div className="bgrid bgrid--review">
      <section className="card review">
        {groups.map((group) => (
          <div key={group.label} className="review__group">
            <div className="row" style={{ gap: 10 }}>
              <span className="mono review__n">{String(group.step + 1).padStart(2, '0')}</span>
              <h3>{group.label}</h3>
              <span className="spacer" />
              <button type="button" className="btn btn--quiet" onClick={() => onEdit(group.step)}>
                עריכה
              </button>
            </div>
            <ul className="checklist" style={{ marginTop: 10 }}>
              {group.items.map((c) => (
                <li key={c.label}>
                  <i data-ok={c.ok} data-warn={!c.ok && !c.blocking}>
                    {c.ok ? '✓' : '!'}
                  </i>
                  <span>
                    {c.label}
                    <em>{c.hint}</em>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <aside className="stack bside">
        <div className="card card--pad">
          <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
            {ok} מתוך {checks.length} סעיפים תקינים
            {blocking ? ` · ${blocking} ${blocking === 1 ? 'חוסם' : 'חוסמים'}` : ''}
          </div>
          <div className="readybar" aria-hidden>
            {checks.map((c) => (
              <i key={c.label} data-state={c.ok ? 'ok' : c.blocking ? 'block' : 'warn'} />
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 16 }}
            disabled={blocking > 0}
            onClick={onPublish}
          >
            {published ? 'עדכון התוכנית שפורסמה' : 'פרסום התוכנית'}
          </button>
          {!published && (
            <button type="button" className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={onMarkReady}>
              סימון כמוכן לפרסום
            </button>
          )}
          <p className="bnote" style={{ marginTop: 10 }}>
            {blocking
              ? 'יש להשלים את הסעיפים המסומנים לפני הפרסום.'
              : `אחרי הפרסום יוצג בדשבורד התוכנית קישור עם קוד גישה ללומדים${draft.client.trim() ? ` של ${draft.client.trim()}` : ''}.`}
          </p>
        </div>
      </aside>
    </div>
  );
}


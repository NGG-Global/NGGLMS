import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { library, unitMinutes } from '../content';
import { medianUnitMinutes, monthlyHoursTarget, weekActivity } from '../content/demo-analytics';
import { PROGRAM_STATUS_LABEL, type Program, type ProgramStatus } from '../state/types';
import {
  activeLearners,
  atRiskLearners,
  learningHours,
  overallScore,
  programStats,
  programsByScope,
  type ProgramScope,
} from '../app/progress';
import { assetUrl } from '../app/paths';
import { AdminLayout } from './AdminLayout';
import { StatTiles, type StatTileProps } from './StatTile';

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HEBREW_MONTHS = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
];

const STATUS_CHIP: Record<ProgramStatus, string> = {
  published: 'chip chip--green',
  draft: 'chip chip--plain',
  ready: 'chip chip--amber',
  archived: 'chip chip--outline',
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('');
}

/** Workspace overview: what is live, who is learning, and what needs attention. */
export function Dashboard() {
  const { identity, workspace } = useStore();
  const navigate = useNavigate();
  const [scope, setScope] = useState<ProgramScope>('mine');
  const [toast, setToast] = useState<string | null>(null);

  const owner = identity?.name ?? '';
  const mine = useMemo(() => programsByScope(workspace.programs, owner, 'mine'), [workspace.programs, owner]);
  const team = useMemo(() => programsByScope(workspace.programs, owner, 'team'), [workspace.programs, owner]);

  const stats = useMemo(
    () => new Map(workspace.programs.map((p) => [p.id, programStats(workspace, p)])),
    [workspace],
  );

  const active = activeLearners(workspace, 7);
  const atRisk = atRiskLearners(workspace, 10);
  const hours = learningHours(workspace);
  const score = overallScore(workspace);
  const published = mine.filter((p) => p.status === 'published').length;
  const ready = mine.filter((p) => p.status === 'ready').length;
  const drafts = mine.filter((p) => p.status === 'draft').length;
  const completed = workspace.programs.reduce((sum, p) => sum + (stats.get(p.id)?.completed ?? 0), 0);

  const today = new Date();
  const todayLabel = `יום ${HEBREW_DAYS[today.getDay()]} · ${today.getDate()} ${HEBREW_MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  const tiles: StatTileProps[] = [
    {
      label: 'התוכניות שלי',
      value: String(mine.length),
      pct: mine.length ? Math.round((published / mine.length) * 100) : 0,
      sub: `${published} פורסמו · ${ready} מוכנה לפרסום · ${drafts} טיוטה`,
      tone: 'magenta',
    },
    {
      label: 'לומדים פעילים',
      value: String(active.length),
      pct: workspace.learners.length ? Math.round((active.length / workspace.learners.length) * 100) : 0,
      sub: `מתוך ${workspace.learners.length} שהוזמנו · 7 ימים`,
      tone: 'green',
    },
    {
      label: 'זמן למידה בפועל',
      value: `${hours} שע׳`,
      pct: Math.min(100, Math.round((hours / monthlyHoursTarget) * 100)),
      sub: `סך הכול · ${Math.round((hours / monthlyHoursTarget) * 100)}% מהצפי החודשי`,
      tone: 'amber',
    },
    {
      label: 'לומדים בסיכון',
      value: String(atRisk.length),
      pct: workspace.learners.length ? Math.round((atRisk.length / workspace.learners.length) * 100) : 0,
      sub: 'ללא פעילות מעל 10 ימים',
      tone: 'violet',
    },
  ];

  // Programmes in scope, grouped by client, archived ones set aside.
  const groups = useMemo(() => {
    const list = (scope === 'mine' ? mine : team).filter((p) => p.status !== 'archived');
    const byClient = new Map<string, Program[]>();
    for (const program of list) {
      const bucket = byClient.get(program.client) ?? [];
      bucket.push(program);
      byClient.set(program.client, bucket);
    }
    return [...byClient.entries()];
  }, [scope, mine, team]);

  const weekMax = Math.max(...weekActivity.map((d) => d.nuggets));
  const weekTotal = weekActivity.reduce((a, d) => a + d.nuggets, 0);

  const openProgram = (program: Program) =>
    navigate(
      program.status === 'draft' || program.status === 'ready'
        ? `/admin/programs/${program.id}/build`
        : `/admin/programs/${program.id}`,
    );

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1900);
  };

  const monthLabel = `${HEBREW_MONTHS[today.getMonth()].replace('ב', '')} ${today.getFullYear()}`;
  const marks = new Map(workspace.milestones.map((m) => [m.day, m.kind]));
  const firstDow = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const newest = [...library].sort((a, b) => b.recencyRank - a.recencyRank).slice(0, 3);

  return (
    <AdminLayout crumb="דשבורד">
      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__kicker">{todayLabel}</div>
            <h1 style={{ marginTop: 4 }}>בוקר טוב{identity ? `, ${identity.name.split(' ')[0]}` : ''}</h1>
            <p>
              {mine.length} תוכניות בבעלותך · {published} באוויר
              {ready ? `, ${ready} מחכה לפרסום` : ''}
            </p>
          </div>
          <span className="spacer" />
          <Link className="btn btn--primary" to="/admin/programs/new">
            + תוכנית חדשה
          </Link>
        </div>

        <StatTiles tiles={tiles} />

        <div className="dash" style={{ marginTop: 20 }}>
          <div className="stack" style={{ gap: 20, minWidth: 0 }}>
            <section className="card card--flush card--scroll">
              <div className="section__head" style={{ padding: '16px 18px 14px' }}>
                <h2>תוכניות פעילות</h2>
                <div className="seg seg--ink">
                  <button type="button" aria-pressed={scope === 'mine'} onClick={() => setScope('mine')}>
                    שלי · {mine.length}
                  </button>
                  <button type="button" aria-pressed={scope === 'team'} onClick={() => setScope('team')}>
                    של הצוות · {team.length}
                  </button>
                </div>
                <span className="spacer" />
                <Link className="btn btn--quiet" to="/admin/programs">
                  כל התוכניות ←
                </Link>
              </div>

              {groups.length === 0 ? (
                <p className="empty" style={{ margin: 18 }}>
                  אין תוכניות פעילות בתצוגה הזאת.
                </p>
              ) : (
                groups.map(([client, rows]) => {
                  const cohort = rows.reduce((sum, p) => sum + (stats.get(p.id)?.learners ?? 0), 0);
                  return (
                    <div key={client}>
                      <div className="clientgroup">
                        <span className="mono-badge mono-badge--sm">{client[0]}</span>
                        <span className="clientgroup__body">
                          <b>{client}</b>
                          <span>
                            {rows.length === 1 ? 'תוכנית אחת' : `${rows.length} תוכניות`} · {cohort} לומדים
                          </span>
                        </span>
                        <em>{rows[0].owner}</em>
                      </div>
                      {rows.map((program) => {
                        const s = stats.get(program.id);
                        return (
                          <button key={program.id} type="button" className="progrow" onClick={() => openProgram(program)}>
                            <span className="progrow__name">
                              <b>{program.title}</b>
                              <span>
                                {program.audience} · {program.cohort}
                              </span>
                            </span>
                            <span className="progrow__cell">{program.units.length} יחידות</span>
                            <span className="progrow__cell">{s?.learners ? s.learners : '—'}</span>
                            <span>
                              <span className={STATUS_CHIP[program.status]}>{PROGRAM_STATUS_LABEL[program.status]}</span>
                            </span>
                            <span className="progrow__prog">
                              <span className="meter">
                                <i style={{ width: `${s?.avgPct ?? 0}%` }} data-empty={!s?.started} />
                              </span>
                              <span>{s?.started ? `${s.avgPct}% בממוצע` : 'טרם התחיל'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </section>

            <section className="card card--pad">
              <div className="section__head">
                <div>
                  <h2>פעילות לומדים</h2>
                  <p>שבעת הימים האחרונים · כל התוכניות שפורסמו</p>
                </div>
                <span className="spacer" />
                <div style={{ textAlign: 'left' }}>
                  <b style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink)' }}>
                    {weekTotal}
                  </b>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-4)' }}>נאגטים הושלמו</span>
                </div>
              </div>

              <div className="weekchart">
                {weekActivity.map((d) => {
                  const peak = d.nuggets === weekMax;
                  return (
                    <div key={d.label}>
                      <b data-peak={peak}>{d.nuggets}</b>
                      <i data-peak={peak} style={{ height: `${Math.max(7, (d.nuggets / weekMax) * 70)}px` }} />
                      <span>{d.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="factrow">
                <div>
                  <span>לומדים ייחודיים</span>
                  <b>{active.length}</b>
                </div>
                <div>
                  <span>סיימו תוכנית</span>
                  <b>{completed}</b>
                </div>
                <div>
                  <span>ציון תרגילים ממוצע</span>
                  <b>{score == null ? '—' : `${score}%`}</b>
                </div>
                <div>
                  <span>זמן חציוני ליחידה</span>
                  <b>{medianUnitMinutes} דק׳</b>
                </div>
              </div>
              <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-5)' }}>
                הפילוח היומי והזמן החציוני הם נתוני הדגמה — למרחב העבודה אין יומן פעילות שממנו
                אפשר לגזור אותם. שאר המספרים מחושבים מרשומות ההתקדמות.
              </p>
            </section>
          </div>

          <aside className="dash__rail">
            <section className="card card--pad-sm">
              <div className="section__head">
                <h3>מחזורי למידה</h3>
                <span className="spacer" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>{monthLabel}</span>
              </div>

              <div className="cal">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
                  <span key={d} className="cal__dow">
                    {d}
                  </span>
                ))}
                {Array.from({ length: firstDow }, (_, i) => (
                  <span key={`pad${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <span
                    key={d}
                    className="cal__day"
                    data-today={d === today.getDate() || undefined}
                    data-kind={marks.get(d)}
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="callegend">
                <span>
                  <i style={{ background: 'var(--accent)' }} /> קיקאוף
                </span>
                <span>
                  <i style={{ background: 'var(--amber)' }} /> דדליין
                </span>
                <span>
                  <i style={{ background: 'var(--violet)' }} /> דוח לקוח
                </span>
              </div>

              <div style={{ marginTop: 13 }}>
                {workspace.milestones.map((m) => {
                  const tint =
                    m.kind === 'קיקאוף'
                      ? { background: 'var(--accent-tint)', color: 'var(--accent-ink)' }
                      : m.kind === 'דדליין'
                        ? { background: 'var(--amber-tint)', color: 'var(--amber-ink)' }
                        : { background: 'var(--violet-tint)', color: 'var(--violet-ink)' };
                  return (
                    <div key={`${m.day}-${m.title}`} className="milestone">
                      <span className="milestone__date" style={tint}>
                        <b>{m.day}</b>
                        <span>{m.month}</span>
                      </span>
                      <span className="milestone__body">
                        <b>{m.title}</b>
                        <span>{m.subtitle}</span>
                      </span>
                      <span className="chip" style={tint}>
                        {m.kind}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card card--pad-sm">
              <div className="section__head">
                <h3>לומדים שנתקעו</h3>
                <span className="chip chip--count">{atRisk.length}</span>
                <span className="spacer" />
                <Link className="btn btn--quiet" to="/admin/analytics">
                  הכול ←
                </Link>
              </div>
              <div style={{ marginTop: 6 }}>
                {atRisk.slice(0, 4).map((row) => (
                  <div key={row.learner.id} className="stuckrow">
                    <span className="initials">{initials(row.learner.name)}</span>
                    <span className="stuckrow__body">
                      <b>{row.learner.name}</b>
                      <span>
                        {row.days} ימים ללא פעילות · {row.stuck}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn btn--well"
                      onClick={() => flash(`תזכורת נשלחה ל${row.learner.name}`)}
                    >
                      תזכורת
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="dark-card">
              <img className="dark-card__mark" src={assetUrl('assets/ngg-mark-white.png')} alt="" />
              <div style={{ position: 'relative', padding: '16px 17px 12px' }}>
                <h3 style={{ color: '#fff', fontSize: 15.5, fontWeight: 700, letterSpacing: '-.015em' }}>
                  חדש בספריית NGG
                </h3>
              </div>
              <div style={{ position: 'relative' }}>
                {newest.map((unit) => (
                  <div key={unit.id} className="dark-card__row">
                    <b>{unit.title}</b>
                    <span>
                      {unit.topic} · {unitMinutes(unit)} דק׳
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative', padding: '13px 17px 16px' }}>
                <Link
                  className="btn btn--block"
                  style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}
                  to="/admin/library"
                >
                  לספריית התוכן ←
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </main>
    </AdminLayout>
  );
}

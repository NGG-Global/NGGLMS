import { Link, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { unitCompletion, unitLocked } from '../app/progress';
import { builtUnits, hasNarration, libraryUnit, unitHealth, unitMinutes, unitNuggets } from '../content';
import { formatTime } from '../player/timeline';
import { Shell } from '../app/Shell';
import './learner.css';

/** Unit landing page: what it is for, what is inside, and one button into the player. */
export function UnitOverview() {
  const { programId, unitId } = useParams();
  const { identity, workspace, progressFor, introHeardFor } = useStore();
  if (!identity) return null;

  const program = workspace.programs.find((p) => p.id === programId);
  const unit = unitId ? libraryUnit(unitId) : undefined;

  if (!program || !unit) {
    return (
      <Shell crumb="יחידה">
        <main className="page page--narrow">
          <p className="empty">היחידה לא נמצאה.</p>
        </main>
      </Shell>
    );
  }

  const progress = progressFor(identity.id);
  const contentId = unit.contentId;
  const content = contentId ? builtUnits[contentId] : undefined;
  const completion = unitCompletion(progress, unit.contentId);
  const locked = unitLocked(program, unit, progress);
  const health = unit.contentId ? unitHealth(unit.contentId) : null;
  const nuggets = unitNuggets(unit);

  // The opening is a step in the flow now: starting a unit routes through it until the
  // learner has heard it, and only then straight to a nugget.
  const intro = content?.unit.intro;
  const introLength = intro ? intro.end - intro.start : 0;
  const introHeard = Boolean(content?.unit && contentId && introHeardFor(identity.id)[contentId]);
  const viaOpening = Boolean(content) && !introHeard && !completion.complete;
  const startTo = viaOpening
    ? `/learn/${program.id}/${unit.id}/opening`
    : `/learn/${program.id}/${unit.id}/play`;

  return (
    <Shell crumb={`${program.course || program.title} · ${unit.title}`}>
      <main className="page page--narrow">
        <p>
          <Link className="btn btn--quiet" to={`/learn/${program.id}`}>
            ← למסלול הלמידה
          </Link>
        </p>

        <div className="unitpage">
          <div>
            <span className="eyebrow eyebrow--pink">
              {content ? `יחידה ${content.unit.n}` : 'יחידה'} · {unit.topic}
            </span>
            <h1 style={{ marginTop: 8 }}>{content?.unit.title ?? unit.title}</h1>
            <p className="unitpage__lead">{content?.unit.lead ?? unit.summary}</p>

            <section className="section">
              <div className="section__head">
                <h2>מה כלול ביחידה</h2>
                <span className="spacer" />
                <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
                  {nuggets.length} נאגטים · {unitMinutes(unit)} דקות
                  {intro && hasNarration(intro.src, intro.end) ? ' · כולל פתיח' : ''}
                </span>
              </div>
              <ul className="blocklist">
                {content && intro && (
                  <li className="openrow" style={{ display: 'grid' }}>
                    <span className="openrow__play">▶</span>
                    <b>פתיח היחידה</b>
                    <span className="t">{formatTime(introLength)}</span>
                  </li>
                )}
                {nuggets.map((nugget, i) => {
                  const segment = content?.segments[i];
                  const record = segment ? progress[unit.contentId!]?.[segment.id] : undefined;
                  const segmentHealth = health?.segments[i];
                  return (
                    <li key={i}>
                      <i>{record?.practised ? '✓' : String(i + 1).padStart(2, '0')}</i>
                      <span>
                        <b>{nugget.title}</b>
                        {segment ? <em>{segment.think}</em> : nugget.summary ? <em>{nugget.summary}</em> : null}
                      </span>
                      <span className="t">
                        {segment ? formatTime(segment.end - segment.start) : `${nugget.minutes} דק׳`}
                        {segmentHealth && !segmentHealth.hasAudio ? ' · ללא קריינות' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="stack" style={{ gap: 14, position: 'sticky', top: 'calc(var(--topbar-h) + 22px)' }}>
            <div className="card card--pad">
              <div className="eyebrow">מטרת הלמידה</div>
              <p style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {unit.objective}
              </p>
            </div>

            <div className="card card--pad">
              <div className="eyebrow">בסיום היחידה תוכלו</div>
              <ul className="ticks" style={{ marginTop: 8 }}>
                {unit.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>

            <div className="card card--pad stack" style={{ gap: 10 }}>
              {completion.total > 0 && (
                <div className="row" style={{ gap: 10 }}>
                  <span className="meter meter--tall" style={{ flex: 1 }}>
                    <i style={{ width: `${completion.pct}%` }} />
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', flex: 'none' }}>
                    {completion.practised}/{completion.total}
                  </span>
                </div>
              )}
              {!content ? (
                <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  היחידה נמצאת בהפקה. התוכן יתווסף למסלול עם השלמתו.
                </p>
              ) : locked ? (
                <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  יש להשלים את היחידה הקודמת במסלול לפני שנפתחת היחידה הזאת.
                </p>
              ) : (
                <Link className="btn btn--primary" to={startTo}>
                  {completion.practised === 0 && viaOpening
                    ? `להתחיל — פתיח היחידה (${formatTime(introLength)})`
                    : completion.practised === 0
                      ? 'להתחיל את היחידה ←'
                      : completion.complete
                        ? 'לצפות שוב ←'
                        : 'להמשיך ←'}
                </Link>
              )}
              {completion.score && (
                <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                  תרגילים: {completion.score.correct} מתוך {completion.score.outOf} נכון
                </p>
              )}
            </div>

            {health && health.silentSegments.length > 0 && (
              <div className="banner banner--warn">
                <span>
                  <strong>הערה:</strong> ל־{health.silentSegments.length} מקטעים ביחידה עדיין אין קובץ קריינות.
                  הכתוביות והאנימציה מוצגות ומסונכרנות, אך ללא קול.
                </span>
              </div>
            )}
          </aside>
        </div>
      </main>
    </Shell>
  );
}

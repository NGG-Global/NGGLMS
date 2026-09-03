import { Link, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { programCompletion, unitCompletion, unitLocked } from '../app/progress';
import { unitMinutes } from '../content';
import { Shell } from '../app/Shell';
import './learner.css';

/** One programme as the learner sees it: the welcome note and the ordered unit list. */
export function ProgramView() {
  const { programId } = useParams();
  const { identity, workspace, progressFor } = useStore();
  if (!identity) return null;

  const program = workspace.programs.find((p) => p.id === programId);
  if (!program) {
    return (
      <Shell crumb="תוכנית">
        <main className="page page--narrow">
          <p className="empty">התוכנית לא נמצאה. ייתכן שהוסרה או שהקישור שגוי.</p>
          <p style={{ marginTop: 12 }}>
            <Link className="btn btn--quiet" to="/learn">
              ← למסלול הלמידה
            </Link>
          </p>
        </main>
      </Shell>
    );
  }

  const progress = progressFor(identity.id);
  const completion = programCompletion(program, progress);
  const allUnits = [...completion.playable, ...completion.pending];

  return (
    <Shell crumb={`${program.client} · ${program.course || program.title}`}>
      <main className="page page--narrow">
        <p>
          <Link className="btn btn--quiet" to="/learn">
            ← למסלול הלמידה
          </Link>
        </p>

        <div className="hero">
          <div>
            <h1>{program.course || program.title}</h1>
            <p>{program.description}</p>
          </div>
        </div>

        {program.welcome && (
          <div className="banner banner--info" style={{ marginBottom: 18 }}>
            <span>{program.welcome}</span>
          </div>
        )}

        <section className="card resume" style={{ marginBottom: 18 }}>
          <div>
            <div className="resume__k">ההתקדמות שלי</div>
            <div className="resume__t">
              {completion.done} מתוך {completion.playable.length} יחידות
            </div>
            <div className="resume__m">
              <span className="meter meter--tall">
                <i style={{ width: `${completion.pct}%` }} />
              </span>
              <span>{completion.pct}%</span>
            </div>
          </div>
          {completion.complete ? (
            <span className="pill pill--ok">✓ התוכנית הושלמה</span>
          ) : (
            completion.nextUnitId && (
              <Link className="btn btn--primary" to={`/learn/${program.id}/${completion.nextUnitId}`}>
                {completion.done ? 'להמשיך ←' : 'להתחיל ←'}
              </Link>
            )
          )}
        </section>

        <section className="section" style={{ marginTop: 0 }}>
          <div className="section__head">
            <h2>מסלול הלמידה</h2>
            <span className="spacer" />
            <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
              {program.sequential ? 'יחידות נפתחות לפי הסדר' : 'אפשר ללמוד בכל סדר'}
            </span>
          </div>
          <div className="card card--flush pathlist">
            {allUnits.map((unit, i) => {
              const completionUnit = unitCompletion(progress, unit.contentId);
              const locked = unitLocked(program, unit, progress);
              const inProduction = !unit.contentId;
              const body = (
                <>
                  <span
                    className={`pathrow__n${
                      completionUnit.complete ? ' pathrow__n--done' : locked ? '' : ' pathrow__n--now'
                    }`}
                  >
                    {completionUnit.complete ? '✓' : locked ? '🔒' : i + 1}
                  </span>
                  <span className="pathrow__b">
                    <b>{unit.title}</b>
                    <span>{unit.summary}</span>
                  </span>
                  <span className="pathrow__meta">
                    {inProduction ? (
                      <span className="pill pill--warn">בהכנה</span>
                    ) : completionUnit.practised > 0 && !completionUnit.complete ? (
                      <span className="pill pill--pink">
                        {completionUnit.practised}/{completionUnit.total}
                      </span>
                    ) : null}
                    <span className="pill pill--outline">{unitMinutes(unit)} דק׳</span>
                  </span>
                </>
              );
              return locked ? (
                <div
                  key={unit.id}
                  className="pathrow pathrow--locked"
                  title={inProduction ? 'היחידה בהפקה' : 'יש להשלים את היחידה הקודמת'}
                >
                  {body}
                </div>
              ) : (
                <Link key={unit.id} className="pathrow" to={`/learn/${program.id}/${unit.id}`}>
                  {body}
                </Link>
              );
            })}
          </div>
        </section>

        {completion.complete && program.closing && (
          <div className="banner banner--info" style={{ marginTop: 18 }}>
            <span>{program.closing}</span>
          </div>
        )}
      </main>
    </Shell>
  );
}

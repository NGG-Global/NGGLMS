import { Link } from 'react-router-dom';
import type { Program } from '../state/types';
import type { ProgramCompletion } from '../app/progress';
import { assetUrl } from '../app/paths';
import { ClientLogo } from '../app/ClientLogo';
import './learner.css';

interface Props {
  program: Program;
  completion: Pick<ProgramCompletion, 'pct' | 'done' | 'complete' | 'nextUnitId'> & { playableCount: number };
  /**
   * The builder's preview: the button is drawn but does not navigate, and the layout
   * stacks to fit a side panel.
   */
  preview?: boolean;
}

/**
 * The dark programme hero on the learner's home. The builder renders the same component
 * as its preview, so what an admin signs off is what the learner gets.
 */
export function ProgramHero({ program, completion, preview = false }: Props) {
  const label =
    completion.pct === 0 ? 'להתחיל ללמוד ←' : completion.complete ? 'לצפייה חוזרת ←' : 'להמשיך בלמידה ←';
  return (
    <section className={`lhero${preview ? ' lhero--compact' : ''}`}>
      <img className="lhero__mark" src={assetUrl('assets/ngg-mark-white.png')} alt="" />
      <div className="lhero__body">
        <div>
          <div className="lhero__k">
            {program.client.trim() && <ClientLogo client={program.client} size={28} radius={7} tone="dark" />}
            <span>{completion.pct === 0 ? 'התוכנית שלך' : 'להמשיך מאיפה שעצרת'}</span>
          </div>
          <div className="lhero__t">{program.course || program.title || 'שם הקורס'}</div>
          <div className="lhero__s">
            {program.client || 'הלקוח'} · {completion.done} מתוך {completion.playableCount} יחידות הושלמו
          </div>
          <div className="lhero__meter">
            <span className="meter">
              <i style={{ width: `${completion.pct}%` }} />
            </span>
            <span>{completion.pct}%</span>
          </div>
        </div>
        {completion.nextUnitId &&
          (preview ? (
            <span className="btn btn--primary" aria-hidden>
              {label}
            </span>
          ) : (
            <Link className="btn btn--primary" to={`/learn/${program.id}/${completion.nextUnitId}`}>
              {label}
            </Link>
          ))}
      </div>
    </section>
  );
}

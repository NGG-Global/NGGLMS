// Building blocks shared by the library, the programme list and the builder: the
// pieces that let a unit, and a path of units, be read by topic and by length.

import type { CSSProperties } from 'react';
import { isPlayable, nuggetWeights, topicStyle, topicVars, unitCode, unitMinutes, type LibraryUnit } from '../content';
import type { Program } from '../state/types';

/** Drafts open in the builder; live and archived programmes open on their dashboard. */
export function programHref(program: Program): string {
  return program.status === 'draft' || program.status === 'ready'
    ? `/admin/programs/${program.id}/build`
    : `/admin/programs/${program.id}`;
}

export function minutesLabel(total: number): string {
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${total} דק׳`;
  return `${hours} שע׳${rest ? ` ${rest} דק׳` : ''}`;
}

export function totalMinutes(units: LibraryUnit[]): number {
  return units.reduce((sum, u) => sum + unitMinutes(u), 0);
}

export function StatusChip({ unit }: { unit: LibraryUnit }) {
  return isPlayable(unit) ? (
    <span className="chip chip--green">מופק</span>
  ) : (
    <span className="chip chip--amber">בהפקה</span>
  );
}

/** One bar per nugget, drawn to scale; striped while the unit is still in production. */
export function NuggetBar({ unit, style }: { unit: LibraryUnit; style?: CSSProperties }) {
  return (
    <span className="nbar" data-made={isPlayable(unit)} style={{ ...topicVars(unit.topic), ...style }} aria-hidden>
      {nuggetWeights(unit).map((w, i) => (
        <i key={i} style={{ flex: w }} />
      ))}
    </span>
  );
}

/**
 * Topic-tinted cover. The design reserves this area for a unit image; the catalogue has
 * none yet, so the cover carries the topic's code instead of a stock picture.
 */
export function UnitCover({
  unit,
  className = '',
  children,
  showStatus = true,
  showCode = true,
}: {
  unit: LibraryUnit;
  className?: string;
  children?: React.ReactNode;
  showStatus?: boolean;
  showCode?: boolean;
}) {
  return (
    <div className={`ucover ${className}`} style={topicVars(unit.topic)}>
      <span className="ucover__mark" aria-hidden>
        {topicStyle(unit.topic).code}
      </span>
      {showCode && <span className="ucover__code">{unitCode(unit)}</span>}
      {showStatus && (
        <span className="ucover__status">
          <StatusChip unit={unit} />
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * A programme's path as one strip: a segment per unit, coloured by topic and as wide as
 * the unit is long. It is the at-a-glance answer to "what is in this programme".
 */
export function PathStrip({ units, numbered = false }: { units: LibraryUnit[]; numbered?: boolean }) {
  if (!units.length) return <span className="pathstrip pathstrip--empty">המסלול ריק</span>;
  return (
    <span className="pathstrip" role="img" aria-label={units.map((u) => u.title).join(' · ')}>
      {units.map((unit, i) => (
        <i
          key={unit.id}
          title={`${unit.title} · ${unitMinutes(unit)} דק׳${isPlayable(unit) ? '' : ' · בהפקה'}`}
          data-made={isPlayable(unit)}
          style={{ ...topicVars(unit.topic), flex: Math.max(1, unitMinutes(unit)) }}
        >
          {numbered ? String(i + 1).padStart(2, '0') : null}
        </i>
      ))}
    </span>
  );
}

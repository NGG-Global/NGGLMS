/**
 * Pastel status tile with a donut ring — shared by the dashboard and analytics.
 *
 * The ring is an inline SVG rather than a library: r=18.5 in a 44-unit box gives a
 * circumference of 116.2, so the dash array is simply pct/100 of that.
 */
const CIRCUMFERENCE = 116.2;

export type TileTone = 'magenta' | 'green' | 'amber' | 'violet';

const TONES: Record<TileTone, { bg: string; ring: string; track: string; ink: string }> = {
  magenta: { bg: 'var(--accent-tint)', ring: 'var(--accent)', track: 'var(--accent-tint-edge)', ink: 'var(--accent-ink)' },
  green: { bg: 'var(--green-tint)', ring: 'var(--green)', track: 'var(--green-track)', ink: 'var(--green-ink)' },
  amber: { bg: 'var(--amber-tint)', ring: 'var(--amber)', track: 'var(--amber-track)', ink: 'var(--amber-ink)' },
  violet: { bg: 'var(--violet-tint)', ring: 'var(--violet)', track: 'var(--violet-track)', ink: 'var(--violet-ink)' },
};

export interface StatTileProps {
  label: string;
  value: string;
  /** Ring fill, 0–100. */
  pct: number;
  sub: string;
  tone: TileTone;
}

export function StatTile({ label, value, pct, sub, tone }: StatTileProps) {
  const t = TONES[tone];
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="card tile" style={{ background: t.bg, borderColor: 'transparent', boxShadow: 'none', color: t.ink }}>
      <div className="tile__row">
        <span className="tile__donut">
          <svg viewBox="0 0 44 44" aria-hidden>
            <circle cx="22" cy="22" r="18.5" fill="none" stroke={t.track} strokeWidth="5" />
            <circle
              cx="22"
              cy="22"
              r="18.5"
              fill="none"
              stroke={t.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${((clamped / 100) * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE}`}
            />
          </svg>
          <span style={{ color: t.ink }}>{clamped}%</span>
        </span>
        <span>
          <span className="tile__v" style={{ color: t.ink }}>
            {value}
          </span>
          <span className="tile__k" style={{ display: 'block', color: t.ink }}>
            {label}
          </span>
        </span>
      </div>
      <div className="tile__sub">{sub}</div>
    </div>
  );
}

export function StatTiles({ tiles }: { tiles: StatTileProps[] }) {
  return (
    <div className="tiles">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  );
}

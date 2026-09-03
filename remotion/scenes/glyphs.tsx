/**
 * Monoline glyphs for the capability chips.
 *
 * A row of six identical pills is a list; the same row with a mark on each becomes
 * six distinct things, which is the whole reason the scene exists. They are drawn
 * rather than imported so they share one stroke weight and one corner radius with
 * the rest of the stage.
 *
 * Matching is by keyword, not by whole label, because the same capability is worded
 * differently from nugget to nugget — "ניסוח" in nugget 1 and "להציע ניסוחים" in
 * nugget 2 are the same idea and should carry the same mark. Rules are tried in order.
 * An unmatched label picks up the neutral mark and still renders; the fix is one rule
 * here rather than a change to the content.
 */

import type { ReactNode } from 'react';

const Svg = ({ children, size }: { children: ReactNode; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const RULES: [RegExp, (size: number) => ReactNode][] = [
  // Pattern in language: a waveform.
  [/דפוס/, (s) => (
    <Svg size={s}>
      <path d="M3 12h2.5l2-5 2.5 10 2.5-7 2 4h6.5" />
    </Svg>
  )],
  // Synthesis: many lines converging into one.
  [/סינתז/, (s) => (
    <Svg size={s}>
      <path d="M20 6h-6.5L10 12l3.5 6H20" />
      <path d="M4 6h4" />
      <path d="M4 12h6" />
      <path d="M4 18h4" />
    </Svg>
  )],
  // Phrasing: a nib.
  [/ניסוח|לנסח/, (s) => (
    <Svg size={s}>
      <path d="M4 20l3-1 11-11-2-2L5 17z" />
      <path d="M15 6l3 3" />
    </Svg>
  )],
  // Comparison: two measured bars.
  [/השווא|השוות|גרסא/, (s) => (
    <Svg size={s}>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M3 19h18" />
    </Svg>
  )],
  // Organising: a grid.
  [/ארגון|לארגן|נושא/, (s) => (
    <Svg size={s}>
      <rect x="4" y="4" width="7" height="7" rx="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.6" />
    </Svg>
  )],
  // Drafts: stacked pages.
  [/טיוט/, (s) => (
    <Svg size={s}>
      <path d="M8 3h7l4 4v10a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M15 3v4h4" />
      <path d="M9 13h7" />
      <path d="M9 16.5h4.5" />
    </Svg>
  )],
  // Summarising: a page condensed to a few lines.
  [/סכם|סיכום|מסמכ/, (s) => (
    <Svg size={s}>
      <path d="M5 4.5h11a2 2 0 012 2V19a2 2 0 01-2 2H5" />
      <path d="M8.5 9h6" />
      <path d="M8.5 12.5h4" />
      <path d="M8.5 16h2" />
    </Svg>
  )],
  // Ideas: a spark.
  [/רעיונ/, (s) => (
    <Svg size={s}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M4.5 12h3" />
      <path d="M16.5 12h3" />
      <path d="M6.9 6.9l2.1 2.1" />
      <path d="M15 15l2.1 2.1" />
      <path d="M17.1 6.9L15 9" />
      <path d="M9 15l-2.1 2.1" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  )],
  // Explaining plainly: a bubble with a short line.
  [/הסבי|הסבר|פשט/, (s) => (
    <Svg size={s}>
      <path d="M20 13.5A2.5 2.5 0 0117.5 16H9l-4 3.5V6.5A2.5 2.5 0 017.5 4h10A2.5 2.5 0 0120 6.5z" />
      <path d="M9 10h7" />
      <path d="M9 13h4" />
    </Svg>
  )],
  // Surfacing questions: a query mark.
  [/שאל/, (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.7 9.4a2.4 2.4 0 114.1 1.8c-.9.8-1.8 1.2-1.8 2.4" />
      <path d="M12 16.8h.01" />
    </Svg>
  )],
];

/** A neutral mark, for a label with no drawn glyph. */
const Neutral = (s: number) => (
  <Svg size={s}>
    <path d="M12 5l7 7-7 7-7-7z" />
  </Svg>
);

export const Glyph = ({ label, size = 34 }: { label: string; size?: number }) => {
  const rule = RULES.find(([pattern]) => pattern.test(label));
  return <>{(rule ? rule[1] : Neutral)(size)}</>;
};

/**
 * Whether a drawn mark exists for this label.
 *
 * A caller with a whole list should check all of them: a set where nothing matches
 * gets the same neutral diamond on every row, and a column of identical marks is
 * noise where a glyph is supposed to be the thing that tells rows apart.
 */
export const hasGlyph = (label: string) => RULES.some(([pattern]) => pattern.test(label));

/** A message you would send: for chips that are quoted prompts, not capabilities. */
export const Send = ({ color, size = 28 }: { color: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.5 12L4 5.2l2.4 6.8L4 18.8z" />
    <path d="M6.4 12h14.1" />
  </svg>
);

/**
 * An empty-set mark: something the tool does not hold.
 *
 * Shared by `negspace` and `butlist` on purpose — a learner who met it as "what it
 * does not hold" in nugget 1 should read it the same way in nugget 2.
 */
export const Void = ({ color, size = 30 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M6.4 17.6L17.6 6.4" strokeLinecap="round" />
  </svg>
);

/** Its counterpart: something the tool does do. */
export const Check = ({ color, size = 30 }: { color: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8.4" strokeWidth={1.8} />
    <path d="M8 12.4l2.8 2.8L16 9.6" />
  </svg>
);

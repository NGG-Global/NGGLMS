/**
 * Monoline glyphs for the capability chips.
 *
 * A row of six identical pills is a list; the same row with a mark on each becomes
 * six distinct things, which is the whole reason the scene exists. They are drawn
 * rather than imported so they share one stroke weight and one corner radius with
 * the rest of the stage.
 *
 * The map is keyed by the label the content author wrote. That is deliberate coupling:
 * a new capability chip in a later nugget picks up the neutral mark and still renders,
 * and the fix is one entry here rather than a change to the content.
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

const GLYPHS: Record<string, (size: number) => ReactNode> = {
  // Pattern in language: a waveform.
  'זיהוי דפוסים בשפה': (s) => (
    <Svg size={s}>
      <path d="M3 12h2.5l2-5 2.5 10 2.5-7 2 4h6.5" />
    </Svg>
  ),
  // Synthesis: many lines converging into one.
  'סינתזה של מידע': (s) => (
    <Svg size={s}>
      <path d="M20 6h-6.5L10 12l3.5 6H20" />
      <path d="M4 6h4" />
      <path d="M4 12h6" />
      <path d="M4 18h4" />
    </Svg>
  ),
  // Phrasing: a nib.
  'ניסוח': (s) => (
    <Svg size={s}>
      <path d="M4 20l3-1 11-11-2-2L5 17z" />
      <path d="M15 6l3 3" />
    </Svg>
  ),
  // Comparison: two measured bars.
  'השוואה': (s) => (
    <Svg size={s}>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M3 19h18" />
    </Svg>
  ),
  // Organising: a grid.
  'ארגון': (s) => (
    <Svg size={s}>
      <rect x="4" y="4" width="7" height="7" rx="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.6" />
    </Svg>
  ),
  // Drafts: stacked pages.
  'הפקת טיוטות': (s) => (
    <Svg size={s}>
      <path d="M8 3h7l4 4v10a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M15 3v4h4" />
      <path d="M9 13h7" />
      <path d="M9 16.5h4.5" />
    </Svg>
  ),
};

/** A neutral mark, for a label with no drawn glyph. */
const Neutral = (s: number) => (
  <Svg size={s}>
    <path d="M12 5l7 7-7 7-7-7z" />
  </Svg>
);

export const Glyph = ({ label, size = 34 }: { label: string; size?: number }) =>
  <>{(GLYPHS[label] ?? Neutral)(size)}</>;

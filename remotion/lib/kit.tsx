/**
 * Shared building blocks for the scene components.
 */

import type { CSSProperties, ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE_OUT, reveal } from './motion';

export interface RevealProps {
  children: ReactNode;
  /** Frame, relative to the enclosing scene, at which the entrance starts. */
  at?: number;
  duration?: number;
  /** Distance travelled on the way in, px. Positive rises from below. */
  dy?: number;
  /** Horizontal travel, px. Positive enters from the right — the RTL reading edge. */
  dx?: number;
  /** Entry scale, e.g. 0.94 to grow in. */
  from?: number;
  /** Entry blur in px. Cheap here because only a handful of nodes carry it. */
  blur?: number;
  easing?: (t: number) => number;
  style?: CSSProperties;
}

/**
 * One element's entrance. Composes opacity, travel, scale and blur off a single eased
 * progress value so a group given the same `at` moves as one body.
 */
export const Reveal = ({
  children,
  at = 0,
  duration = 22,
  dy = 18,
  dx = 0,
  from = 1,
  blur = 0,
  easing = EASE_OUT,
  style,
}: RevealProps) => {
  const frame = useCurrentFrame();
  const p = reveal(frame, { delay: at, duration, easing });
  const scale = from === 1 ? '' : ` scale(${from + (1 - from) * p})`;
  return (
    <div
      style={{
        opacity: p,
        transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px)${scale}`,
        filter: blur > 0 && p < 1 ? `blur(${blur * (1 - p)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * A headline whose accent phrase is marked rather than merely recoloured.
 *
 * The scene data gives the accent as a substring of the head (see `Scene['accent']`),
 * so the split is textual: everything before it, the phrase, everything after. The
 * phrase gets a brush that sweeps in beneath it once the phrase itself has landed —
 * the sequence reads as emphasis being *applied*, which recolouring alone does not.
 */
export const AccentHead = ({
  head,
  accent,
  at = 0,
  color,
  accentColor,
  fontSize,
  maxWidth,
}: {
  head: string;
  accent?: string;
  at?: number;
  color: string;
  accentColor: string;
  fontSize: number;
  maxWidth?: number;
}) => {
  const frame = useCurrentFrame();
  const cut = accent ? head.indexOf(accent) : -1;
  const parts: { text: string; marked: boolean }[] =
    cut < 0
      ? [{ text: head, marked: false }]
      : [
          { text: head.slice(0, cut), marked: false },
          { text: accent as string, marked: true },
          { text: head.slice(cut + (accent as string).length), marked: false },
        ];

  // The brush starts once the marked phrase is most of the way in.
  const brush = reveal(frame, { delay: at + 16, duration: 26 });

  return (
    <h2
      style={{
        margin: 0,
        maxWidth,
        fontSize,
        fontWeight: 800,
        lineHeight: 1.22,
        letterSpacing: '-0.022em',
        color,
        textWrap: 'balance',
      }}
    >
      {parts.map((part, i) => {
        if (!part.text) return null;
        const p = reveal(frame, { delay: at + i * 5, duration: 24 });
        return (
          <span
            key={i}
            style={{
              display: 'inline',
              opacity: p,
              color: part.marked ? accentColor : undefined,
            }}
          >
            {part.marked ? (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ position: 'relative' }}>{part.text}</span>
                {/* An underline, not a filled chip: a chip reads as a UI control and
                    boxes the phrase away from the sentence it belongs to. RTL, so the
                    stroke is pulled from the right edge, the way the line is read. */}
                <span
                  style={{
                    position: 'absolute',
                    insetInlineStart: '-0.04em',
                    insetInlineEnd: '-0.04em',
                    bottom: '-0.12em',
                    height: '0.11em',
                    borderRadius: '0.06em',
                    background: accentColor,
                    opacity: 0.85,
                    transform: `scaleX(${brush})`,
                    transformOrigin: 'right center',
                  }}
                />
              </span>
            ) : (
              part.text
            )}
          </span>
        );
      })}
    </h2>
  );
};

/** Letterspaced micro label — the eyebrow treatment from the platform's `.micro`. */
export const Micro = ({
  children,
  color,
  size = 21,
  style,
}: {
  children: ReactNode;
  color: string;
  size?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 700,
      letterSpacing: '0.16em',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

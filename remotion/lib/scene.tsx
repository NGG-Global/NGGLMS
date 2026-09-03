/**
 * The contract every scene component is built against.
 *
 * A scene gets its own frame clock (0 = the moment the shot cuts in) and, crucially,
 * `cueAt` — the frame each of its narration lines starts on. Reveals hang off those
 * anchors rather than off arbitrary delays, which is what keeps the picture and the
 * voice describing the same thing at the same time. When the copy is re-timed, the
 * animation follows without anyone touching these files.
 */

import type { ReactNode } from 'react';
import type { Scene } from '../../src/content/types';
import type { ResolvedArt } from '../art';
import type { Tone } from '../theme';
import { font, layout, type } from '../theme';

export interface SceneProps<S extends Scene = Scene> {
  scene: S;
  /** Start frame of each narration line, relative to the shot. */
  cueAt: number[];
  durationInFrames: number;
  t: Tone;
  /** Which line each element hangs off — see remotion/art.ts. */
  art: ResolvedArt;
}

/** Cue anchor with a fallback, so a re-cut segment with fewer lines still renders. */
export const cue = (cueAt: number[], index: number, fallback: number) =>
  cueAt[index] ?? fallback;

/**
 * Frame at which the cue named by an art entry starts.
 *
 * Art indexes cues; scenes need frames. A shot re-cut with fewer lines than the art
 * expects clamps to its last line rather than reaching past the end and rendering an
 * element that never arrives.
 */
export const cueFrame = (cueAt: number[], index: number | undefined, fallback = 0) => {
  if (index == null || cueAt.length === 0) return fallback;
  return cueAt[Math.min(Math.max(0, index), cueAt.length - 1)];
};

/**
 * The drawable area. Nothing may extend below `layout.stageBottom` — the caption band
 * owns everything under it, and a scene that reaches into it would collide with the
 * narration text on the longest lines.
 */
export const SceneBody = ({
  children,
  align = 'stretch',
  justify = 'center',
  gap = 0,
}: {
  children: ReactNode;
  align?: 'stretch' | 'center' | 'flex-start';
  justify?: 'center' | 'flex-start' | 'space-between';
  gap?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      top: layout.headerBottom,
      height: layout.stageBottom - layout.headerBottom,
      insetInlineStart: layout.gutter,
      insetInlineEnd: layout.gutter,
      display: 'flex',
      flexDirection: 'column',
      alignItems: align,
      justifyContent: justify,
      gap,
      direction: 'rtl',
      fontFamily: font.sans,
      textAlign: 'right',
    }}
  >
    {children}
  </div>
);

/** The scene headline treatment — `head` on every scene kind that carries one. */
export const SceneHead = ({ children, t }: { children: ReactNode; t: Tone }) => (
  <div
    style={{
      fontSize: type.sub,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      color: t.fg,
    }}
  >
    {children}
  </div>
);

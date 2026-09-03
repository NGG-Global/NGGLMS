/**
 * The ground the whole nugget is painted on.
 *
 * Scenes declare a tone, and roughly a fifth of nugget 1 runs light while the rest
 * runs dark. Letting each shot paint its own full-frame colour would flash on the
 * boundary, because two crossfading shots each at 50% opacity do not add up to an
 * opaque frame. So the backdrop is a single reel-level layer: both tones are drawn
 * once and `mix` dissolves between them, and the shots above it carry only content.
 *
 * The blooms drift on long, offset periods. At this amplitude the movement is below
 * the level anyone would name if asked, which is the point — it keeps a 31-second
 * hold from reading as a frozen frame.
 */

import { useCurrentFrame } from 'remotion';
import { drift } from '../lib/motion';
import { palette } from '../theme';

/** Faint dither. A real grain filter would cost more per frame than the look is worth. */
const dither = (color: string, size: number) => ({
  backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

export const Backdrop = ({ mix }: { mix: number }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Dark tone. */}
      <div style={{ position: 'absolute', inset: 0, background: palette.stageDark }}>
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background:
              'radial-gradient(46% 42% at 76% 16%, rgba(236,42,140,0.38), rgba(236,42,140,0) 64%)',
            transform: `translate(${drift(frame, 34, 900)}px, ${drift(frame, 22, 760, 1.1)}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background:
              'radial-gradient(44% 40% at 14% 86%, rgba(122,92,214,0.32), rgba(122,92,214,0) 62%)',
            transform: `translate(${drift(frame, 28, 1040, 2.4)}px, ${drift(frame, 18, 880, 0.4)}px)`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, ...dither('rgba(255,255,255,0.05)', 3) }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(78% 70% at 50% 46%, rgba(0,0,0,0), rgba(0,0,0,0.34))',
          }}
        />
      </div>

      {/* Light tone, dissolved over the dark one. */}
      <div style={{ position: 'absolute', inset: 0, background: palette.stageLight, opacity: mix }}>
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background:
              'radial-gradient(44% 40% at 82% 12%, rgba(236,42,140,0.10), rgba(236,42,140,0) 60%)',
            transform: `translate(${drift(frame, 26, 940, 0.8)}px, ${drift(frame, 16, 820)}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background:
              'radial-gradient(40% 38% at 10% 90%, rgba(122,92,214,0.09), rgba(122,92,214,0) 58%)',
            transform: `translate(${drift(frame, 22, 1120, 1.9)}px, ${drift(frame, 14, 900, 2.2)}px)`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, ...dither('rgba(21,21,31,0.05)', 4) }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(80% 70% at 50% 44%, rgba(21,21,31,0), rgba(21,21,31,0.06))',
          }}
        />
      </div>
    </div>
  );
};

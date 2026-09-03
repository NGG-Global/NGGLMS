/**
 * Persistent furniture: brand mark, unit identity, section kicker, progress.
 *
 * It sits above every shot and outlives all of them, so it is the one place a viewer
 * can look to answer "where am I" without the scene having to say so. Colours are
 * interpolated off the same `mix` the backdrop uses, which keeps the header legible
 * through a dark-to-light dissolve instead of flashing at the boundary.
 */

import { Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from 'remotion';
import { Micro } from '../lib/kit';
import { EASE_OUT } from '../lib/motion';
import { HEIGHT, WIDTH, layout, palette } from '../theme';

export interface FrameProps {
  /** 0 = dark tone, 1 = light tone. */
  mix: number;
  /** 0 -> 1 across the narration. */
  progress: number;
  /** Shot boundaries as a fraction of the narration, drawn as ticks on the track. */
  ticks: number[];
  /** e.g. "יחידה 01 · נאגט 1" */
  identity: string;
  /** The segment's eyebrow, e.g. "מודל מחשבתי". */
  kicker: string;
}

export const Frame = ({ mix, progress, ticks, identity, kicker }: FrameProps) => {
  const frame = useCurrentFrame();
  // The furniture arrives a beat after the title card, so the first thing on screen
  // is the nugget's name and not its chrome.
  const entry = interpolate(frame, [8, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });

  const quiet = interpolateColors(mix, [0, 1], ['rgba(255,255,255,0.52)', palette.ink4]);
  const accent = interpolateColors(mix, [0, 1], ['#ff5fa8', palette.accentDeep]);
  const rule = interpolateColors(mix, [0, 1], ['rgba(255,255,255,0.16)', 'rgba(21,21,31,0.10)']);
  const track = interpolateColors(mix, [0, 1], ['rgba(255,255,255,0.10)', 'rgba(21,21,31,0.07)']);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: entry }}>
      <div
        style={{
          position: 'absolute',
          top: 54,
          insetInlineStart: layout.gutter,
          insetInlineEnd: layout.gutter,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
        }}
      >
        {/* Two marks, crossfaded, because neither reads on both tones. */}
        <div style={{ position: 'relative', width: 50, height: 44, flex: 'none' }}>
          <Img
            src={staticFile('assets/ngg-mark-white.png')}
            style={{ position: 'absolute', inset: 0, width: 50, height: 44, objectFit: 'contain' }}
          />
          <Img
            src={staticFile('assets/ngg-mark.png')}
            style={{
              position: 'absolute',
              inset: 0,
              width: 50,
              height: 44,
              objectFit: 'contain',
              opacity: mix,
            }}
          />
        </div>
        <span style={{ width: 1, height: 30, background: rule, flex: 'none' }} />
        <Micro color={quiet}>{identity}</Micro>
        <span style={{ flex: 1 }} />
        <Micro color={accent}>{kicker}</Micro>
      </div>

      {/* Progress. The ticks expose the shot structure — six seconds in, a viewer can
          already see the nugget is built from nine beats and roughly where they fall. */}
      <div
        style={{
          position: 'absolute',
          top: layout.progressY,
          left: 0,
          width: WIDTH,
          height: HEIGHT - layout.progressY,
          background: track,
        }}
      >
        {ticks.map((tick, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: tick * WIDTH,
              width: 2,
              background: interpolateColors(mix, [0, 1], ['rgba(255,255,255,0.22)', 'rgba(21,21,31,0.14)']),
            }}
          />
        ))}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            width: Math.max(0, progress) * WIDTH,
            background: `linear-gradient(90deg, ${palette.violet}, ${palette.accent} 62%, #ff7ab8)`,
          }}
        />
      </div>
    </div>
  );
};

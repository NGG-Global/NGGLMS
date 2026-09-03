/**
 * The narration, written out.
 *
 * These are the same cue lines the web player captions with, on the same clock, so
 * the video is watchable with the sound off — which is how a good deal of workplace
 * training actually gets watched.
 *
 * Lines do not crossfade. Two different sentences at half opacity over each other is
 * unreadable for the 4 frames it lasts, so the outgoing line leaves before the
 * incoming one arrives; the ~100ms of clear band between them is below notice against
 * continuous speech. It lives at reel level rather than inside the shots, so a scene
 * change never interrupts a sentence mid-word.
 */

import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import type { Cue } from '../../src/player/timeline';
import { FPS, font, layout, palette, type } from '../theme';

const OUT = 4;
const IN = 7;
const HOLD = 3;

const Line = ({ text, opacity, dy, color }: { text: string; opacity: number; dy: number; color: string }) => (
  <div
    style={{
      position: 'absolute',
      insetInlineStart: 0,
      insetInlineEnd: 0,
      top: 0,
      opacity,
      transform: `translateY(${dy}px)`,
      textAlign: 'center',
      fontFamily: font.sans,
      fontSize: type.body,
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '-0.01em',
      color,
    }}
  >
    {text}
  </div>
);

export const Captions = ({ cues, mix }: { cues: Cue[]; mix: number }) => {
  const frame = useCurrentFrame();

  let index = -1;
  for (let i = 0; i < cues.length; i++) {
    if (Math.round(cues[i].t0 * FPS) <= frame) index = i;
    else break;
  }
  if (index < 0) return null;

  const local = frame - Math.round(cues[index].t0 * FPS);
  const color = interpolateColors(mix, [0, 1], ['rgba(255,255,255,0.90)', palette.ink2]);
  const previous = cues[index - 1];

  return (
    <div
      style={{
        position: 'absolute',
        top: layout.captionTop,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        height: 150,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 1420 }}>
        {previous && previous.text && local < OUT ? (
          <Line
            text={previous.text}
            color={color}
            opacity={interpolate(local, [0, OUT], [1, 0], { extrapolateRight: 'clamp' })}
            dy={interpolate(local, [0, OUT], [0, -8], { extrapolateRight: 'clamp' })}
          />
        ) : null}
        {cues[index].text ? (
          <Line
            text={cues[index].text}
            color={color}
            opacity={interpolate(local, [OUT + HOLD, OUT + HOLD + IN], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
            dy={interpolate(local, [OUT + HOLD, OUT + HOLD + IN], [10, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />
        ) : null}
      </div>
    </div>
  );
};

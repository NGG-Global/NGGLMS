/**
 * `dial` — one setting, moved.
 *
 * The head is the instruction ("להתאים את רמת הבקרה לרמת הסיכון") and `low` and `high`
 * are the two ends. A static gradient bar with a label under each end states that; the
 * scene instead puts a handle on the track and moves it, because the claim is about
 * adjusting, and adjusting is a motion.
 *
 * The handle sits at the low end on the line about a simple task and travels to the
 * high end on the line about a sensitive one. Each end's caption lifts as the handle
 * arrives and dims when it leaves, so at any moment exactly one reading is live.
 *
 * Green to amber, from the platform's own status tokens: the same colours the app uses
 * for "fine" and "look closer".
 */

import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_IN_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import { palette } from '../theme';

type DialScene = Extract<Scene, { kind: 'dial' }>;

const BOARD = 1560;
const TRACK_H = 22;
const HANDLE = 76;

export const DialSceneView = ({ scene, cueAt, t, art }: SceneProps<DialScene>) => {
  const frame = useCurrentFrame();

  const lowAt = cueFrame(cueAt, art.itemCues[0]);
  const highAt = cueFrame(cueAt, art.itemCues[1] ?? art.itemCues[0]);

  const trackIn = reveal(frame, { delay: 14, duration: 40 });
  // 0 at the low end, 1 at the high end. The travel is the scene.
  const at = interpolate(frame, [lowAt, highAt, highAt + 78], [0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const arrived = reveal(frame, { delay: lowAt, duration: 30 });

  const live = interpolateColors(at, [0, 1], [palette.green, palette.amber]);
  // RTL: low sits at the right, where the reading starts.
  const handleX = BOARD - HANDLE / 2 - at * (BOARD - HANDLE);

  const End = ({ text, on, x, align }: { text: string; on: number; x: number; align: 'right' | 'left' }) => (
    <div
      style={{
        position: 'absolute',
        top: 104,
        [align]: x,
        width: 660,
        direction: 'rtl',
        textAlign: align === 'right' ? 'right' : 'left',
        fontSize: 31,
        fontWeight: 700,
        lineHeight: 1.35,
        letterSpacing: '-0.015em',
        // The end the handle left is still part of the claim, so it stays readable.
        color: interpolateColors(on, [0, 1], [t.fg3, t.fg]),
        opacity: interpolate(on, [0, 1], [0.66, 1]),
        transform: `translateY(${(1 - on) * 8}px)`,
      }}
    >
      {text}
    </div>
  );

  return (
    <SceneBody justify="center" gap={72}>
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: BOARD,
            height: 200,
            direction: 'ltr',
            transform: `translateY(${drift(frame, 4, 700)}px)`,
          }}
        >
          {/* The track, and the span of it the handle has taken. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 34,
              width: BOARD,
              height: TRACK_H,
              borderRadius: TRACK_H,
              background: `linear-gradient(270deg, ${palette.green}, ${palette.amber})`,
              opacity: 0.24 * trackIn,
              transform: `scaleX(${trackIn})`,
              transformOrigin: 'right center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: handleX + HANDLE / 2,
              top: 34,
              width: BOARD - handleX - HANDLE / 2,
              height: TRACK_H,
              borderRadius: TRACK_H,
              background: `linear-gradient(270deg, ${palette.green}, ${live})`,
              opacity: arrived,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: handleX - HANDLE / 2,
              top: 34 - (HANDLE - TRACK_H) / 2,
              width: HANDLE,
              height: HANDLE,
              borderRadius: HANDLE,
              background: t.dark ? '#1c1c26' : '#fff',
              border: `4px solid ${live}`,
              boxShadow: `0 0 ${30 * arrived}px ${live}`,
              opacity: arrived,
              transform: `scale(${0.8 + 0.2 * arrived})`,
            }}
          />

          <End text={scene.low} on={1 - at} x={0} align="right" />
          <End text={scene.high} on={at} x={0} align="left" />
        </div>
      </div>
    </SceneBody>
  );
};

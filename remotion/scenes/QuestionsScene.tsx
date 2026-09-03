/**
 * `questions` — one ambiguous phrase, six things it could have meant.
 *
 * The list itself is not the insight; the fan-out is. So the head is not a title over
 * a column of bullets, it is the node at the centre, and the six candidates hang off
 * it on drawn connectors — the shape of an under-specified request.
 *
 * The last two narration lines are what the scene is really for. On "without clear
 * context, the tool decides for itself what matters", a selection ring lands on one
 * branch and the other five drop away: the choice got made, just not by us. On
 * "sometimes that is enough, sometimes it is exactly what we did not want" the ring
 * pulses once green and once amber, which is the whole risk stated without a word of
 * new copy.
 */

import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { EASE_IN_OUT, EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, cue, type SceneProps } from '../lib/scene';
import { palette, type as typeScale } from '../theme';

type QuestionsScene = Extract<Scene, { kind: 'questions' }>;

const BOARD_W = 1656;
const BOARD_H = 620;
const CX = BOARD_W / 2;
const CY = BOARD_H / 2;
const NODE_W = 560;
const NODE_H = 128;
const PILL_W = 380;
const PILL_H = 92;
/** Row centres for the three branches on each side. */
const ROWS = [78, CY, BOARD_H - 78];

/**
 * The branch the tool picks for itself. Deliberately not the first item and not the
 * one nearest the centre: an arbitrary pick has to look arbitrary, or the scene reads
 * as the tool choosing sensibly.
 */
const PICKED = 4;

interface Branch {
  item: string;
  right: boolean;
  x: number;
  y: number;
}

const layoutBranches = (items: string[]): Branch[] =>
  items.map((item, i) => {
    // RTL: the first three named go on the right, where reading starts.
    const right = i < 3;
    return {
      item,
      right,
      x: right ? BOARD_W - PILL_W : 0,
      y: ROWS[i % 3] - PILL_H / 2,
    };
  });

export const QuestionsSceneView = ({ scene, cueAt, t }: SceneProps<QuestionsScene>) => {
  const frame = useCurrentFrame();
  const branches = layoutBranches(scene.items);

  const firstWave = cue(cueAt, 0, 0);
  const secondWave = cue(cueAt, 1, 117);
  const decideFrom = cue(cueAt, 2, 232);
  const verdictFrom = cue(cueAt, 3, 337);

  const branchAt = (i: number) => (i < 3 ? firstWave + 14 + i * 30 : secondWave + (i - 3) * 30);
  const decide = reveal(frame, { delay: decideFrom, duration: 34, easing: EASE_OUT });

  // Two pulses on the verdict line: it worked, then it did not.
  const good = interpolate(frame, [verdictFrom + 6, verdictFrom + 30, verdictFrom + 54], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const bad = interpolate(frame, [verdictFrom + 62, verdictFrom + 92, verdictFrom + 150], [0, 1, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const ring = interpolateColors(
    Math.max(good, bad),
    [0, 1],
    [t.accent, good >= bad ? palette.green : palette.amber],
  );

  const nodeEnter = reveal(frame, { delay: 0, duration: 30 });

  return (
    <SceneBody align="center" justify="center">
      <div style={{ position: 'relative', width: BOARD_W, height: BOARD_H, direction: 'ltr' }}>
        {/* Connectors, drawn under everything. */}
        <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {branches.map((b, i) => {
            const from = b.right ? CX + NODE_W / 2 : CX - NODE_W / 2;
            const to = b.right ? b.x : PILL_W;
            const y = b.y + PILL_H / 2;
            const mid = (from + to) / 2;
            const d = `M ${from} ${CY} C ${mid} ${CY}, ${mid} ${y}, ${to} ${y}`;
            const p = reveal(frame, { delay: branchAt(i), duration: 30 });
            const dropped = i === PICKED ? 0 : decide;
            return (
              <path
                key={b.item}
                d={d}
                fill="none"
                stroke={i === PICKED && decide > 0.1 ? ring : t.fg4}
                strokeWidth={i === PICKED && decide > 0.1 ? 3 : 2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={p * interpolate(dropped, [0, 1], [1, 0.16])}
              />
            );
          })}
        </svg>

        {/* The ambiguous phrase. */}
        <div
          style={{
            position: 'absolute',
            left: CX - NODE_W / 2,
            top: CY - NODE_H / 2,
            width: NODE_W,
            height: NODE_H,
            borderRadius: 24,
            background: t.dark ? 'rgba(255,255,255,0.08)' : '#fff',
            border: `2px solid ${t.dark ? t.edge : '#e4e3e8'}`,
            boxShadow: t.dark ? 'none' : '0 26px 60px -40px rgba(21,10,20,0.6)',
            display: 'grid',
            placeItems: 'center',
            padding: '0 34px',
            direction: 'rtl',
            opacity: nodeEnter,
            transform: `scale(${0.96 + 0.04 * nodeEnter}) translateY(${drift(frame, 4, 560)}px)`,
          }}
        >
          <span
            style={{
              fontSize: typeScale.sub,
              fontWeight: 800,
              letterSpacing: '-0.022em',
              lineHeight: 1.2,
              color: t.fg,
              textAlign: 'center',
            }}
          >
            {scene.head}
          </span>
        </div>

        {/* The candidates. */}
        {branches.map((b, i) => {
          const p = reveal(frame, { delay: branchAt(i), duration: 26 });
          const picked = i === PICKED;
          const dropped = picked ? 0 : decide;
          const lift = picked ? decide : 0;
          return (
            <div
              key={b.item}
              style={{
                position: 'absolute',
                left: b.x,
                top: b.y,
                width: PILL_W,
                height: PILL_H,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                direction: 'rtl',
                background: picked && decide > 0.1 ? t.accentWash : t.dark ? t.panel : '#fff',
                border: `2px solid ${picked && decide > 0.1 ? ring : t.dark ? t.edge : '#e4e3e8'}`,
                boxShadow: picked
                  ? `0 0 ${26 * lift}px ${interpolateColors(lift, [0, 1], ['rgba(236,42,140,0)', ring])}`
                  : t.dark
                    ? 'none'
                    : '0 2px 4px rgba(21,21,31,0.04)',
                fontSize: typeScale.item,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: interpolateColors(dropped, [0, 1], [t.fg, t.fg3]),
                opacity: p * interpolate(dropped, [0, 1], [1, 0.62]),
                transform: `translateY(${16 * (1 - p) + drift(frame, 3, 640, i)}px) scale(${
                  (0.95 + 0.05 * p) * (1 + 0.035 * lift)
                })`,
              }}
            >
              {b.item}
            </div>
          );
        })}
      </div>
    </SceneBody>
  );
};

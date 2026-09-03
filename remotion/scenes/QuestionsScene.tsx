/**
 * `questions` — one phrase, and the several things it could mean or ask.
 *
 * The list is not the insight; the fan-out is. So the head is not a title over a
 * column of bullets, it is the node at the centre, and the candidates hang off it on
 * drawn connectors — the shape of an under-specified request, or of a check that has
 * more than one part.
 *
 * Nugget 1's shot is the one with a verdict in it. Its narration says the tool decides
 * for itself what matters, so `pick` in art.ts lands a selection ring on one branch
 * and the other five drop away: the choice got made, just not by us. Then the ring
 * pulses once green and once amber, which is the whole risk stated without a word of
 * new copy. Nugget 3's two question sets are prompts for the learner, and dimming four
 * of five of them would say something the copy never says — so without `pick` every
 * branch simply arrives and stays.
 */

import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { EASE_IN_OUT, EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, cueFrame, type SceneProps } from '../lib/scene';
import { palette, type as typeScale } from '../theme';

type QuestionsScene = Extract<Scene, { kind: 'questions' }>;

const BOARD_W = 1656;
const BOARD_H = 620;
const CX = BOARD_W / 2;
const CY = BOARD_H / 2;
const NODE_W = 560;
const NODE_MIN_H = 128;
const PILL_MIN_H = 92;
/** Widest a branch may get before its label wraps instead. */
const PILL_MAX_W = 520;

interface Branch {
  item: string;
  right: boolean;
  y: number;
}

/**
 * Lays the branches out on both sides of the node.
 *
 * Sides are balanced rather than filled three-then-three, so five questions read as
 * 3 + 2 instead of 3 + 2 stacked at the top of the left column. Rows are centred on
 * the node's line and spaced by a capped step, so two branches sit either side of
 * centre instead of being flung to the frame edges.
 */
const layoutBranches = (items: string[]): Branch[] => {
  const rightCount = Math.ceil(items.length / 2);
  const rowsFor = (count: number) => {
    const step = Math.min(212, (BOARD_H - PILL_MIN_H - 20) / Math.max(1, count - 1));
    return Array.from({ length: count }, (_, j) => CY + (j - (count - 1) / 2) * step);
  };
  const rightRows = rowsFor(rightCount);
  const leftRows = rowsFor(items.length - rightCount);
  // RTL: the first questions named go on the right, where reading starts.
  return items.map((item, i) => {
    const right = i < rightCount;
    return { item, right, y: right ? rightRows[i] : leftRows[i - rightCount] };
  });
};

/** Rough label width, so short questions do not sit in oversized boxes. */
const pillWidth = (items: string[]) => {
  const longest = items.reduce((max, item) => Math.max(max, item.length), 0);
  return Math.round(Math.min(PILL_MAX_W, Math.max(320, 48 + longest * 16)));
};

export const QuestionsSceneView = ({ scene, cueAt, t, art }: SceneProps<QuestionsScene>) => {
  const frame = useCurrentFrame();
  const branches = layoutBranches(scene.items);
  const pillW = pillWidth(scene.items);

  // Branches sharing a line are spaced inside it rather than landing together.
  let sameCue = 0;
  const branchAt = art.itemCues.map((cueIndex, i) => {
    sameCue = i > 0 && art.itemCues[i - 1] === cueIndex ? sameCue + 1 : 0;
    return cueFrame(cueAt, cueIndex) + 14 + sameCue * 28;
  });

  const picked = art.pick;
  const decide =
    picked == null ? 0 : reveal(frame, { delay: cueFrame(cueAt, art.pickAt), duration: 34, easing: EASE_OUT });

  // Two pulses on the verdict line: it worked, then it did not.
  const verdictFrom = cueFrame(cueAt, art.verdictAt, 10_000);
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

  const nodeEnter = reveal(frame, { delay: cueFrame(cueAt, art.headAt), duration: 30 });
  // A two-sentence head needs to give up some size to stay on three lines.
  const headSize = scene.head.length > 38 ? 36 : typeScale.sub;

  return (
    <SceneBody align="center" justify="center">
      <div style={{ position: 'relative', width: BOARD_W, height: BOARD_H, direction: 'ltr' }}>
        {/* Connectors, drawn under everything. */}
        <svg
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {branches.map((b, i) => {
            const from = b.right ? CX + NODE_W / 2 : CX - NODE_W / 2;
            const to = b.right ? BOARD_W - pillW : pillW;
            const mid = (from + to) / 2;
            const d = `M ${from} ${CY} C ${mid} ${CY}, ${mid} ${b.y}, ${to} ${b.y}`;
            const p = reveal(frame, { delay: branchAt[i], duration: 30 });
            const dropped = i === picked ? 0 : decide;
            const chosen = i === picked && decide > 0.1;
            return (
              <path
                key={b.item}
                d={d}
                fill="none"
                stroke={chosen ? ring : t.dark ? t.fg4 : '#c4c2cc'}
                strokeWidth={chosen ? 3 : 2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={p * interpolate(dropped, [0, 1], [1, 0.16])}
              />
            );
          })}
        </svg>

        {/* The phrase everything hangs off. */}
        <div
          style={{
            position: 'absolute',
            left: CX - NODE_W / 2,
            top: CY,
            width: NODE_W,
            minHeight: NODE_MIN_H,
            borderRadius: 24,
            background: t.dark ? 'rgba(255,255,255,0.08)' : '#fff',
            border: `2px solid ${t.dark ? t.edge : '#e4e3e8'}`,
            boxShadow: t.dark ? 'none' : '0 26px 60px -40px rgba(21,10,20,0.6)',
            display: 'grid',
            placeItems: 'center',
            padding: '28px 34px',
            direction: 'rtl',
            opacity: nodeEnter,
            transform: `translateY(calc(-50% + ${drift(frame, 4, 560)}px)) scale(${
              0.96 + 0.04 * nodeEnter
            })`,
          }}
        >
          <span
            style={{
              fontSize: headSize,
              fontWeight: 800,
              letterSpacing: '-0.022em',
              lineHeight: 1.24,
              color: t.fg,
              textAlign: 'center',
            }}
          >
            {scene.head}
          </span>
        </div>

        {/* The branches. */}
        {branches.map((b, i) => {
          const p = reveal(frame, { delay: branchAt[i], duration: 26 });
          const isPick = i === picked;
          const dropped = isPick ? 0 : decide;
          const lift = isPick ? decide : 0;
          return (
            <div
              key={b.item}
              style={{
                position: 'absolute',
                [b.right ? 'right' : 'left']: 0,
                top: b.y,
                width: pillW,
                minHeight: PILL_MIN_H,
                borderRadius: 26,
                display: 'grid',
                placeItems: 'center',
                padding: '20px 26px',
                direction: 'rtl',
                background: isPick && decide > 0.1 ? t.accentWash : t.dark ? t.panel : '#fff',
                border: `2px solid ${
                  isPick && decide > 0.1 ? ring : t.dark ? t.edge : '#e4e3e8'
                }`,
                boxShadow: isPick
                  ? `0 0 ${26 * lift}px ${interpolateColors(lift, [0, 1], ['rgba(236,42,140,0)', ring])}`
                  : t.dark
                    ? 'none'
                    : '0 2px 4px rgba(21,21,31,0.04)',
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.28,
                letterSpacing: '-0.015em',
                textAlign: 'center',
                color: interpolateColors(dropped, [0, 1], [t.fg, t.fg3]),
                opacity: p * interpolate(dropped, [0, 1], [1, 0.62]),
                transform: `translateY(calc(-50% + ${
                  16 * (1 - p) + drift(frame, 3, 640, i)
                }px)) scale(${(0.95 + 0.05 * p) * (1 + 0.035 * lift)})`,
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

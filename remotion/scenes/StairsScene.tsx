/**
 * `stairs` — the same thing at three levels of one quantity.
 *
 * Nugget 5's are steps of responsibility: drafting three slide titles, analysing
 * business data, recommending a sensitive decision. The items give the task and what
 * it asks of the person, and the order is an explicit escalation — the copy calls them
 * "מדרגות של אחריות" in so many words, so drawing them as a rising flight is the
 * content's own metaphor rather than an interpretation laid over it.
 *
 * Each tread arrives on the line that names its task and its note follows on the line
 * that says what the task requires, so the climb is built one step per sentence. The
 * flight is drawn behind them as it goes, which is what makes three cards read as one
 * ascent instead of three cards.
 */

import { useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';

type StairsScene = Extract<Scene, { kind: 'stairs' }>;

const BOARD = 1656;
/**
 * The run has to clear the tread, or the flight has nowhere to be drawn but through
 * the cards. That caps the tread width: three steps across 1656 leaves 540 each with
 * an 18px gap between them.
 */
const CARD_W = 540;
const RUN = 558;
const RISE = 140;
const CARD_H = 168;

export const StairsSceneView = ({ scene, cueAt, t, art }: SceneProps<StairsScene>) => {
  const frame = useCurrentFrame();
  const count = scene.items.length;
  const boardH = (count - 1) * RISE + CARD_H;

  // RTL: the first, lightest step stands at the bottom right, and the flight climbs
  // leftward — the direction the line is read.
  const rightOf = (i: number) => i * RUN;
  const topOf = (i: number) => (count - 1 - i) * RISE;

  return (
    <SceneBody justify="center" gap={44}>
      <Reveal at={cueFrame(cueAt, art.headAt)} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ position: 'relative', width: BOARD, height: boardH, direction: 'ltr' }}>
        {/* The flight itself, drawn under the treads. */}
        <svg
          viewBox={`0 0 ${BOARD} ${boardH}`}
          style={{ position: 'absolute', inset: 0, width: BOARD, height: boardH }}
        >
          {scene.items.map((item, i) => {
            const p = reveal(frame, {
              delay: cueFrame(cueAt, art.itemCues[i]) - 10,
              duration: 30,
              easing: EASE_OUT,
            });
            // Along the underside of this tread, then up the riser to the next one.
            const right = BOARD - rightOf(i);
            const left = right - CARD_W;
            const bottom = topOf(i) + CARD_H;
            const next = i + 1 < count ? topOf(i + 1) + CARD_H : bottom;
            return (
              <path
                key={item[0]}
                d={`M ${right} ${bottom} L ${left} ${bottom}${
                  i + 1 < count ? ` L ${left} ${next}` : ''
                }`}
                fill="none"
                stroke={t.accent}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.45}
              />
            );
          })}
        </svg>

        {scene.items.map(([task, note], i) => {
          const at = cueFrame(cueAt, art.itemCues[i]);
          const noteAt = cueFrame(cueAt, art.detailCues[i], at + 40);
          const p = reveal(frame, { delay: at, duration: 30 });
          const q = reveal(frame, { delay: noteAt, duration: 26 });
          const top = i === count - 1;
          return (
            <div
              key={task}
              style={{
                position: 'absolute',
                right: rightOf(i),
                top: topOf(i),
                width: CARD_W,
                height: CARD_H,
                padding: '24px 26px',
                borderRadius: 20,
                background: t.panel,
                // The last step is where the person has to hold the decision, so it
                // is the one the frame ends up looking at.
                border: `${top ? 2 : 1}px solid ${top && q > 0.4 ? t.accent : t.edge}`,
                boxShadow: top && q > 0.4 ? `0 0 ${34 * q}px rgba(236,42,140,0.22)` : 'none',
                direction: 'rtl',
                opacity: p,
                // Enters from the right, the way the flight is climbed.
                transform: `translateX(${28 * (1 - p)}px) translateY(${drift(frame, 2, 620, i)}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 800,
                  letterSpacing: '-0.018em',
                  lineHeight: 1.25,
                  color: t.fg,
                }}
              >
                {task}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: top && q > 0.4 ? t.accent : t.fg3,
                  opacity: q,
                  transform: `translateY(${(1 - q) * 8}px)`,
                }}
              >
                {note}
              </div>
            </div>
          );
        })}
      </div>
    </SceneBody>
  );
};

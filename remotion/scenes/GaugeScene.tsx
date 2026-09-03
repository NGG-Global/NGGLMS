/**
 * `gauge` — a quantity that rises as conditions accumulate.
 *
 * The head states the relationship ("ככל שהמשימה כזו, תפקיד האדם גדל") and the items
 * are the conditions, in order of increasing weight. The app draws them as widening
 * bars; here they are columns on a shared baseline, because the point is not four
 * separate facts but a slope — and a slope wants a common floor to be read against.
 *
 * Each column rises on the line that names its condition, so by the time the narrator
 * reaches "so the person's role grows" the climb is already on screen and the accent
 * trend line drawn across the tops only confirms what the viewer has watched happen.
 */

import { useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';

type GaugeScene = Extract<Scene, { kind: 'gauge' }>;

const PLOT_H = 330;
const COL_W = 224;
const GAP = 84;
/** Shortest and tallest column, as a fraction of the plot. */
const FLOOR = 0.3;
const CEIL = 1;

export const GaugeSceneView = ({ scene, cueAt, t, art }: SceneProps<GaugeScene>) => {
  const frame = useCurrentFrame();
  const count = scene.items.length;
  const boardW = count * COL_W + (count - 1) * GAP;

  const heightOf = (i: number) =>
    PLOT_H * (FLOOR + ((CEIL - FLOOR) * i) / Math.max(1, count - 1));
  // RTL: the first condition stands at the right, and the climb runs leftward.
  const centreX = (i: number) => boardW - i * (COL_W + GAP) - COL_W / 2;

  const trend = reveal(frame, {
    delay: cueFrame(cueAt, art.payoffAt),
    duration: 54,
    easing: EASE_OUT,
  });

  return (
    <SceneBody justify="center" gap={48}>
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ position: 'relative', width: boardW, height: PLOT_H + 108, direction: 'ltr' }}>
          {/* Baseline. Everything is measured off it. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: PLOT_H,
              height: 2,
              background: t.edge,
              transform: `scaleX(${reveal(frame, { delay: 8, duration: 34 })})`,
              transformOrigin: 'right center',
            }}
          />

          {scene.items.map((item, i) => {
            const at = cueFrame(cueAt, art.itemCues[i]);
            const p = reveal(frame, { delay: at, duration: 34 });
            const h = heightOf(i);
            return (
              <div key={item}>
                <div
                  style={{
                    position: 'absolute',
                    left: centreX(i) - COL_W / 2,
                    top: PLOT_H - h,
                    width: COL_W,
                    height: h,
                    borderRadius: '18px 18px 0 0',
                    // Light enough to read as a measured quantity rather than a
                    // block of colour: four saturated slabs swamp the frame.
                    background: 'linear-gradient(180deg, rgba(236,42,140,0.13), rgba(236,42,140,0))',
                    border: `1px solid ${t.edge}`,
                    borderBottom: 'none',
                    // Grown from the floor, so the rise reads as accumulation.
                    transform: `scaleY(${p})`,
                    transformOrigin: 'bottom center',
                    opacity: p,
                  }}
                />
                {/* The cap: where this condition tops out. */}
                <div
                  style={{
                    position: 'absolute',
                    left: centreX(i) - COL_W / 2,
                    top: PLOT_H - h - 3,
                    width: COL_W,
                    height: 6,
                    borderRadius: 6,
                    background: t.accent,
                    opacity: p,
                    transform: `scaleX(${p})`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: centreX(i) - COL_W / 2,
                    top: PLOT_H + 26,
                    width: COL_W,
                    direction: 'rtl',
                    textAlign: 'center',
                    fontSize: 29,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '-0.015em',
                    color: t.fg2,
                    opacity: p,
                    transform: `translateY(${(1 - p) * 14 + drift(frame, 2, 600, i)}px)`,
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}

          {/* The slope itself, drawn once every condition is standing. */}
          <svg
            viewBox={`0 0 ${boardW} ${PLOT_H}`}
            style={{ position: 'absolute', inset: 0, width: boardW, height: PLOT_H, overflow: 'visible' }}
          >
            <path
              d={scene.items
                .map((_, i) => `${i === 0 ? 'M' : 'L'} ${centreX(i)} ${PLOT_H - heightOf(i)}`)
                .join(' ')}
              fill="none"
              stroke={t.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - trend}
              opacity={0.82}
            />
            {scene.items.map((item, i) => (
              <circle
                key={item}
                cx={centreX(i)}
                cy={PLOT_H - heightOf(i)}
                r={9}
                fill={t.accent}
                opacity={Math.max(0, Math.min(1, trend * count - i))}
              />
            ))}
          </svg>
        </div>
      </div>
    </SceneBody>
  );
};

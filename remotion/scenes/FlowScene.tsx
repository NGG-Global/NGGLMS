/**
 * `flow` — one thing becoming another.
 *
 * The nodes here are "כמות גדולה של טקסט" and "סיכום קצר", and the operation between
 * them is the point: a lot in, a little out. Two labelled boxes and an arrow would
 * state that; this shows it, by giving the source real bulk — sixteen lines of it —
 * and then moving that bulk down the connector into a card that holds three.
 *
 * The narration names three separate instances of the same operation (a summary, a
 * tidy email, a set of options), which is why the transfer runs three times, once per
 * line, instead of playing once and leaving the frame static for twelve seconds.
 * Repeating the same motion is honest here: the copy is repeating the same claim.
 */

import { interpolate, random, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Micro, Reveal } from '../lib/kit';
import { EASE_IN_OUT, EASE_OUT, reveal } from '../lib/motion';
import { SceneBody, SceneHead, type SceneProps } from '../lib/scene';
import type { Tone } from '../theme';
import { type as typeScale } from '../theme';

type FlowScene = Extract<Scene, { kind: 'flow' }>;

const BOARD = 1656;
const SOURCE_W = 720;
const CARD_W = 470;
const PASS = 124;

const SourceLines = ({ t, sweep }: { t: Tone; sweep: number }) => {
  const frame = useCurrentFrame();
  const rows = 16;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, direction: 'rtl' }}>
      {Array.from({ length: rows }, (_, i) => {
        const p = reveal(frame, { delay: 14 + i * 5, duration: 22 });
        // The sweep runs top to bottom through the block as the transfer starts, so
        // the source visibly *feeds* the connector rather than just sitting there.
        const local = sweep * rows - i;
        const lit = interpolate(local, [0, 0.7, 2.4], [0, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <span
            key={i}
            style={{
              height: 10,
              borderRadius: 10,
              width: `${52 + random(`flow-line-${i}`) * 48}%`,
              background: lit > 0.02 ? t.accent : t.fg4,
              opacity: p * (0.34 + 0.66 * lit),
              transform: `scaleX(${p})`,
              transformOrigin: 'right center',
            }}
          />
        );
      })}
    </div>
  );
};

export const FlowSceneView = ({ scene, cueAt, t }: SceneProps<FlowScene>) => {
  const frame = useCurrentFrame();

  // One transfer per narration line, the first held back until the boards are built.
  const anchors = [Math.max(56, cueAt[0] + 56), ...cueAt.slice(1)];
  let anchor = anchors[0];
  for (const a of anchors) if (a <= frame) anchor = a;
  const local = frame - anchor;

  const sweep = interpolate(local, [0, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  const travel = interpolate(local, [26, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  // Arrival: a short swell on the card, then back to rest before the next pass.
  const arrive = interpolate(local, [70, 86, PASS], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });

  const railStart = CARD_W + 56;
  const railEnd = BOARD - SOURCE_W - 56;
  const railW = railEnd - railStart;

  return (
    <SceneBody justify="center" gap={54}>
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ position: 'relative', width: BOARD, height: 420, direction: 'ltr' }}>
        {/* Both node labels sit on one baseline above their boxes, so the pair reads as
            two columns of the same diagram rather than two unrelated cards. */}
        <Reveal at={16} dy={10} style={{ position: 'absolute', left: 0, top: 0, width: CARD_W }}>
          <Micro color={t.accent} size={24} style={{ textAlign: 'center', direction: 'rtl' }}>
            {scene.nodes[scene.nodes.length - 1]}
          </Micro>
        </Reveal>
        <Reveal at={10} dy={10} style={{ position: 'absolute', right: 0, top: 0, width: SOURCE_W }}>
          <Micro color={t.fg3} size={24} style={{ textAlign: 'center', direction: 'rtl' }}>
            {scene.nodes[0]}
          </Micro>
        </Reveal>

        {/* Result: three lines, and it grows as the transfer lands. */}
        <Reveal
          at={10}
          dy={0}
          from={0.96}
          style={{ position: 'absolute', left: 0, top: 158, width: CARD_W }}
        >
          <div
            style={{
              borderRadius: 22,
              padding: '34px 30px',
              background: t.dark ? 'rgba(255,255,255,0.07)' : '#fff',
              border: `1px solid ${arrive > 0.1 ? t.accent : t.edge}`,
              boxShadow: t.dark
                ? `0 0 ${34 * arrive}px rgba(236,42,140,${0.28 * arrive})`
                : `0 18px 40px -28px rgba(21,21,31,${0.3 + 0.2 * arrive})`,
              transform: `scale(${1 + 0.022 * arrive})`,
              direction: 'rtl',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 0.78, 0.52].map((w, i) => (
                <span
                  key={i}
                  style={{
                    height: 12,
                    borderRadius: 12,
                    width: `${w * 100}%`,
                    background: t.accent,
                    opacity: 0.35 + 0.65 * interpolate(arrive, [0, 1], [0.2, 1]),
                    transform: `scaleX(${interpolate(travel, [0.5 + i * 0.14, 0.78 + i * 0.14], [0.35, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })})`,
                    transformOrigin: 'right center',
                  }}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* The rail, and the packet running down it. */}
        <div style={{ position: 'absolute', left: railStart, top: 224, width: railW, height: 4 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              background: t.edge,
              transform: `scaleX(${reveal(frame, { delay: 24, duration: 30 })})`,
              transformOrigin: 'right center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -7,
              left: interpolate(travel, [0, 1], [railW - 18, -18]),
              width: 36,
              height: 18,
              borderRadius: 18,
              background: t.accent,
              opacity: travel > 0.001 && travel < 0.999 ? 1 : 0,
              boxShadow: `0 0 26px ${t.accent}`,
            }}
          />
          {/* Arrowhead, pointing the way the reading goes. */}
          <svg
            width={26}
            height={26}
            viewBox="0 0 26 26"
            style={{
              position: 'absolute',
              left: -13,
              top: -11,
              opacity: reveal(frame, { delay: 40, duration: 24 }),
            }}
          >
            <path
              d="M16 5L8 13l8 8"
              fill="none"
              stroke={t.fg3}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Source: the bulk. */}
        <Reveal
          at={4}
          dy={0}
          from={0.97}
          style={{ position: 'absolute', right: 0, top: 52, width: SOURCE_W }}
        >
          <div
            style={{
              borderRadius: 22,
              padding: '30px 32px',
              background: t.panel,
              border: `1px solid ${t.edge}`,
              height: 344,
              overflow: 'hidden',
            }}
          >
            <SourceLines t={t} sweep={sweep} />
          </div>
        </Reveal>
      </div>

      {scene.foot ? (
        <Reveal at={90} dy={14}>
          <div style={{ fontSize: typeScale.body, color: t.fg3 }}>{scene.foot}</div>
        </Reveal>
      ) : null}
    </SceneBody>
  );
};

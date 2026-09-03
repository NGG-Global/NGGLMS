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
 *
 * Nugget 4 uses the same kind for grounding, where the nodes are "relevant and defined
 * information" and "an anchored answer". Compression is the wrong picture for that —
 * it would say grounding is summarising, which is the opposite of the point — so
 * `flowStyle: 'anchor'` draws the answer adrift and then tethers it to the source. The
 * foot on that shot is "instead of letting the model act in empty space", and the
 * untethered state is that space.
 */

import { interpolate, random, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Micro, Reveal } from '../lib/kit';
import { EASE_IN_OUT, EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
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

export const FlowSceneView = ({ scene, cueAt, t, art }: SceneProps<FlowScene>) => {
  const frame = useCurrentFrame();

  if (art.flowStyle === 'spread') {
    const sourceW = 420;
    const destW = 470;
    const destH = 104;
    const boardH = 460;
    const cy = boardH / 2;
    const rows = scene.nodes.map((_, i) =>
      scene.nodes.length === 1
        ? cy
        : cy + (i - (scene.nodes.length - 1) / 2) * ((boardH - destH - 16) / (scene.nodes.length - 1)),
    );
    const sourceIn = reveal(frame, { delay: 8, duration: 30 });

    return (
      <SceneBody justify="center" gap={48}>
        <Reveal at={cueFrame(cueAt, art.headAt)} dy={18}>
          <SceneHead t={t}>{scene.head}</SceneHead>
        </Reveal>

        <div style={{ position: 'relative', width: BOARD, height: boardH, direction: 'ltr' }}>
          {/* Connectors, drawn under everything. */}
          <svg
            viewBox={`0 0 ${BOARD} ${boardH}`}
            style={{ position: 'absolute', inset: 0, width: BOARD, height: boardH }}
          >
            {scene.nodes.map((node, i) => {
              const from = BOARD - sourceW;
              const to = destW;
              const mid = (from + to) / 2;
              const p = reveal(frame, { delay: cueFrame(cueAt, art.itemCues[i]), duration: 32 });
              return (
                <path
                  key={node}
                  d={`M ${from} ${cy} C ${mid} ${cy}, ${mid} ${rows[i]}, ${to} ${rows[i]}`}
                  fill="none"
                  stroke={t.accent}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  opacity={0.6 * p}
                />
              );
            })}
          </svg>

          {/* The output. Unlabelled on purpose: the head has just named it, and the
              scene is about where it goes, not what it is. */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: cy,
              width: sourceW,
              borderRadius: 22,
              padding: '30px 30px',
              background: t.dark ? 'rgba(255,255,255,0.07)' : '#fff',
              border: `2px solid ${t.accent}`,
              boxShadow: `0 0 ${26 * sourceIn}px rgba(236,42,140,0.22)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              direction: 'rtl',
              opacity: sourceIn,
              transform: `translateY(calc(-50% + ${drift(frame, 4, 680)}px)) scale(${
                0.96 + 0.04 * sourceIn
              })`,
            }}
          >
            {[1, 0.76, 0.9].map((w, i) => (
              <span
                key={i}
                style={{
                  height: 12,
                  borderRadius: 12,
                  width: `${w * 100}%`,
                  background: t.accent,
                  opacity: 0.85,
                  transform: `scaleX(${reveal(frame, { delay: 14 + i * 8, duration: 24 })})`,
                  transformOrigin: 'right center',
                }}
              />
            ))}
          </div>

          {/* Where it ends up. */}
          {scene.nodes.map((node, i) => {
            const p = reveal(frame, { delay: cueFrame(cueAt, art.itemCues[i]) + 8, duration: 28 });
            return (
              <div
                key={node}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: rows[i],
                  width: destW,
                  minHeight: destH,
                  borderRadius: 18,
                  padding: '20px 26px',
                  display: 'grid',
                  placeItems: 'center',
                  background: t.panel,
                  border: `1px solid ${t.edge}`,
                  direction: 'rtl',
                  textAlign: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: t.fg,
                  opacity: p,
                  transform: `translateY(calc(-50% + ${
                    14 * (1 - p) + drift(frame, 2, 640, i)
                  }px)) scale(${0.95 + 0.05 * p})`,
                }}
              >
                {node}
              </div>
            );
          })}
        </div>

        {scene.foot ? (
          <Reveal at={cueFrame(cueAt, art.payoffAt)} duration={28} dy={14}>
            <div style={{ fontSize: typeScale.body, color: t.fg3 }}>{scene.foot}</div>
          </Reveal>
        ) : null}
      </SceneBody>
    );
  }

  if (art.flowStyle === 'anchor') {
    const tetherFrom = cueFrame(cueAt, art.itemCues[0], 90);
    // The answer starts adrift and is pulled into line as the tether takes hold.
    const tether = reveal(frame, { delay: tetherFrom, duration: 54, easing: EASE_OUT });
    const adrift = 1 - tether;
    // Once anchored, a slow pulse runs the tether so the hold reads as live.
    const pulse = (Math.sin(frame / 24) + 1) / 2;

    const sourceW = 660;
    const answerW = 560;
    // The tether spans card edge to card edge. A gap at either end is a disconnect,
    // in a scene whose whole subject is the connection.
    const railStartX = answerW;
    const railW = BOARD - sourceW - answerW;
    // One height for both, so the tether meets each at its centre.
    const cardH = 196;
    const cardTop = 78;
    const railTop = cardTop + cardH / 2 - 2;

    return (
      <SceneBody justify="center" gap={54}>
        <Reveal at={0} dy={18}>
          <SceneHead t={t}>{scene.head}</SceneHead>
        </Reveal>

        <div style={{ position: 'relative', width: BOARD, height: 380, direction: 'ltr' }}>
          <Reveal at={14} dy={10} style={{ position: 'absolute', left: 0, top: 0, width: answerW }}>
            <Micro color={t.accent} size={24} style={{ textAlign: 'center', direction: 'rtl' }}>
              {scene.nodes[scene.nodes.length - 1]}
            </Micro>
          </Reveal>
          <Reveal at={6} dy={10} style={{ position: 'absolute', right: 0, top: 0, width: sourceW }}>
            <Micro color={t.fg3} size={24} style={{ textAlign: 'center', direction: 'rtl' }}>
              {scene.nodes[0]}
            </Micro>
          </Reveal>

          {/* The defined source: few lines, all solid. Nothing here is bulk. */}
          <Reveal
            at={4}
            dy={0}
            from={0.97}
            style={{ position: 'absolute', right: 0, top: cardTop, width: sourceW }}
          >
            <div
              style={{
                borderRadius: 22,
                padding: '0 36px',
                height: cardH,
                background: t.panel,
                border: `1px solid ${t.edge}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 20,
                direction: 'rtl',
              }}
            >
              {[1, 0.86, 0.94, 0.7].map((w, i) => (
                <span
                  key={i}
                  style={{
                    height: 14,
                    borderRadius: 14,
                    width: `${w * 100}%`,
                    background: t.fg4,
                    opacity: 0.7,
                    transform: `scaleX(${reveal(frame, { delay: 16 + i * 8, duration: 26 })})`,
                    transformOrigin: 'right center',
                  }}
                />
              ))}
            </div>
          </Reveal>

          {/* The tether. */}
          <div style={{ position: 'absolute', left: railStartX, top: railTop, width: railW, height: 4 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 4,
                background: t.accent,
                opacity: 0.35 + 0.4 * tether * pulse,
                transform: `scaleX(${tether})`,
                transformOrigin: 'right center',
              }}
            />
            {/* The point of attachment, on the source side. */}
            <div
              style={{
                position: 'absolute',
                right: -9,
                top: -7,
                width: 18,
                height: 18,
                borderRadius: 18,
                background: t.accent,
                opacity: tether,
              }}
            />
          </div>

          {/* The answer: adrift, then held. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: cardTop,
              width: answerW,
              height: cardH,
              borderRadius: 22,
              padding: '0 32px',
              justifyContent: 'center',
              background: t.dark ? 'rgba(255,255,255,0.07)' : '#fff',
              border: `2px ${tether > 0.6 ? 'solid' : 'dashed'} ${
                tether > 0.4 ? t.accent : t.fg4
              }`,
              boxShadow: t.dark
                ? `0 0 ${30 * tether * pulse}px rgba(236,42,140,0.3)`
                : `0 18px 40px -28px rgba(21,21,31,0.3)`,
              // Adrift: it wanders, and off the tether's line. Anchored: it sits still.
              transform: `translate(${adrift * -26}px, ${
                adrift * (34 + drift(frame, 16, 150)) + drift(frame, 3, 700)
              }px)`,
              direction: 'rtl',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {[1, 0.78, 0.9].map((w, i) => (
              <span
                key={i}
                style={{
                  height: 13,
                  borderRadius: 13,
                  width: `${w * 100}%`,
                  background: t.accent,
                  opacity: 0.4 + 0.6 * tether,
                  transform: `scaleX(${reveal(frame, { delay: 22 + i * 8, duration: 26 })})`,
                  transformOrigin: 'right center',
                }}
              />
            ))}
          </div>
        </div>

        {scene.foot ? (
          <Reveal at={cueFrame(cueAt, art.payoffAt)} duration={28} dy={14}>
            <div style={{ fontSize: typeScale.body, color: t.fg3 }}>{scene.foot}</div>
          </Reveal>
        ) : null}
      </SceneBody>
    );
  }

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

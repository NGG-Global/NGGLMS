/**
 * `principle` — the nugget's one takeaway, staged as a replacement.
 *
 * The data gives a label, a question to stop asking (`off`) and the one to ask instead
 * (`on`). The scene is built so the swap happens on screen: the old question arrives
 * first and in full, gets struck on the line that rejects it, and stays visible but
 * demoted underneath the new one — a viewer who joins here still sees both halves of
 * the correction.
 *
 * Nuggets 1 and 2 deliver `on` across two narration lines ("which part of the work am
 * I asking it to do," / "and on the basis of what information"), so `tailAt` in art.ts
 * names the line that completes it and the question arrives in two beats — the
 * sentence being finished rather than a block of text appearing. Nugget 3 speaks its
 * whole kept question in one breath ("ניסוח, הערכה, תיקון והשוואה"), so it has no
 * `tailAt` and is rendered whole: splitting a list at a comma nobody paused on would
 * read as the sentence breaking, not finishing.
 */

import { interpolate, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Micro, Reveal } from '../lib/kit';
import { EASE_IN_OUT, EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, cueFrame, type SceneProps } from '../lib/scene';
import { type as typeScale } from '../theme';

type PrincipleScene = Extract<Scene, { kind: 'principle' }>;

/**
 * Splits the kept question at its first comma, so it can arrive in two beats.
 *
 * The first comma, not the last: both scripts that split deliver the opening clause
 * on one line and everything after it on the next, and in nugget 2 that remainder is
 * itself a list ("הבנה, בדיקה ושיקול דעת") that must not be broken up further.
 */
const splitClauses = (on: string): [string, string] => {
  const at = on.indexOf(', ');
  return at < 0 ? [on, ''] : [on.slice(0, at + 1), on.slice(at + 2)];
};

export const PrincipleSceneView = ({ scene, cueAt, t, art }: SceneProps<PrincipleScene>) => {
  const frame = useCurrentFrame();
  const split = art.tailAt != null;
  const [lead, tail] = split ? splitClauses(scene.on) : [scene.on, ''];

  const offFrom = cueFrame(cueAt, art.itemCues[0], 101);
  const onFrom = cueFrame(cueAt, art.itemCues[1], 199);
  const tailFrom = cueFrame(cueAt, art.tailAt, 317);
  const closeFrom = cueFrame(cueAt, art.payoffAt, 555);

  // The strike starts as the new question arrives: one movement, two halves.
  const strike = reveal(frame, { delay: onFrom - 22, duration: 30, easing: EASE_OUT });
  const demote = interpolate(strike, [0, 1], [1, 0.4]);
  // A slow breath on the glow through the closing lines, so the last five seconds are
  // not a still frame under live narration.
  const breath = 0.5 + 0.5 * Math.sin(frame / 52);
  const close = reveal(frame, { delay: closeFrom, duration: 60, easing: EASE_IN_OUT });
  const glow = 26 + 16 * breath + 26 * close;

  return (
    <SceneBody align="center" justify="center" gap={52}>
      <Reveal at={cueFrame(cueAt, art.headAt)} dy={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, direction: 'rtl' }}>
          <span
            style={{
              width: 54,
              height: 4,
              borderRadius: 4,
              background: t.accent,
              transform: `scaleX(${reveal(frame, { delay: 6, duration: 26 })})`,
              transformOrigin: 'right center',
            }}
          />
          <Micro color={t.accent} size={26}>
            {scene.label}
          </Micro>
        </div>
      </Reveal>

      {/* The question to stop asking. */}
      <Reveal at={offFrom} duration={28} dy={20} blur={5}>
        <div style={{ position: 'relative', opacity: demote }}>
          <div
            style={{
              fontSize: typeScale.sub,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: t.fg2,
              textAlign: 'center',
            }}
          >
            {scene.off}
          </div>
          <span
            style={{
              position: 'absolute',
              insetInlineStart: -8,
              insetInlineEnd: -8,
              top: '46%',
              height: 3,
              borderRadius: 3,
              background: t.fg3,
              transform: `scaleX(${strike})`,
              transformOrigin: 'right center',
            }}
          />
        </div>
      </Reveal>

      {/* The question to ask instead. */}
      <Reveal at={onFrom} duration={32} dy={34} from={0.96} blur={8}>
        <div
          style={{
            position: 'relative',
            maxWidth: 1420,
            padding: '48px 62px',
            borderRadius: 28,
            background: t.dark ? 'rgba(255,255,255,0.05)' : '#fff',
            border: `2px solid ${t.accent}`,
            boxShadow: t.dark
              ? `0 0 ${glow}px rgba(236,42,140,0.34)`
              : `0 30px 70px -46px rgba(236,42,140,0.7)`,
            transform: `translateY(${drift(frame, 5, 620)}px)`,
            direction: 'rtl',
          }}
        >
          <div
            style={{
              fontSize: typeScale.head,
              fontWeight: 900,
              letterSpacing: '-0.028em',
              lineHeight: 1.2,
              color: t.fg,
              textAlign: 'center',
            }}
          >
            {lead}
            {tail ? (
              <span
                style={{
                  // Its own line, so the clause never breaks mid-phrase against the
                  // lead — and the line is reserved from the start, held at a trace,
                  // so the box reads as a sentence waiting to be finished rather than
                  // an empty panel, and nothing reflows when it lands.
                  display: 'block',
                  color: t.accent,
                  opacity: interpolate(reveal(frame, { delay: tailFrom, duration: 28 }), [0, 1], [0.14, 1]),
                }}
              >
                {tail}
              </span>
            ) : null}
          </div>
        </div>
      </Reveal>
    </SceneBody>
  );
};

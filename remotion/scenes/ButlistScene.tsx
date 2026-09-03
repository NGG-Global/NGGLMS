/**
 * `butlist` — three sentences of the form "it can do X, but it does not Y".
 *
 * The whole shape of the copy is a contrast repeated three times, and the narration
 * says each half on its own line. So each half gets its own card and its own cue: the
 * capability lands solid on the line that grants it, and the limitation lands hollow
 * and dashed on the line that takes it back. Watching that happen three times is the
 * argument; a static two-column table would only report it.
 *
 * The hollow card and its ⌀ mark are the same treatment `negspace` uses in nugget 1,
 * deliberately — a learner who met that language as "what it does not hold" should
 * read it the same way here.
 */

import { interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import { Check, Void } from './glyphs';

type ButlistScene = Extract<Scene, { kind: 'butlist' }>;

const BOARD = 1656;
const BREAK = 108;
const CARD_W = (BOARD - BREAK) / 2;

/** The turn in the sentence: a hairline that does not quite join. */
const Break = ({ color, on }: { color: string; on: number }) => (
  <svg width={BREAK} height={40} viewBox={`0 0 ${BREAK} 40`} style={{ opacity: on }}>
    <line x1={0} y1={20} x2={BREAK * 0.36} y2={20} stroke={color} strokeWidth={2} />
    <line x1={BREAK * 0.64} y1={20} x2={BREAK} y2={20} stroke={color} strokeWidth={2} />
    <line
      x1={BREAK * 0.44}
      y1={30}
      x2={BREAK * 0.56}
      y2={10}
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  </svg>
);

export const ButlistSceneView = ({ scene, cueAt, t, art }: SceneProps<ButlistScene>) => {
  const frame = useCurrentFrame();

  return (
    <SceneBody justify="center" gap={44}>
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {scene.items.map(([can, cannot], i) => {
          const canP = reveal(frame, { delay: cueFrame(cueAt, art.itemCues[i]), duration: 30 });
          const notP = reveal(frame, { delay: cueFrame(cueAt, art.detailCues[i]), duration: 30 });
          return (
            <div
              key={can}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                width: BOARD,
                direction: 'ltr',
                transform: `translateY(${drift(frame, 2, 640, i)}px)`,
              }}
            >
              {/* Left in the DOM, but this is the RTL end of the row: the limitation. */}
              <div
                style={{
                  width: CARD_W,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '22px 26px',
                  borderRadius: 18,
                  border: `2px dashed ${t.fg4}`,
                  direction: 'rtl',
                  opacity: notP,
                  transform: `translateX(${-18 * (1 - notP)}px)`,
                }}
              >
                <span style={{ color: t.fg4, flex: 'none' }}>
                  <Void color="currentColor" size={28} />
                </span>
                <span
                  style={{
                    fontSize: 31,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: '-0.015em',
                    color: t.fg3,
                  }}
                >
                  {cannot}
                </span>
              </div>

              <div style={{ width: BREAK, display: 'grid', placeItems: 'center' }}>
                <Break color={t.fg4} on={notP} />
              </div>

              {/* The RTL start of the row: what it can do. */}
              <div
                style={{
                  width: CARD_W,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '22px 26px',
                  borderRadius: 18,
                  background: t.panel,
                  border: `1px solid ${t.edge}`,
                  direction: 'rtl',
                  opacity: canP,
                  transform: `translateX(${18 * (1 - canP)}px)`,
                }}
              >
                <span style={{ color: t.accent, flex: 'none' }}>
                  <Check color="currentColor" size={28} />
                </span>
                <span
                  style={{
                    fontSize: 31,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '-0.015em',
                    // Dims a touch once its own limitation is on screen, so the eye
                    // finishes each row on the half that qualifies it.
                    color: interpolateColors(notP, [0, 1], [t.fg, t.fg2]),
                  }}
                >
                  {can}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SceneBody>
  );
};

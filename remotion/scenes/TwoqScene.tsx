/**
 * `twoq` — a pair of questions, each with the example that explains it.
 *
 * The shot runs thirty-one seconds and the narrator spends the first six of them
 * saying that two questions exist before asking either. So both cards are placed
 * empty at the top of the shot — the scaffold the narration is promising — and then
 * each fills in two beats: the question on the line that asks it, the example on the
 * line that works it through.
 *
 * The numerals are not invented copy: the narration itself says "הראשונה" and "השאלה
 * השנייה", and the head calls them two questions.
 */

import { useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import { palette } from '../theme';

type TwoqScene = Extract<Scene, { kind: 'twoq' }>;

const BOARD = 1656;
const GAP = 44;

export const TwoqSceneView = ({ scene, cueAt, t, art }: SceneProps<TwoqScene>) => {
  const frame = useCurrentFrame();
  const count = Math.max(1, scene.items.length);
  const cardW = (BOARD - GAP * (count - 1)) / count;

  return (
    <SceneBody justify="center" gap={44}>
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'flex', gap: GAP, width: BOARD }}>
        {scene.items.map(([question, detail], i) => {
          // The empty card first, then the question, then the example.
          const shell = reveal(frame, { delay: 10 + i * 12, duration: 30 });
          const asked = reveal(frame, { delay: cueFrame(cueAt, art.itemCues[i]), duration: 28 });
          const shown = reveal(frame, { delay: cueFrame(cueAt, art.detailCues[i]), duration: 30 });
          return (
            <div
              key={question}
              style={{
                width: cardW,
                minHeight: 350,
                padding: '38px 36px',
                borderRadius: 26,
                background: t.dark ? t.panel : '#fff',
                // Dashed while empty, solid once the question is actually asked:
                // the card visibly becomes a question rather than arriving as one.
                border: `2px ${asked > 0.5 ? 'solid' : 'dashed'} ${
                  asked > 0.5
                    ? t.dark
                      ? t.accent
                      : palette.accentTintEdge
                    : t.dark
                      ? t.edge
                      : '#e4e3e8'
                }`,
                boxShadow:
                  asked > 0.5 && !t.dark ? '0 24px 60px -44px rgba(21,10,20,0.55)' : 'none',
                opacity: shell,
                transform: `translateY(${(1 - shell) * 20 + drift(frame, 3, 660, i)}px)`,
                display: 'flex',
                flexDirection: 'column',
                gap: 26,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 62,
                  flex: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  background: asked > 0.5 ? t.accent : 'transparent',
                  border: `2px solid ${asked > 0.5 ? t.accent : t.fg4}`,
                  color: asked > 0.5 ? '#fff' : t.fg4,
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </div>

              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  lineHeight: 1.26,
                  letterSpacing: '-0.022em',
                  color: t.fg,
                  opacity: asked,
                  transform: `translateY(${(1 - asked) * 14}px)`,
                }}
              >
                {question}
              </div>

              <div
                style={{
                  fontSize: 29,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  letterSpacing: '-0.01em',
                  color: t.dark ? t.fg3 : palette.ink3,
                  opacity: shown,
                  transform: `translateY(${(1 - shown) * 12}px)`,
                }}
              >
                {detail}
              </div>
            </div>
          );
        })}
      </div>
    </SceneBody>
  );
};

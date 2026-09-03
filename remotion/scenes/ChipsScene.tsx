/**
 * `chips` — a set of capabilities.
 *
 * The shot runs 21 seconds but the first eleven are narration about *what the tool is*
 * ("a system that produces answers from language models and from the information it is
 * allowed to reach") before a single capability is named. Revealing six pills at the
 * top of the shot would leave the picture stalled through that whole passage and then
 * have nothing left to give when the list actually arrives.
 *
 * So the shot opens on the mechanism. A grid of candidate tokens fills in, and then a
 * single path is drawn through it, one token per column: the model picking what comes
 * next, which is the honest picture of "produces answers on the basis of language
 * models". When the narration turns to what it is good at, the grid recedes behind the
 * headline and the capabilities land on the two lines that name them — two, then four.
 */

import { interpolate, random, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cue, type SceneProps } from '../lib/scene';
import type { Tone } from '../theme';
import { type as typeScale } from '../theme';
import { Glyph } from './glyphs';

type ChipsScene = Extract<Scene, { kind: 'chips' }>;

const COLS = 5;
const ROWS = 4;
const CELL_W = 208;
const CELL_H = 44;
const COL_GAP = 64;
const ROW_GAP = 24;
const GRID_W = COLS * CELL_W + (COLS - 1) * COL_GAP;
const GRID_H = ROWS * CELL_H + (ROWS - 1) * ROW_GAP;

/** Column x centre, counted from the right: the sequence runs the way the text reads. */
const colX = (col: number) => GRID_W - col * (CELL_W + COL_GAP) - CELL_W / 2;
const rowY = (row: number) => row * (CELL_H + ROW_GAP) + CELL_H / 2;

/**
 * Which candidate wins in each column.
 *
 * Seeded from Remotion's `random` rather than Math.random: a re-render has to produce
 * the same frames, or a re-encode would not match the cut that was reviewed. Each
 * column is drawn from the rows the previous column did not use, because an unforced
 * draw can hand back the same row three times running — and a path that comes out flat
 * shows a straight line rather than a route being chosen through the candidates.
 */
const PATH = ((): number[] => {
  const path: number[] = [];
  for (let col = 0; col < COLS; col++) {
    const options = Array.from({ length: ROWS }, (_, row) => row).filter(
      (row) => row !== path[col - 1],
    );
    path.push(options[Math.floor(random(`u1n1-path-${col}`) * options.length)]);
  }
  return path;
})();

const TokenPath = ({ t, recede }: { t: Tone; recede: number }) => {
  const frame = useCurrentFrame();
  // The path is drawn once the grid is mostly filled, one column at a time.
  const draw = reveal(frame, { delay: 132, duration: 176 });
  const reached = draw * (COLS - 1);

  return (
    <div
      style={{
        position: 'relative',
        width: GRID_W,
        height: GRID_H,
        opacity: interpolate(recede, [0, 1], [1, 0.2]),
        transform: `scale(${interpolate(recede, [0, 1], [1, 0.95])}) translateY(${
          interpolate(recede, [0, 1], [148, 0]) + drift(frame, 5, 700)
        }px)`,
      }}
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const picked = PATH[col] === row;
        const enter = reveal(frame, {
          delay: 6 + col * 18 + row * 7 + random(`u1n1-cell-${i}`) * 10,
          duration: 26,
        });
        // A candidate only turns accent once the path has actually reached its column.
        const on = picked ? interpolate(reached, [col - 0.5, col], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) : 0;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: colX(col) - CELL_W / 2,
              top: rowY(row) - CELL_H / 2,
              width: CELL_W,
              height: CELL_H,
              borderRadius: CELL_H,
              background: on > 0.1 ? t.accentWash : t.panel,
              border: `1px solid ${on > 0.1 ? t.accent : t.edge}`,
              opacity: enter * (picked ? 1 : interpolate(on, [0, 1], [0.5, 0.5])),
              transform: `scaleX(${enter}) scale(${1 + 0.05 * on})`,
              transformOrigin: 'center',
            }}
          />
        );
      })}

      <svg
        viewBox={`0 0 ${GRID_W} ${GRID_H}`}
        style={{ position: 'absolute', inset: 0, width: GRID_W, height: GRID_H, overflow: 'visible' }}
      >
        {PATH.slice(0, -1).map((row, col) => {
          const x1 = colX(col) - CELL_W / 2;
          const y1 = rowY(row);
          const x2 = colX(col + 1) + CELL_W / 2;
          const y2 = rowY(PATH[col + 1]);
          // A flat S between the two pills, so the run reads as one continuous path.
          const mid = (x1 + x2) / 2;
          const p = interpolate(reached, [col, col + 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <path
              key={col}
              d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={t.accent}
              strokeWidth={2.6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
};

/** Rows of three, so six capabilities never break as five and an orphan. */
const chunk = <T,>(items: T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
};

export const ChipsSceneView = ({ scene, cueAt, t }: SceneProps<ChipsScene>) => {
  const frame = useCurrentFrame();

  const headFrom = Math.max(0, cue(cueAt, 2, 340) - 44);
  const firstWave = cue(cueAt, 2, 340);
  const secondWave = cue(cueAt, 3, 513);

  // How far the mechanism has stepped back to let the list through.
  const recede = reveal(frame, { delay: headFrom, duration: 50, easing: EASE_OUT });
  // The narration names two capabilities on one line and four on the next.
  const waveFor = (index: number) =>
    index < 2 ? firstWave + index * 16 : secondWave + (index - 2) * 15;

  let index = -1;

  return (
    <SceneBody justify="center" gap={44}>
      <div style={{ display: 'grid', placeItems: 'center', height: GRID_H }}>
        <TokenPath t={t} recede={recede} />
      </div>

      <Reveal at={headFrom} dy={20} blur={5}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {chunk(scene.items, scene.items.length > 4 ? 3 : scene.items.length).map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 18 }}>
            {row.map((item) => {
              index += 1;
              const p = reveal(frame, { delay: waveFor(index), duration: 26 });
              return (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 15,
                    padding: '16px 28px 16px 32px',
                    borderRadius: 999,
                    background: t.panel,
                    border: `1px solid ${p > 0.6 ? t.accentWash : t.edge}`,
                    boxShadow: t.dark ? 'none' : '0 1px 2px rgba(21,21,31,0.04)',
                    fontSize: typeScale.item,
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    color: t.fg,
                    whiteSpace: 'nowrap',
                    opacity: p,
                    transform: `translateY(${18 * (1 - p)}px) scale(${0.94 + 0.06 * p})`,
                  }}
                >
                  <span style={{ color: t.accent, display: 'grid', placeItems: 'center' }}>
                    <Glyph label={item} size={32} />
                  </span>
                  {item}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </SceneBody>
  );
};

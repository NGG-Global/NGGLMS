/**
 * `chips` — a set of capabilities.
 *
 * Each pill lands on the narration line that names it, which art.ts supplies: nugget 1
 * names two capabilities on one line and four on the next, nugget 2 names eight, two to
 * a line and then one to a line. Revealing the whole list at the top of a thirty-second
 * shot would leave nothing for the twenty seconds the narrator spends going through it.
 *
 * Nugget 3 uses the same kind for something else again: five quoted follow-up prompts
 * ("קצר את הפתיחה"), which are things you would type rather than things the tool is
 * good at. `chipStyle: 'prompt'` in art.ts draws them as messages, with a send mark
 * instead of a capability glyph.
 *
 * Nugget 1's shot also opens on eleven seconds of narration about *what the tool is*
 * ("a system that produces answers from language models and from the information it is
 * allowed to reach") before a single capability is named, so its art asks for the
 * `token-path` motif: a grid of candidate tokens fills in and a single path is drawn
 * through it, one token per column — the model picking what comes next. It recedes
 * behind the headline when the narration turns to strengths. Nugget 2's shot opens
 * straight into the list and gets no motif, because the same lattice over a list of
 * strengths would mean nothing.
 */

import { interpolate, random, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import type { Tone } from '../theme';
import { type as typeScale } from '../theme';
import { Glyph, Send, hasGlyph } from './glyphs';

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

/**
 * Two balanced rows, never a row of five and an orphan. Six goes 3+3, eight goes 4+4;
 * four or fewer stay on one line, and the cap keeps a long row inside the gutters.
 */
const rows = <T,>(items: T[]): T[][] => {
  if (items.length <= 4) return [items];
  const size = Math.min(4, Math.ceil(items.length / 2));
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export const ChipsSceneView = ({ scene, cueAt, t, art }: SceneProps<ChipsScene>) => {
  const frame = useCurrentFrame();

  const motif = art.motif === 'token-path';
  const prompts = art.chipStyle === 'prompt';
  // A glyph earns its place only if it tells the rows apart. When no label in the set
  // matches a rule they would all carry the same neutral diamond, which is worse than
  // no mark: it looks like information and is not.
  const glyphs = !prompts && scene.items.some(hasGlyph);
  // The head lands a beat before the first pill, so the list has something to hang off.
  const headFrom = Math.max(0, cueFrame(cueAt, art.headAt) - (motif ? 44 : 0));
  // How far the mechanism has stepped back to let the list through.
  const recede = motif ? reveal(frame, { delay: headFrom, duration: 50, easing: EASE_OUT }) : 1;

  // Items sharing a line are spaced inside it rather than landing together.
  let sameCue = 0;
  const itemAt = art.itemCues.map((cueIndex, i) => {
    sameCue = i > 0 && art.itemCues[i - 1] === cueIndex ? sameCue + 1 : 0;
    return cueFrame(cueAt, cueIndex) + sameCue * 16;
  });

  // With no motif, the head opens near the centre of the stage and lifts as the first
  // pill arrives, so the shot is not top-weighted through the run-up to the list.
  const listFrom = itemAt[0] ?? 0;
  const lift = motif ? 1 : reveal(frame, { delay: Math.max(0, listFrom - 30), duration: 44 });

  // Once the list is complete the narration keeps going ("in such tasks it can save
  // time and expand our options"), so a slow accent wave runs across the finished set.
  const wave = reveal(frame, { delay: cueFrame(cueAt, art.payoffAt), duration: 96 });

  let index = -1;

  return (
    <SceneBody justify="center" gap={motif ? 44 : 52}>
      {motif ? (
        <div style={{ display: 'grid', placeItems: 'center', height: GRID_H }}>
          <TokenPath t={t} recede={recede} />
        </div>
      ) : null}

      <div style={{ transform: `translateY(${(1 - lift) * 148}px)` }}>
        <Reveal at={headFrom} dy={20} blur={5}>
          <SceneHead t={t}>{scene.head}</SceneHead>
        </Reveal>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {rows(scene.items).map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 18 }}>
            {row.map((item) => {
              index += 1;
              const p = reveal(frame, { delay: itemAt[index] ?? 0, duration: 26 });
              // Bell around the wave front, so the highlight travels rather than flashes.
              const lit = Math.max(
                0,
                1 - Math.abs(wave * (scene.items.length + 2) - index - 1) / 1.4,
              );
              return (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 15,
                    padding: prompts ? '16px 26px 16px 22px' : '16px 28px 16px 32px',
                    borderRadius: 999,
                    background: prompts ? (t.dark ? t.panel : '#fff') : t.panel,
                    border: `1px solid ${lit > 0.05 ? t.accent : p > 0.6 ? t.accentWash : t.edge}`,
                    boxShadow: t.dark ? 'none' : '0 1px 2px rgba(21,21,31,0.04)',
                    fontSize: prompts ? 34 : typeScale.item,
                    fontWeight: prompts ? 600 : 700,
                    letterSpacing: '-0.015em',
                    color: t.fg,
                    whiteSpace: 'nowrap',
                    opacity: p,
                    transform: `translateY(${18 * (1 - p)}px) scale(${0.94 + 0.06 * p + 0.02 * lit})`,
                  }}
                >
                  {glyphs ? (
                    <span style={{ color: t.accent, display: 'grid', placeItems: 'center' }}>
                      <Glyph label={item} size={32} />
                    </span>
                  ) : null}
                  {/* Quoted in the script, so quoted on screen. Straight marks, like
                      the content's own: directional ones invert in an RTL run and come
                      out closing-then-opening. */}
                  {prompts ? `"${item}"` : item}
                  {prompts ? (
                    <span style={{ color: t.accent, display: 'grid', placeItems: 'center' }}>
                      <Send color="currentColor" size={28} />
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </SceneBody>
  );
};

/**
 * `negspace` — the four things the tool does not hold.
 *
 * This is the longest shot in the nugget at 31 seconds, and it carries two movements,
 * not one. The first four narration lines name the four absences, so each arrives as
 * an empty slot: dashed edge, no fill, most of the row left deliberately blank. The
 * blank is the argument.
 *
 * The next four lines are the consequence — "if we did not give it something it
 * needs, it may try to complete what is missing" — and that is where the empty rows
 * start filling themselves in, hatched, with a caret running ahead of the fill. By
 * the last line ("a convincing answer built on a bad basis") the fill has gone amber:
 * every slot is now full, and none of it came from us.
 *
 * Nugget 4 uses the same kind for something the tool does not do at all: three
 * conditions under which a source fails ("if the document is old"). Nothing fills
 * those in, so `fill: false` in art.ts leaves the rows empty and gives each a warning
 * edge as it lands — they are ways the ground gives way, not gaps being invented.
 */

import { interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import { palette, type as typeScale } from '../theme';
import { Void } from './glyphs';

type NegspaceScene = Extract<Scene, { kind: 'negspace' }>;

/** Frames one row takes to fill, and the gap between rows starting. */
const FILL = 150;
const FILL_STAGGER = 44;

export const NegspaceSceneView = ({ scene, cueAt, t, art }: SceneProps<NegspaceScene>) => {
  const frame = useCurrentFrame();

  const filling = art.fill !== false;
  const rowAt = (i: number) => cueFrame(cueAt, art.itemCues[i], 117 + i * 84);
  const fillFrom = cueFrame(cueAt, art.detailCues[0], 440);
  const alarmFrom = cueFrame(cueAt, art.payoffAt, 749);

  // The hatch is the tool's own material, so it stays accent throughout: that is
  // still the tool writing, and recolouring a thousand pixels of fill turns the frame
  // into a warning table. The escalation on the last line ("a convincing answer on a
  // bad basis") is carried by the row's edge and its caret instead — enough to read
  // as a warning, not enough to repaint the scene.
  const alarm = reveal(frame, { delay: alarmFrom, duration: 70, easing: EASE_OUT });
  const hatch = t.accent;
  const edge = interpolateColors(alarm, [0, 1], [t.accent, palette.amber]);

  return (
    <SceneBody justify="center" gap={40}>
      <Reveal at={cueFrame(cueAt, art.headAt)} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {scene.items.map((item, i) => {
          const enter = reveal(frame, { delay: rowAt(i), duration: 28 });
          const fill = filling
            ? reveal(frame, { delay: fillFrom + i * FILL_STAGGER, duration: FILL })
            : 0;
          const running = fill > 0.004 && fill < 0.996;
          // With no fill, the row's own edge carries the warning, a beat after it
          // arrives, so three conditions read as three risks rather than three labels.
          const warn = filling
            ? 0
            : reveal(frame, { delay: Math.max(rowAt(i), alarmFrom) + 26 + i * 20, duration: 40 });
          const rowEdge = filling
            ? fill > 0.35
              ? edge
              : t.fg4
            : interpolateColors(warn, [0, 1], [t.fg4, palette.amber]);

          return (
            <div
              key={item}
              style={{
                position: 'relative',
                height: 90,
                borderRadius: 20,
                border: `2px ${fill > 0.6 ? 'solid' : 'dashed'} ${rowEdge}`,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '0 30px',
                overflow: 'hidden',
                opacity: enter,
                transform: `translateY(${(1 - enter) * 20}px)`,
              }}
            >
              <span style={{ color: filling ? (fill > 0.6 ? edge : t.fg4) : rowEdge, flex: 'none' }}>
                <Void color="currentColor" />
              </span>
              <span
                style={{
                  fontSize: typeScale.item,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: interpolateColors(filling ? fill : warn, [0, 1], [t.fg3, t.fg]),
                  transform: `translateY(${drift(frame, 2, 620, i)}px)`,
                  flex: 'none',
                }}
              >
                {item}
              </span>

              {/* The void. Only this part fills: hatching the label too would read as
                  the row being selected rather than the gap being invented. */}
              <span style={{ position: 'relative', flex: 1, alignSelf: 'stretch', overflow: 'hidden' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    insetInlineStart: `${(1 - fill) * 100}%`,
                    insetInlineEnd: 0,
                    background: `repeating-linear-gradient(135deg, ${hatch} 0 3px, rgba(0,0,0,0) 3px 14px)`,
                    opacity: 0.2,
                  }}
                />
                {/* The caret leads the fill, then leaves once the row is full. */}
                <span
                  style={{
                    position: 'absolute',
                    top: 18,
                    bottom: 18,
                    insetInlineStart: `${(1 - fill) * 100}%`,
                    width: 4,
                    borderRadius: 4,
                    background: edge,
                    opacity: running ? 0.5 + 0.5 * Math.sin(frame / 4) : 0,
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </SceneBody>
  );
};

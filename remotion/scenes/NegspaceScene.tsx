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
 */

import { interpolateColors, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cue, type SceneProps } from '../lib/scene';
import { palette, type as typeScale } from '../theme';

type NegspaceScene = Extract<Scene, { kind: 'negspace' }>;

/** An empty-set mark: what the row is missing, before anything fills it. */
const Void = ({ color, size = 30 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M6.4 17.6L17.6 6.4" strokeLinecap="round" />
  </svg>
);

/** Frames one row takes to fill, and the gap between rows starting. */
const FILL = 150;
const FILL_STAGGER = 44;

export const NegspaceSceneView = ({ scene, cueAt, t }: SceneProps<NegspaceScene>) => {
  const frame = useCurrentFrame();

  // Line 0 is the claim ("it does not know things the way a person does"); the four
  // absences are named one per line after it.
  const rowAt = (i: number) => cue(cueAt, i + 1, 117 + i * 84);
  const fillFrom = cue(cueAt, 5, 440);
  const alarmFrom = cue(cueAt, 7, 749);

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
      <Reveal at={0} dy={18}>
        <SceneHead t={t}>{scene.head}</SceneHead>
      </Reveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {scene.items.map((item, i) => {
          const enter = reveal(frame, { delay: rowAt(i), duration: 28 });
          const fill = reveal(frame, { delay: fillFrom + i * FILL_STAGGER, duration: FILL });
          const running = fill > 0.004 && fill < 0.996;

          return (
            <div
              key={item}
              style={{
                position: 'relative',
                height: 90,
                borderRadius: 20,
                border: `2px ${fill > 0.6 ? 'solid' : 'dashed'} ${fill > 0.35 ? edge : t.fg4}`,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '0 30px',
                overflow: 'hidden',
                opacity: enter,
                transform: `translateY(${(1 - enter) * 20}px)`,
              }}
            >
              <span style={{ color: fill > 0.6 ? edge : t.fg4, flex: 'none' }}>
                <Void color="currentColor" />
              </span>
              <span
                style={{
                  fontSize: typeScale.item,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: interpolateColors(fill, [0, 1], [t.fg3, t.fg]),
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

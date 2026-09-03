/**
 * `type` — a statement that is the whole picture.
 *
 * Nugget 1 uses this three times and each use is a different job, so the component
 * reads the shape of the copy rather than taking a variant flag:
 *
 *   'a'  logo + sub, no accent          -> the title card
 *   'b'  one clause with an accent      -> a claim, with the accent phrase brushed
 *   'f'  "not X. rather Y", Y accented  -> the correction: X is struck, Y is promoted
 *
 * The third case is the one worth spelling out. The scene data gives a single head,
 * "לא מומחה שיודע הכול. שותף עבודה מהיר מאוד", with the second sentence as the accent.
 * Rendering that as one brushed line would flatten it; the sentence is a correction,
 * and a correction wants the rejected half visibly struck and the kept half raised.
 * So when the accent is a trailing sentence, the two clauses are stacked and staged
 * against the two narration lines that say them.
 */

import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { AccentHead, Micro, Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, cue, type SceneProps } from '../lib/scene';
import { type as typeScale } from '../theme';

type TypeScene = Extract<Scene, { kind: 'type' }>;

/** The Copilot mark, with a bloom that grows out from behind it. */
const CopilotMark = ({ at, size, accent }: { at: number; size: number; accent: string }) => {
  const frame = useCurrentFrame();
  const p = reveal(frame, { delay: at, duration: 30 });
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity: p,
        transform: `scale(${0.82 + 0.18 * p}) translateY(${drift(frame, 5, 520)}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.55,
          borderRadius: '50%',
          background: `radial-gradient(50% 50% at 50% 50%, ${accent}, rgba(0,0,0,0) 70%)`,
          opacity: 0.3 * p,
        }}
      />
      <Img
        src={staticFile('assets/copilot.png')}
        style={{ position: 'relative', width: size, height: size, objectFit: 'contain' }}
      />
    </div>
  );
};

export const TypeSceneView = ({ scene, cueAt, t }: SceneProps<TypeScene>) => {
  const frame = useCurrentFrame();
  const accentAt = scene.accent ? scene.head.indexOf(scene.accent) : -1;
  // A trailing accent sentence, with the rejected clause before it.
  const breakAt = accentAt > 0 ? scene.head.lastIndexOf('. ', accentAt) : -1;

  if (breakAt > 0 && scene.accent) {
    const lead = scene.head.slice(0, breakAt + 1);
    const kept = scene.head.slice(breakAt + 2);
    const strikeFrom = cue(cueAt, 1, 130);
    const strike = reveal(frame, { delay: strikeFrom - 26, duration: 30, easing: EASE_OUT });
    // The rejected clause does not vanish — it stays legible and struck, because the
    // point of the line is the contrast between the two halves.
    const leadFade = interpolate(strike, [0, 1], [1, 0.42]);

    return (
      <SceneBody align="center" gap={44}>
        {scene.logo ? <CopilotMark at={0} size={104} accent={t.accent} /> : null}
        <Reveal at={6} dy={22} blur={6} style={{ position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              fontSize: typeScale.sub,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: t.fg2,
              opacity: leadFade,
              textAlign: 'center',
            }}
          >
            {lead}
            <span
              style={{
                position: 'absolute',
                insetInlineStart: 0,
                insetInlineEnd: 0,
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
        <Reveal at={strikeFrom} duration={30} dy={30} from={0.96} blur={8}>
          <div
            style={{
              fontSize: typeScale.head,
              fontWeight: 900,
              letterSpacing: '-0.028em',
              lineHeight: 1.16,
              color: t.fg,
              textAlign: 'center',
              maxWidth: 1360,
            }}
          >
            {kept}
          </div>
        </Reveal>
        {/* The rule under the kept clause arrives last and holds the eye there. */}
        <Reveal at={strikeFrom + 24} duration={34} dy={0}>
          <div
            style={{
              width: 260,
              height: 5,
              borderRadius: 5,
              background: `linear-gradient(90deg, rgba(0,0,0,0), ${t.accent}, rgba(0,0,0,0))`,
            }}
          />
        </Reveal>
      </SceneBody>
    );
  }

  // Title card: the mark, the nugget number, the name.
  if (scene.logo && scene.sub) {
    const rule = reveal(frame, { delay: 34, duration: 34 });
    return (
      <SceneBody align="center" gap={30}>
        <CopilotMark at={0} size={112} accent={t.accent} />
        <Reveal at={12} dy={14}>
          <Micro color={t.fg3} size={24}>
            {scene.sub}
          </Micro>
        </Reveal>
        <Reveal at={18} duration={28} dy={26} from={0.97} blur={7}>
          <div
            style={{
              fontSize: typeScale.hero,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: t.fg,
              textAlign: 'center',
            }}
          >
            {scene.head}
          </div>
        </Reveal>
        <div
          style={{
            width: 420 * rule,
            height: 5,
            borderRadius: 5,
            background: `linear-gradient(90deg, rgba(0,0,0,0), ${t.accent})`,
          }}
        />
      </SceneBody>
    );
  }

  // A claim. The three bars behind it are the tool's own fluency — they type
  // themselves out as the narration reaches "he writes fast, sounds confident", then
  // dim on the line that says to distrust the impression.
  const barsFrom = cue(cueAt, 2, 200);
  const barsOut = cue(cueAt, 4, 380);
  const bars = reveal(frame, { delay: barsFrom, duration: 40 });
  const barsFade = interpolate(frame, [barsOut, barsOut + 40], [1, 0.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });

  return (
    <SceneBody align="center" justify="center" gap={72}>
      <div style={{ textAlign: 'center' }}>
        <AccentHead
          head={scene.head}
          accent={scene.accent}
          color={t.fg}
          accentColor={t.accent}
          fontSize={typeScale.head}
          maxWidth={1420}
        />
      </div>
      {/* Clear of the headline, not behind it: bars crossing the text read as
          strike-throughs and fight the sentence they are supposed to illustrate. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          width: 620,
          opacity: 0.62 * barsFade * bars,
          transform: `translateY(${drift(frame, 6, 640)}px)`,
        }}
      >
        {[1, 0.84, 0.58].map((w, i) => {
          const p = reveal(frame, { delay: barsFrom + i * 14, duration: 34 });
          return (
            <span
              key={i}
              style={{
                alignSelf: 'stretch',
                height: 14,
                borderRadius: 14,
                background: t.panel,
                border: `1px solid ${t.edge}`,
                transform: `scaleX(${p * w})`,
                transformOrigin: 'right center',
              }}
            />
          );
        })}
      </div>
    </SceneBody>
  );
};

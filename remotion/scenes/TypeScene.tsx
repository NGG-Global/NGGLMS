/**
 * `type` — a statement that is the whole picture.
 *
 * The component reads the shape of the copy rather than taking a variant flag:
 *
 *   sub, no accent            -> the title card (with the Copilot mark if `logo`)
 *   one clause with an accent -> a claim, accent phrase brushed
 *   "not X. rather Y", Y      -> the correction: X struck, Y promoted
 *   accent not inside head    -> a question and its answer, on two lines
 *
 * That third case is worth spelling out. Nugget 1 gives a single head, "לא מומחה
 * שיודע הכול. שותף עבודה מהיר מאוד", with the second sentence as the accent.
 * Rendering it as one brushed line would flatten it; the sentence is a correction, and
 * a correction wants the rejected half visibly struck and the kept half raised. So
 * when the accent is a trailing sentence, the clauses stack and stage against the two
 * narration lines that say them.
 *
 * A claim held for eleven or eighteen seconds needs more than a headline, and what it
 * needs depends on what it claims — so the supporting motif comes from art.ts rather
 * than from this file.
 */

import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { AccentHead, Micro, Reveal } from '../lib/kit';
import { EASE_OUT, drift, reveal } from '../lib/motion';
import { SceneBody, cue, cueFrame, type SceneProps } from '../lib/scene';
import type { Tone } from '../theme';
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

/**
 * `output-lines` — three bars that write themselves out.
 *
 * For a claim about the tool's own fluency. They sit clear of the headline: bars
 * crossing the text read as strike-throughs and fight the sentence they illustrate.
 */
const OutputLines = ({ t, at, out }: { t: Tone; at: number; out: number }) => {
  const frame = useCurrentFrame();
  const on = reveal(frame, { delay: at, duration: 40 });
  const fade = interpolate(frame, [out, out + 40], [1, 0.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        width: 620,
        opacity: 0.62 * fade * on,
        transform: `translateY(${drift(frame, 6, 640)}px)`,
      }}
    >
      {[1, 0.84, 0.58].map((w, i) => (
        <span
          key={i}
          style={{
            alignSelf: 'stretch',
            height: 14,
            borderRadius: 14,
            background: t.panel,
            border: `1px solid ${t.edge}`,
            transform: `scaleX(${reveal(frame, { delay: at + i * 14, duration: 34 }) * w})`,
            transformOrigin: 'right center',
          }}
        />
      ))}
    </div>
  );
};

/**
 * `uniform-tiles` — six identical tiles that stop being identical.
 *
 * For the claim that one habit is being applied to every task. The tiles arrive as
 * exact copies of each other on the line about using it the same way for everything,
 * and on the line that corrects it they take on different heights and weights: the
 * tasks were never the same shape.
 */
const UniformTiles = ({ t, at, out }: { t: Tone; at: number; out: number }) => {
  const frame = useCurrentFrame();
  const differ = reveal(frame, { delay: out, duration: 46, easing: EASE_OUT });
  // Heights the tiles resolve to. Uniform until `differ` pulls them apart.
  const shape = [0.58, 1, 0.42, 0.86, 0.34, 0.7];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, height: 190 }}>
      {shape.map((h, i) => {
        const on = reveal(frame, { delay: at + i * 9, duration: 26 });
        const height = 94 + (h - 0.5) * 168 * differ;
        return (
          <span
            key={i}
            style={{
              width: 152,
              height,
              borderRadius: 18,
              background: t.panel,
              border: `1px solid ${differ > 0.4 && h > 0.8 ? t.accent : t.edge}`,
              opacity: on * (0.5 + 0.5 * (differ > 0.4 ? h : 1)),
              transform: `scaleY(${on})`,
              transformOrigin: 'bottom center',
            }}
          />
        );
      })}
    </div>
  );
};

export const TypeSceneView = ({ scene, cueAt, t, art }: SceneProps<TypeScene>) => {
  const frame = useCurrentFrame();
  const accentAt = scene.accent ? scene.head.indexOf(scene.accent) : -1;
  // A trailing accent sentence, with the rejected clause before it.
  const breakAt = accentAt > 0 ? scene.head.lastIndexOf('. ', accentAt) : -1;

  // Title card: the nugget number and the name. The mark is optional — nugget 1 opens
  // on it, nugget 2 does not.
  if (scene.sub && !scene.accent) {
    const rule = reveal(frame, { delay: scene.logo ? 34 : 26, duration: 34 });
    return (
      <SceneBody align="center" gap={30}>
        {scene.logo ? <CopilotMark at={0} size={112} accent={t.accent} /> : null}
        <Reveal at={scene.logo ? 12 : 0} dy={14}>
          <Micro color={t.fg3} size={24}>
            {scene.sub}
          </Micro>
        </Reveal>
        <Reveal at={scene.logo ? 18 : 8} duration={28} dy={26} from={0.97} blur={7}>
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

  const headAt = cueFrame(cueAt, art.headAt);

  // An accent that is not a phrase inside the head is a separate statement — nugget
  // 5 asks "who is responsible for the result?" and answers "the answer is not
  // Copilot". Rendering only the head would drop the answer entirely.
  if (scene.accent && accentAt < 0) {
    const answerAt = cueFrame(cueAt, art.itemCues[0], headAt + 90);
    return (
      <SceneBody align="center" justify="center" gap={52}>
        {scene.logo ? <CopilotMark at={0} size={96} accent={t.accent} /> : null}
        <Reveal at={headAt} duration={28} dy={24} from={0.97} blur={6}>
          <div
            style={{
              fontSize: typeScale.head,
              fontWeight: 900,
              letterSpacing: '-0.028em',
              lineHeight: 1.16,
              color: t.fg,
              textAlign: 'center',
              maxWidth: 1420,
            }}
          >
            {scene.head}
          </div>
        </Reveal>
        <Reveal at={answerAt} duration={30} dy={26} from={0.96} blur={7}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 26,
            }}
          >
            <span
              style={{
                width: 200,
                height: 4,
                borderRadius: 4,
                background: `linear-gradient(90deg, rgba(0,0,0,0), ${t.accent}, rgba(0,0,0,0))`,
              }}
            />
            <span
              style={{
                fontSize: typeScale.sub,
                fontWeight: 800,
                letterSpacing: '-0.022em',
                lineHeight: 1.2,
                color: t.accent,
                textAlign: 'center',
                maxWidth: 1420,
              }}
            >
              {scene.accent}
            </span>
          </div>
        </Reveal>
      </SceneBody>
    );
  }

  // A claim, with whatever motif the shot's art calls for.
  const motifAt = cueFrame(cueAt, art.motifAt, 200);
  const motifOut = cueFrame(cueAt, art.motifOutAt, 10_000);

  return (
    <SceneBody align="center" justify="center" gap={72}>
      {scene.logo ? <CopilotMark at={0} size={96} accent={t.accent} /> : null}
      <div style={{ textAlign: 'center' }}>
        <AccentHead
          head={scene.head}
          accent={scene.accent}
          at={headAt}
          // Where the copy delivers the accent phrase on a later line, it lands there.
          accentAt={art.itemCues.length ? cueFrame(cueAt, art.itemCues[0]) : undefined}
          color={t.fg}
          accentColor={t.accent}
          fontSize={typeScale.head}
          maxWidth={1420}
        />
      </div>
      {art.motif === 'output-lines' ? <OutputLines t={t} at={motifAt} out={motifOut} /> : null}
      {art.motif === 'uniform-tiles' ? <UniformTiles t={t} at={motifAt} out={motifOut} /> : null}
    </SceneBody>
  );
};

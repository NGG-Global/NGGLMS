/**
 * `mock` — the tool, doing exactly what was asked.
 *
 * The whole force of this beat is that nothing goes wrong on screen. The prompt is
 * reasonable, the answer is well formed, and the problem only becomes visible when
 * you ask what "project status" was supposed to mean. So the panel is built to look
 * genuinely good: real chrome, a typed prompt, a considered pause, an answer that
 * arrives line by line.
 *
 * It follows the mock in src/player/stage.css — ink prompt bubble, plain reply, first
 * line bold — because a learner who has seen this scene in the platform should
 * recognise it here.
 *
 * Nugget 4's mock has no reply at all, and that is deliberate: the prompt is "prepare
 * me a proposal for the meeting with the client" and the beat is that there is nothing
 * to answer it with. So the pause never resolves — the dots keep going to the end of
 * the shot — and the label asks which proposal, which client, which meeting. A reply
 * that simply failed to appear would read as a broken asset; one that never arrives
 * while the tool visibly keeps waiting reads as the point.
 */

import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { EASE_OUT, reveal, stagger } from '../lib/motion';
import { SceneBody, cueFrame, type SceneProps } from '../lib/scene';
import { palette, type as typeScale } from '../theme';

type MockScene = Extract<Scene, { kind: 'mock' }>;

const CARD_W = 1120;

/** Three dots, the pause before an answer. Sells the panel as live rather than drawn. */
const Thinking = ({ show }: { show: number }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', height: 26, opacity: show }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 12,
            background: palette.ink5,
            opacity: 0.35 + 0.65 * Math.max(0, Math.sin(frame / 5 - i * 0.9)),
          }}
        />
      ))}
    </div>
  );
};

export const MockSceneView = ({
  scene,
  cueAt,
  t,
  art,
  durationInFrames,
}: SceneProps<MockScene>) => {
  const frame = useCurrentFrame();
  const answers = Boolean(scene.reply);

  // Fallbacks are fractions of the shot, not fixed frame counts: nugget 1's mock runs
  // ten seconds and nugget 4's runs four and a half, and absolute defaults tuned for
  // the first one land past the end of the second.
  const promptFrom = cueFrame(cueAt, art.itemCues[0], Math.round(durationInFrames * 0.1));
  const replyFrom = cueFrame(cueAt, art.detailCues[0], Math.round(durationInFrames * 0.55));
  // ~0.5 characters a frame: fast enough to finish inside the line that quotes it,
  // slow enough to read as typing rather than a paste.
  const typed = interpolate(frame, [promptFrom, promptFrom + scene.prompt.length * 2], [0, scene.prompt.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  const promptText = scene.prompt.slice(0, Math.round(typed));
  const typing = typed > 0 && typed < scene.prompt.length;

  const lines = (scene.reply || '').split('\n');
  // The turn is held until the answer is fully on screen and looking fine. Where the
  // script has a line for it, that line sets the moment; otherwise it follows the
  // answer by a beat.
  const typedBy = promptFrom + scene.prompt.length * 2;
  const payoff = cueFrame(cueAt, art.payoffAt);
  const labelFrom = answers
    ? payoff > replyFrom
      ? payoff
      : replyFrom + 56
    : // With no answer to wait for, the turn follows the typed prompt.
      typedBy + 26;
  // A long reply has to give up some size to stay inside the stage.
  const replySize = (scene.reply || '').length > 150 ? 27 : 30;

  return (
    <SceneBody align="center" justify="center" gap={34}>
      <Reveal at={0} duration={30} dy={26} from={0.97}>
        <div
          style={{
            width: CARD_W,
            borderRadius: 24,
            border: `1px solid #e2e1e5`,
            background: '#fff',
            overflow: 'hidden',
            boxShadow: '0 40px 90px -50px rgba(21,10,20,0.55)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '20px 28px',
              borderBottom: `1px solid ${palette.hairline}`,
              background: '#f9f9fa',
            }}
          >
            <Img src={staticFile('assets/copilot.png')} style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '0.02em', color: palette.ink4 }}>
              Copilot
            </span>
          </div>

          <div style={{ padding: 34, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 250 }}>
            {promptText ? (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '78%',
                  padding: '20px 28px',
                  borderRadius: '16px 16px 16px 5px',
                  background: palette.ink,
                  color: '#fff',
                  fontSize: typeScale.item,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  letterSpacing: '-0.015em',
                }}
              >
                {promptText}
                {typing ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 3,
                      height: '1em',
                      marginInlineStart: 4,
                      verticalAlign: '-0.12em',
                      background: '#fff',
                      opacity: Math.sin(frame / 4) > 0 ? 1 : 0.15,
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            <Thinking
              show={
                answers
                  ? interpolate(frame, [typedBy, replyFrom - 6, replyFrom], [0, 1, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : reveal(frame, { delay: typedBy, duration: 16 })
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingInlineStart: 8 }}>
              {lines.map((line, i) =>
                line === '' ? (
                  <span key={i} style={{ height: 14 }} />
                ) : (
                  <span
                    key={i}
                    style={{
                      fontSize: replySize,
                      fontWeight: i === 0 ? 700 : 400,
                      lineHeight: 1.5,
                      color: i === 0 ? palette.ink : '#33333f',
                      opacity: reveal(frame, { delay: replyFrom + stagger(i, 13), duration: 22 }),
                      transform: `translateY(${
                        10 * (1 - reveal(frame, { delay: replyFrom + stagger(i, 13), duration: 22 }))
                      }px)`,
                    }}
                  >
                    {line}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {scene.label ? (
        <Reveal at={labelFrom} duration={28} dy={18} blur={5}>
          <div
            style={{
              fontSize: typeScale.sub,
              fontWeight: 800,
              letterSpacing: '-0.022em',
              color: t.fg,
              textAlign: 'center',
              maxWidth: 1200,
            }}
          >
            {scene.label}
          </div>
        </Reveal>
      ) : null}
    </SceneBody>
  );
};

/**
 * `quote` — a sentence held up as an example.
 *
 * Nugget 4 uses it for the one thing the whole nugget is arguing for: a line of
 * context you would actually type. The head names what context is, the quote is the
 * specimen, and the foot says what a single sentence like it does to the result.
 *
 * The specimen assembles clause by clause, each on the narration line that speaks it.
 * That matters more here than in most scenes: the point being made is that context is
 * *short* — three clauses, twelve seconds — and watching it come together in three
 * short strokes makes the brevity part of the picture rather than a claim about it.
 */

import { useCurrentFrame } from 'remotion';
import type { Scene } from '../../src/content/types';
import { Reveal } from '../lib/kit';
import { drift, reveal } from '../lib/motion';
import { SceneBody, SceneHead, cueFrame, type SceneProps } from '../lib/scene';
import { type as typeScale } from '../theme';

type QuoteScene = Extract<Scene, { kind: 'quote' }>;

/**
 * Clauses of the specimen, keeping their punctuation.
 *
 * Split after the comma rather than on it, so each stroke reads as a finished piece of
 * the sentence instead of a fragment waiting for its mark.
 */
const clauses = (quote: string): string[] => {
  const parts = quote.split(/(?<=,)\s+/);
  return parts.length > 1 ? parts : [quote];
};

export const QuoteSceneView = ({ scene, cueAt, t, art }: SceneProps<QuoteScene>) => {
  const frame = useCurrentFrame();
  const parts = clauses(scene.quote);

  return (
    <SceneBody justify="center" gap={44}>
      {scene.head ? (
        <Reveal at={cueFrame(cueAt, art.headAt)} dy={18}>
          <SceneHead t={t}>{scene.head}</SceneHead>
        </Reveal>
      ) : null}

      <Reveal
        at={cueFrame(cueAt, art.itemCues[0]) - 18}
        duration={30}
        dy={0}
        from={0.98}
        style={{ display: 'grid', placeItems: 'stretch' }}
      >
        <div
          style={{
            position: 'relative',
            padding: '52px 118px 52px 58px',
            borderRadius: 26,
            background: t.panel,
            border: `1px solid ${t.edge}`,
            // The accent edge on the reading side marks it as quoted material rather
            // than another card of the platform's own copy.
            borderInlineStart: `5px solid ${t.accent}`,
            transform: `translateY(${drift(frame, 4, 700)}px)`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 18,
              insetInlineStart: 42,
              fontSize: 132,
              lineHeight: 1,
              fontWeight: 900,
              color: t.accent,
              opacity: 0.28,
            }}
          >
            &rdquo;
          </span>
          <div
            style={{
              fontSize: 42,
              fontWeight: 600,
              lineHeight: 1.48,
              letterSpacing: '-0.018em',
              color: t.fg,
            }}
          >
            {parts.map((part, i) => {
              const p = reveal(frame, {
                delay: cueFrame(cueAt, art.itemCues[i] ?? art.itemCues[0]),
                duration: 28,
              });
              return (
                <span key={i} style={{ opacity: p }}>
                  {i > 0 ? ' ' : ''}
                  {part}
                </span>
              );
            })}
          </div>
        </div>
      </Reveal>

      {scene.foot ? (
        <Reveal at={cueFrame(cueAt, art.payoffAt)} duration={28} dy={14}>
          <div
            style={{
              fontSize: typeScale.body,
              fontWeight: 500,
              lineHeight: 1.45,
              color: t.fg3,
            }}
          >
            {scene.foot}
          </div>
        </Reveal>
      ) : null}
    </SceneBody>
  );
};

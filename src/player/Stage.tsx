import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Scene } from '../content/types';
import { assetUrl } from '../app/paths';
import './stage.css';

/** Per-child animation index, consumed by the staggered-entry rule in stage.css. */
const step = (i: number): CSSProperties => ({ ['--i' as string]: i });

function splitAccent(head: string, accent?: string) {
  if (!accent) return [head];
  const at = head.indexOf(accent);
  if (at < 0) return [head];
  return [head.slice(0, at), accent, head.slice(at + accent.length)];
}

interface StageProps {
  scene: Scene | undefined;
  /** Changing this key remounts the stage, which is what replays the entry animation. */
  sceneKey: string;
}

/**
 * Renders one scene card. Mounted fresh on every scene change so the CSS entry
 * animations fire exactly when the narration reaches that scene.
 */
function StageInner({ scene }: StageProps) {
  if (!scene) return null;
  const dark = scene.tone !== 'light';
  const cls = `stage stage--${dark ? 'dark' : 'light'}`;

  const head = (text: string) => (
    <div className="stage__head" data-anim="rise" style={step(0)}>
      {text}
    </div>
  );

  switch (scene.kind) {
    case 'type': {
      const parts = splitAccent(scene.head, scene.accent);
      return (
        <div className={cls}>
          {scene.logo && (
            <img className="sc-type__logo" data-anim="pop" style={step(0)} src={assetUrl('assets/copilot.png')} alt="" />
          )}
          {scene.sub && (
            <div className="sc-type__sub" data-anim="rise" style={step(scene.logo ? 1 : 0)}>
              {scene.sub}
            </div>
          )}
          <h2 className="sc-type__head">
            {parts.map((part, i) =>
              part ? (
                <span key={i} data-anim="rise" style={{ ...step(i), display: 'inline' }}>
                  {parts.length === 3 && i === 1 ? <em>{part}</em> : part}
                </span>
              ) : null,
            )}
          </h2>
        </div>
      );
    }

    case 'chips':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className={`sc-chips${scene.items.length <= 5 ? ' sc-chips--big' : ''}`}>
            {scene.items.map((item, i) => (
              <span key={i} data-anim="pop" style={step(i)}>
                {item}
              </span>
            ))}
          </div>
        </div>
      );

    case 'flow':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-flow">
            {scene.nodes.map((node, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && (
                  <span className="sc-flow__arrow" data-anim="fade" style={step(i * 2 - 1)}>
                    ←
                  </span>
                )}
                <span
                  className={`sc-flow__node${i === scene.nodes.length - 1 ? ' sc-flow__node--last' : ''}`}
                  data-anim="pop"
                  style={step(i * 2)}
                >
                  {node}
                </span>
              </span>
            ))}
          </div>
          {scene.foot && (
            <p className="sc-foot" data-anim="rise" style={step(scene.nodes.length * 2 + 1)}>
              {scene.foot}
            </p>
          )}
        </div>
      );

    case 'negspace':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-neg">
            {scene.items.map((item, i) => (
              <span key={i} data-anim="rise" style={step(i)}>
                <i />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      );

    case 'questions':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-q">
            {scene.items.map((item, i) => (
              <span key={i} data-anim="rise" style={step(i)}>
                {item}
              </span>
            ))}
          </div>
        </div>
      );

    case 'principle':
      return (
        <div className={cls}>
          {head(scene.label)}
          <div className="sc-pr__off" data-anim="rise" style={step(1)}>
            {scene.off}
          </div>
          <div className="sc-pr__on" data-anim="rise" style={step(2)}>
            {scene.on}
          </div>
        </div>
      );

    case 'gauge': {
      const last = Math.max(1, scene.items.length - 1);
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-gauge">
            {scene.items.map((item, i) => (
              <span key={i}>
                <i
                  data-anim="grow"
                  style={{ ...step(i), width: `${26 + (i * 62) / last}%`, opacity: 0.35 + i * (0.65 / last) }}
                />
                <b data-anim="fade" style={step(i)}>
                  {item}
                </b>
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'butlist':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-but">
            {scene.items.map(([left, right], i) => (
              <span key={i} data-anim="rise" style={step(i)}>
                <b>{left}</b>
                <i />
                <em>{right}</em>
              </span>
            ))}
          </div>
        </div>
      );

    case 'twoq':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-twoq">
            {scene.items.map(([q, a], i) => (
              <span key={i} data-anim="pop" style={step(i)}>
                <b>{q}</b>
                <em>{a}</em>
              </span>
            ))}
          </div>
        </div>
      );

    case 'dial':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-dial__bar" data-anim="grow" style={step(0)} />
          <div className="sc-dial__labels">
            <span data-anim="rise" style={step(1)}>
              {scene.low}
            </span>
            <span data-anim="rise" style={step(2)}>
              {scene.high}
            </span>
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className={cls}>
          {scene.head ? head(scene.head) : null}
          <blockquote className="sc-quote" data-anim="pop" style={step(1)}>
            “{scene.quote}”
          </blockquote>
          {scene.foot && (
            <p className="sc-foot" data-anim="rise" style={step(2)}>
              {scene.foot}
            </p>
          )}
        </div>
      );

    case 'stairs':
      return (
        <div className={cls}>
          {head(scene.head)}
          <div className="sc-stairs">
            {scene.items.map(([label, note], i) => (
              <span
                key={i}
                className={i === scene.items.length - 1 ? 'is-last' : undefined}
                data-anim="slidein"
                style={{ ...step(i), marginInlineStart: `${i * 7}%` }}
              >
                <b>{label}</b>
                <em>{note}</em>
              </span>
            ))}
          </div>
        </div>
      );

    case 'mock': {
      const lines = (scene.reply || '').split('\n');
      return (
        <div className={cls}>
          <div className="sc-mock" data-anim="pop" style={step(0)}>
            <div className="sc-mock__bar">
              <img src={assetUrl('assets/copilot.png')} alt="" />
              <span>Copilot</span>
            </div>
            <div className="sc-mock__body">
              <span className="sc-mock__ask" data-anim="rise" style={step(1)}>
                {scene.prompt}
              </span>
              {lines.some((l) => l !== '') && (
                <span className="sc-mock__reply">
                  {lines.map((line, i) =>
                    line === '' ? (
                      <span key={i} className="is-gap" />
                    ) : (
                      <span
                        key={i}
                        className={i === 0 ? 'is-first' : undefined}
                        data-anim="rise"
                        style={step(2 + i * 0.6)}
                      >
                        {line}
                      </span>
                    ),
                  )}
                </span>
              )}
            </div>
          </div>
          {scene.label && (
            <p className="sc-mock__label" data-anim="rise" style={step(4)}>
              {scene.label}
            </p>
          )}
        </div>
      );
    }

    default:
      return <div className={cls} />;
  }
}

/** Only re-render when the scene actually changes — the clock ticks far more often. */
export const Stage = memo(StageInner, (a, b) => a.sceneKey === b.sceneKey);

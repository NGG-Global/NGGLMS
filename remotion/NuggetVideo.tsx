/**
 * One nugget, end to end.
 *
 * The reel is assembled from content, not authored per video: give it a unit and a
 * segment and it resolves the narration slice, the cue timings and the scene order
 * from src/content. Nugget 2 is a second <Composition> entry, not a second file.
 *
 * Layering, bottom to top: the backdrop (continuous, dissolving between tones), the
 * shots (each in its own Sequence, crossfading into the next), the furniture and the
 * captions (reel-level, so a scene change never cuts a sentence in half), the end
 * card, and the fade to black.
 */

import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Backdrop } from './components/Backdrop';
import { Captions } from './components/Captions';
import { Frame } from './components/Frame';
import { EndCard } from './components/EndCard';
import { buildReel, type Shot } from './lib/timing';
import { EASE_IN_OUT, shotFade } from './lib/motion';
import { SceneView } from './scenes';
import { palette, tone } from './theme';
import { builtUnits } from '../src/content';

/** Frames a shot lingers into the next one, so cuts are dissolves and never a gap. */
const OVERLAP = 12;
/** Frames the tone dissolve takes at a shot boundary. */
const TONE_DISSOLVE = 7;
/** Silent tail carrying the end card. */
export const OUTRO_FRAMES = 150;

// A type alias, not an interface: Remotion's <Composition> needs props assignable to
// Record<string, unknown>, and only an alias picks up the implicit index signature.
export type NuggetProps = {
  /** Key into `builtUnits`, e.g. 'unit-01'. */
  contentId: string;
  /** Segment id inside that unit, e.g. 's1'. */
  segmentId: string;
};

export const resolveSegment = ({ contentId, segmentId }: NuggetProps) => {
  const unit = builtUnits[contentId];
  if (!unit) throw new Error(`Unknown content id "${contentId}"`);
  const segment = unit.segments.find((s) => s.id === segmentId);
  if (!segment) throw new Error(`Unit ${contentId} has no segment "${segmentId}"`);
  return { unit, segment };
};

/** Total frames for a nugget, for the composition's `durationInFrames`. */
export const nuggetDuration = (props: NuggetProps) =>
  buildReel(resolveSegment(props).segment).narrationFrames + OUTRO_FRAMES;

const ShotLayer = ({ shot }: { shot: Shot }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity: shotFade(frame, durationInFrames, OVERLAP) }}>
      <SceneView
        scene={shot.scene}
        cueAt={shot.cueAt}
        durationInFrames={shot.durationInFrames}
        t={tone(shot.scene.tone !== 'light')}
      />
    </AbsoluteFill>
  );
};

export const NuggetVideo = ({ contentId, segmentId }: NuggetProps) => {
  const frame = useCurrentFrame();
  const { unit, segment } = resolveSegment({ contentId, segmentId });
  const reel = buildReel(segment);
  const { shots, narrationFrames } = reel;

  // Tone holds flat through a shot and dissolves across the boundary. Built as
  // keyframes rather than read off the current shot so the backdrop never steps.
  const mixInput: number[] = [];
  const mixOutput: number[] = [];
  shots.forEach((shot, i) => {
    const value = shot.scene.tone === 'light' ? 1 : 0;
    mixInput.push(i === 0 ? 0 : shot.from + TONE_DISSOLVE);
    mixOutput.push(value);
    mixInput.push(
      i === shots.length - 1 ? narrationFrames : shot.from + shot.durationInFrames - TONE_DISSOLVE,
    );
    mixOutput.push(value);
  });
  const mix = interpolate(frame, mixInput, mixOutput, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });

  const narration = interpolate(frame, [narrationFrames - 14, narrationFrames + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const tail = interpolate(
    frame,
    [narrationFrames + OUTRO_FRAMES - 16, narrationFrames + OUTRO_FRAMES],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.stageDark }}>
      <Backdrop mix={mix} />

      <AbsoluteFill style={{ opacity: narration }}>
        {shots.map((shot) => (
          <Sequence
            key={shot.key}
            name={`${shot.key} · ${shot.scene.kind}`}
            from={shot.from}
            durationInFrames={shot.durationInFrames + OVERLAP}
          >
            <ShotLayer shot={shot} />
          </Sequence>
        ))}

        <Frame
          mix={mix}
          progress={frame / narrationFrames}
          ticks={shots.slice(1).map((shot) => shot.from / narrationFrames)}
          identity={`יחידה ${unit.unit.n} · נאגט ${segment.n}`}
          kicker={segment.kicker}
        />
        <Captions cues={reel.cues} mix={mix} />
      </AbsoluteFill>

      <Sequence from={narrationFrames - 6} durationInFrames={OUTRO_FRAMES + 6} name="end card">
        <EndCard unitTitle={unit.unit.title} nuggetTitle={segment.title} think={segment.think} />
      </Sequence>

      <Audio
        src={staticFile(reel.audio.src)}
        trimBefore={reel.audio.trimBefore}
        trimAfter={reel.audio.trimAfter}
        // The narration ends on a full stop; the short ramp only keeps the encoder
        // from clipping the tail.
        volume={(f) =>
          interpolate(f, [narrationFrames - 10, narrationFrames], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />

      <AbsoluteFill style={{ background: '#000', opacity: tail }} />
    </AbsoluteFill>
  );
};

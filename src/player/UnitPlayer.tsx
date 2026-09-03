import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Scene, UnitContent } from '../content/types';
import { hasNarration } from '../content/narration-manifest';
import { videoTrack } from '../content/video-manifest';
import { assetUrl } from '../app/paths';
import { buildTimeline, formatTime, type Timeline } from './timeline';
import { useTimelineClock } from './useTimelineClock';
import { Stage } from './Stage';
import { Exercise, type ExerciseResult } from './Exercise';
import './player.css';

const RATES = [0.75, 1, 1.25, 1.5];

export interface SegmentProgress {
  /** Narration watched to the end at least once. */
  watched?: boolean;
  /** Exercise checked. */
  practised?: boolean;
  score?: number;
  outOf?: number;
  /** Furthest second reached, so a learner can resume mid-segment. */
  lastT?: number;
}

export type UnitProgress = Record<string, SegmentProgress>;

interface Props {
  content: UnitContent;
  progress: UnitProgress;
  onProgress: (segmentId: string, patch: Partial<SegmentProgress>) => void;
  /** Called when the last segment's exercise is completed. */
  onUnitComplete?: () => void;
  /** Which nugget is open. Controlled by the route, so a deep link like ?n=3 lands on it. */
  segmentIndex: number;
  onSegmentChange: (index: number) => void;
}

/**
 * Plays one unit.
 *
 * Narration, captions and scene animations all read the same clock, so a caption is
 * never ahead of the voice and a scene never lands early. Where a narration file has
 * not been delivered the clock falls back to a virtual timer and the frame says so —
 * the lesson stays usable instead of failing silently.
 *
 * A nugget with a rendered visualizer (see src/content/video-manifest.ts) plays that
 * instead: the <video> becomes the clock's media element, and the frame drops its own
 * caption line and header because the render already carries both. Nuggets without
 * one keep the CSS stage, so a unit is switched over a nugget at a time as its video
 * is produced. Playback stops at the end of the narration rather than the end of the
 * file — the render's end card would otherwise say "עצור וחשוב" a beat before the
 * player's own reflection panel says it again.
 */
export function UnitPlayer({
  content,
  progress,
  onProgress,
  onUnitComplete,
  segmentIndex,
  onSegmentChange,
}: Props) {
  const segments = content.segments;
  const index = Math.min(Math.max(0, segmentIndex), segments.length - 1);
  const [showThink, setShowThink] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const segment = segments[index];

  const timelines = useMemo<Timeline[]>(() => segments.map((s) => buildTimeline(s)), [segments]);
  const timeline = timelines[index];

  const audioAvailable = hasNarration(segment.src, segment.end);
  const video = videoTrack(content.unit.n, segment.n, segment.end - segment.start);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const clockTarget = useMemo(
    () =>
      video
        ? {
            src: assetUrl(video.file),
            // The render is already trimmed to the segment, so its clock starts at
            // zero and the segment's own length is the whole of it.
            start: 0,
            end: segment.end - segment.start,
            cues: timeline.cues,
            element: videoEl,
          }
        : {
            src: audioAvailable ? assetUrl(segment.src) : null,
            start: segment.start,
            end: segment.end,
            cues: timeline.cues,
          },
    [video, videoEl, audioAvailable, segment.src, segment.start, segment.end, timeline.cues],
  );

  const handleFinish = useCallback(() => {
    setShowThink(true);
    onProgress(segment.id, { watched: true, lastT: segment.end - segment.start });
  }, [onProgress, segment.id, segment.end, segment.start]);

  const clock = useTimelineClock(clockTarget, handleFinish);

  // Park the furthest point reached, so "המשך מאיפה שעצרת" has something to go on.
  const lastSaved = useRef(0);
  useEffect(() => {
    if (!clock.started) return;
    if (clock.t - lastSaved.current < 5) return;
    lastSaved.current = clock.t;
    onProgress(segment.id, { lastT: clock.t });
  }, [clock.t, clock.started, onProgress, segment.id]);

  useEffect(() => {
    lastSaved.current = 0;
    setShowThink(false);
  }, [index]);

  const select = useCallback(
    (next: number) => {
      if (next < 0 || next >= segments.length || next === index) return;
      onSegmentChange(next);
      setIntroOpen(false);
      mainRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    },
    [segments.length, index, onSegmentChange],
  );

  const cue = timeline.cues[clock.cueIndex];
  const preRoll = !clock.started || clock.t < (timeline.cues[0]?.t0 ?? 0);
  const sceneKey = preRoll ? timeline.cues[0]?.scene ?? 'a' : cue?.scene ?? 'a';
  const scene: Scene | undefined = segment.scenes[sceneKey];
  const captionText = clock.started && !preRoll ? cue?.text ?? '' : '';

  const doneCount = segments.filter((s) => progress[s.id]?.practised).length;
  const unitMinutes = Math.round(segments.reduce((sum, s) => sum + (s.end - s.start), 0) / 60);

  const onScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    clock.seek((Number(event.target.value) / 1000) * clock.duration);
    setShowThink(false);
  };

  const handleChecked = (result: ExerciseResult) => {
    onProgress(segment.id, { practised: true, score: result.score, outOf: result.outOf });
  };

  const handleNext = () => {
    if (index < segments.length - 1) select(index + 1);
    else onUnitComplete?.();
  };

  const pct = (clock.t / clock.duration) * 100;
  const segmentIsDone = Boolean(progress[segment.id]?.practised);

  return (
    <div className="player">
      <div className="player__main" ref={mainRef}>
        <div className="frame">
          {video ? (
            // No `src` here: the clock owns loading, so the element is not asked for
            // the same file twice. Metadata only until play — the file is ~23MB.
            <video
              className="frame__video"
              ref={setVideoEl}
              preload="metadata"
              playsInline
              disablePictureInPicture
            />
          ) : (
            <Stage key={sceneKey + segment.id} sceneKey={sceneKey + segment.id} scene={scene} />
          )}

          {/* The render draws its own header and captions, so the frame does not. */}
          {!video && (
            <div className="frame__top">
              <span className="frame__kicker">{segment.kicker}</span>
              <span className="spacer" />
              <span className="frame__num" dir="ltr">
                {segment.n} / {segments.length}
              </span>
            </div>
          )}

          {!audioAvailable && !video && (
            <p className="frame__silent">
              ללא קריינות — הכתוביות והאנימציה מסונכרנות ביניהן
            </p>
          )}

          {captionText && !video && (
            <div className="frame__caption-wrap">
              <p className="frame__caption" key={clock.cueIndex}>
                {captionText}
              </p>
            </div>
          )}

          {!clock.started && !showThink && (
            <button type="button" className="frame__poster" onClick={clock.play}>
              <i>▶</i>
              <b>
                נאגט {segment.n} · {formatTime(clock.duration)}
                {audioAvailable ? '' : ' · ללא קריינות'}
              </b>
            </button>
          )}

          {showThink && (
            <div className="frame__think">
              <span>עצור וחשוב</span>
              <p>{segment.think}</p>
              <div>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    setShowThink(false);
                    clock.acknowledgeFinish();
                  }}
                >
                  לתרגיל של המקטע ↓
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setShowThink(false);
                    clock.restart();
                  }}
                >
                  לצפות שוב
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card transport">
          <button
            type="button"
            className="transport__pp"
            onClick={() => {
              setShowThink(false);
              clock.toggle();
            }}
            aria-label={clock.playing ? 'להשהות' : 'להפעיל'}
          >
            {clock.playing ? '❚❚' : '▶'}
          </button>
          <span className="transport__time" dir="ltr">
            {formatTime(clock.t)} / {formatTime(clock.duration)}
          </span>
          <div className="transport__scrub">
            <span className="meter">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="transport__dot" style={{ right: `${pct}%` }} />
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round((clock.t / clock.duration) * 1000)}
              onChange={onScrub}
              aria-label="מיקום בהשמעה"
            />
          </div>
          <div className="transport__rates">
            {RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                aria-pressed={clock.rate === rate}
                onClick={() => clock.setRate(rate)}
              >
                {rate === 1 ? '1×' : `${rate}×`}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="transport__done"
            aria-pressed={segmentIsDone}
            onClick={() => onProgress(segment.id, { practised: !segmentIsDone })}
          >
            {segmentIsDone ? '✓ הושלם' : 'סמן כהושלם'}
          </button>
        </div>

        <Exercise
          key={segment.id}
          exercise={segment.ex}
          nuggetNumber={segment.n}
          nextLabel={index < segments.length - 1 ? 'למקטע הבא ←' : 'סיימתי את היחידה'}
          onNext={handleNext}
          onChecked={handleChecked}
        />

        {showTranscript ? (
          <section className="card transcript">
            <div className="transcript__top">
              <h3>תמלול המקטע</h3>
              <span className="spacer" />
              <button type="button" className="btn btn--quiet" onClick={() => setShowTranscript(false)}>
                להסתיר
              </button>
            </div>
            <div className="transcript__lines">
              {timeline.cues.map((line, i) =>
                line.text ? (
                  <button
                    key={i}
                    type="button"
                    aria-current={i === clock.cueIndex && clock.started}
                    onClick={() => {
                      setShowThink(false);
                      clock.seek(line.t0);
                      if (!clock.playing) clock.play();
                    }}
                  >
                    {line.text}
                  </button>
                ) : null,
              )}
            </div>
          </section>
        ) : (
          <button
            type="button"
            className="btn btn--quiet"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setShowTranscript(true)}
          >
            להציג את התמלול המלא ↓
          </button>
        )}
      </div>

      <aside className="player__rail">
        <div className="card card--flush">
          <div className="rail__head">
            <h2>חמישה מקטעים</h2>
            <p>
              {unitMinutes} דקות · {doneCount} מתוך {segments.length} הושלמו
            </p>
          </div>
          {segments.map((s, i) => {
            const done = Boolean(progress[s.id]?.practised);
            const playable = hasNarration(s.src, s.end);
            return (
              <button
                key={s.id}
                type="button"
                className="rail__item"
                aria-current={i === index}
                onClick={() => select(i)}
              >
                <span className={`rail__num${done ? ' rail__num--done' : ''}`}>{done ? '✓' : s.n}</span>
                <span className="rail__body">
                  <b>{s.title}</b>
                  <span className={playable ? undefined : 'rail__muted'}>
                    {s.kicker} · {formatTime(s.end - s.start)}
                    {playable ? '' : ' · ללא קריינות'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="card card--pad">
          <h3 style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>פתיח היחידה</h3>
          <p style={{ marginTop: 5, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>{content.unit.lead}</p>
          {hasNarration(content.unit.intro.src, content.unit.intro.end) ? (
            <IntroPlayer intro={content.unit.intro} open={introOpen} onToggle={setIntroOpen} />
          ) : (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-4)' }}>הקלטת הפתיח לא נמצאת בספרייה.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

/** The unit intro is a short read-aloud slice; it gets its own element so it never
 *  competes with the segment clock for the shared audio object. */
function IntroPlayer({
  intro,
  open,
  onToggle,
}: {
  intro: UnitContent['unit']['intro'];
  open: boolean;
  onToggle: (next: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const length = Math.round(intro.end - intro.start);

  // Created on first press, not on mount: the intro shares a file with the segments and
  // there is no reason to spend a learner's bandwidth on it before they ask for it.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const toggle = () => {
    if (open) {
      audioRef.current?.pause();
      onToggle(false);
      return;
    }
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(assetUrl(intro.src));
      audio.preload = 'auto';
      audio.addEventListener('timeupdate', () => {
        if (audio!.currentTime >= intro.end - 0.05) {
          audio!.pause();
          onToggle(false);
        }
      });
      audioRef.current = audio;
    }
    if (audio.readyState >= 1 && (audio.currentTime < intro.start || audio.currentTime >= intro.end - 0.1)) {
      audio.currentTime = intro.start;
    } else if (audio.readyState < 1) {
      audio.addEventListener('loadedmetadata', () => {
        audio!.currentTime = intro.start;
      }, { once: true });
    }
    void audio.play().catch(() => onToggle(false));
    onToggle(true);
  };

  return (
    <button type="button" className="btn btn--quiet" style={{ marginTop: 10 }} onClick={toggle}>
      {open ? 'להשהות את הפתיח ❚❚' : `להאזין לפתיח (${length} שנ') ▶`}
    </button>
  );
}

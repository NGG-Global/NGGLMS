import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cueAt, type Cue } from './timeline';

export interface ClockTarget {
  /** Narration file, or null when the segment has no deliverable audio. */
  src: string | null;
  /** Slice of that file the segment occupies. */
  start: number;
  end: number;
  cues: Cue[];
}

export interface Clock {
  /** Seconds from the start of the segment. */
  t: number;
  cueIndex: number;
  duration: number;
  playing: boolean;
  /** Audio metadata has loaded (always true in silent mode). */
  ready: boolean;
  /** No narration available: captions and scenes run on a virtual clock. */
  silent: boolean;
  /** True once the learner has started this segment. */
  started: boolean;
  /** True when playback reached the end of the segment. */
  finished: boolean;
  rate: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  restart: () => void;
  setRate: (rate: number) => void;
  /** Clears the finished flag without moving the playhead. */
  acknowledgeFinish: () => void;
}

/** How often the committed time is refreshed when no cue boundary is crossed. */
const TICK_MS = 60;

/**
 * One clock for narration, captions and scene animations.
 *
 * When narration exists the audio element is the single source of truth, so a caption
 * can never drift from the voice — every frame reads `audio.currentTime`. When it does
 * not (a narration file that has not been delivered yet), the same loop runs off
 * `performance.now()` at the same playback rate, so captions and scenes still play in
 * step with each other and the segment stays teachable.
 */
export function useTimelineClock(target: ClockTarget, onFinish?: () => void): Clock {
  const { src, start, end, cues } = target;
  const duration = Math.max(0.01, end - start);
  const silent = src === null;

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(silent);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rate, setRateState] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedSrc = useRef<string | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const virtual = useRef({ t: 0, since: 0 });
  const committed = useRef({ t: 0, at: 0, cue: -1 });
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  // One audio element per player instance: segments that share an mp3 share the download.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    const onMeta = () => {
      setReady(true);
      if (pendingSeek.current != null) {
        audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
    };
    audio.addEventListener('loadedmetadata', onMeta);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const load = useCallback(
    (file: string) => {
      const audio = audioRef.current;
      if (!audio || loadedSrc.current === file) return;
      loadedSrc.current = file;
      pendingSeek.current = null;
      setReady(false);
      audio.src = file;
    },
    [],
  );

  // Reset to the head of the segment whenever the target segment changes.
  useEffect(() => {
    setT(0);
    setPlaying(false);
    setStarted(false);
    setFinished(false);
    committed.current = { t: 0, at: 0, cue: -1 };
    virtual.current = { t: 0, since: 0 };
    const audio = audioRef.current;
    if (audio) audio.pause();
    if (src) {
      load(src);
      if (audio) {
        if (audio.readyState >= 1) audio.currentTime = start;
        else pendingSeek.current = start;
      }
    } else {
      setReady(true);
    }
  }, [src, start, end, load]);

  const commit = useCallback(
    (next: number, force: boolean) => {
      const clamped = Math.max(0, Math.min(duration, next));
      const cue = cueAt(cues, clamped);
      const now = performance.now();
      if (force || cue !== committed.current.cue || now - committed.current.at >= TICK_MS) {
        committed.current = { t: clamped, at: now, cue };
        setT(clamped);
      }
    },
    [cues, duration],
  );

  // The frame loop. Runs only while playing, so an idle player costs nothing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = () => {
      raf = requestAnimationFrame(step);
      let next: number;
      if (silent) {
        const now = performance.now();
        next = virtual.current.t + ((now - virtual.current.since) / 1000) * rate;
      } else {
        const audio = audioRef.current;
        if (!audio || audio.readyState < 1 || pendingSeek.current != null) return;
        next = audio.currentTime - start;
      }
      if (next >= duration - 0.04) {
        commit(duration, true);
        if (silent) virtual.current = { t: duration, since: performance.now() };
        else audioRef.current?.pause();
        setPlaying(false);
        setFinished(true);
        finishRef.current?.();
        return;
      }
      commit(next, false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, silent, rate, start, duration, commit]);

  const play = useCallback(() => {
    setStarted(true);
    setFinished(false);
    if (silent) {
      const from = committed.current.t >= duration - 0.05 ? 0 : committed.current.t;
      virtual.current = { t: from, since: performance.now() };
      commit(from, true);
      setPlaying(true);
      return;
    }
    const audio = audioRef.current;
    if (!audio || !src) return;
    load(src);
    const from = committed.current.t >= duration - 0.05 ? 0 : committed.current.t;
    if (audio.readyState >= 1) audio.currentTime = start + from;
    else pendingSeek.current = start + from;
    audio.playbackRate = rate;
    void audio.play().catch(() => {
      // Autoplay refusal or a decode error — stay paused rather than pretend to play.
      setPlaying(false);
    });
    setPlaying(true);
  }, [silent, src, start, duration, rate, load, commit]);

  const pause = useCallback(() => {
    if (silent) {
      const now = performance.now();
      virtual.current = {
        t: virtual.current.t + ((now - virtual.current.since) / 1000) * rate,
        since: now,
      };
      commit(virtual.current.t, true);
    } else {
      audioRef.current?.pause();
    }
    setPlaying(false);
  }, [silent, rate, commit]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  const seek = useCallback(
    (to: number) => {
      const clamped = Math.max(0, Math.min(duration - 0.05, to));
      setStarted(true);
      setFinished(false);
      if (silent) {
        virtual.current = { t: clamped, since: performance.now() };
      } else {
        const audio = audioRef.current;
        if (audio) {
          if (src) load(src);
          if (audio.readyState >= 1) audio.currentTime = start + clamped;
          else pendingSeek.current = start + clamped;
        }
      }
      commit(clamped, true);
    },
    [duration, silent, src, start, load, commit],
  );

  const restart = useCallback(() => {
    seek(0);
    play();
  }, [seek, play]);

  const setRate = useCallback(
    (next: number) => {
      if (silent) {
        const now = performance.now();
        virtual.current = {
          t: virtual.current.t + ((now - virtual.current.since) / 1000) * rate,
          since: now,
        };
      } else if (audioRef.current) {
        audioRef.current.playbackRate = next;
      }
      setRateState(next);
    },
    [silent, rate],
  );

  const cueIndex = useMemo(() => cueAt(cues, t), [cues, t]);

  const acknowledgeFinish = useCallback(() => setFinished(false), []);

  return {
    t,
    cueIndex,
    duration,
    playing,
    ready,
    silent,
    started,
    finished,
    rate,
    play,
    pause,
    toggle,
    seek,
    restart,
    setRate,
    acknowledgeFinish,
  };
}

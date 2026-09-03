import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cueAt, type Cue } from './timeline';

export interface ClockTarget {
  /** Media file, or null when the segment has no deliverable narration. */
  src: string | null;
  /** Slice of that file the segment occupies. */
  start: number;
  end: number;
  cues: Cue[];
  /**
   * Media element to drive the clock from.
   *
   * Omitted, the hook makes its own <audio>, which is what a nugget playing the CSS
   * stage needs. A nugget with a rendered visualizer passes its mounted <video>
   * instead: the picture and the voice are then the same element, so they cannot
   * drift from each other at all, and the rest of this hook is unchanged — a video
   * is a media element with a currentTime like any other.
   */
  element?: HTMLMediaElement | null;
}

export interface Clock {
  /** Seconds from the start of the segment. */
  t: number;
  cueIndex: number;
  duration: number;
  playing: boolean;
  /** Media metadata has loaded (always true in silent mode). */
  ready: boolean;
  /**
   * Playback is running but the media has nothing to play.
   *
   * A 3MB mp3 buffers faster than anyone notices. A 23MB render does not, and without
   * this the frame freezes while the transport still shows a pause button — which
   * reads as a broken player rather than a slow network.
   */
  stalled: boolean;
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
 * When narration exists the media element is the single source of truth, so a caption
 * can never drift from the voice — every frame reads `currentTime`. When it does
 * not (a narration file that has not been delivered yet), the same loop runs off
 * `performance.now()` at the same playback rate, so captions and scenes still play in
 * step with each other and the segment stays teachable.
 */
export function useTimelineClock(target: ClockTarget, onFinish?: () => void): Clock {
  const { src, start, end, cues, element } = target;
  const duration = Math.max(0.01, end - start);
  const silent = src === null;

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(silent);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rate, setRateState] = useState(1);
  const [stalled, setStalled] = useState(false);

  const audioRef = useRef<HTMLMediaElement | null>(null);
  const loadedSrc = useRef<string | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const virtual = useRef({ t: 0, since: 0 });
  const committed = useRef({ t: 0, at: 0, cue: -1 });
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  // One media element per player instance: segments that share a file share the
  // download. A supplied element belongs to the caller, so its src is left alone on
  // teardown — clearing it would blank the <video> the caller is still rendering.
  useEffect(() => {
    const owned = element == null;
    const media: HTMLMediaElement = element ?? new Audio();
    if (owned) media.preload = 'auto';
    audioRef.current = media;
    // A different element has never been given this segment's file.
    loadedSrc.current = null;
    const onMeta = () => {
      setReady(true);
      if (pendingSeek.current != null) {
        media.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
    };
    const onWaiting = () => setStalled(true);
    const onRunning = () => setStalled(false);
    media.addEventListener('loadedmetadata', onMeta);
    media.addEventListener('waiting', onWaiting);
    media.addEventListener('stalled', onWaiting);
    media.addEventListener('playing', onRunning);
    media.addEventListener('canplay', onRunning);
    media.addEventListener('seeked', onRunning);
    if (media.readyState >= 1) setReady(true);
    return () => {
      media.removeEventListener('loadedmetadata', onMeta);
      media.removeEventListener('waiting', onWaiting);
      media.removeEventListener('stalled', onWaiting);
      media.removeEventListener('playing', onRunning);
      media.removeEventListener('canplay', onRunning);
      media.removeEventListener('seeked', onRunning);
      media.pause();
      if (owned) media.src = '';
      audioRef.current = null;
    };
  }, [element]);

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
    setStalled(false);
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
    // `element` is a dependency because the media element arrives on the render after
    // the player mounts it, and the file has to be handed to whichever element is
    // current.
  }, [src, start, end, load, element]);

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
    stalled,
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

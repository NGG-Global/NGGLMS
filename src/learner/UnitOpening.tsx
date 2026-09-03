import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { builtUnits, hasNarration, libraryUnit } from '../content';
import { unitCompletion } from '../app/progress';
import { formatTime } from '../player/timeline';
import { assetUrl } from '../app/paths';
import { Shell } from '../app/Shell';
import './learner.css';
import './opening.css';

/** The intro's length as a phrase, so the hint reads as Hebrew rather than a timestamp. */
function lengthPhrase(seconds: number): string {
  if (seconds < 45) return 'חצי דקה';
  if (seconds < 75) return 'דקה';
  if (seconds < 105) return 'דקה וחצי';
  return `${Math.round(seconds / 60)} דקות`;
}

/** Bar heights the design specifies, cycled across 28 bars. */
const WAVE = [9, 15, 22, 13, 26, 18, 11, 24, 16, 20, 12, 25, 14, 19];
const BARS = 28;

/**
 * The unit opening — the first step of a unit rather than an optional side action.
 *
 * The design's prototype fakes the player with a fixed 94-second CSS animation because
 * it has no audio. Here the intro is real, so the progress fill and the time label are
 * driven by the audio clock and each unit shows its own length; only the waveform pulse
 * stays a CSS animation, since it is decoration rather than a readout.
 */
export function UnitOpening() {
  const { programId, unitId } = useParams();
  const navigate = useNavigate();
  const { identity, workspace, progressFor, markIntroHeard } = useStore();

  const program = workspace.programs.find((p) => p.id === programId);
  const unit = unitId ? libraryUnit(unitId) : undefined;
  const contentId = unit?.contentId;
  const content = contentId ? builtUnits[contentId] : undefined;

  const intro = content?.unit.intro;
  const audible = intro ? hasNarration(intro.src, intro.end) : false;
  const length = intro ? intro.end - intro.start : 0;

  const [state, setState] = useState<'idle' | 'playing' | 'paused' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef(0);

  // Created on first press: there is no reason to fetch the clip before it is asked for.
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !intro) return;
    const at = audio.currentTime - intro.start;
    if (at >= length - 0.15) {
      audio.pause();
      setElapsed(length);
      setState('done');
      return;
    }
    setElapsed(Math.max(0, at));
    rafRef.current = requestAnimationFrame(tick);
  }, [intro, length]);

  const toggle = useCallback(() => {
    if (!intro) return;
    if (state === 'playing') {
      audioRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
      setState('paused');
      return;
    }
    if (!audible) {
      // No intro recording for this unit: mark it heard so the flow still moves on.
      setElapsed(length);
      setState('done');
      return;
    }
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(assetUrl(intro.src));
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    const from = state === 'done' ? 0 : elapsed;
    const seek = () => {
      audio!.currentTime = intro.start + from;
    };
    if (audio.readyState >= 1) seek();
    else audio.addEventListener('loadedmetadata', seek, { once: true });
    void audio.play().catch(() => setState('paused'));
    setState('playing');
    rafRef.current = requestAnimationFrame(tick);
  }, [intro, state, audible, elapsed, length, tick]);

  const bars = useMemo(
    () =>
      Array.from({ length: BARS }, (_, i) => ({
        height: WAVE[i % WAVE.length],
        duration: (0.9 + (i % 5) * 0.16).toFixed(2),
        delay: (i * 0.05).toFixed(2),
      })),
    [],
  );

  if (!identity) return null;

  if (!program || !unit || !content || !contentId || !intro) {
    return (
      <Shell crumb="פתיח היחידה">
        <main className="page page--narrow">
          <p className="empty">היחידה לא נמצאה, או שאין לה פתיח.</p>
          <p style={{ marginTop: 12 }}>
            <Link className="btn btn--quiet" to={program ? `/learn/${program.id}` : '/learn'}>
              ← למסלול הלמידה
            </Link>
          </p>
        </main>
      </Shell>
    );
  }

  const progress = progressFor(identity.id);
  const completion = unitCompletion(progress, contentId);
  const running = state === 'playing' || state === 'paused';
  const heard = state === 'done';

  const advance = () => {
    markIntroHeard(identity.id, contentId);
    audioRef.current?.pause();
    // Land on the first unwatched nugget, which is not always the first one.
    navigate(`/learn/${program.id}/${unit.id}/play?n=${completion.resumeIndex + 1}`);
  };

  const steps = content.segments.length + 2;
  const pct = length ? Math.min(100, (elapsed / length) * 100) : 0;

  return (
    <Shell crumb={`${program.course || program.title} · פתיח היחידה`}>
      <main className="page">
        <div className="opening">
          <div className="opening__top">
            <Link className="btn btn--quiet" to={`/learn/${program.id}/${unit.id}`}>
              ← {content.unit.title}
            </Link>
            <span className="spacer" />
            <span className="opening__step">
              שלב 1 מתוך {steps} · פתיח היחידה
            </span>
            <span className="opening__track">
              <i style={{ width: '8%' }} />
            </span>
          </div>

          <div className="opening__grid">
            <section className="opening__panel">
              <img className="opening__mark" src={assetUrl('assets/ngg-mark-white.png')} alt="" />
              <div className="opening__inner">
                <div className="opening__kicker">
                  <b>פתיח היחידה</b>
                  <span>
                    יחידה {content.unit.n} · {formatTime(length)}
                  </span>
                </div>

                <h1 className="opening__title">{content.unit.title}</h1>
                <p className="opening__obj">{content.unit.lead}</p>

                <div className="introplayer">
                  <div className="introplayer__row">
                    <button
                      type="button"
                      className="introplayer__btn"
                      onClick={toggle}
                      aria-label={state === 'playing' ? 'להשהות את הפתיח' : 'להשמיע את הפתיח'}
                    >
                      {state === 'playing' ? '❚❚' : '▶'}
                    </button>
                    <div className="introplayer__wave" data-on={running || heard} data-paused={state === 'paused'} aria-hidden>
                      {bars.map((bar, i) => (
                        <i
                          key={i}
                          style={{
                            height: `${bar.height}px`,
                            animationDuration: `${bar.duration}s`,
                            animationDelay: `${bar.delay}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="introplayer__time">
                      {formatTime(elapsed)} / {formatTime(length)}
                    </span>
                  </div>
                  <div className="introplayer__track">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {!audible && (
                  <p style={{ marginTop: 14, fontSize: 12.5, color: 'rgba(255,255,255,.55)' }}>
                    הקלטת הפתיח ליחידה הזאת לא נמצאת בספרייה — אפשר להמשיך לנאגט הראשון.
                  </p>
                )}

                <div className="opening__cta">
                  <button
                    type="button"
                    className={`btn ${state === 'idle' ? 'btn--outline' : 'btn--go'}`}
                    onClick={advance}
                  >
                    לנאגט הראשון ←
                  </button>
                  <span className="opening__hint">
                    {state === 'idle'
                      ? `${lengthPhrase(length)} שממסגרות את כל היחידה.`
                      : heard
                        ? 'הפתיח הושמע.'
                        : 'אפשר להמשיך גם בזמן ההאזנה.'}
                  </span>
                </div>
              </div>
            </section>

            <aside className="card upnext">
              <h3>מה בהמשך היחידה</h3>
              <div className="upnext__open">
                <i>▶</i>
                <b>פתיח היחידה</b>
                <span>{formatTime(length)}</span>
              </div>
              {content.segments.map((segment, i) => (
                <div key={segment.id} className="upnext__row">
                  <i>{i + 1}</i>
                  <b>{segment.title}</b>
                  <span>{formatTime(segment.end - segment.start)}</span>
                </div>
              ))}
              <div className="upnext__ex">
                <div className="upnext__row">
                  <i>✓</i>
                  <b>{unit.assessment}</b>
                  <span>מסכם</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </Shell>
  );
}

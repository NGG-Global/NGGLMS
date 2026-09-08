import { Link, useParams } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { assetUrl, videoUrl } from '../app/paths';
import {
  episodeClock,
  episodeMinutes,
  explainerEpisode,
  explainerSeries,
  nextEpisode,
} from '../content/explainers';
import './explainers.css';

/**
 * The Claude instruction series: a list of episodes, and one page each.
 *
 * Deliberately not the nugget player. That player owns its own clock because it drives
 * a scene stage against a narration timeline, and it withholds scrubbing so a learner
 * cannot skip past the beat a reveal hangs off. An episode has no such structure — it
 * is a finished film — so it gets native controls, and the learner can scrub, pause and
 * re-watch a passage the way they would any other video.
 */
export function Explainers() {
  const { episodes } = explainerSeries;
  const total = episodes.reduce((sum, ep) => sum + ep.duration, 0);

  return (
    <Shell crumb={explainerSeries.title}>
      <main className="page page--narrow" style={{ margin: '0 auto' }}>
        <div className="page__head">
          <div>
            <div className="page__kicker">הדרכות קלוד</div>
            <h1>{explainerSeries.title}</h1>
            <p>{explainerSeries.lead}</p>
          </div>
        </div>

        <div className="chipset" style={{ marginBottom: 18 }}>
          <span className="chip chip--outline">
            {episodes.length === 1 ? 'פרק אחד' : `${episodes.length} פרקים`}
          </span>
          <span className="chip chip--plain">{Math.max(1, Math.round(total / 60))} דקות סה״כ</span>
        </div>

        <ol className="eplist">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <Link className="eprow" to={`/explainers/${ep.id}`}>
                <span className="eprow__thumb" aria-hidden>
                  {ep.poster ? <img src={assetUrl(ep.poster)} alt="" loading="lazy" /> : null}
                  <span className="eprow__n">{ep.n}</span>
                </span>
                <span className="eprow__body">
                  <span className="eprow__k">{ep.kicker}</span>
                  <span className="eprow__t">{ep.title}</span>
                  <span className="eprow__s">{ep.summary}</span>
                </span>
                <span className="eprow__meta">
                  <b>{episodeMinutes(ep)} דק׳</b>
                  <span className="eprow__play" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {episodes.length === 0 && <div className="empty">עוד לא פורסמו פרקים.</div>}
      </main>
    </Shell>
  );
}

/** One episode: the film, then what to take from it. */
export function ExplainerEpisodePage() {
  const { episodeId } = useParams();
  const episode = episodeId ? explainerEpisode(episodeId) : undefined;

  if (!episode) {
    return (
      <Shell crumb={explainerSeries.title}>
        <main className="page page--narrow" style={{ margin: '0 auto' }}>
          <div className="empty">
            הפרק לא נמצא. <Link to="/explainers">חזרה לסדרה</Link>
          </div>
        </main>
      </Shell>
    );
  }

  const next = nextEpisode(episode.id);

  return (
    <Shell crumb={`${explainerSeries.title} · ${episode.kicker}`}>
      <main className="page page--narrow" style={{ margin: '0 auto' }}>
        <div className="page__head">
          <div>
            <div className="page__kicker">{episode.kicker}</div>
            <h1>{episode.title}</h1>
          </div>
        </div>

        {/* Native controls, and no autoplay: the learner opened a page, they did not
            ask for sound to start. `preload="metadata"` so the duration is right
            without pulling 24MB before anyone presses play. */}
        <div className="epframe">
          <video
            className="epframe__video"
            src={videoUrl(episode.file)}
            poster={episode.poster ? assetUrl(episode.poster) : undefined}
            controls
            preload="metadata"
            playsInline
            controlsList="nodownload"
          />
        </div>

        <div className="meta" style={{ marginTop: 12 }}>
          {episodeClock(episode)} · 1080p
        </div>

        <section className="card card--pad" style={{ marginTop: 22 }}>
          <div className="micro">על הפרק</div>
          <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>
            {episode.summary}
          </p>
        </section>

        <section className="epkeep">
          <div className="micro">מה לקחת מכאן</div>
          <p>{episode.takeaway}</p>
        </section>

        <nav className="epnav">
          <Link className="btn btn--ghost" to="/explainers">
            כל הפרקים
          </Link>
          {next && (
            <Link className="btn btn--primary" to={`/explainers/${next.id}`}>
              {next.kicker}: {next.title}
            </Link>
          )}
        </nav>
      </main>
    </Shell>
  );
}

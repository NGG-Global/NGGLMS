// Claude instruction videos.
//
// A separate content family from the narrated units, because an episode is a finished
// film rather than a narration the platform animates. A `Segment` carries a slice of a
// narration file, a scene model, a cue timeline and an exercise, and the player builds
// the picture from them; an episode has none of that — the video *is* the content, and
// the player's only job is to hand it to a <video> element. Modelling one as the other
// would mean inventing a scene map and an exercise nobody wrote.
//
// So episodes are declared here rather than scanned, the way library.ts declares the
// catalogue. `duration` and `bytes` are read from the file once, at the time it is
// added — `npm run check:explainers` re-reads them and fails on drift, so the numbers
// on screen cannot quietly stop matching what is in the store.

export interface ExplainerEpisode {
  /** Stable id, used in the route. */
  id: string;
  /** 1-based episode number inside the series. */
  n: number;
  title: string;
  /** Short eyebrow label. */
  kicker: string;
  summary: string;
  /** The one line to leave with. */
  takeaway: string;
  /** Store pathname, resolved through `videoUrl()`. Never a full URL. */
  file: string;
  /**
   * Still frame, served from the build rather than the store.
   *
   * A poster is tens of kilobytes where the film is tens of megabytes, so the reason
   * the videos left the repository does not apply to it — and keeping it local means
   * the list and the player have something to show before anything is fetched.
   */
  poster?: string;
  /** Playable length in seconds, read from the file. */
  duration: number;
  bytes: number;
}

export interface ExplainerSeries {
  id: string;
  title: string;
  lead: string;
  episodes: ExplainerEpisode[];
}

export const explainerSeries: ExplainerSeries = {
  id: 'claude',
  title: 'קלוד — סדרת הדרכה',
  lead: 'סדרת פרקים קצרים על עבודה עם קלוד: מה להעביר לו, איך לזהות משימה שמתאימה, ומה נשאר באחריות שלכם.',
  episodes: [
    {
      id: 'ep01',
      n: 1,
      title: 'עוזר מקצועי, לא עוד כלי',
      kicker: 'פרק 1',
      summary:
        'רוב הכלים שאנחנו עובדים איתם דורשים שנדע בדיוק מה לעשות ואיפה ללחוץ. קלוד עובד אחרת — מעבירים לו משימה שלמה והוא מבצע אותה: מסמך של 40 עמודים שהוא קורא ועונה עליו לעומק, טיוטת הצעה ללקוח, מסמך תהליך, שלד של מצגת. הפרק מציג את כלל האצבע לזיהוי משימה מתאימה, את החיבור של החשבון הארגוני למיקרוסופט 365, ואת הגבולות שנשארים אצל האדם.',
      takeaway:
        'אם המשימה מתחילה מטקסט, מנתונים או מרעיון — היא כנראה מתאימה. שיקול הדעת המקצועי נשאר אצלכם.',
      file: 'assets/video/claude-ep01.mp4',
      poster: 'assets/poster/claude-ep01.jpg',
      duration: 219.78,
      bytes: 24429891,
    },
  ],
};

/** Rounded running time, for the episode list. */
export function episodeMinutes(episode: ExplainerEpisode): number {
  return Math.max(1, Math.round(episode.duration / 60));
}

/** mm:ss, for the episode's own page. */
export function episodeClock(episode: ExplainerEpisode): string {
  const total = Math.round(episode.duration);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function explainerEpisode(id: string): ExplainerEpisode | undefined {
  return explainerSeries.episodes.find((episode) => episode.id === id);
}

/** The episode after this one, for the "next" link at the end of a page. */
export function nextEpisode(id: string): ExplainerEpisode | undefined {
  const at = explainerSeries.episodes.findIndex((episode) => episode.id === id);
  return at < 0 ? undefined : explainerSeries.episodes[at + 1];
}

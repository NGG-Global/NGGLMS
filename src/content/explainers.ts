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
  /**
   * What the episode is about, in the platform's words. This is the name learners pick
   * an episode by, so it says the subject outright rather than repeating the film's
   * own, more figurative title.
   */
  title: string;
  /** The title on the film's own title card, shown beside the player so the card is recognised. */
  filmTitle: string;
  /** Short eyebrow label. */
  kicker: string;
  /** The film's own subtitle, from its title card. */
  lead: string;
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
  // The films name themselves on their own title cards — series, episode number,
  // title and subtitle. The series name, `kicker`, `filmTitle` and `lead` are
  // transcribed from those cards, and anything there that disagrees with a card is a
  // mistake. `title` is the exception on purpose: the card titles are figurative
  // ("פשוט לשאול"), so the platform lists each episode under a name that says what it
  // covers, and shows the card's title next to the player.
  title: 'מדריך קלוד',
  lead: 'סדרת פרקים קצרים על עבודה עם קלוד: מה להעביר לו, איפה הוא יושב, ואיך להגדיר אותו פעם אחת כך שיתאים לעבודה שלכם.',
  episodes: [
    {
      id: 'ep01',
      n: 1,
      title: 'מה קלוד עושה ואילו משימות מתאימות לו',
      filmTitle: 'קלוד עובד אחרת',
      kicker: 'פרק ראשון',
      lead: 'אתם מתארים במילים שלכם מה אתם צריכים — והוא מבצע',
      summary:
        'רוב הכלים שאנחנו עובדים איתם דורשים שנדע בדיוק מה לעשות ואיפה ללחוץ. קלוד עובד אחרת — מעבירים לו משימה שלמה והוא מבצע אותה: מסמך של 40 עמודים שהוא קורא ועונה עליו לעומק, טיוטת הצעה ללקוח, מסמך תהליך, שלד של מצגת. הפרק מציג את כלל האצבע לזיהוי משימה מתאימה, את החיבור של החשבון הארגוני למיקרוסופט 365, ואת הגבולות שנשארים אצל האדם.',
      takeaway:
        'אם המשימה מתחילה מטקסט, מנתונים או מרעיון — היא כנראה מתאימה. שיקול הדעת המקצועי נשאר אצלכם.',
      file: 'assets/video/claude-ep01.mp4',
      poster: 'assets/poster/claude-ep01.jpg',
      duration: 219.78,
      bytes: 24429891,
    },
    {
      id: 'ep02',
      n: 2,
      title: 'התקנה, בחירת מודל והגדרות אישיות',
      filmTitle: 'מתחברים ומתחילים',
      kicker: 'פרק שני',
      lead: 'התקנה, חשבון, והמסך שממנו הכל מתחיל',
      summary:
        'חשבון אחד עובד בנייד, במחשב ובדפדפן, והשיחות עוברות איתכם בין המכשירים. הפרק עובר על המסך הראשי ועל שדה הטקסט היחיד שממנו הכל מתחיל, על בורר המודלים — ולמה המודל הכבד ביותר הוא לא בהכרח הנכון, כשהוא מחזיר אותה תוצאה תמורת יותר זמן ויותר מכסה — ועל ההגדרות האישיות: מגדירים פעם אחת מה התפקיד שלכם, איזה אורך תשובה אתם רוצים ואיזה סוג דוגמאות, במקום להסביר את זה מחדש בכל צ׳אט.',
      takeaway:
        'פתחתם את הבורר ואין לכם מושג? Sonnet הוא בדרך כלל הימור מצוין. ואת ההעדפות שלכם כדאי להגדיר פעם אחת, לא בכל שיחה.',
      file: 'assets/video/claude-ep02.mp4',
      poster: 'assets/poster/claude-ep02.jpg',
      duration: 414.44,
      bytes: 29290366,
    },
    {
      id: 'ep03',
      n: 3,
      title: 'חיבור קלוד למיקרוסופט 365 והרשאות הגישה',
      filmTitle: 'מתחברים למערכות',
      kicker: 'פרק שלישי',
      lead: 'עכשיו קלוד מתחבר למקום שבו העבודה שלכם כבר נמצאת',
      summary:
        'החיבור למיקרוסופט 365 מאפשר לחפש במיילים וביומן, לעבור על שרשור ארוך ולהוציא ממנו את מה שחשוב, ולבקש בקשה אחת — "מצא את מסמך התכנון האחרון בשיירפוינט וסכם את עיקרי הדברים" — כך שקלוד מחפש בטימס, בשיירפוינט או באאוטלוק בלי שתפתחו תיקיות ובלי שתעלו קבצים. הפרק מדגיש שההרשאות לא משתנות: מה שקלוד רואה הוא בדיוק מה שאתם מורשים לראות, ומבחין בין לחפש ולקרוא לבין לעשות.',
      takeaway:
        'קלוד רואה רק את מה שאתם מורשים לראות — אותם כללי הרשאות בדיוק. וכדאי לזכור את ההבדל בין לקרוא לבין לעשות.',
      file: 'assets/video/claude-ep03.mp4',
      poster: 'assets/poster/claude-ep03.jpg',
      duration: 277.44,
      bytes: 22354463,
    },
    {
      id: 'ep04',
      n: 4,
      title: 'מתן הקשר בבקשה ושיפור התשובה באותה שיחה',
      filmTitle: 'לתת הקשר, ולעבוד בסבבים',
      kicker: 'פרק רביעי',
      lead: 'למה התשובה הראשונה היא כמעט תמיד רק ההתחלה',
      summary:
        'אותו כלי ואותה בקשה יכולים להחזיר טיוטה שאפשר להתחיל לעבוד איתה, או טיוטה גנרית שכמעט צריך לכתוב מחדש — וההבדל הוא ההקשר. הפרק מראה שהידע על הפרויקט שלכם מתחיל ריק, איך אילוץ שנאמר מראש ("סדנה של יומיים") משנה את התוצאה, ומדגים את הלופ שכדאי להימנע ממנו: שולחים בקשה, מקבלים תשובה שלא בדיוק מתאימה, פותחים צ׳אט חדש ומנסחים הכול מחדש — וההקשר שנצבר נשאר על עשרים אחוז. במקום זה, ממשיכים באותה שיחה ועובדים בסבבים.',
      takeaway:
        'התשובה הראשונה היא נקודת פתיחה, לא תוצר. אל תפתחו צ׳אט חדש — תקנו באותה שיחה, ותנו את האילוצים מראש.',
      file: 'assets/video/claude-ep04.mp4',
      poster: 'assets/poster/claude-ep04.jpg',
      duration: 305.75,
      bytes: 28761595,
    },
    {
      id: 'ep05',
      n: 5,
      title: 'עבודה עם קבצים: בצ׳אט או כמשימה שלמה על המחשב',
      filmTitle: 'לעבוד על הקבצים עצמם',
      kicker: 'פרק חמישי',
      lead: 'ומתי הצ׳אט הוא הכלי הנכון — ומתי בכלל לא',
      summary:
        'גוררים קובץ לתוך השיחה — הצעה, טבלת נתונים, מצגת — וקלוד קורא אותו ועונה עליו. הפרק מראה אילו שאלות מוציאות מזה יותר ("מה ההתנגדויות שעולות כאן"), ואז מבחין בין שני מצבי עבודה: בצ׳אט מעלים קבצים לשיחה ואתם בפנים כל הדרך, ולעומת זאת אפשר להעביר משימה שלמה שמנוהלת שלב אחרי שלב על הקבצים שבמחשב — הכול מתועד, אפשר לעצור באמצע, יש בקשת אישור, ואתם חוזרים לתוצאה.',
      takeaway:
        'הצ׳אט מתאים כשאתם רוצים להיות בפנים בכל צעד. משימה שלמה על הקבצים עצמם מתאימה כשאתם רוצים לחזור לתוצאה — עם תיעוד ואפשרות לעצור.',
      file: 'assets/video/claude-ep05.mp4',
      poster: 'assets/poster/claude-ep05.jpg',
      duration: 236.78,
      bytes: 23024558,
    },
    {
      id: 'ep06',
      n: 6,
      title: 'שליפת מידע ממיקרוסופט 365 בשאלה אחת',
      filmTitle: 'פשוט לשאול',
      kicker: 'פרק שישי',
      lead: 'המידע כבר נמצא במערכות שלכם — עכשיו רק שולפים אותו',
      summary:
        'במקום לפתוח את אאוטלוק ולחפש, פשוט שואלים. שאלה אחת — "מה קורה עם הלקוח הזה?" — נשענת על היומן, על טימס, על שיירפוינט ועל אאוטלוק ומחזירה תמונה אחת: המידע כבר שם, פזור, וקלוד רק אוסף אותו. שימושי במיוחד כשפגישה קופצת עליכם פתאום, ועובד גם על תמלול של פגישה כמו כל שאלה אחרת.',
      takeaway:
        'אל תחפשו — תשאלו. המידע כבר נמצא במערכות שלכם, וצריך רק לבקש שיאסוף אותו לתמונה אחת.',
      file: 'assets/video/claude-ep06.mp4',
      poster: 'assets/poster/claude-ep06.jpg',
      duration: 185.54,
      bytes: 28553007,
    },
    {
      id: 'ep07',
      n: 7,
      title: 'פרויקטים: חומרים והוראות קבועים ללקוח או לנושא',
      filmTitle: 'פרויקטים',
      kicker: 'פרק שביעי',
      lead: 'מסבירים פעם אחת — וזה נשאר',
      summary:
        'צ׳אט הוא שיחה בודדת שנעלמת מהעין ברגע שעברתם הלאה; פרויקט הוא הבית הקבוע של נושא שלם. מוסיפים לו תיק חומרים והוראות — הקשר, מסמכים, הנחיות — וכל שיחה שנפתחת בתוכו נשענת עליהם, כך שלא צריך להסביר מחדש בכל פעם, וזה מתעדכן בקלות. הפרק גם מזהיר על הגבול: מה שנאמר בשיחה אחת לא עובר מעצמו לשנייה — רק החומרים וההוראות ברמת הפרויקט משותפים לכולן.',
      takeaway:
        'פרויקט אחד ללקוח — לא פרויקט אחד לכל שיחה איתו. מה שצריך לחזור על עצמו שייך לתיק החומרים, לא לצ׳אט.',
      file: 'assets/video/claude-ep07.mp4',
      poster: 'assets/poster/claude-ep07.jpg',
      duration: 220.29,
      bytes: 27229628,
    },
    // No episode 8 yet: this film's card says פרק תשיעי, so it is numbered as the film
    // is. The list reads 7 → 9 until episode 8 arrives and is added above.
    {
      id: 'ep09',
      n: 9,
      title: 'בניית מצגת ב-Claude Design: מהבריף ועד הייצוא',
      filmTitle: 'מצגות מתוך השיחה',
      kicker: 'פרק תשיעי',
      lead: 'כמה החלטות קטנות בהתחלה — שחוסכות הרבה עבודה אחר כך',
      summary:
        'מצגת נבנית ישירות מתוך אותה שיחה, בלי כלי נפרד ובלי לקפוץ בין מסכים. הפרק עובר על ההחלטות שכדאי לקבל בהתחלה: מאיפה מתחילים — כמעט תמיד כבר יש מסמך, סיכום או מצגת קודמת לצרף, במקום לכתוב בריף שלם מחדש; איך המצגת אמורה להיראות — בוחרים דיזיין סיסטם, של NGG או של לקוח מסוים, והצבעים, הפונטים והלוגו נכונים מההתחלה; ובריף קצר — למי, מה המטרה, כמה זמן ועל מה. ואז החלק שחוסך הכי הרבה זמן: לבקש קודם סטורי־ליין — כותרת ומסר מרכזי לכל שקף, בלי עיצוב — לתקן את הסדר, ורק אז לבנות. אחרי הבנייה יש שלוש דרכים לחדד: שינוי רוחבי בצ׳אט, תיקון קטן ישירות על הקנבס, והערה על האלמנט עצמו. בסוף מייצאים ל-PowerPoint, ל-PDF או לקישור. ואם יש כבר תבנית שעובדת, כמו הצעה פורמלית ללקוח — עובדים בתבנית הקיימת.',
      takeaway:
        'קודם סטורי־ליין, אחר כך עיצוב: לשנות שורה ברשימה לוקח כמה שניות, לפרק מבנה של מצגת שכבר עוצבה — הרבה פחות. ויש תבנית טובה שעובדת? משתמשים בה.',
      file: 'assets/video/claude-ep09.mp4',
      poster: 'assets/poster/claude-ep09.jpg',
      duration: 382.93,
      bytes: 27059494,
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

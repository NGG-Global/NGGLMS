// NGG content library.
//
// Only units that exist. The library holds two courses, each a topic of its own: the
// Copilot Essentials films under "יסודות Copilot", and the Claude guide episodes under
// "יסודות קלוד". Each unit carries a `contentId` pointing at a produced unit module whose
// nuggets are those films.
//
// Retired ids — do not reuse them for a new unit. Programmes saved before a unit was
// retired may still reference its id, and the screens ignore ids the library does not
// know; a new unit given an old id would silently appear inside those programmes.
//   u2       the responsible-AI unit, retired when the library was narrowed to Copilot
//   u3–u16   planned units lifted from the platform design, never produced
// u1 keeps its id: the Copilot Essentials unit 1 replaced its content in place.

export interface LibraryNugget {
  title: string;
  type: string;
  minutes: number;
  summary?: string;
  takeaway?: string;
}

export interface LibraryQuizItem {
  q: string;
  opts: string[];
  answer: number;
  why: string;
}

export interface LibraryTask {
  title: string;
  lead: string;
  quote?: string;
  listLead?: string;
  items?: string[];
  ask?: string;
  cta: string;
}

export interface LibraryUnit {
  id: string;
  title: string;
  summary: string;
  topic: string;
  roles: string[];
  minutes: number;
  contentType: string;
  assessment: string;
  tags: string[];
  /** Recency rank used by the "recently added" sort; higher is newer. */
  recencyRank: number;
  objective: string;
  recommendedFor: string;
  prerequisite?: string;
  /** Present when narrated content exists and the unit is playable. */
  contentId?: string;
  outcomes: string[];
  nuggets: LibraryNugget[];
  quiz?: LibraryQuizItem[];
  task?: LibraryTask;
}

export const library: LibraryUnit[] = [
    {
      id: "u1",
      title: "לעבוד עם AI",
      summary: "איפה Copilot משתלב בעבודה, על איזה מידע התשובה שלו נשענת, איך מנהלים איתו שיחה שמתקדמת לתוצאה טובה, ומתי בודקים לפני שסומכים.",
      topic: "יסודות Copilot",
      roles: ["כללי"],
      minutes: 11,
      contentType: "וידאו + בוחן",
      assessment: "בוחן",
      tags: ["יסודות Copilot", "ליבה"],
      recencyRank: 13,
      objective: "להכיר את Microsoft 365 Copilot ואת Copilot Chat, לבחור את המקור שהתשובה צריכה להישען עליו, לנסח בקשה שממשיכים לדייק בשיחה, ולהתאים את רמת הבדיקה להשפעה של טעות.",
      recommendedFor: "כל העובדים. מומלץ כיחידת הפתיחה של כל תוכנית AI.",
      contentId: "copilot-01",
      outcomes: ["לזהות איפה Copilot משתלב בעבודה היומיומית", "לבחור את המקור הנכון לפני שמנסחים בקשה", "לנסח בקשה עם מטרה, הקשר, מקור וציפייה לתוצאה", "לשפר תשובה בשיחה במקום להתחיל מחדש", "להתאים את רמת הבדיקה להשפעה של טעות"],
      nuggets: [
        { title: "מה זה Copilot ואיפה מתחילים", type: "וידאו", minutes: 3, summary: "Copilot משתלב ב-Word, Outlook ו-Teams, והמקום הפשוט להתחיל ממנו הוא Copilot Chat.", takeaway: "העבודה עם הצ׳אט היא שיחה: נותנים כיוון, רואים מה התקבל, ומדייקים." },
        { title: "על מה התשובה מבוססת: מקורות ו-Grounding", type: "וידאו", minutes: 2, summary: "התשובה נשענת על הרשת, על המידע הארגוני או על קובץ מסוים, ו-Copilot לא עוקף הרשאות.", takeaway: "קודם בוחרים את המקור, ואחר כך מנסחים את הבקשה." },
        { title: "המיתוס של הפרומפט המושלם", type: "וידאו", minutes: 3, summary: "מטרה, הקשר, מקור וציפייה לתוצאה נותנים כיוון. משם משפרים בשינוי אחד בכל פעם.", takeaway: "הפרומפט הראשון נותן כיוון. האיטרציות מביאות לתוצאה." },
        { title: "לבדוק לפני שסומכים", type: "וידאו", minutes: 3, summary: "תשובה משכנעת עדיין יכולה להיות חלקית או לא מדויקת. רמת הבדיקה נקבעת לפי ההשפעה של טעות.", takeaway: "Copilot יכול לעזור להכין את ההחלטה. האדם הוא שמקבל אותה." }
      ],
      quiz: [
        { q: "מהי הדרך הנכונה להתייחס לתשובה הראשונה שה-AI מייצר?", opts: ["תוצר גמור שאפשר להעביר הלאה", "טיוטה שעורכים, בודקים ולוקחים עליה אחריות", "הוכחה שהכלי הבין את הכוונה", "סימן שצריך לנסח מחדש ולהתחיל מאפס"], answer: 1, why: "הפלט הראשון הוא נקודת פתיחה. אתם נשארים הכותבים: עורכים, מאמתים ומחליטים מה יוצא." },
        { q: "עובד מבקש מהעוזר את נתון ההכנסות של הרבעון וקיבל מספר בביטחון מלא. מה עליו לעשות?", opts: ["להשתמש בו — לעוזר יש גישה למערכות", "לבדוק אותו מול מערכת המקור לפני השימוש", "לשאול שוב כדי לאמת", "לעגל למטה ליתר ביטחון"], answer: 1, why: "שטף לשוני הוא לא ראיה. אם הכלי לא מחובר למערכת המקור, כל מספר הוא בלתי מאומת." },
        { q: "לאיזו משימה AI מתאים במיוחד?", opts: ["להחליט את מי לקדם", "להפיק טיוטה ראשונה למסמך ארוך", "לאשר החזר כספי ללקוח", "לחתום על דוח רגולטורי"], answer: 1, why: "AI חזק בניסוח, סיכום וארגון מחדש. החלטות עם השלכות על אנשים נשארות אצל אנשים." },
        { q: "מה זה \"לתת הקשר\" בפועל?", opts: ["לכתוב פרומפט ארוך יותר", "לנסח בנימוס", "לספק את הקהל, המטרה, האילוצים והחומר שלכם", "לשאול כמה שאלות בבת אחת"], answer: 2, why: "הקשר הוא הפרטים שרק לכם יש: למי זה מיועד, איך נראית תוצאה טובה, ואיזה מסמכים רלוונטיים." }
      ]
    },
    {
      id: "u17",
      title: "Copilot באפליקציות",
      summary: "Copilot ב-Outlook, ב-Teams, ב-Word וב-PowerPoint: מבינים שרשור, פגישה, מסמך ומצגת, מנסחים מהם תוצר, ובודקים אותו לפני שהוא יוצא.",
      topic: "יסודות Copilot",
      roles: ["כללי"],
      minutes: 9,
      contentType: "וידאו + תרגיל",
      assessment: "תרגיל",
      tags: ["יסודות Copilot", "ליבה"],
      recencyRank: 14,
      objective: "להשתמש ב-Copilot ב-Outlook, ב-Teams, ב-Word וב-PowerPoint כדי להבין שרשורים, פגישות, מסמכים ומצגות, לנסח מהם תשובה, סיכום, טיוטה או מצגת, ולבדוק את מה שיוצא לפני שהוא נשלח או מוצג.",
      recommendedFor: "כל העובדים שעובדים ב-Microsoft 365. מומלץ אחרי יחידת היסודות.",
      prerequisite: "לעבוד עם AI",
      contentId: "copilot-02",
      outcomes: ["לסכם שרשור מייל לפי מה סוכם, מה פתוח ומה מבקשים ממני", "לנסח תשובה בלי להכניס התחייבות שלא התכוונו אליה", "לשאול על פגישה שאלות ספציפיות במקום לבקש סיכום כללי", "לבדוק מה באמת הוחלט ולמי הוצמדה כל משימה לפני שליחה", "לשאול על מסמך ארוך ב-Word בלי לשנות אותו, ולבדוק את התשובה מול ההפניות", "לבנות מצגת ב-PowerPoint שמתחילה במסר ולבדוק אותה מול המקור"],
      nuggets: [
        { title: "Copilot ב-Outlook: מהשרשור לתשובה", type: "וידאו", minutes: 2, summary: "מסכמים שרשור לפי מה סוכם, מה פתוח ומה מבקשים ממני, ומנסחים תשובה שמשנים בה דבר אחד בכל פעם.", takeaway: "כשמשנים טון, בודקים שלא השתנתה גם המשמעות." },
        { title: "Copilot ב-Teams: מה באמת הוחלט", type: "וידאו", minutes: 2, summary: "שאלות ספציפיות על הפגישה נותנות יותר מסיכום כללי, ו-Copilot רואה רק את מה שבתמלול.", takeaway: "Copilot עוזר לזכור ולסדר. ההחלטה מה סוכם נשארת שלנו." },
        { title: "Copilot ב-Word: מהמסמך להבנה ולטיוטה", type: "וידאו", minutes: 2, summary: "שואלים על מסמך ארוך ב-Chat only בלי לשנות אותו, ובודקים את התשובה מול ההפניות למסמך.", takeaway: "מספרים, שמות, תאריכים וציטוטים בודקים מול המקור." },
        { title: "Copilot ב-PowerPoint: מתחילים במסר", type: "וידאו", minutes: 2, summary: "מצגת מקובץ קיים היא טיוטה. קודם מנסחים את המסר, אחר כך מחדדים שקף אחד בכל פעם.", takeaway: "האחריות למה שעולה על המסך נשארת שלנו." }
      ]
    },
    {
      id: "u18",
      title: "מדריך קלוד",
      summary: "מה קלוד עושה ולאילו משימות הוא מתאים, איך מתקינים ומגדירים אותו, איך מחברים אותו למיקרוסופט 365, ואיך עובדים איתו עם הקשר, קבצים, פרויקטים ומצגות.",
      topic: "יסודות קלוד",
      roles: ["כללי"],
      minutes: 38,
      contentType: "וידאו + תרגיל",
      assessment: "תרגיל",
      tags: ["יסודות קלוד", "ליבה"],
      recencyRank: 15,
      objective: "לעבוד עם קלוד כעוזר מקצועי: לבחור משימות שמתאימות לו ומודל שמתאים למשימה, לחבר אותו למידע הארגוני בתוך ההרשאות, לתת לו הקשר ולשפר בסבבים, ולארגן עבודה חוזרת בפרויקטים.",
      recommendedFor: "כל העובדים שעובדים עם קלוד בחשבון הארגוני.",
      contentId: "claude-01",
      outcomes: ["לזהות משימה שמתאימה לקלוד ומשימה שעדיף לעשות לבד", "לבחור מודל לפי המשימה ולהגדיר העדפות אישיות פעם אחת", "לשלוף מידע ממיקרוסופט 365 בתוך ההרשאות הקיימות", "לתת הקשר, לעבוד עם קבצים ולשפר תשובה באותה שיחה", "לארגן עבודה חוזרת על לקוח או נושא בפרויקט"],
      nuggets: [
        { title: "מה קלוד עושה ואילו משימות מתאימות לו", type: "וידאו", minutes: 4, takeaway: "אם המשימה מתחילה מטקסט, מנתונים או מרעיון — היא כנראה מתאימה. שיקול הדעת המקצועי נשאר אצלכם." },
        { title: "התקנה, בחירת מודל והגדרות אישיות", type: "וידאו", minutes: 7, takeaway: "פתחתם את הבורר ואין לכם מושג? Sonnet הוא בדרך כלל הימור מצוין. ואת ההעדפות שלכם כדאי להגדיר פעם אחת, לא בכל שיחה." },
        { title: "חיבור קלוד למיקרוסופט 365 והרשאות הגישה", type: "וידאו", minutes: 5, takeaway: "קלוד רואה רק את מה שאתם מורשים לראות — אותם כללי הרשאות בדיוק. וכדאי לזכור את ההבדל בין לקרוא לבין לעשות." },
        { title: "מתן הקשר בבקשה ושיפור התשובה באותה שיחה", type: "וידאו", minutes: 5, takeaway: "התשובה הראשונה היא נקודת פתיחה, לא תוצר. אל תפתחו צ׳אט חדש — תקנו באותה שיחה, ותנו את האילוצים מראש." },
        { title: "עבודה עם קבצים: בצ׳אט או כמשימה שלמה על המחשב", type: "וידאו", minutes: 4, takeaway: "הצ׳אט מתאים כשאתם רוצים להיות בפנים בכל צעד. משימה שלמה על הקבצים עצמם מתאימה כשאתם רוצים לחזור לתוצאה — עם תיעוד ואפשרות לעצור." },
        { title: "שליפת מידע ממיקרוסופט 365 בשאלה אחת", type: "וידאו", minutes: 3, takeaway: "אל תחפשו — תשאלו. המידע כבר נמצא במערכות שלכם, וצריך רק לבקש שיאסוף אותו לתמונה אחת." },
        { title: "פרויקטים: חומרים והוראות קבועים ללקוח או לנושא", type: "וידאו", minutes: 4, takeaway: "פרויקט אחד ללקוח — לא פרויקט אחד לכל שיחה איתו. מה שצריך לחזור על עצמו שייך לתיק החומרים, לא לצ׳אט." },
        { title: "בניית מצגת ב-Claude Design: מהבריף ועד הייצוא", type: "וידאו", minutes: 6, takeaway: "קודם סטורי־ליין, אחר כך עיצוב: לשנות שורה ברשימה לוקח כמה שניות, לפרק מבנה של מצגת שכבר עוצבה — הרבה פחות. ויש תבנית טובה שעובדת? משתמשים בה." }
      ]
    }
];

export const topics: string[] = ["יסודות Copilot", "יסודות קלוד"];

export const roles: string[] = ["כללי", "מנהלים", "ניהול פרויקטים", "משאבי אנוש", "מכירות", "שיווק", "כספים"];

export const contentTypes: string[] = ["וידאו + בוחן", "תרחיש", "וידאו + תרגיל", "מטלה מעשית"];

export const languages: string[] = ["עברית", "אנגלית", "ערבית", "רוסית"];

/** The flagship programme the seeded workspace opens with. */
export const seedFlagshipProgram = {
  "title": "יסודות AI לכל העובדים",
  "course": "לעבוד חכם יותר עם AI",
  "client": "נורת׳ווינד",
  "audience": "כל העובדים",
  "description": "ללמוד לעבוד עם AI בצורה אפקטיבית, ליישם אותו בעבודה היומיומית ולדעת איפה האדם חייב להישאר במשוואה.",
  "units": [
    "u1",
    "u17"
  ],
  "welcome": "ברוכים הבאים. עשו יחידה אחת בכל פעם — החלקים המעשיים הם אלה שנשארים."
};

export function libraryUnit(id: string): LibraryUnit | undefined {
  return library.find((u) => u.id === id);
}

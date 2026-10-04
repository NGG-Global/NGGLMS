// NGG content library.
//
// Only units that exist. The library holds the Copilot Essentials films and nothing
// else: every unit sits under the "יסודות Copilot" topic, and each carries a `contentId`
// pointing at a produced unit module whose nuggets are those films.
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
      title: "Copilot ב-Outlook וב-Teams",
      summary: "מסכמים שרשור ארוך ועונים עליו בלי התחייבות מיותרת, ומוציאים מפגישה את מה שבאמת הוחלט ולמי.",
      topic: "יסודות Copilot",
      roles: ["כללי"],
      minutes: 4,
      contentType: "וידאו + תרגיל",
      assessment: "תרגיל",
      tags: ["יסודות Copilot", "ליבה"],
      recencyRank: 14,
      objective: "להשתמש ב-Copilot ב-Outlook וב-Teams כדי להבין שרשורים ופגישות, לנסח מהם תשובה או סיכום, ולבדוק את מה שיוצא לפני שהוא נשלח.",
      recommendedFor: "כל העובדים שעובדים ב-Microsoft 365. מומלץ אחרי יחידת היסודות.",
      prerequisite: "לעבוד עם AI",
      contentId: "copilot-02",
      outcomes: ["לסכם שרשור מייל לפי מה סוכם, מה פתוח ומה מבקשים ממני", "לנסח תשובה בלי להכניס התחייבות שלא התכוונו אליה", "לשאול על פגישה שאלות ספציפיות במקום לבקש סיכום כללי", "לבדוק מה באמת הוחלט ולמי הוצמדה כל משימה לפני שליחה"],
      nuggets: [
        { title: "Copilot ב-Outlook: מהשרשור לתשובה", type: "וידאו", minutes: 2, summary: "מסכמים שרשור לפי מה סוכם, מה פתוח ומה מבקשים ממני, ומנסחים תשובה שמשנים בה דבר אחד בכל פעם.", takeaway: "כשמשנים טון, בודקים שלא השתנתה גם המשמעות." },
        { title: "Copilot ב-Teams: מה באמת הוחלט", type: "וידאו", minutes: 2, summary: "שאלות ספציפיות על הפגישה נותנות יותר מסיכום כללי, ו-Copilot רואה רק את מה שבתמלול.", takeaway: "Copilot עוזר לזכור ולסדר. ההחלטה מה סוכם נשארת שלנו." }
      ]
    }
];

export const topics: string[] = ["יסודות Copilot"];

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

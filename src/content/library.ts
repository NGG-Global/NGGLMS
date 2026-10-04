// NGG content library.
//
// Only units that exist. Each entry carries a `contentId` pointing at a produced unit
// module, so everything the admin side lists can actually be played.
//
// The catalogue used to also hold fourteen planned units (u3–u16) lifted from the
// platform design, which made the library look fuller than the content behind it.
// They were removed so the library reflects what NGG has produced. Those ids are
// retired: programmes saved before the removal may still reference them, and the
// screens ignore any id the library does not know. Give a new unit a fresh id rather
// than reusing one of them, or it will silently appear inside those old programmes.

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
      summary: "איפה Copilot משתלב בעבודה, על איזה מידע התשובה שלו נשענת, ואיך מנהלים איתו שיחה שמתקדמת לתוצאה טובה.",
      topic: "מיומנויות AI ליבה",
      roles: ["כללי"],
      minutes: 8,
      contentType: "וידאו + בוחן",
      assessment: "בוחן",
      tags: ["מיומנויות AI ליבה", "שיטות עבודה מומלצות"],
      recencyRank: 13,
      objective: "להכיר את Microsoft 365 Copilot ואת Copilot Chat, לבחור את המקור שהתשובה צריכה להישען עליו, ולנסח בקשה שממשיכים לדייק בשיחה.",
      recommendedFor: "כל העובדים. מומלץ כיחידת הפתיחה של כל תוכנית AI.",
      contentId: "unit-01",
      outcomes: ["לזהות איפה Copilot משתלב בעבודה היומיומית", "לבחור את המקור הנכון לפני שמנסחים בקשה", "לנסח בקשה עם מטרה, הקשר, מקור וציפייה לתוצאה", "לשפר תשובה בשיחה במקום להתחיל מחדש"],
      nuggets: [
        { title: "מה זה Copilot ואיפה מתחילים", type: "וידאו", minutes: 3, summary: "Copilot משתלב ב-Word, Outlook ו-Teams, והמקום הפשוט להתחיל ממנו הוא Copilot Chat.", takeaway: "העבודה עם הצ׳אט היא שיחה: נותנים כיוון, רואים מה התקבל, ומדייקים." },
        { title: "על מה התשובה מבוססת: מקורות ו-Grounding", type: "וידאו", minutes: 2, summary: "התשובה נשענת על הרשת, על המידע הארגוני או על קובץ מסוים, ו-Copilot לא עוקף הרשאות.", takeaway: "קודם בוחרים את המקור, ואחר כך מנסחים את הבקשה." },
        { title: "המיתוס של הפרומפט המושלם", type: "וידאו", minutes: 3, summary: "מטרה, הקשר, מקור וציפייה לתוצאה נותנים כיוון. משם משפרים בשינוי אחד בכל פעם.", takeaway: "הפרומפט הראשון נותן כיוון. האיטרציות מביאות לתוצאה." }
      ],
      quiz: [
        { q: "מהי הדרך הנכונה להתייחס לתשובה הראשונה שה-AI מייצר?", opts: ["תוצר גמור שאפשר להעביר הלאה", "טיוטה שעורכים, בודקים ולוקחים עליה אחריות", "הוכחה שהכלי הבין את הכוונה", "סימן שצריך לנסח מחדש ולהתחיל מאפס"], answer: 1, why: "הפלט הראשון הוא נקודת פתיחה. אתם נשארים הכותבים: עורכים, מאמתים ומחליטים מה יוצא." },
        { q: "עובד מבקש מהעוזר את נתון ההכנסות של הרבעון וקיבל מספר בביטחון מלא. מה עליו לעשות?", opts: ["להשתמש בו — לעוזר יש גישה למערכות", "לבדוק אותו מול מערכת המקור לפני השימוש", "לשאול שוב כדי לאמת", "לעגל למטה ליתר ביטחון"], answer: 1, why: "שטף לשוני הוא לא ראיה. אם הכלי לא מחובר למערכת המקור, כל מספר הוא בלתי מאומת." },
        { q: "לאיזו משימה AI מתאים במיוחד?", opts: ["להחליט את מי לקדם", "להפיק טיוטה ראשונה למסמך ארוך", "לאשר החזר כספי ללקוח", "לחתום על דוח רגולטורי"], answer: 1, why: "AI חזק בניסוח, סיכום וארגון מחדש. החלטות עם השלכות על אנשים נשארות אצל אנשים." },
        { q: "מה זה \"לתת הקשר\" בפועל?", opts: ["לכתוב פרומפט ארוך יותר", "לנסח בנימוס", "לספק את הקהל, המטרה, האילוצים והחומר שלכם", "לשאול כמה שאלות בבת אחת"], answer: 2, why: "הקשר הוא הפרטים שרק לכם יש: למי זה מיועד, איך נראית תוצאה טובה, ואיזה מסמכים רלוונטיים." }
      ]
    },
    {
      id: "u2",
      title: "AI בטוח ואחראי",
      summary: "איפה עובר הגבול במידע רגיש, בהטיה ובהסלמה — בכלל שאפשר לזכור.",
      topic: "AI אחראי",
      roles: ["כללי"],
      minutes: 20,
      contentType: "תרחיש",
      assessment: "תרחיש",
      tags: ["AI אחראי", "ליבה"],
      recencyRank: 12,
      objective: "ליישם כלל ברור לגבי מה נכנס לעוזר, לזהות איפה הטיה יוצרת סיכון אמיתי, ולהסלים בזמן.",
      recommendedFor: "כל העובדים. בדרך כלל ממוקמת מיד אחרי יחידת הפתיחה.",
      contentId: "unit-02",
      outcomes: ["ליישם כלל ברור למידע רגיש", "לזהות איפה הטיה יוצרת סיכון", "לבחור את הכלי הנכון למשימה רגישה", "להסלים לפני שהבעיה מתפוצצת"],
      nuggets: [
        { title: "מה לא מדביקים לצ׳אט", type: "וידאו", minutes: 5, summary: "רשומות לקוחות, נתוני שכר, תוצאות שלא פורסמו, כל דבר תחת סודיות. כלל פשוט עובד טוב יותר ממדיניות ארוכה.", takeaway: "אם לא הייתם שולחים את זה במייל חיצוני — אל תדביקו." },
        { title: "כלים ארגוניים מול כלים ציבוריים", type: "וידאו", minutes: 5, summary: "כלים ארגוניים מאושרים משאירים את המידע בתוך הארגון. כלים צרכניים לא.", takeaway: "דעו באיזה כלי אתם נמצאים לפני שאתם מקלידים." },
        { title: "הטיה נכנסת, הטיה יוצאת", type: "וידאו", minutes: 5, summary: "מודלים משקפים את הנתונים שאימנו אותם. סינון, דירוג והערכה של אנשים זה המקום הרגיש ביותר.", takeaway: "לעולם לא נותנים ל-AI להחליט על בני אדם." },
        { title: "מתי מסלימים", type: "וידאו", minutes: 5, summary: "נושאים משפטיים, HR, בטיחות והתחייבויות ללקוח דורשים בעל בית אנושי ותיעוד.", takeaway: "הסלמה מוקדמת זולה. מאוחרת — לא." }
      ],
      task: { title: "תרחיש", lead: "שלוש בקשות מגיעות לתיבה שלכם באותו בוקר. אחת מהן לא צריכה להתקרב לעוזר AI.", items: ["עובד מבקש שתסכמו את סיכום הפגישה של אתמול.", "משאבי אנוש מבקשים לדרג שנים־עשר מועמדים פנימיים לפי הערכות ביצועים.", "שיווק מבקש חמש חלופות לשורת נושא לניוזלטר."], ask: "איזו בקשה היא המסוכנת, ומה הייתם עושים במקום?", cta: "שליחת תשובה" }
    }
];

export const topics: string[] = ["מיומנויות AI ליבה", "AI אחראי", "פתרון בעיות", "ניסוח בקשות", "אימות ובדיקה", "שיטות עבודה מומלצות", "תכנון תהליכים", "יסודות Copilot"];

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
    "u2"
  ],
  "welcome": "ברוכים הבאים. עשו יחידה אחת בכל פעם — החלקים המעשיים הם אלה שנשארים."
};

export function libraryUnit(id: string): LibraryUnit | undefined {
  return library.find((u) => u.id === id);
}

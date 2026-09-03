# Handoff: Admin Dashboard + Learner Opening Redesign (NGG Learning Platform)

## Overview
A redesign of the NGG Learning Platform admin side (dashboard, programs, analytics) and the
learner side, plus one new step in the learner flow: the unit **opening** (פתיח) is now a
required-feeling step at the start of a unit instead of an optional button in a side panel.

The UI is Hebrew, RTL, and uses the Heebo type family throughout.

## About the design files
The files in this bundle are **design references created in HTML** — a prototype of the
intended look and behaviour, not production code to copy. The task is to recreate them
inside the existing app: `NGG-Global/NGGLMS` (React 18 + Vite + React Router, plain CSS in
`src/**/**.css`), following that codebase's existing patterns — `.card`, `.btn`, `.chip`
classes and the CSS custom properties in `src/styles.css`. Do not port the prototype's
inline styles verbatim; translate them into the codebase's CSS layer.

`NGG Learning Platform Hi-Fi v2.dc.html` opens directly in a browser (it needs the
sibling `support.js`, `image-slot.js` and `assets/` folder included here).

## Fidelity
**High fidelity.** Colours, type sizes, radii, shadows and copy are final. Recreate
pixel-for-pixel using the codebase's own primitives. Layout dimensions below are exact.

## Target files in NGGLMS
| Design screen | Implement in |
| --- | --- |
| Admin dashboard | `src/admin/Dashboard.tsx` |
| Programs list | `src/admin/Programs.tsx` |
| Analytics | `src/admin/Analytics.tsx` |
| Learner home / unit overview | `src/learner/LearnerHome.tsx`, `src/learner/UnitOverview.tsx` |
| Unit opening (new step) | `src/learner/UnitPlay.tsx` + `src/player/UnitPlayer.tsx` |
| Shell / top bar / sidebar | `src/app/Shell.tsx`, `src/admin/AdminLayout.tsx` |

## Design tokens

### Colour
| Token | Hex | Use |
| --- | --- | --- |
| accent | `#ec2a8c` | primary buttons, active nav pill, progress fills |
| accent-deep | `#d11e78` | hover on primary, inline links |
| accent-ink | `#8e1050` | text on magenta pastel |
| accent-tint | `#fdeef6` | pastel tile background, chips |
| accent-tint-edge | `#f8cfe4` | borders on magenta pastel, secondary bars |
| ink | `#15151f` | headings, dark surfaces |
| ink-2 | `#3a3a40` | body |
| ink-3 | `#6b6a73` | secondary text |
| ink-4 | `#8e8d95` | meta text |
| ink-5 | `#a8a6b0` | labels, disabled |
| canvas | `#fbfafc` | main content background |
| surface | `#ffffff` | cards, sidebar, top bar |
| hairline | `#f0eff2` | card borders |
| hairline-2 | `#f4f3f6` | row dividers |
| well | `#f7f6f9` | search field, inert pills |
| well-2 | `#fcfbfd` | table header rows, list wells |
| green / green-tint | `#1f8a5b` / `#eaf6f0` | completed, positive |
| amber / amber-tint | `#e0a020` / `#fdf3e5` | deadline, weak score |
| violet / violet-tint | `#7a5cd6` / `#f1eefc` | client report, completion |
| danger | `#b0162f` | 14+ days idle |

Pastel tile ring tracks: magenta `#f8cfe4`, green `#c9e7d8`, amber `#f7e2c1`, violet `#dcd4f5`.

### Type — Heebo (400/500/600/700/800), base `14.5px/1.65`
| Role | Size / weight / tracking |
| --- | --- |
| Page h1 | 25–27px / 800 / `-.025em` |
| Section h2, h3 | 15.5px / 700 / `-.015em` |
| Tile value | 24px / 800 / `-.03em`, `white-space:nowrap` |
| Row title | 14.5px / 700 / `-.01em` |
| Body | 14.5px / 400 |
| Meta | 12.5px / 400 |
| Micro label | 11–11.5px / 600–700, `letter-spacing .1–.14em` when all-caps |
`font-variant-numeric: tabular-nums` on `body`.

### Shape
Radii: cards `16px`, tiles `16px`, pills/buttons `99px`, inner wells `11–13px`, nav items `12px`,
monograms `8–10px`, dark hero `20px`.
Card shadow: `0 1px 2px rgba(21,21,31,.04), 0 12px 30px -22px rgba(21,21,31,.18)`.
Primary button shadow: `0 10px 22px -10px rgba(236,42,140,.6)`.
Active nav pill shadow: `0 10px 20px -12px rgba(236,42,140,.75)`.
Spacing scale: 2, 5, 7, 9, 11, 13, 14, 16, 18, 20, 24, 28.

## Shell

**Top bar** — 68px, `#fff`, bottom border `#f0eff2`, sticky, z 60, padding `0 24px`, gap 16.
Contents right→left: NGG mark (26px) + "פלטפורמת הלמידה" (15px/700); 1×20px divider; crumb
(12.5px, `#8e8d95`); centred search — max-width 420px, `#f7f6f9`, 1px `#f0eff2`, radius 99px,
padding `9px 15px`, magnifier drawn as a 15px circle + 6px rotated bar in `#c9c7d0`,
placeholder "חיפוש תוכניות, לקוחות, יחידות…"; ניהול/לומד segmented pill (3px padding, `#f7f6f9`,
radius 99px; active = white, `0 1px 2px rgba(0,0,0,.07)`); 34px bell button with a 7px `#ec2a8c`
dot; identity pill — name 12.5px/600 + 30px avatar with `linear-gradient(145deg,#ec2a8c,#8e1050)`.

**Sidebar** — 244px, `#fff`, sticky under the top bar, `height:calc(100vh - 68px)`,
padding `20px 14px`, flex column.
- Label "NGG CONSULTING" — 10px/700, `.14em`, `#a8a6b0`.
- Items — `display:flex; gap:11px; padding:11px 13px; radius:12px; font-size:14`, 3px apart.
  Inactive: `#4a4952`, weight 500. Active: background `#ec2a8c`, white, weight 700, pill shadow.
  Each item has a 15px leading glyph square (2px border, radius 4) — inactive `#c9c7d0`,
  active `rgba(255,255,255,.9)` with `rgba(255,255,255,.28)` fill — and a trailing count pill
  (10.5px/700; inactive `#f2f1f5`/`#8e8d95`, active `rgba(255,255,255,.22)`/white).
  Items: דשבורד, תוכניות (7), ספריית תוכן (16), לומדים ומשתתפים (449), אנליטיקה, הגדרות.
- Bottom draft card — `linear-gradient(160deg,#fdeef6,#f7f0fb)`, radius 14, padding 14:
  "טיוטה בעבודה" (10px/700, `.1em`, `#b0508a`), draft name 13.5px/700, meta 12px `#7a5c6d`,
  full-width magenta pill button "להמשיך בבנייה".

**Main** — `flex:1`, padding `24px 28px 80px`, `max-width:1320px`, background `#fbfafc`,
`border-top-right-radius:22px`, `border-inline-start:1px solid #f4f3f6`.

## Screen: Admin dashboard

Header row: kicker "יום חמישי · 3 בספטמבר 2026" (11px/700, `.12em`, `#c0508f`), h1
"בוקר טוב, מאיה" (27px/800), sub "4 תוכניות בבעלותך · 2 באוויר, 1 מחכה לפרסום" (`#6b6a73`),
right-aligned primary pill "+ תוכנית חדשה" (`padding:12px 20px`).

### Status tiles
`grid-template-columns: repeat(auto-fit, minmax(215px,1fr)); gap:14px`. Each tile: pastel
background, radius 16, padding `16px 17px`. Row of a 52px donut + text; donut is an SVG
`viewBox 0 0 44 44`, `r=18.5`, `stroke-width:5`, rotated `-90deg`, circumference 116.2,
`stroke-dasharray = pct/100*116.2 + " 116.2"`, `stroke-linecap:round`; the percentage sits
centred inside at 10.5px/700 in the tile's ink colour. Value 24px/800, label 13px/700.
Sub-line under a `1px solid rgba(21,21,31,.08)` divider, `margin-top:13px; padding-top:11px`,
11.5px, ink colour at `opacity:.75`.

| Tile | Value | Ring | Sub |
| --- | --- | --- | --- |
| התוכניות שלי | 4 | 57%, magenta | 2 פורסמו · 1 מוכנה לפרסום · 1 טיוטה |
| לומדים פעילים | 141 | 31%, green | מתוך 449 שהוזמנו · 7 ימים |
| זמן למידה בפועל | 213 שע׳ | 87%, amber | החודש · 87% מהצפי |
| לומדים בסיכון | 18 | 14%, violet | ללא פעילות מעל 10 ימים |

### Body grid
`grid-template-columns: minmax(0,1fr) 328px; gap:20px; align-items:start`.

**תוכניות פעילות** (card, `overflow-x:auto`):
- Header: h2 + scope segmented pill (`שלי · 4`, `של הצוות · 3`; active `#15151f`/white,
  inactive `#6b6a73`, `padding:6px 15px`, radius 99, `nowrap`) + "כל התוכניות ←" link
  (13px/700, `#d11e78`).
- Grouped by client. Group header (`min-width:660px`, padding `11px 18px`, `#fcfbfd`):
  26px monogram (radius 8, `#fdeef6`/`#c0508f`, first letter of client), client 13.5px/700,
  meta "N תוכניות · N לומדים" 12px `#8e8d95`, owner name right-aligned 11.5px `#a8a6b0`.
- Program row — button, `display:grid`,
  `grid-template-columns: minmax(200px,2.6fr) minmax(64px,.8fr) minmax(78px,.9fr) minmax(96px,.9fr) minmax(120px,1.1fr)`,
  `gap:12px; min-width:660px; padding:13px 18px; white-space:nowrap`, top border `#f4f3f6`.
  Cells: name 14.5px/700 + sub "`audience` · `cohort`" 12.5px `#8e8d95`; "N יחידות"; learners
  or "—"; status chip; progress — 7px track `#f2f1f5` radius 99 with
  `linear-gradient(90deg,#f871b5,#ec2a8c)` fill (`#e5e4e7` when never started) and a
  10.5px/700 `#8e8d95` label ("54% בממוצע" / "טרם התחיל").
- Status chips (existing palette): פורסם `#e9f6ef`/`#167349`, טיוטה `#f2f2f4`/`#3a3a40`,
  מוכן לפרסום `#fbf2e0`/`#a66f08`, בארכיון white/`#949494` + 1px `#e5e4e7`.
- Row click: draft or ready → program builder; otherwise → program dashboard.

**פעילות לומדים** (card, padding 18): title + sub "שבעת הימים האחרונים · כל התוכניות שפורסמו";
right-aligned total 22px/800 with caption "נאגטים הושלמו". Chart: `grid-template-columns:repeat(7,1fr);
gap:9px; height:104px; align-items:end`; per day a value label (11px/700, `#a8a6b0`; peak `#c0186f`),
a bar `height = max(7, v/max*70)px`, radius 8, `#f8cfe4` (peak `linear-gradient(180deg,#ec2a8c,#c0186f)`),
then the day letter (11px/600 `#8e8d95`). Data א–ש: 34, 61, 48, 72, 55, 18, 9 (total 297).
Footer above a `#f4f3f6` divider: לומדים ייחודיים 141 · יחידות שהושלמו 52 · ציון תרגילים ממוצע 82% ·
זמן חציוני ליחידה 19 דק׳ (label 11.5px `#8e8d95`, value 15px/700).

### Right rail (328px, gap 16)
1. **מחזורי למידה** — card, padding `16px 17px`. Header + "ספטמבר 2026" (12.5px/600).
   Weekday letters א–ש (10.5px/700 `#a8a6b0`, centred). 7×5 grid of 30px cells, radius 9, gap 2:
   plain days `#6b6a73`; today (3) `#f2f1f5` with `inset 0 0 0 1.5px #d3d2d6`; marked days filled
   with their kind colour and white bold text — 8 magenta (kickoff), 14 amber (deadline),
   21 violet (client report), 30 amber. Legend row of three 7px dots.
   Milestone list: rows radius 11 on `#fcfbfd`, a 40px date block (day 14px/800 + month 9.5px/600)
   tinted by kind, title 13px/700, sub 11.5px `#8e8d95`, kind pill 10.5px/700.
   Entries: 8 ספט קיקאוף · נורת׳ווינד מחזור 3 (280 לומדים מוזמנים); 14 ספט דדליין · יסודות למנהלים
   (קונטוסו · מחזור 2); 21 ספט דוח לקוח · פבריקם (סיכום רבעוני); 30 ספט דדליין · ספרינט AI למכירות
   (אדוונצ׳ר וורקס).
2. **לומדים שנתקעו** — title + count pill (18) + "הכול ←". Rows divided by `#f4f3f6`: 30px
   initials circle (`#f7f6f9`/`#6b6a73`), name 13px/700, note 11.5px `#8e8d95`
   ("12 ימים ללא פעילות · נעצרה ביחידה 2"), and a "תזכורת" pill button (`#f7f6f9`, hover
   `#fdeef6`/`#d11e78`) that fires a toast "תזכורת נשלחה ל<name>".
3. **חדש בספריית NGG** — dark card `linear-gradient(165deg,#15151f,#221024)`, radius 16, with the
   white NGG mark at `opacity:.07` bleeding off the top-left. Rows split by
   `rgba(255,255,255,.1)`; title 13px/700 white, meta 11.5px `rgba(255,255,255,.55)`.
   Full-width `rgba(255,255,255,.12)` pill "לספריית התוכן ←" (hover `.2`).

## Screen: Programs
Existing header and "+ תוכנית חדשה" retained. Below it a scope segmented pill
(`שלי · 4`, `של הצוות · 3`, `הכול · 7`) plus a note: "תוכניות שאת יצרת ומנהלת" /
"תוכניות של מנהלי תוכן אחרים ב-NGG" / "כל התוכניות במרחב העבודה".

Cards: `repeat(auto-fill, minmax(320px,1fr)); gap:16px`, white, radius 16, padding 18,
card shadow; hover border `#e8cfdd` and shadow `0 16px 34px -20px rgba(236,42,140,.3)`.
Content: 34px client monogram (radius 10, `#fdeef6`/`#c0508f`) + client 13px/700 + cohort
11.5px `#a8a6b0` + status chip; program name 17px/700 `-.015em`; audience 13px `#6b6a73`;
7px progress track with the magenta gradient; footer above `#f4f3f6`: "N יחידות", learners
or "טרם פורסם", percentage (700), owner name right-aligned 11.5px `#a8a6b0` `nowrap`.

## Screen: Analytics
Header: h1 "אנליטיקה" + sub "איך התוכניות מתקדמות בפועל — ומה צריך תשומת לב השבוע.";
program `<select>` (radius 99, `max-width:260px`) and primary pill "ייצוא דוח לקוח"
(`flex:none; white-space:nowrap`; fires toast "דוח הלקוח נוצר · PDF + גיליון").

Tiles — same component as the dashboard: ציון תרגילים ממוצע 82% (ring 82, magenta, sub
"יחידה 2 החלשה — 68%"); מעורבות שבועית 141 (31, green, "עלייה של 8% מהשבוע שעבר");
לומדים בסיכון 18 (14, amber, "4% מהקהל · מעל 10 ימים"); השלמת תוכנית 96 (21, violet,
"מתוך 449 · 21%").

Two cards, `repeat(auto-fit, minmax(400px,1fr)); gap:18px` (they stack below ~1100px):
1. **מעורבות לאורך זמן** — sub "לומדים פעילים לשבוע · 12 השבועות האחרונים", legend
   פעילים `#ec2a8c` / השלימו יחידה `#f8cfe4`. `repeat(12,1fr); gap:7px; height:150px;
   align-items:end`. Each column is a stacked pair scaled against max 141 over 118px: the
   `#f8cfe4` "completed" cap (radius `6px 6px 0 0`) above the magenta active segment
   (radius `0 0 6px 6px`, `opacity:.82`; last week full opacity with
   `linear-gradient(180deg,#ec2a8c,#c0186f)`). Labels every third week, last is "עכשיו".
   Active: 38, 52, 61, 55, 74, 88, 96, 79, 104, 118, 131, 141. Completed: 9, 14, 18, 16, 22,
   29, 31, 24, 33, 38, 44, 52. Footer: שיא שבועי 141 לומדים · יחידות שהושלמו · 12 שבועות 330 ·
   זמן חציוני ליחידה 19 דק׳.
2. **ציוני תרגילים לפי יחידה** — sub "אחוז תשובות נכונות בבוחן או בתרגיל המסכם". Per unit:
   name 13px/700, score pill (green tint ≥75%, amber tint below), 7px bar with the magenta
   gradient (amber `linear-gradient(90deg,#f6d99a,#e0a020)` when below 75), optional amber
   note 11.5px. Data: לעבוד עם AI 91; AI בטוח ואחראי 68 ("החלשה ביותר — שאלת ההסלמה");
   להגדיר את הבעיה 84; לנסח בקשה עם כוונה 79; לתקן ולשפר 88; לבדוק לפני שסומכים 72
   ("25% טעו בזיהוי מקור מומצא").

**לומדים בסיכון** table — card with `overflow-x:auto`; header and rows
`grid-template-columns:1.6fr 1.2fr 1fr .9fr .8fr; gap:12px; min-width:680px`, rows
`white-space:nowrap`, dividers `#f4f3f6`, header on `#fcfbfd` (11px/700 `#a8a6b0`).
Columns: לומד (30px initials + name 13.5px/700 + org 11.5px), תוכנית, נעצר ב, ללא פעילות
(700; `#b0162f` at ≥14 days, else `#8a5f08`), ציון תרגילים. Five rows: מריה סילבה, פטר נובק,
יונתן וייס, עמית דגן, רות אלמוג (see the prototype for exact values).

## Learner side

**Home** — dark hero kept as-is. The welcome note becomes
`linear-gradient(160deg,#fdeef6,#f7f0fb)`, 1px `#f8cfe4`, radius 16, padding `17px 19px`,
text `#4a2036`.
Journey rows: white, radius 16, 1px `#f0eff2`, padding `16px 18px`, shadow
`0 1px 2px rgba(21,21,31,.04)`. In-progress row: border `#f8cfe4` + shadow
`0 12px 30px -20px rgba(236,42,140,.55)`. 34px state circle — done `#eaf6f0`/`#1f8a5b` "✓";
in progress `linear-gradient(145deg,#ec2a8c,#a3155f)` white "▶"; not started / locked
`#f2f1f5`/`#a8a6b0`. Locked rows `opacity:.55` and flash "היחידה תיפתח לאחר השלמת היחידה הקודמת".

**Unit overview** — "מה כלול ביחידה" now starts with the opening as a first-class row:
`#fdeef6`, 1px `#f8cfe4`, radius 12, 24px magenta "▶" circle, "פתיח היחידה" 14.5px/700
`#8e1050`, "1:34" 12.5px `#c0508f`. Start button label for an unstarted unit:
"להתחיל — פתיח היחידה (1:34)".

### New screen: unit opening (פתיח)
The learner reaches it automatically — `start` routes to the opening whenever the intro has
not been heard for that unit and the unit is not already complete; it is a step in the flow,
not a side action.

Layout: `max-width:980px`, top row with "← <unit title>", "שלב 1 מתוך N · פתיח היחידה" and a
130×6px progress track at 8%. Below, `grid-template-columns: minmax(0,1fr) 262px; gap:20px`.

Left panel: radius 20, `linear-gradient(155deg,#15151f 0%,#1b0f1c 55%,#33112b 100%)`,
padding `34px 34px 30px`, shadow `0 26px 60px -34px rgba(21,10,20,.75)`, white NGG mark at
`opacity:.06` off the top-left. Kicker pill "פתיח היחידה" (`rgba(236,42,140,.22)`/`#ff8ec5`,
10.5px/700, `.1em`) + "יחידה N · 1:34". Unit title 32px/800 `-.03em`; objective 16px
`rgba(255,255,255,.72)`, max-width 560px.
Player block: `rgba(255,255,255,.07)`, 1px `rgba(255,255,255,.12)`, radius 16, padding `14px 16px`.
52px magenta play/pause button with `0 0 0 8px rgba(236,42,140,.16)`; a 28-bar waveform
(`flex:1` bars, heights cycling 9/15/22/13/26/18/11/24/16/20/12/25/14/19px, radius 99,
`rgba(255,255,255,.22)` before playback, `rgba(255,143,197,.9)` after) animated with
`@keyframes pulse{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}`,
`0.9–1.54s` durations staggered `0.05s` per bar, `animation-play-state:paused` when paused;
a 4px track whose fill runs `@keyframes grow{from{width:0}to{width:100%}}` over **94s**
(the real 1:34 intro length) and holds at 100% when done; time label `direction:ltr`
("0:00 / 1:34" → "1:34 / 1:34").
CTA "לנאגט הראשון ←" — before playback an outline pill (`1px rgba(255,255,255,.25)`), once
playing or heard a filled magenta pill with `0 12px 26px -12px rgba(236,42,140,.8)`; always
`nowrap`. Hint beside it: "דקה וחצי שממסגרות את כל היחידה." → "אפשר להמשיך גם בזמן ההאזנה."
→ "הפתיח הושמע."
Advancing marks the intro heard for that unit and lands on the learner's first unwatched
nugget (not always nugget 1).

Right aside ("מה בהמשך היחידה"): white card, radius 16; the opening row highlighted on
`#fdeef6` with a magenta "▶" and "1:34"; then each nugget (22px `#f2f1f5` index circle, title
13px, minutes) and finally the unit's exercise row above a `#f4f3f6` divider.

**Quiz options** — radius 13, 1px `#f0eff2`, padding `14px 15px`, `0 1px 2px rgba(21,21,31,.04)`;
correct `#f2faf6`/`#6cbb95`, wrong `#fcebee`/`#eda3ae` (unchanged logic).

## State
Admin: `screen`, `scope` ('mine' | 'team') for the dashboard, `pScope` ('mine' | 'team' | 'all')
for the programs page, `toast`.
Learner: `lScreen` gains `'opening'`; `lIntro` ('idle' | 'playing' | 'paused' | 'done') drives
the waveform and progress animation; `lIntroHeard: Record<unitId, true>` decides whether the
opening is shown when a unit is started.

## Data model additions (not in the repo yet)
- `Program.owner: string` — the content manager who created and manages it. Everything in the
  "שלי / של הצוות" split depends on this; today `Program` has no owner field.
- `Program.cohort: string` — display label for the current cohort ("מחזור 2 · ספטמבר",
  "קיקאוף 8 בספטמבר", "מחזור טרם נקבע").
- Cohort milestones: `{ day, month, title, subtitle, kind: 'קיקאוף' | 'דדליין' | 'דוח' }`.
- Derived analytics: weekly active learners, exercise score per unit, idle days per learner.
  The prototype hard-codes these; wire them to `src/app/progress.ts`.

## Assets
`assets/ngg-mark.png` (top bar) and `assets/ngg-mark-white.png` (dark cards) — already in the
repo under `public/assets/`. Font: Heebo from Google Fonts, weights 300–900. No icon library:
the search glyph, nav glyphs, bell and waveform are CSS shapes, and "▶ ❚❚ ✓ ← ✕" are text.
Image placeholders in the prototype (`<image-slot>`) mark where real cover imagery goes —
program cover 1600×900, learner hero, nugget poster frame.

## Files in this bundle
- `NGG Learning Platform Hi-Fi v2.dc.html` — the redesign (admin + learner, all screens).
- `NGG Learning Platform Hi-Fi.dc.html` — the previous version, for diffing.
- `support.js`, `image-slot.js`, `assets/` — needed for the HTML to run offline.

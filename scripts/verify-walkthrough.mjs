#!/usr/bin/env node
/**
 * End-to-end walkthrough of both sides.
 *
 * Not part of `npm run build` — it drives a real browser, so Playwright is not a
 * dependency of the app. To run it:
 *
 *   npm run build && npm run preview          # in one terminal
 *   npm i --no-save playwright
 *   node scripts/verify-walkthrough.mjs http://127.0.0.1:4173/
 *
 * Set CHROMIUM_PATH to use a browser you already have, and SHOTS_DIR to choose where
 * screenshots land (default ./verify-shots).
 */
import { chromium } from 'playwright';
const BASE = process.env.BASE_URL ?? process.argv[2] ?? 'http://127.0.0.1:4173/';
const SHOTS = process.env.SHOTS_DIR ?? 'verify-shots';
const fails = [];
const ok = (m) => console.log('   ok   ' + m);
const bad = (m) => { fails.push(m); console.log('   FAIL ' + m); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

// ══════════ ADMIN ══════════
const admin = await browser.newPage({ viewport: { width: 1440, height: 940 } });
const errs = [];
admin.on('pageerror', (e) => errs.push('admin: ' + e.message));
admin.on('console', (m) => { if (m.type() === 'error' && !/404|ERR_CONNECTION|favicon/.test(m.text())) errs.push('admin console: ' + m.text()); });

console.log('\n═══ צד האדמין ═══');
await admin.goto(BASE, { waitUntil: 'networkidle' });
await admin.fill('#si-name', 'מאיה כהן');
await admin.fill('#si-email', 'maya@nggconsult.com');
await admin.fill('#si-org', 'Learning');
await admin.click('button:has-text("מנהל תוכן")');
await admin.click('button[type=submit]');
await admin.waitForURL('**/#/admin');
await admin.waitForSelector('.tile__v');

console.log('\n1. סקירה');
const tiles = await admin.$$eval('.card.tile', (n) => n.map((x) => x.querySelector('.tile__k').textContent + ' = ' + x.querySelector('.tile__v').textContent));
tiles.forEach((t) => console.log('   ' + t));
const avg = tiles.find((t) => t.includes('התקדמות'));
/= [1-9]/.test(avg) ? ok('average progress is populated: ' + avg) : bad('average progress still zero: ' + avg);
await admin.screenshot({ path: `${SHOTS}/a1-dashboard.png`, fullPage: true });

const rows = await admin.$$eval('table.grid tbody tr', (n) => n.map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent.trim().replace(/\s+/g, ' ')).join(' | ')));
console.log('   תוכניות:');
rows.forEach((r) => console.log('     ' + r));

console.log('\n2. אנליטיקה');
await admin.click('.admin__nav a:has-text("אנליטיקה")');
await admin.waitForSelector('.barrow');
const bars = await admin.$$eval('.barrow', (n) => n.map((b) => b.querySelector('b').textContent + ' → ' + b.querySelector('.v').textContent));
bars.forEach((b) => console.log('   ' + b));
bars.length >= 2 ? ok(`${bars.length} bars rendered`) : bad('analytics is empty');
bars.some((b) => !/→ 0%|→ 0\//.test(b)) ? ok('analytics shows real movement') : bad('every analytics bar is zero');
await admin.screenshot({ path: `${SHOTS}/a2-analytics.png`, fullPage: true });

console.log('\n3. לומדים');
await admin.click('.admin__nav a:has-text("לומדים")');
await admin.waitForSelector('table.grid tbody tr');
const people = await admin.$$eval('table.grid tbody tr', (n) => n.map((r) => { const c = [...r.querySelectorAll('td')]; return c[0].textContent.split('@')[0].trim() + ' · ' + c[3].textContent.trim() + ' · ' + c[4].textContent.trim(); }));
people.forEach((p) => console.log('   ' + p));
new Set(people.map((p) => p.split('·')[2])).size >= 4 ? ok('learner progress varies realistically') : bad('learner progress is uniform');
await admin.screenshot({ path: `${SHOTS}/a3-learners.png`, fullPage: true });

console.log('\n4. ספריית תוכן');
await admin.click('.admin__nav a:has-text("ספריית תוכן")');
await admin.waitForSelector('.libcard');
ok((await admin.$$('.libcard')).length + ' units');
await admin.screenshot({ path: `${SHOTS}/a4-library.png`, fullPage: true });

console.log('\n5. דשבורד תוכנית');
await admin.goto(BASE + '#/admin/programs/p1', { waitUntil: 'networkidle' });
await admin.waitForSelector('.barrow');
const unitBars = await admin.$$eval('.barrow', (n) => n.map((b) => b.querySelector('b').textContent + ' → ' + b.querySelector('.v').textContent));
unitBars.forEach((b) => console.log('   ' + b));
await admin.screenshot({ path: `${SHOTS}/a5-program.png`, fullPage: true });

console.log('\n6. בנאי תוכניות — 4 שלבים');
await admin.goto(BASE + '#/admin/programs/new', { waitUntil: 'networkidle' });
await admin.fill('#pb-client', 'מכבי שירותי בריאות');
await admin.fill('#pb-title', 'עוצמה — אוריינות AI למנהלים');
await admin.fill('#pb-course', 'לעבוד נכון עם AI');
await admin.fill('#pb-aud', 'מנהלים בדרג ביניים');
await admin.click('button.steps__i:has-text("מסלול הלמידה")');
await admin.waitForSelector('.libgrid');
await admin.click('.chipset button:has-text("מופק בלבד")');
await admin.waitForTimeout(200);
for (const b of await admin.$$('.libgrid .libcard button:has-text("למסלול")')) { await b.click(); await admin.waitForTimeout(150); }
ok((await admin.$$('.jrow')).length + ' units in the path');
await admin.screenshot({ path: `${SHOTS}/a6-builder.png`, fullPage: true });
await admin.click('button.steps__i:has-text("סקירה ופרסום")');
await admin.waitForSelector('.checklist');
const pub = await admin.$('button:has-text("פרסום התוכנית")');
!(await pub.isDisabled()) ? ok('publish enabled') : bad('publish blocked');
await pub.click();
await admin.waitForSelector('.linkbox', { timeout: 8000 });
const link = await admin.textContent('.linkbox code');
console.log('   learner link: ' + link);
await admin.screenshot({ path: `${SHOTS}/a7-published.png`, fullPage: true });

// ══════════ LEARNER ══════════
console.log('\n═══ צד הלומד ═══');
const learner = await browser.newPage({ viewport: { width: 1440, height: 940 } });
learner.on('pageerror', (e) => errs.push('learner: ' + e.message));
learner.on('console', (m) => { if (m.type() === 'error' && !/404|ERR_CONNECTION|favicon/.test(m.text())) errs.push('learner console: ' + m.text()); });
await learner.addInitScript(() => {
  window.__audio = [];
  const N = window.Audio;
  window.Audio = function (...a) { const el = new N(...a); window.__audio.push(el); return el; };
  window.Audio.prototype = N.prototype;
});

await learner.goto(BASE, { waitUntil: 'networkidle' });
await learner.fill('#si-name', 'דור ואקנין');
await learner.fill('#si-email', 'dor@nggconsult.com');
await learner.fill('#si-org', 'Delivery');
await learner.click('button[type=submit]');
await learner.waitForURL('**/#/learn');
await learner.waitForSelector('.pathrow', { timeout: 8000 });
console.log('\n1. מסלול הלמידה');
console.log('   ' + (await learner.textContent('h1')).trim());
const myPrograms = await learner.$$eval('.pathrow__b b', (n) => n.map((x) => x.textContent));
console.log('   ' + JSON.stringify(myPrograms));
myPrograms.length ? ok('learner sees a programme') : bad('learner has no programme');
await learner.screenshot({ path: `${SHOTS}/l1-home.png`, fullPage: true });

console.log('\n2. תוכנית');
await learner.click('.section .pathlist .pathrow >> nth=0');
await learner.waitForSelector('.pathlist .pathrow');
const units = await learner.$$eval('.pathlist .pathrow', (n) => n.map((r) => r.querySelector('b').textContent + (r.className.includes('locked') ? ' [נעול]' : '')));
units.forEach((u) => console.log('   ' + u));
await learner.screenshot({ path: `${SHOTS}/l2-program.png`, fullPage: true });

console.log('\n3. דף יחידה + נגן (יחידה 02 — קריינות מלאה)');
const pid = await learner.evaluate(() => location.hash.split('/')[2]);
await learner.goto(`${BASE}#/learn/${pid}/u2`, { waitUntil: 'networkidle' });
await learner.waitForSelector('.unitpage');
await learner.screenshot({ path: `${SHOTS}/l3-unit.png`, fullPage: true });
const startLink = await learner.$('a:has-text("להתחיל את היחידה"), a:has-text("להמשיך"), a:has-text("לצפות שוב")');
if (!startLink) { console.log('   FAIL no start link on the unit page'); process.exit(1); }
await startLink.click();
await learner.waitForSelector('.frame', { timeout: 8000 });
await learner.click('.frame__poster');
await learner.waitForTimeout(4000);
const play = await learner.evaluate(() => {
  const a = (window.__audio || []).filter((x) => x.src.includes('u2-a')).pop();
  return { rs: a?.readyState, ct: +a?.currentTime.toFixed(1), paused: a?.paused };
});
console.log('   audio ' + JSON.stringify(play) + ' · clock ' + (await learner.textContent('.transport__time')).trim());
play.rs >= 3 && play.paused === false ? ok('narration playing') : bad('narration not playing: ' + JSON.stringify(play));
console.log('   caption: ' + (await learner.textContent('.frame__caption').catch(() => '(none)')));
await learner.screenshot({ path: `${SHOTS}/l4-player.png`, fullPage: true });

console.log('\n4. מעבר בין נאגטים דרך הרשימה בצד');
await learner.click('.rail__item:nth-of-type(4)');
await learner.waitForTimeout(1200);
const railTitle = (await learner.textContent('.rail__item[aria-current="true"] .rail__body b')).trim();
console.log('   נבחר: ' + railTitle + ' · url ' + (await learner.evaluate(() => location.hash.split('?')[1])));
railTitle !== 'מה מותר להזין ומה לא' ? ok('rail click switched the nugget') : bad('rail click did not switch');
await learner.click('.transport__pp');
await learner.waitForTimeout(2500);
const play2 = await learner.evaluate(() => {
  const a = (window.__audio || []).filter((x) => x.src.includes('u2-a')).pop();
  return { ct: +a?.currentTime.toFixed(1), paused: a?.paused };
});
console.log('   audio after switch: ' + JSON.stringify(play2));
play2.paused === false ? ok('narration resumed on the new nugget') : bad('narration did not resume');
await learner.screenshot({ path: `${SHOTS}/l5-rail-switch.png`, fullPage: true });
await learner.click('.transport__pp');

console.log('\n5. תרגיל → מקטע הבא');
await learner.goto(`${BASE}#/learn/${pid}/u2/play?n=1`, { waitUntil: 'networkidle' });
await learner.waitForSelector('.ex');
await learner.$$eval('.ex__row', (rows) => rows.forEach((r) => r.querySelectorAll('.ex__opt')[0].click()));
await learner.waitForTimeout(200);
await learner.click('.ex__actions button:has-text("לבדוק")');
await learner.waitForSelector('.ex__result');
console.log('   ' + (await learner.textContent('.ex__result b')).trim());
await learner.click('.ex__actions button:has-text("למקטע הבא")');
await learner.waitForTimeout(900);
const next = (await learner.textContent('.rail__item[aria-current="true"] .rail__body b')).trim();
console.log('   הועבר ל: ' + next);
next === 'הרשאות, מקורות ומה שקופיילוט יכול לראות' ? ok('"next nugget" advanced correctly') : bad('next nugget went to ' + next);
await learner.screenshot({ path: `${SHOTS}/l6-exercise.png`, fullPage: true });

console.log('\n6. ההתקדמות נרשמה וחוזרת אחרי רענון');
await learner.goto(`${BASE}#/learn/${pid}`, { waitUntil: 'networkidle' });
await learner.reload({ waitUntil: 'networkidle' });
await learner.waitForSelector('.resume__t');
const mine = (await learner.textContent('.resume__t')).trim() + ' — ' + (await learner.textContent('.resume__m span:last-child')).trim();
console.log('   ' + mine);
/[1-9]/.test((await learner.textContent('.resume__m span:last-child')).trim()) ? ok('progress persisted across reload') : bad('progress lost');
await learner.screenshot({ path: `${SHOTS}/l7-progress.png`, fullPage: true });

console.log('\n7. יחידה 01 — הנאגט שעדיין ללא קריינות (נאגט 4)');
await learner.goto(`${BASE}#/learn/${pid}/u1/play?n=4`, { waitUntil: 'networkidle' });
await learner.waitForSelector('.frame');
const badge = await learner.textContent('.frame__silent').catch(() => null);
badge ? ok('silent nugget is labelled: ' + badge.trim()) : bad('no label on unit 01 nugget 4, which has no narration file yet');
await learner.screenshot({ path: `${SHOTS}/l8-silent.png`, fullPage: true });

console.log('\n═══ שגיאות ═══');
errs.length ? errs.forEach((e) => bad(e)) : ok('none on either side');

await browser.close();
console.log('\n' + (fails.length ? `FAILURES (${fails.length}):\n - ${fails.join('\n - ')}` : 'BOTH SIDES VERIFIED END TO END'));

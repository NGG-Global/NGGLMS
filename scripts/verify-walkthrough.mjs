#!/usr/bin/env node
/**
 * End-to-end walkthrough of both sides, against the v2 design.
 *
 * Checks the shell, the admin dashboard's tiles / grouped programmes / calendar /
 * stuck-learner rail, the programme cards, the analytics charts, then the learner
 * journey through the new unit-opening step and into the player.
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
const OUT = process.env.SHOTS_DIR ?? 'verify-shots';
const fails = [];
const ok = (m) => console.log('   ok   ' + m);
const bad = (m) => { fails.push(m); console.log('   FAIL ' + m); };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

const errs = [];
const watch = (p, tag) => {
  p.on('pageerror', (e) => errs.push(`${tag}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/404|ERR_CONN|favicon|Autoplay/.test(m.text())) errs.push(`${tag} console: ${m.text()}`); });
};

console.log('\n═══ admin (1440) ═══');
const a = await b.newPage({ viewport: { width: 1440, height: 1000 } }); watch(a, 'admin');
await a.goto(BASE, { waitUntil: 'networkidle' });
await a.fill('#si-name', 'מאיה כהן'); await a.fill('#si-email', 'maya@nggconsult.com'); await a.fill('#si-org', 'Learning');
await a.click('button:has-text("מנהל תוכן")'); await a.click('button[type=submit]');
await a.waitForURL('**/#/admin'); await a.waitForSelector('.tile__donut');
(await a.$$('.tile__donut svg')).length === 4 ? ok('four donut tiles') : bad('donut tiles missing');
(await a.$('.topbar__search')) ? ok('top bar search present') : bad('no search in top bar');
(await a.$('.navitem[aria-current="page"]')) ? ok('sidebar active pill') : bad('no active nav pill');
(await a.$('.draftcard')) ? ok('draft card in sidebar') : bad('no draft card');
(await a.$('.dark-card')) ? ok('dark library card') : bad('no dark library card');
(await a.$$('.cal__day[data-kind]')).length === 4 ? ok('four marked calendar days') : bad('calendar marks: ' + (await a.$$('.cal__day[data-kind]')).length);
await a.screenshot({ path: `${OUT}/w-dash.png`, fullPage: true });

await a.click('.seg--ink button:has-text("של הצוות")');
await a.waitForTimeout(400);
(await a.$$('.progrow')).length > 0 ? ok('team scope shows rows') : bad('team scope empty');
await a.click('.seg--ink button:has-text("שלי")');

await a.goto(BASE + '#/admin/programs', { waitUntil: 'networkidle' });
await a.waitForSelector('.progcard');
console.log('   programme cards:', (await a.$$('.progcard')).length);
await a.screenshot({ path: `${OUT}/w-programs.png`, fullPage: true });

await a.goto(BASE + '#/admin/analytics', { waitUntil: 'networkidle' });
await a.waitForSelector('.engchart');
(await a.$$('.engchart > div')).length === 12 ? ok('12-week engagement chart') : bad('engagement columns: ' + (await a.$$('.engchart > div')).length);
(await a.$$('.scorerow')).length > 0 ? ok('per-unit score rows') : bad('no score rows');
(await a.$$('.gridtable__row')).length > 0 ? ok('at-risk table rows') : bad('no at-risk rows');
await a.screenshot({ path: `${OUT}/w-analytics.png`, fullPage: true });

for (const [r, n] of [['admin/library', 'w-library'], ['admin/learners', 'w-learners'], ['admin/settings', 'w-settings'], ['admin/programs/p1', 'w-progdash'], ['admin/programs/new', 'w-builder']]) {
  await a.goto(BASE + '#/' + r, { waitUntil: 'networkidle' });
  await a.waitForTimeout(500);
  await a.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
}
ok('all admin screens rendered');

console.log('\n═══ learner (1280) ═══');
const l = await b.newPage({ viewport: { width: 1280, height: 800 } }); watch(l, 'learner');
await l.addInitScript(() => { window.__audio = []; const N = window.Audio; window.Audio = function (...x) { const e = new N(...x); window.__audio.push(e); return e; }; window.Audio.prototype = N.prototype; });
await l.goto(BASE, { waitUntil: 'networkidle' });
await l.fill('#si-name', 'דור ואקנין'); await l.fill('#si-email', 'dor@nggconsult.com');
await l.click('button[type=submit]'); await l.waitForURL('**/#/learn');
await l.waitForSelector('.lhero');
ok('dark learner hero');
(await l.$('.softnote')) ? ok('pastel welcome note') : bad('no welcome note');
(await l.$$('.jrow2')).length > 0 ? ok((await l.$$('.jrow2')).length + ' journey rows') : bad('no journey rows');
await l.screenshot({ path: `${OUT}/w-lhome.png`, fullPage: true });

const locked = await l.$('.jrow2[data-state="locked"]');
if (locked) { await locked.click(); await l.waitForTimeout(400); (await l.$('.toast')) ? ok('locked row flashes a note') : bad('locked row silent'); }

const pid = await l.evaluate(() => location.hash.split('/')[2] || 'p1');
await l.goto(`${BASE}#/learn/p1/u2`, { waitUntil: 'networkidle' });
await l.waitForSelector('.unitpage');
(await l.$('.openrow')) ? ok('opening is a first-class row in the unit') : bad('no opening row');
const startLabel = (await l.textContent('.btn--primary')).trim();
console.log('   start button:', startLabel);
/פתיח/.test(startLabel) ? ok('start button offers the opening') : bad('start label: ' + startLabel);
await l.screenshot({ path: `${OUT}/w-unit.png`, fullPage: true });

console.log('\n── the opening screen ──');
await l.click('.btn--primary');
await l.waitForSelector('.opening__panel', { timeout: 8000 });
ok('routed to the opening');
(await l.$$('.introplayer__wave i')).length === 28 ? ok('28 waveform bars') : bad('bars: ' + (await l.$$('.introplayer__wave i')).length);
console.log('   step:', (await l.textContent('.opening__step')).trim());
console.log('   time:', (await l.textContent('.introplayer__time')).trim());
console.log('   hint:', (await l.textContent('.opening__hint')).trim());
console.log('   up-next rows:', (await l.$$('.upnext__row')).length);
await l.screenshot({ path: `${OUT}/w-opening-idle.png`, fullPage: true });

await l.click('.introplayer__btn');
await l.waitForTimeout(3500);
const play = await l.evaluate(() => { const x = (window.__audio || []).filter((y) => y.src.includes('u2-intro')).pop(); return x ? { rs: x.readyState, ct: +x.currentTime.toFixed(1), paused: x.paused } : null; });
console.log('   intro audio:', JSON.stringify(play), '· clock', (await l.textContent('.introplayer__time')).trim());
play && play.rs >= 3 && play.paused === false ? ok('intro narration playing from the real file') : bad('intro not playing: ' + JSON.stringify(play));
const fill = await l.$eval('.introplayer__track i', (e) => e.style.width);
parseFloat(fill) > 0 ? ok('progress fill tracks the audio (' + fill + ')') : bad('progress not moving');
await l.screenshot({ path: `${OUT}/w-opening-playing.png`, fullPage: true });

await l.click('.opening__cta .btn');
await l.waitForSelector('.frame', { timeout: 8000 });
ok('advanced into the player');
console.log('   landed on:', (await l.textContent('.rail__item[aria-current="true"] .rail__body b')).trim());

await l.goto(`${BASE}#/learn/p1/u2`, { waitUntil: 'networkidle' });
await l.waitForSelector('.unitpage');
const second = (await l.textContent('.btn--primary')).trim();
console.log('   start button after hearing it:', second);
!/פתיח/.test(second) ? ok('opening not offered again once heard') : bad('still routing through the opening');

console.log('\n═══ errors ═══');
errs.length ? errs.slice(0, 8).forEach(bad) : ok('none on either side');
await b.close();
console.log('\n' + (fails.length ? `FAILURES (${fails.length}):\n - ${fails.join('\n - ')}` : 'REDESIGN VERIFIED ON BOTH SIDES'));

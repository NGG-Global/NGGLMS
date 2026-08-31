#!/usr/bin/env node
/**
 * Per-nugget playback audit.
 *
 * Not part of `npm run build` — it drives a real browser, so Playwright is not a
 * dependency of the app. To run it:
 *
 *   npm run build && npm run preview          # in one terminal
 *   npm i --no-save playwright
 *   node scripts/verify-nuggets.mjs http://127.0.0.1:4173/
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

// Expected slices, straight from the content modules.
const SEGS = {
  u1: [
    { n: 1, file: 'u1-n1.mp3', start: 36, end: 188.33, title: 'מה קופיילוט באמת עושה' },
    { n: 2, file: 'u1-n2.mp3', start: 0, end: 148.95, title: 'במה AI טוב, ובמה פחות' },
    { n: 3, file: 'u1-n2.mp3', start: 149, end: 295.2, title: 'התשובה הראשונה היא טיוטה, לא אמת' },
    { n: 4, file: 'u1-n2.mp3', start: 295.68, end: 430.91, title: 'קונטקסט, מקורות ו-grounding' },
    { n: 5, file: 'u1-n5.mp3', start: 0, end: 153.08, title: 'האחריות נשארת אצל האדם' },
  ],
  u2: [
    { n: 1, file: 'u2-a.mp3', start: 0, end: 186, title: 'מה מותר להזין ומה לא' },
    { n: 2, file: 'u2-a.mp3', start: 186, end: 373.4, title: 'הרשאות, מקורות ומה שקופיילוט יכול לראות' },
    { n: 3, file: 'u2-a.mp3', start: 373.4, end: 562, title: 'דיוק, הטיות והזיות' },
    { n: 4, file: 'u2-a.mp3', start: 562, end: 735.82, title: 'הסתמכות יתר' },
    { n: 5, file: 'u2-n5.mp3', start: 0, end: 224.54, title: 'רמת הסיכון קובעת את רמת הבדיקה' },
  ],
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
await page.addInitScript(() => {
  window.__audio = [];
  const Native = window.Audio;
  window.Audio = function (...a) { const el = new Native(...a); window.__audio.push(el); return el; };
  window.Audio.prototype = Native.prototype;
});
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.fill('#si-name', 'מאיה כהן');
await page.fill('#si-email', 'maya@nggconsult.com');
await page.fill('#si-org', 'Learning');
await page.click('button:has-text("מנהל תוכן")');
await page.click('button[type=submit]');
await page.waitForURL('**/#/admin');

const probeAudio = (file) => page.evaluate((f) => {
  const a = (window.__audio || []).filter((x) => x.src.includes(f)).pop();
  return a ? { rs: a.readyState, ct: +a.currentTime.toFixed(2), paused: a.paused, dur: +a.duration.toFixed(1), err: a.error?.code ?? null } : null;
}, file);

for (const [unit, list] of Object.entries(SEGS)) {
  for (const seg of list) {
    console.log(`\n── ${unit} · נאגט ${seg.n} · ${seg.title}`);
    await page.goto(`${BASE}#/learn/p1/${unit}/play?n=${seg.n}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.frame', { timeout: 10000 });
    await page.waitForTimeout(350);

    const current = await page.textContent('.rail__item[aria-current="true"] .rail__body b');
    current.trim() === seg.title ? ok(`opened the right nugget`) : bad(`${unit} n${seg.n}: opened "${current.trim()}" instead of "${seg.title}"`);

    const expectDur = seg.end - seg.start;
    const shown = (await page.textContent('.transport__time')).trim();
    const shownDur = shown.split('/')[1].trim();
    const mm = Math.floor(expectDur / 60), ss = Math.round(expectDur % 60);
    const expectLabel = `${mm}:${String(ss).padStart(2, '0')}`;
    shownDur === expectLabel ? ok(`duration ${shownDur}`) : bad(`${unit} n${seg.n}: duration shows ${shownDur}, expected ${expectLabel}`);

    const silent = await page.$('.frame__silent');
    const shouldBeSilent = seg.file === 'u1-n2.mp3';
    if (shouldBeSilent && !silent) bad(`${unit} n${seg.n}: no silent badge though ${seg.file} is missing`);
    if (!shouldBeSilent && silent) bad(`${unit} n${seg.n}: silent badge shown though ${seg.file} exists`);

    // Play from a point mid-segment so the seek path into a shared file is exercised.
    await page.$eval('.transport__scrub input', (el) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      s.call(el, '400'); el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(250);
    await page.click('.transport__pp');
    await page.waitForTimeout(2600);

    const t = (await page.textContent('.transport__time')).trim();
    const secs = (label) => { const [m, s] = label.split(':').map(Number); return m * 60 + s; };
    const elapsed = secs(t.split('/')[0].trim());
    const expectFrom = expectDur * 0.4;
    Math.abs(elapsed - expectFrom) < 5
      ? ok(`clock ${t} — advanced from the 40% mark`)
      : bad(`${unit} n${seg.n}: clock ${t}, expected ~${expectFrom.toFixed(0)}s`);

    if (!shouldBeSilent) {
      const a = await probeAudio(seg.file);
      if (!a) bad(`${unit} n${seg.n}: no audio element for ${seg.file}`);
      else {
        console.log(`   audio: ${seg.file} rs=${a.rs} ct=${a.ct} dur=${a.dur} paused=${a.paused} err=${a.err}`);
        a.rs >= 3 ? ok('audio buffered and playable') : bad(`${unit} n${seg.n}: readyState ${a.rs}`);
        a.paused === false ? ok('audio is playing') : bad(`${unit} n${seg.n}: audio paused during playback`);
        // The decisive check for the shared 12-minute file: is the playhead inside this nugget's slice?
        a.ct >= seg.start - 1 && a.ct <= seg.end + 1
          ? ok(`playhead ${a.ct}s is inside the slice [${seg.start}, ${seg.end}]`)
          : bad(`${unit} n${seg.n}: playhead ${a.ct}s is OUTSIDE [${seg.start}, ${seg.end}] — wrong narration would be heard`);
        const offset = a.ct - seg.start;
        Math.abs(offset - elapsed) < 2
          ? ok(`audio offset ${offset.toFixed(1)}s matches displayed ${elapsed}s`)
          : bad(`${unit} n${seg.n}: audio offset ${offset.toFixed(1)}s vs displayed ${elapsed}s`);
      }
    }

    const cap = (await page.textContent('.frame__caption').catch(() => '')) || '';
    const head = (await page.textContent('.stage__head').catch(() => '')) || (await page.textContent('.sc-type__head').catch(() => '')) || '';
    console.log(`   scene: ${head.slice(0, 40)} | caption: ${cap.slice(0, 56)}`);
    cap.trim() ? ok('caption on screen') : bad(`${unit} n${seg.n}: no caption during playback`);
    await page.click('.transport__pp');
  }
}

console.log('\n── boundary: does nugget 2 of unit 02 stop at its own end? ──');
await page.goto(`${BASE}#/learn/p1/u2/play?n=2`, { waitUntil: 'networkidle' });
await page.waitForSelector('.frame');
await page.$eval('.transport__scrub input', (el) => {
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  s.call(el, '985'); el.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(200);
await page.click('.transport__pp');
await page.waitForTimeout(5000);
const endState = await page.evaluate(() => {
  const a = (window.__audio || []).filter((x) => x.src.includes('u2-a')).pop();
  return { paused: a?.paused, ct: +a?.currentTime.toFixed(1), think: !!document.querySelector('.frame__think') };
});
console.log('   end state:', JSON.stringify(endState));
endState.paused === true ? ok('audio stopped at the nugget boundary') : bad('audio ran past the nugget end into the next one');
endState.ct <= 374.5 ? ok(`stopped at ${endState.ct}s (slice ends 373.4)`) : bad(`overran to ${endState.ct}s`);
endState.think ? ok('"עצור וחשוב" overlay appeared') : bad('no reflection overlay at the end');
await page.screenshot({ path: `${SHOTS}/20-think-overlay.png` });

console.log('\n── page errors ──');
pageErrors.length === 0 ? ok('none') : pageErrors.forEach((e) => bad('pageerror: ' + e));

await browser.close();
console.log('\n' + (fails.length ? `FAILURES (${fails.length}):\n - ${fails.join('\n - ')}` : 'ALL 10 NUGGETS VERIFIED'));

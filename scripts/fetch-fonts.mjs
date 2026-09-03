/**
 * Vendors the Heebo subsets the video renderer needs into public/assets/fonts.
 *
 * The web app links Heebo from Google Fonts, but a Remotion render cannot depend on
 * the network mid-frame — see remotion/fonts.ts. Run this only to pick up a new Heebo
 * release; the files it writes are committed.
 *
 *   node scripts/fetch-fonts.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';

const DIR = 'public/assets/fonts';
const WEIGHTS = [400, 500, 700, 800, 900];
// Google serves one @font-face per script. The stage only ever sets Hebrew copy and
// the occasional latin word ("Copilot", "NGG"), so the other subsets are dead weight.
const KEEP = new Set(['hebrew', 'latin']);
// css2 hands back a variable-font @font-face unless the caller looks like a browser.
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
};

await mkdir(DIR, { recursive: true });

for (const weight of WEIGHTS) {
  const css = await (
    await get(`https://fonts.googleapis.com/css2?family=Heebo:wght@${weight}&display=swap`)
  ).text();

  const blocks = css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g);
  for (const [, subset, body] of blocks) {
    if (!KEEP.has(subset)) continue;
    const url = /src:\s*url\(([^)]+)\)/.exec(body)?.[1];
    if (!url) continue;
    const file = `heebo-${weight}-${subset}.woff2`;
    const bytes = Buffer.from(await (await get(url)).arrayBuffer());
    await writeFile(`${DIR}/${file}`, bytes);
    console.log(`${file}  ${bytes.length} bytes`);
    // The unicode-range must match what remotion/fonts.ts declares; if Google ever
    // changes it, that constant has to move with it.
    console.log(`  unicode-range: ${/unicode-range:\s*([^;]+);/.exec(body)?.[1].trim()}`);
  }
}

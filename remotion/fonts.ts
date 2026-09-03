/**
 * Heebo, self-hosted.
 *
 * The platform pulls Heebo from Google Fonts at runtime; a render cannot. The
 * headless browser would race the network and, on a miss, silently commit 4,600
 * frames set in a fallback face. So the hebrew and latin subsets are committed under
 * public/assets/fonts and registered here through loadFont(), which holds the render
 * open until each face has actually parsed.
 *
 * Regenerate with scripts/fetch-fonts.mjs if the Heebo release changes.
 */

import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

const HEBREW = 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F';
const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, ' +
  'U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const WEIGHTS = [400, 500, 700, 800, 900] as const;

for (const weight of WEIGHTS) {
  for (const [subset, unicodeRange] of [
    ['hebrew', HEBREW],
    ['latin', LATIN],
  ] as const) {
    void loadFont({
      family: 'Heebo',
      url: staticFile(`assets/fonts/heebo-${weight}-${subset}.woff2`),
      weight: String(weight),
      unicodeRange,
      format: 'woff2',
    });
  }
}

/**
 * Render settings for the nugget visualizers.
 *
 * Only settings that must hold for every render live here. Anything per-render — the
 * output path, a frame range, still output — stays on the command line.
 */

import { Config } from '@remotion/cli/config';

Config.setEntryPoint('remotion/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// No GPU in CI or in a container, and the stage leans on gradients and blurs that a
// pure-software rasteriser gets visibly wrong. SwiftShader via ANGLE renders them
// correctly at the cost of some speed.
Config.setChromiumOpenGlRenderer('swangle');

// Set REMOTION_BROWSER_EXECUTABLE to reuse a Chromium that is already on the machine
// instead of letting Remotion download its own.
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browser) Config.setBrowserExecutable(browser);

#!/usr/bin/env node
/**
 * Refuses to build while nugget renders are staged in public/assets/video.
 *
 * Vite copies public/ into dist verbatim, so a render left in that directory is
 * silently baked into the build — 53MB of it, the first time this fired. The whole
 * point of moving the renders to the blob store is that they are not part of the
 * bundle, and the manifest is what tells the player where they are. A staged copy is
 * dead weight at best, and if it differs from what was uploaded it is a build that
 * disagrees with the store about what a nugget looks like.
 *
 * The files are gitignored, so a deployment building from a fresh clone never sees
 * them. This is about local builds, where the staging directory persists between a
 * render and its upload.
 *
 * `VITE_VIDEO_BASE` pointing at a local path is the one case where the copies belong
 * in the build — that is the documented way to work offline — so the check stands
 * down for it.
 *
 * Runs from prebuild.
 */
import { existsSync, readdirSync } from 'node:fs';

const DIR = 'public/assets/video';
const base = process.env.VITE_VIDEO_BASE ?? '';
const servingLocally = base !== '' && !/^https?:\/\//i.test(base);

if (!servingLocally && existsSync(DIR)) {
  const staged = readdirSync(DIR).filter((f) => f.endsWith('.mp4'));
  if (staged.length > 0) {
    console.error(
      `${staged.length} render(s) still staged in ${DIR}:\n` +
        staged.map((f) => `  ${f}`).join('\n') +
        '\n\nVite copies public/ into dist verbatim, so these would be baked into the\n' +
        'build. The renders belong in the blob store, not the bundle.\n\n' +
        'Upload them and clear the directory:\n' +
        '  BLOB_READ_WRITE_TOKEN=… npm run upload:video\n' +
        `  rm ${DIR}/*.mp4\n\n` +
        'To serve them from the build on purpose, set VITE_VIDEO_BASE to a local path.',
    );
    process.exit(1);
  }
}

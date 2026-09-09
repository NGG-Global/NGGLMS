#!/usr/bin/env node
/**
 * Uploads the produced nugget renders to the Vercel Blob store.
 *
 * Pathnames are preserved exactly (`addRandomSuffix: false`) because the player
 * resolves them from src/content/video-manifest.ts against the video base URL — the
 * manifest keeps bare `assets/video/…` paths and only the prefix changes. A random
 * suffix would break every one of them.
 *
 * Needs a store read-write token:
 *
 *   BLOB_READ_WRITE_TOKEN=… npm run upload:video
 *
 * The renders are ~23MB each and are not in the repository, so the workflow for a
 * newly produced nugget is: render to out/, copy into public/assets/video, run
 * `npm run scan:video` to refresh the manifest, commit the manifest, run this, then
 * delete the local copy. `cacheControlMaxAge` matches the immutable one-year header
 * the deployment path already sets for /assets/video.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { put, list } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;
const DIR = 'public/assets/video';
const files = readdirSync(DIR).filter((f) => f.endsWith('.mp4')).sort();
if (!token) {
  console.error('Set BLOB_READ_WRITE_TOKEN. See the header of this file.');
  process.exit(1);
}
if (files.length === 0) {
  console.error(`No .mp4 files in ${DIR}. Copy the renders there first.`);
  process.exit(1);
}

for (const name of files) {
  const path = `${DIR}/${name}`;
  const bytes = statSync(path).size;
  const started = Date.now();
  const blob = await put(`assets/video/${name}`, readFileSync(path), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    // Matches the immutable one-year header the deployment path already sets.
    cacheControlMaxAge: 31536000,
    contentType: 'video/mp4',
    token,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`${name}  ${(bytes / 1048576).toFixed(1)}MB  ${secs}s  -> ${blob.pathname}`);
}

const { blobs } = await list({ prefix: 'assets/video/', token });
console.log(`\nstore now holds ${blobs.length} blob(s) under assets/video/:`);
for (const b of blobs.sort((a, z) => a.pathname.localeCompare(z.pathname))) {
  console.log(`  ${b.pathname}  ${(b.size / 1048576).toFixed(1)}MB`);
}
console.log('\nbase:', blobs[0]?.url.replace(/assets\/video\/.*$/, ''));

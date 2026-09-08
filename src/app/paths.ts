/**
 * Resolves a content-relative asset path against the deployment base.
 *
 * Content stores bare paths like `assets/audio/u1-n1.mp3`. Vercel serves the app from
 * the domain root and GitHub Pages from `/<repo>/`, so every asset URL has to go
 * through here rather than being used as-is.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const clean = path.replace(/^\/+/, '');
  return base.endsWith('/') ? base + clean : `${base}/${clean}`;
}

/**
 * Where the nugget videos are served from.
 *
 * The renders are not in the repository. Each is ~23MB, they would be re-uploaded on
 * every deploy, and they would stay in git history for good — so they live in a Vercel
 * Blob store and the manifest keeps bare `assets/video/…` paths that get this prefix.
 *
 * The store's base URL is the default rather than a required environment variable, on
 * purpose. It is a public CDN address, not a secret, and making it a required variable
 * creates a failure mode where a deploy that forgets it serves a player pointing at
 * files that are no longer in the repository. `VITE_VIDEO_BASE` overrides it — set it
 * to move to a different store, or to a local path to work offline.
 */
const VIDEO_BASE = 'https://9zcmfr7mcr08t2hm.public.blob.vercel-storage.com/';

export function videoUrl(path: string): string {
  const base = import.meta.env.VITE_VIDEO_BASE || VIDEO_BASE;
  const clean = path.replace(/^\/+/, '');
  return base.endsWith('/') ? base + clean : `${base}/${clean}`;
}

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
 * Video does not belong in the repository. A render is ~23MB, it is re-uploaded on
 * every deploy, and it stays in git history for good. Setting `VITE_VIDEO_BASE` to a
 * blob store's public base URL moves them off the deployment without touching content
 * or code — the manifest keeps its bare `assets/video/…` paths, and only the prefix
 * changes. Unset, videos are served from the site like every other asset, which is
 * what the repository does today.
 *
 * Example: VITE_VIDEO_BASE=https://<store>.public.blob.vercel-storage.com/
 */
export function videoUrl(path: string): string {
  const base = import.meta.env.VITE_VIDEO_BASE;
  if (!base) return assetUrl(path);
  const clean = path.replace(/^\/+/, '');
  return base.endsWith('/') ? base + clean : `${base}/${clean}`;
}

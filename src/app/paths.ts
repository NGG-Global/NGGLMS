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

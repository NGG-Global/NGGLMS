// Client branding: the accent colour a programme is shown in, and the client logo.
//
// The colour is applied by overriding the accent tokens on a wrapper element, so every
// primary button, meter and highlight inside it follows without per-component props.
// NGG pink is the default and returns no overrides at all, which keeps an unbranded
// programme identical to the hand-tuned root tokens in styles.css.

import type { CSSProperties } from 'react';

export const DEFAULT_ACCENT = '#ec2a8c';

/** Swatches offered in the builder: NGG pink plus the three from the design canvas. */
export const ACCENT_PRESETS: { hex: string; label: string }[] = [
  { hex: DEFAULT_ACCENT, label: 'ורוד NGG' },
  { hex: '#1f7dcf', label: 'כחול' },
  { hex: '#249057', label: 'ירוק' },
  { hex: '#c56c21', label: 'כתום' },
];

const INK = '#15151f';
const WHITE = '#ffffff';

type RGB = [number, number, number];

/** `#abc` or `#aabbcc`, any case → `#aabbcc`; anything else → null. */
export function normalizeHex(value: string | undefined | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return null;
}

function rgb(hex: string): RGB {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

function hex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
}

/** `amount` of `a` over `b`, in sRGB — the same arithmetic CSS color-mix uses. */
function mix(a: RGB, b: RGB, amount: number): RGB {
  return [0, 1, 2].map((i) => a[i] * amount + b[i] * (1 - amount)) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2 contrast ratio. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Below this, button labels are hard to read. NGG pink itself sits at about 4:1 with
 * white, so the bar is set where the house colour already clears it rather than at a
 * figure the platform's own palette would fail.
 */
export const MIN_ACCENT_CONTRAST = 3;

/**
 * Text colour for a button filled with the accent. White is the house style and is kept
 * whenever it clears the bar — ink would often score higher on mid-tone colours, NGG
 * pink included, but switching there would break the look for no gain in legibility.
 * Only a light accent where white fails gets ink, and only if ink actually reads better.
 */
export function onAccent(accent: string): { color: string; ratio: number } {
  const white = contrastRatio(accent, WHITE);
  if (white >= MIN_ACCENT_CONTRAST) return { color: WHITE, ratio: white };
  const ink = contrastRatio(accent, INK);
  return ink > white ? { color: INK, ratio: ink } : { color: WHITE, ratio: white };
}

/** Token overrides for a branded scope. Empty for NGG pink or a missing/invalid value. */
export function accentVars(accent: string | undefined | null): CSSProperties {
  const value = normalizeHex(accent);
  if (!value || value === DEFAULT_ACCENT) return {};
  const base = rgb(value);
  const black: RGB = [0, 0, 0];
  const white: RGB = [255, 255, 255];
  const ink = rgb(INK);
  return {
    '--accent': value,
    '--accent-rgb': base.join(', '),
    '--accent-deep': hex(mix(base, black, 0.88)),
    '--accent-ink': hex(mix(base, black, 0.6)),
    '--accent-grad': hex(mix(base, black, 0.7)),
    '--accent-tint': hex(mix(base, white, 0.08)),
    '--accent-tint-edge': hex(mix(base, white, 0.23)),
    '--accent-light': hex(mix(base, white, 0.7)),
    '--accent-glow': hex(mix(base, white, 0.55)),
    '--on-accent': onAccent(value).color,
    '--hero-mid': hex(mix(base, ink, 0.05)),
    '--hero-end': hex(mix(base, ink, 0.14)),
    '--shadow-primary': `0 10px 22px -10px rgba(${base.join(', ')}, 0.6)`,
  } as CSSProperties;
}

/* ---------------------------------------------------------------- logos --- */

/** How a client name is keyed, so "נורת'ווינד" and "נורת׳ווינד " share one logo. */
export function clientKey(client: string): string {
  return client.trim().replace(/\s+/g, ' ').replace(/['’`]/g, '׳').toLowerCase();
}

export function monogram(client: string): string {
  return client.trim()[0] ?? '·';
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
export const LOGO_ACCEPT = ACCEPTED.join(',');
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
/** Encoded size ceiling per logo. A 256px WebP logo is usually 5–25 KB. */
const MAX_LOGO_CHARS = 150_000;

/** Only re-encoded raster data is ever stored or rendered. */
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

export function isLogoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_LOGO_CHARS && LOGO_DATA_URL.test(value);
}

export class LogoError extends Error {}

/**
 * Turns an uploaded file into a small raster data URL.
 *
 * Everything is redrawn through a canvas: that caps the size (the logo is shown at
 * 92px at most), strips metadata such as EXIF location, and means an SVG is stored as
 * pixels rather than as markup. It also means the store never holds anything but an
 * image the browser itself produced.
 */
export async function prepareLogo(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new LogoError('אפשר להעלות PNG, JPG, WebP או SVG בלבד.');
  if (file.size > MAX_INPUT_BYTES) throw new LogoError('הקובץ גדול מ-5MB. העלו גרסה קטנה יותר של הלוגו.');

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new LogoError('לא ניתן לקרוא את הקובץ כתמונה.');
    }
    // SVGs without intrinsic dimensions report 0; draw them square.
    const w = img.naturalWidth || 256;
    const h = img.naturalHeight || 256;
    for (const side of [256, 192, 128]) {
      const scale = Math.min(1, side / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new LogoError('הדפדפן לא מאפשר לעבד את התמונה.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let out: string;
      try {
        out = canvas.toDataURL('image/webp', 0.92);
        // Browsers that cannot encode WebP silently return PNG; that is fine too.
        if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png');
      } catch {
        throw new LogoError('לא ניתן לעבד את הקובץ. נסו לשמור את הלוגו כ-PNG ולהעלות שוב.');
      }
      if (out.length <= MAX_LOGO_CHARS && LOGO_DATA_URL.test(out)) return out;
    }
    throw new LogoError('הלוגו מורכב מדי לשמירה. העלו גרסה פשוטה יותר או קובץ PNG.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

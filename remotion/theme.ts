/**
 * Visualizer design tokens.
 *
 * Values are lifted from src/styles.css so a rendered nugget and the platform it
 * plays inside read as one brand. Sizes are not: the app is a 14.5px document and
 * the video is a 1920x1080 stage watched from across a room, so the type scale here
 * is its own, tuned on rendered stills rather than scaled from the CSS.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Brand palette, verbatim from the platform tokens. */
export const palette = {
  accent: '#ec2a8c',
  accentDeep: '#d11e78',
  accentInk: '#8e1050',
  accentTint: '#fdeef6',
  accentTintEdge: '#f8cfe4',

  ink: '#15151f',
  ink2: '#3a3a40',
  ink3: '#6b6a73',
  ink4: '#8e8d95',
  ink5: '#a8a6b0',

  violet: '#7a5cd6',
  violetInk: '#4a2fa8',
  green: '#1f8a5b',
  amber: '#e0a020',

  stageDark: '#14141c',
  stageLight: '#fbfbfc',
  surface: '#ffffff',
  hairline: '#f0eff2',
  well: '#f7f6f9',
} as const;

/**
 * Tone-resolved colours. Every scene declares `tone: 'dark' | 'light'`; each side
 * needs its own foreground ramp, and the dark ramp cannot simply be the light one
 * inverted — white at full strength on #14141c blooms, so body text tops out at 0.86.
 */
export interface Tone {
  dark: boolean;
  bg: string;
  /** Headline colour. */
  fg: string;
  /** Body and label colour. */
  fg2: string;
  /** Quiet metadata colour. */
  fg3: string;
  /** Faintest legible tier — dashes, tick marks, disabled rows. */
  fg4: string;
  /** Card and chip fill. */
  panel: string;
  /** Card and chip border. */
  edge: string;
  /** Accent that holds up against `bg`. */
  accent: string;
  /** Accent wash for fills behind accent text. */
  accentWash: string;
}

export const tone = (dark: boolean): Tone =>
  dark
    ? {
        dark,
        bg: palette.stageDark,
        fg: '#ffffff',
        fg2: 'rgba(255,255,255,0.86)',
        fg3: 'rgba(255,255,255,0.56)',
        fg4: 'rgba(255,255,255,0.26)',
        panel: 'rgba(255,255,255,0.055)',
        edge: 'rgba(255,255,255,0.13)',
        // The brand pink is tuned for white paper; on ink it needs lifting to keep
        // its chroma from reading brown.
        accent: '#ff5fa8',
        accentWash: 'rgba(236,42,140,0.16)',
      }
    : {
        dark,
        bg: palette.stageLight,
        fg: palette.ink,
        fg2: palette.ink2,
        fg3: palette.ink3,
        fg4: palette.ink5,
        panel: palette.surface,
        edge: palette.hairline,
        accent: palette.accentDeep,
        accentWash: palette.accentTint,
      };

/** Type scale for the stage, in px at 1080p. */
export const type = {
  hero: 92,
  head: 64,
  sub: 44,
  item: 38,
  body: 34,
  label: 26,
  micro: 21,
} as const;

// One family for everything. IBM Plex Mono is in the platform tokens but carries no
// Hebrew, so a mono accent inside an RTL frame would fall back mid-sentence.
export const font = {
  sans: "'Heebo', system-ui, sans-serif",
} as const;

/** Layout bands. The stage never draws below `stageBottom` — captions live there. */
export const layout = {
  gutter: 132,
  headerBottom: 128,
  stageBottom: 792,
  captionTop: 838,
  progressY: HEIGHT - 6,
} as const;

// Topic identity for the catalogue: a short code, a hue, and the four tones every
// topic-coloured surface is drawn from. Figures follow the Redesign A canvas in the
// Course Builder design system (ngg-data.js), where colour is what lets an admin read
// a programme's path strip — and the library map — by topic at a glance.

import type { CSSProperties } from 'react';
import { library, type LibraryUnit } from './library';

export interface TopicStyle {
  name: string;
  /** Four-letter code, as it prefixes unit codes (CORE·01). */
  code: string;
  hue: number;
  /** Pastel surface: covers, row headers. */
  tint: string;
  /** Hairline on a tinted surface. */
  edge: string;
  /** Solid mark: path-strip segments, nugget bars. */
  mid: string;
  /** Text on a tinted surface. */
  ink: string;
}

/** Curriculum order — the order the catalogue map reads in, not the filter order. */
const TOPICS: [name: string, code: string, hue: number][] = [
  ['מיומנויות AI ליבה', 'CORE', 350],
  ['פתרון בעיות', 'PROB', 35],
  ['ניסוח בקשות', 'PRMT', 75],
  ['אימות ובדיקה', 'VRFY', 150],
  ['AI אחראי', 'RESP', 290],
  ['שיטות עבודה מומלצות', 'PRAC', 320],
  ['תכנון תהליכים', 'PROC', 240],
  ['יסודות Copilot', 'COPL', 200],
];

export const topicStyles: TopicStyle[] = TOPICS.map(([name, code, hue]) => ({
  name,
  code,
  hue,
  tint: `oklch(0.968 0.022 ${hue})`,
  edge: `oklch(0.9 0.05 ${hue})`,
  mid: `oklch(0.7 0.12 ${hue})`,
  ink: `oklch(0.42 0.11 ${hue})`,
}));

const byName = new Map(topicStyles.map((t) => [t.name, t]));

/** A topic added to the library before it is added above still renders, in neutral grey. */
const FALLBACK: TopicStyle = {
  name: '',
  code: 'UNIT',
  hue: 0,
  tint: '#f7f6f9',
  edge: '#e5e4e7',
  mid: '#a8a6b0',
  ink: '#6b6a73',
};

export function topicStyle(topic: string): TopicStyle {
  return byName.get(topic) ?? { ...FALLBACK, name: topic };
}

/**
 * The topic's tones as custom properties, so one class can serve every topic.
 * `--t-hatch` is the stripe used for units still in production.
 */
export function topicVars(topic: string): CSSProperties {
  const t = topicStyle(topic);
  return {
    '--t-tint': t.tint,
    '--t-edge': t.edge,
    '--t-mid': t.mid,
    '--t-ink': t.ink,
    '--t-hatch': t.hue ? `oklch(0.85 0.06 ${t.hue})` : '#e5e4e7',
  } as CSSProperties;
}

/**
 * Unit codes, numbered within each topic in library order. New units should be
 * appended to the library rather than inserted, or the codes after them shift.
 */
const codes = new Map<string, string>();
{
  const counters = new Map<string, number>();
  for (const unit of library) {
    const n = (counters.get(unit.topic) ?? 0) + 1;
    counters.set(unit.topic, n);
    codes.set(unit.id, `${topicStyle(unit.topic).code}·${String(n).padStart(2, '0')}`);
  }
}

export function unitCode(unit: LibraryUnit): string {
  return codes.get(unit.id) ?? topicStyle(unit.topic).code;
}

/**
 * Art direction: which narration line each element of a shot hangs off.
 *
 * The scene components know how to draw a kind of picture. They cannot know which
 * line of a particular nugget's script names which element — that is a reading of the
 * copy, and it is the difference between a reveal that lands on the word and one that
 * merely happens nearby. Nugget 2 made the point: `chips` opens on a token lattice in
 * nugget 1 because that shot's narration is about how the model produces answers, and
 * the same lattice over nugget 2's list of strengths would be decoration.
 *
 * So the mapping lives here, keyed `<contentId>/<segmentId>.<sceneKey>`, next to the
 * scenes rather than inside the content: it is a production decision about a specific
 * cut, not a fact about the curriculum. A shot with no entry falls back to defaults
 * that spread its elements across its own cues — always plausible, rarely as tight.
 */

export type Motif = 'output-lines' | 'uniform-tiles' | 'token-path';

export interface ShotArt {
  /** Supporting visual for a `type` claim, beyond the headline itself. */
  motif?: Motif;
  /** Cue index that brings the motif in, and the one that dismisses it. */
  motifAt?: number;
  motifOutAt?: number;
  /** Cue index at which the scene's head lands. Defaults to the first. */
  headAt?: number;
  /** Cue index revealing each item, one entry per item. */
  itemCues?: number[];
  /** Second beat per item: a `butlist` counterpart, a `twoq` elaboration. */
  detailCues?: number[];
  /** Cue index for a closing emphasis beat. */
  payoffAt?: number;
}

const ART: Record<string, ShotArt> = {
  // Unit 01, nugget 1 --------------------------------------------------------
  // "he writes fast, sounds confident, can phrase texts at a high level" — the
  // bars are that fluency; they leave on the line that says to distrust it.
  'unit-01/s1.b': { motif: 'output-lines', motifAt: 2, motifOutAt: 4 },
  // Two capabilities are named on one line and four on the next.
  'unit-01/s1.c': { motif: 'token-path', headAt: 2, itemCues: [2, 2, 3, 3, 3, 3] },

  // Unit 01, nugget 2 --------------------------------------------------------
  // "to use it the same way for every kind of task" — identical tiles, which
  // differentiate on the line that says not every task is alike.
  'unit-01/s2.b': { motif: 'uniform-tiles', motifAt: 1, motifOutAt: 2 },
  // Eight strengths, named two to a line and then one to a line.
  'unit-01/s2.c': { headAt: 0, itemCues: [3, 3, 4, 4, 5, 5, 6, 7] },
  // "the vaguer, the more sensitive, the more consequential, the more it depends
  // on a relationship" — two on the first line, then one each.
  'unit-01/s2.d': { itemCues: [1, 1, 2, 3], payoffAt: 4 },
  // Three can/cannot pairs, each half on its own line.
  'unit-01/s2.e': { itemCues: [0, 3, 5], detailCues: [1, 4, 6] },
  // Each question, then the example that explains it.
  'unit-01/s2.f': { itemCues: [2, 7], detailCues: [3, 8] },
  // The handle sits low on "a simple task" and travels on "a sensitive task".
  'unit-01/s2.g': { itemCues: [3, 4], payoffAt: 5 },
};

/** Evenly spread `count` reveals across cue indices `[from .. last]`. */
const spread = (count: number, cues: number, from: number): number[] =>
  Array.from({ length: count }, (_, i) =>
    Math.min(cues - 1, from + Math.round((i * Math.max(0, cues - 1 - from)) / Math.max(1, count - 1))),
  );

export interface ResolvedArt extends ShotArt {
  headAt: number;
  itemCues: number[];
  detailCues: number[];
  payoffAt: number;
}

/**
 * Art for one shot, with the gaps filled in. `items` and `cues` are the counts this
 * shot actually has, so a fallback never points past the end of either.
 */
export const artFor = (
  contentId: string,
  segmentId: string,
  sceneKey: string,
  items: number,
  cues: number,
): ResolvedArt => {
  const declared = ART[`${contentId}/${segmentId}.${sceneKey}`] ?? {};
  const headAt = declared.headAt ?? 0;
  const itemCues = declared.itemCues ?? spread(items, cues, Math.min(headAt + 1, cues - 1));
  return {
    ...declared,
    headAt,
    itemCues,
    detailCues: declared.detailCues ?? itemCues,
    payoffAt: declared.payoffAt ?? Math.max(0, cues - 1),
  };
};

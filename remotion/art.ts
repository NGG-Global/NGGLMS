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

  /**
   * Whether a `gauge`'s items are one quantity climbing or a set of alternatives.
   *
   * Nugget 2 lists four conditions that escalate, so they read as a slope. Nugget 3
   * lists three things a first draft might be — excellent, mediocre, or
   * excellent-looking with a substantive problem — and there is no quantity there to
   * climb: drawing a rising slope through them would assert an order the copy does
   * not have. Defaults to 'climb', which is what the platform's own gauge renders.
   */
  series?: 'climb' | 'alternatives';

  /**
   * Whether `chips` are capabilities or things you would type.
   *
   * Nugget 3's chips are quoted follow-up prompts ("קצר את הפתיחה"), not things the
   * tool is good at, so they are drawn as messages rather than labelled abilities.
   */
  chipStyle?: 'capability' | 'prompt';

  /**
   * A `questions` branch the tool picks for itself, and the two lines that do it.
   *
   * Only nugget 1 has this: its narration says the tool decides for itself what
   * matters, so a ring lands on one branch and the rest drop away. Nugget 3's
   * question sets are prompts for the learner, and dimming five of them would say
   * something the copy never says.
   */
  pick?: number;
  pickAt?: number;
  verdictAt?: number;

  /**
   * Whether a `negspace`'s rows get filled in by the tool.
   *
   * Nugget 1's four rows are things the tool does not hold, and the beat that follows
   * is it completing them itself — so the void fills, hatched. Nugget 4's three are
   * conditions under which a source fails ("if the document is old"), and nothing
   * fills them in: they are ways the ground gives way, so each simply takes a warning
   * edge. Defaults to true.
   */
  fill?: boolean;

  /**
   * What a `flow` is doing between its nodes.
   *
   * Nugget 1 turns a lot of text into a little ('condense'), so the source has real
   * bulk and it travels. Nugget 4's flow is grounding — connecting an answer to
   * defined information ('anchor') — and drawing that as compression would say
   * grounding is summarisation, which is the opposite of the point.
   */
  flowStyle?: 'condense' | 'anchor';

  /**
   * Cue index that completes a `principle`'s kept question, when the copy delivers it
   * across two lines. Never defaulted: without it the question is rendered whole,
   * because splitting a list at a comma that was spoken in one breath reads as a
   * sentence breaking rather than finishing.
   */
  tailAt?: number;
}

const ART: Record<string, ShotArt> = {
  // Unit 01, nugget 1 --------------------------------------------------------
  // "he writes fast, sounds confident, can phrase texts at a high level" — the
  // bars are that fluency; they leave on the line that says to distrust it.
  'unit-01/s1.b': { motif: 'output-lines', motifAt: 2, motifOutAt: 4 },
  // Two capabilities are named on one line and four on the next.
  'unit-01/s1.c': { motif: 'token-path', headAt: 2, itemCues: [2, 2, 3, 3, 3, 3] },
  // Three readings on one line and three on the next; then the tool picks one of
  // them for itself, and then that pick is judged.
  'unit-01/s1.g': { itemCues: [1], detailCues: [2] },
  // Four absences named one per line, then the tool filling them in, then the line
  // that calls the result unsound.
  'unit-01/s1.e': { itemCues: [1, 2, 3, 4], detailCues: [5], payoffAt: 7 },
  'unit-01/s1.h': { itemCues: [0, 0, 0, 1, 1, 1], pick: 4, pickAt: 2, verdictAt: 3 },
  'unit-01/s1.i': { itemCues: [1, 2], tailAt: 3 },

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
  'unit-01/s2.h': { itemCues: [1, 2], tailAt: 3 },

  // Unit 01, nugget 3 --------------------------------------------------------
  // "they arrive in seconds, usually written smoothly, tidily and confidently" —
  // the same fluency bars nugget 1 uses, dismissed as the headline lands.
  'unit-01/s3.b': { motif: 'output-lines', motifAt: 1, motifOutAt: 4 },
  // Three things a draft might be, not three rungs of one ladder.
  'unit-01/s3.d': { series: 'alternatives', itemCues: [1, 1, 2], payoffAt: 3 },
  // The prompt is quoted across two lines; the answer is there by the line that
  // calls it professional and pleasant.
  'unit-01/s3.e': { itemCues: [0], detailCues: [1], payoffAt: 2 },
  // "is it clear what changes? is the why explained?" — two on one line, then one
  // each. No pick: these are the learner's questions, not the tool's.
  'unit-01/s3.f': { headAt: 1, itemCues: [2, 2, 3, 4, 5] },
  // Five quoted follow-ups, two on one line and then one each.
  'unit-01/s3.g': { chipStyle: 'prompt', headAt: 2, itemCues: [3, 3, 4, 5, 6], payoffAt: 6 },
  // Shallow use is named on one line, professional work on the next.
  'unit-01/s3.h': { itemCues: [2, 3] },
  // "what is good? what is missing? what is inaccurate?" all land together.
  'unit-01/s3.i': { headAt: 2, itemCues: [4, 4, 4, 5] },

  // Unit 01, nugget 4 --------------------------------------------------------
  // No transcript timestamps for this segment, so every cue position below is an
  // estimate from text length rather than a measured block. See src/player/timeline.ts.
  // No reply to wait for: the prompt is typed and nothing can answer it.
  'unit-01/s4.c': { itemCues: [0], detailCues: [0] },
  'unit-01/s4.d': { itemCues: [0, 0, 0, 1, 1, 2] },
  // The specimen assembles clause by clause, then the line about what it changes.
  'unit-01/s4.e': { itemCues: [1, 2, 3], payoffAt: 4 },
  // Five source types on one line, then the sixth.
  'unit-01/s4.f': { itemCues: [1, 1, 1, 1, 1, 2] },
  // Three quoted ways to ask for source-bound work.
  'unit-01/s4.g': { chipStyle: 'prompt', headAt: 1, itemCues: [2, 3, 4] },
  // Grounding: an answer tethered to defined information, not text compressed.
  'unit-01/s4.h': { flowStyle: 'anchor', itemCues: [1], payoffAt: 3 },
  // Ways a source gives way. Nothing fills these in.
  'unit-01/s4.i': { fill: false, itemCues: [1, 1, 1], payoffAt: 1 },
  'unit-01/s4.j': { headAt: 0, itemCues: [1, 2] },
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

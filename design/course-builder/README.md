# Course Builder design system

Design canvases for the admin library, unit page, programme list and programme builder,
kept as delivered (Claude Design `.dc.html` files — they need the Claude Design runtime).

| File | What it is |
|---|---|
| `Current UI.dc.html` | The screens as they were before this redesign, for comparison |
| `Redesign A - Curriculum Map.dc.html` | **Implemented.** Topic-organised catalogue and a guided 4-step builder |
| `Redesign B - Studio.dc.html` | Alternative direction, not implemented: topic × role matrix and a single-canvas builder |
| `ngg-data.js` | The canvases' sample data; the app reads the real catalogue in `src/content/library.ts` |

How Redesign A maps onto the code:

- Catalogue and unit page — `src/admin/Library.tsx`; topic colours and unit codes — `src/content/topics.ts`
- Programme cards and path strips — `src/admin/Programs.tsx`, `src/admin/catalog.tsx`
- Builder — `src/admin/ProgramBuilder.tsx`; learner-hero preview — `src/learner/ProgramHero.tsx`
- Client branding (accent colour, logo) — `src/app/brand.ts`, `src/app/ClientLogo.tsx`

Where the build departs from the canvas, and why:

- **Unit images.** The canvas reserves an image slot on every unit. The catalogue has no unit
  images, so covers are topic-tinted and carry the topic code rather than stock pictures.
- **Per-unit client intro** (◐ פתיח מותאם ללקוח). Not built in this round; the selected-unit
  panel in step 2 shows the unit's nuggets instead.
- **Assessment content** on the unit page (quiz questions, task) is kept below the structure,
  so content managers can still review what learners are assessed on.
- **Autosave.** Drafts and programmes marked ready save as they are edited; a published
  programme waits for an explicit save, because its learners see every saved change.

The canvases load `public/assets/ngg-mark.png` relative to themselves; those logo files are
not duplicated here (they are the same files as the app's `public/assets`).

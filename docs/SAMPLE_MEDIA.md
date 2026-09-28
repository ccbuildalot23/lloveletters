# Sample media

All rug, room, and workshop photos in the sample catalog are **stock photographs from Unsplash**, used under the
Unsplash License as stand-ins so the site can be reviewed before Chris's own shoot. They are hotlinked from
`images.unsplash.com` with sizing parameters and credited on every product page (`PhotoCredits.astro`).
The pool and photographer credits live in `src/data/unsplash.mjs`; `scripts/sample-products.mjs` assigns them.

They are **not** the rugs being sold. Alt text says so. Replace with real product photography per BUILD_SPEC 3.7
(front, back, two corners, fringe, macro, room-scale, person-for-scale, lifestyle) uploaded through
`npm run upload-media`, and remove the `credit` field.

Named site images (`EXTRAS` in `src/data/unsplash.mjs`): hero poster, founder stand-in, workshop wall, room grid,
knot diagram. The hero/founder videos are still placeholders (`PUBLIC_HERO_STREAM_ID`, `PUBLIC_FOUNDER_STREAM_ID`).

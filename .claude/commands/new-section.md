---
description: Add a new section to the homepage (or another page) matching the site's design
argument-hint: [what the section should show]
---

Add a new page section. Follow `CLAUDE.md` → "Building pages & sections (developer tasks)".

1. Ask which site + which page (default: main homepage `src/pages/index.astro`; IT homepage is `it-site/src/pages/index.astro`).
2. **Read the target page first** and look at 1–2 neighbouring `<section>` blocks so the new one matches their rhythm and background alternation.
3. Use the section skeleton from `CLAUDE.md`: `<section class="relative overflow-hidden bg-{white|paper|#12122d} py-24 md:py-32">` → `<Container width="wide">` → eyebrow row → `md:grid-cols-12` heading grid → content with `data-reveal` / `data-stagger`.
4. Reuse existing components (`Container`, `Button`, `Icon`, `Eyebrow`, `CtaSection`) and design tokens (`am-hero-display`, `am-gradient-ink`, `bg-scooter`, etc.). **Do not invent colors, fonts, spacing, or a CSS framework.**
5. If the section needs data, add a typed array in the page's `---` frontmatter — or, to make it CMS-editable on the main homepage, add it to `src/data/taxonomy.ts` and import it.
6. Alternate the background so it doesn't clash with the neighbour above/below.
7. Verify: build the site (`npm run build` at root, or `cd it-site && npm run build`), then `npm run dev` and check desktop + mobile (grids are `grid-cols-1 md:grid-cols-*`).
8. Offer `/publish`.

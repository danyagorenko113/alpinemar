---
description: Add JSON-LD structured data (site-wide or per-page)
argument-hint: [page path or "global"]
---

Add JSON-LD schema. Follow `CLAUDE.md` → "Add per-page JSON-LD schema".

1. Ask which site: main (`src/data/schema-overrides.json`) or IT (`it-site/src/data/schema-overrides.json`).
2. Decide scope:
   - `global` → injected on every page.
   - `byPath` → injected on one URL only, keyed by path (e.g. `/about-us/`).
3. **The value must be the JSON-LD object serialized as a STRING** (double-encoded), with inner quotes escaped:
   ```json
   { "global": "", "byPath": { "/about-us/": "{\"@context\":\"https://schema.org\",\"@type\":\"AboutPage\"}" } }
   ```
4. The schema renders at the **end of `<body>`** automatically — you don't touch any `.astro` file.
5. Validate the JSON-LD (paste it into Google's Rich Results Test mentally / check it's valid JSON). Verify the site build. Offer `/publish`.

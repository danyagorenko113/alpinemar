---
description: Edit static page copy (homepage, About, In the Media, sitemap, IT pages)
argument-hint: [which page]
---

Edit static page copy. Most of it lives in data files, not the `.astro` templates. Follow `CLAUDE.md`.

Pick the target from "$ARGUMENTS" (ask if unclear):

| Page | Edit this file | Format |
|------|----------------|--------|
| Main About Us (`/about-us/`) | `src/data/about.json` | JSON |
| Main In the Media (`/in-the-media/`) | `src/data/press.json` | JSON |
| Main HTML Sitemap (`/sitemap/`) | `src/data/sitemap.json` | JSON |
| Main homepage cards/logos | `src/data/taxonomy.ts` | TS (keep valid, keep `as const`) |
| IT homepage cards / About values / service CTA / business hours / HubSpot | `it-site/src/data/pages.ts` | TS |

Rules:
- JSON files: double-quoted keys, no trailing commas.
- `.ts` files: keep valid TypeScript (`as const` stays).
- Do not change image paths unless the file exists (main: `public/…`, IT: `it-site/public/…`).
- Verify with the affected site's build. Offer `/publish`.

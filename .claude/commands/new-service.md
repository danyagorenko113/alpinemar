---
description: Create a new service page (main or IT site) and wire it into navigation
argument-hint: [optional: service name]
---

Create a new service page. Follow `CLAUDE.md` → "Add/edit a service".

1. Ask which site: **main** (`src/content/services/`) or **IT** (`it-site/src/content/services/`).
2. Collect: title, summary, and body (raw HTML). Derive `slug` (kebab-case) and set `path: "/services/{slug}/"` (required — this controls the URL).
3. **Group:**
   - Main: set `group:` to one EXACT value from `src/data/navigation.ts` serviceMenu labels (`Tax`, `Accounting`, `Advisory`, `Compliance`, `Audit & Attestation`). A typo silently breaks the breadcrumb.
   - IT: `group` is optional/cosmetic; the parent tab comes from `serviceMenu` in `it-site/src/data/site.ts`.
4. Wire into navigation:
   - Main: add an entry to the right group's `items` in `src/data/navigation.ts`, and to `allServices` in `src/data/taxonomy.ts` (to show on the hub).
   - IT: add the slug to a `children` array (or `moreServices`) in `it-site/src/data/site.ts` `serviceMenu`.
5. IT-site bodies: if this is a parent service line, other pages may cross-link it via `.am-subsvc-grid` HTML — preserve that markup exactly (see `CLAUDE.md` gotchas).
6. Optional hero image at `public/images/services/{slug}.jpg` (main) or `it-site/public/images/services/{slug}.jpg` (IT).
7. Verify with the site's build; fix errors. Report the URL and offer `/publish`.

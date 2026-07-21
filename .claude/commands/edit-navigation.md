---
description: Edit the site navigation / mega-menu (add, remove, reorder items)
argument-hint: [what to change]
---

Edit navigation. Follow `CLAUDE.md` → "Editable data files" and gotchas.

1. Ask which site + which menu:
   - Main **top nav**: `primaryNav` in `src/data/site.ts`.
   - Main **Services / Industries mega-menu**: `serviceMenu` / `industryMenu` in `src/data/navigation.ts`.
   - IT **top nav**: `primaryNav` in `it-site/src/data/site.ts`.
   - IT **Services mega-menu** (tabs + sub-services): `serviceMenu` in `it-site/src/data/site.ts`.
2. These are **`.ts` files — keep them valid TypeScript**: preserve commas, quotes, and the `as const` at the end of each export. A syntax slip breaks the build.
3. Main site coupling: a `serviceMenu[].label` is also the service **group** name. If you rename a label, update `group:` in every matching service `.md` AND in `taxonomy.ts` `allServices` (see `CLAUDE.md` → "Rename a service group label"). Never hand-edit `serviceGroupParent` (auto-derived).
4. Every `href`/slug should point at a real page. IT `serviceMenu` children are service slugs that must match files in `it-site/src/content/services/`.
5. Verify with the site's build. Offer `/publish`.

---
description: Add or edit a team member (main or IT site)
argument-hint: [optional: name]
---

Add/edit a team member. Follow `CLAUDE.md` → "Add/edit a team member".

1. Ask which site: **main** (`src/content/team/`) or **IT** (`it-site/src/content/team/`).
2. Required: `name`, `role`. A member with no `photo:` is hidden from the About carousel.
3. **Schema differs by site — do not mix:**
   - Main: allowed fields are `name`, `role`, `photo`, `credentials` (string array), `order`, `status`. Adding `email:` or `linkedin:` here is a **build error**.
   - IT: allowed fields are `name`, `role`, `photo`, `email`, `linkedin`, `order`, `status`. There is **no `credentials`** field.
4. Photos: main → `public/images/team/…`; IT → `it-site/public/images/team/…`. Reference by absolute path (e.g. `/images/team/name.jpg`).
5. `order` controls carousel position (lower = earlier).
6. Verify with the site's build; fix errors. Offer `/publish`.

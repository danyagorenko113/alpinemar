---
description: Build-check the project(s) affected by recent changes
---

Verify that recent edits build cleanly before committing. Follow `CLAUDE.md` → "Verify & deploy".

1. Run `git status` to see which files changed and infer the affected project(s):
   - Anything under `src/`, `content.config.ts`, `src/data/`, root `vercel.json`, `public/` → **main site**: run `npm run build` at repo root.
   - Anything under `it-site/` → **IT site**: run `cd it-site && npm run build`.
   - Anything under `admin/` → **admin**: run `cd admin && npx tsc --noEmit && npm run build`.
2. Run the build(s). A green build means Astro's Zod validation and TypeScript both passed.
3. If a build fails, read the error — it almost always names the file and line. Fix it and re-run. Do NOT commit a red build.
4. Report pass/fail per project. If all green, offer `/publish`.

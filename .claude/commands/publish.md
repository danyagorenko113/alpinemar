---
description: Commit and push the current changes (this deploys the site)
argument-hint: [optional: commit message]
---

Commit and deploy. **Pushing to `main` deploys to production** — do this deliberately.

1. FIRST run the affected build(s) if not already done this turn (see `/verify`). Never publish a red build.
2. `git status` + `git diff` to review exactly what will ship. Summarize the changes for the user in one or two lines and **confirm** before pushing.
3. Stage and commit with a conventional-commit message (use "$ARGUMENTS" if given, else write one): `content(...)`, `fix(...)`, `feat(...)`, etc. Keep it short and accurate.
4. `git push origin main`. This triggers Vercel to rebuild the affected project(s) (~1–2 min).
5. Reminder: the commit author email must be linked to a GitHub account or Vercel blocks the build (see `CLAUDE.md` deploy gotcha). If the push succeeds but the site doesn't update, check the Vercel dashboard for an `UNKNOWN` build.
6. Report the commit and that the deploy is in progress.

---
description: Create a new blog post on the main site or the IT site
argument-hint: [optional: topic/title]
---

Create a new blog post. Follow `CLAUDE.md` exactly.

1. Ask (or infer from "$ARGUMENTS") which site: **main** (`src/content/insights/`) or **IT** (`it-site/src/content/insights/`). Confirm before writing.
2. Collect: title, one-sentence excerpt, date (default today), category (optional), and the body. If the user gives a rough draft, write clean **raw HTML** body (`<p>`, `<h2>`, `<ul><li>`) — NOT Markdown syntax.
3. Create `{slug}.md` (slug = kebab-case of the title; the filename becomes the URL `/blog/{slug}/`). Required frontmatter: `title`, `excerpt`, `date`. Do NOT write `status: published` (omit it). Use `status: draft` only if they want it hidden.
4. IT-site only: `author:` must **exactly** match a `name:` in `it-site/src/content/authors/`. On the main site the author match is fuzzy.
5. Verify: run the build for that site (`npm run build` at root for main, `cd it-site && npm run build` for IT). Fix any Zod/frontmatter error it reports.
6. Report the new URL and offer to commit + push (deploy) — see `/publish`.

Never guess field names — check `CLAUDE.md` → "Content collections" if unsure.

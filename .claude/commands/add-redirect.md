---
description: Add a 301 redirect (old URL → new URL) on the main or IT site
argument-hint: /old-path -> /new-path
---

Add a 301 redirect. Follow `CLAUDE.md` → "Add a 301 redirect".

1. Parse "$ARGUMENTS" for the old and new path (or ask). Both must start with `/`.
2. Ask which site if unclear:
   - Main site → edit `vercel.json` at the repo root.
   - IT site → edit `it-site/vercel.json`. **IT redirects go in `it-site/vercel.json`, never the root one.**
3. Append to the `redirects` array:
   ```json
   { "source": "/old-path/", "destination": "/new-path/", "permanent": true }
   ```
   Keep the file valid JSON (double-quoted keys, no trailing commas). Do not touch other keys like `$schema`.
4. Verify the JSON parses: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))" && echo OK` (use the right path).
5. Note: redirects only activate after a Vercel deploy (not in local dev). `permanent: true` is served by Vercel as HTTP **308** (a permanent redirect, SEO-equivalent to 301) — so a verifying `curl -I` returns 308, not 301; that's expected. Offer `/publish`.

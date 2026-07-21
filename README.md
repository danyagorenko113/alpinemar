# Alpine Mar

Monorepo for the Alpine Mar web presence. Three independent apps, all deploying from this repo on push to `main`:

| App | Folder | Live URL | Stack |
|-----|--------|----------|-------|
| Main CPA site | `/` (root) | alpinemar.com | Astro |
| IT site | `it-site/` | it.alpinemar.com | Astro |
| Admin CMS | `admin/` | (internal) | Next.js |

## Editing the site — two ways

**1. The admin CMS (no code).** A web dashboard to edit blog posts, services, team, page copy, navigation, redirects, schema, and more — for both sites via a Main / IT switcher. Every save commits to this repo and the site rebuilds automatically. This is the easiest path for non-developers.

**2. AI assistant (Claude Code, Cursor, etc.).** Point any AI coding assistant at this repo and ask in plain language ("add a blog post about X", "change the phone number", "redirect /old to /new"). The assistant reads **[`CLAUDE.md`](./CLAUDE.md)** — a detailed, fact-checked guide that tells it exactly where everything lives, how to edit it safely, and how to verify. Handy slash commands are pre-installed: `/new-blog-post`, `/new-service`, `/add-team-member`, `/add-redirect`, `/edit-navigation`, `/edit-page-copy`, `/add-schema`, `/new-section` (developer: add a homepage section), `/verify`, `/publish`.

## Run locally (for developers)

Each app installs and runs on its own:

```bash
# Main site  → http://localhost:4321
npm install && npm run dev

# IT site    → http://localhost:4322
cd it-site && npm install && npm run dev

# Admin CMS  → http://localhost:3030  (needs admin/.env.local — see admin/README.md)
cd admin && npm install && npm run dev
```

## Build & deploy

```bash
npm run build              # main site  → dist/
cd it-site && npm run build   # IT site → it-site/dist/
cd admin && npm run build     # admin
```

Push to `main` → Vercel rebuilds every affected app (~1–2 min). Always build locally before committing.

## Docs

- **[DEPLOY.md](./DEPLOY.md)** — first-time deploy: how to stand up the three Vercel projects from this one repo.
- **[CLAUDE.md](./CLAUDE.md)** / [AGENTS.md](./AGENTS.md) — the AI operating guide (also the best human reference for where content lives).
- [docs/](./docs/) — design system and migration notes.
- [admin/README.md](./admin/README.md) — the CMS internals and local setup.

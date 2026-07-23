# CLAUDE.md — Alpine Mar Repo

> **This is the AI operating guide for the Alpine Mar repo.** Any AI assistant (Claude Code, Cursor, Copilot, etc.) editing this project should read it in full first. It is written so a non-developer can drive an AI to make safe, correct edits. The same content is mirrored in `AGENTS.md` for tools that look for that filename.

## Orientation

This repo (`danyagorenko113/alpinemar`, branch `main`) contains three deployable units:

| Unit | Root dir | Vercel project | Live URL | Stack |
|------|----------|---------------|----------|-------|
| Main CPA site | `/` (repo root) | `alpinemar` | alpinemar.com | Astro 6, SSG |
| IT site | `it-site/` | `alpinemar-77xf` | it.alpinemar.com | Astro 6, SSG |
| Admin CMS | `admin/` | `alpinemar-qtnx` | admin.alpinemar.com | Next.js 16, SSR |

Push to `main` → all three Vercel projects rebuild automatically (~1–2 min each).

### Golden rules

1. **Verify with a build before committing.** Run `npm run build` in the affected project's directory. Astro's Zod validation will catch frontmatter errors; TypeScript errors surface in both Astro and Next.js builds.
2. **The two Astro sites are completely separate.** No file in `it-site/src/` ever imports from `src/` and vice versa. They have separate `node_modules/`, separate `public/` directories, and separate content collections.
3. **`.ts` data files must stay valid TypeScript.** A syntax error (missing comma, wrong quote) crashes the build. The `as const` at the end of each export is required — do not remove it.
4. **Renaming a slug changes the live URL.** Add a redirect to the appropriate `vercel.json` before or alongside the slug rename.
5. **Keep design and styling consistent.** Use existing color tokens and CSS utilities. Never invent new hex values — all tokens live in the `@theme` block of each `global.css`.

---

## Directory map

```
alpinemar/                         ← GitHub repo root
├── src/                           ← Main CPA site source
│   ├── content/
│   │   ├── services/              ← 34 .md files (service pages)
│   │   ├── industries/            ← 11 .md files (industry pages)
│   │   ├── insights/              ← 88 .md files (blog posts)
│   │   ├── team/                  ← 24 .md files (team members)
│   │   └── authors/               ← 9 .md files (blog author bios)
│   ├── data/
│   │   ├── site.ts                ← Firm identity, contact info, socials (object)
│   │   ├── navigation.ts          ← serviceMenu, industryMenu, companyMenu
│   │   ├── taxonomy.ts            ← allServices (Related-services + industry cross-links) & industries (the /industries/ hub). NOTE: its homepage-card exports are edited by the admin but NOT rendered on the live homepage (which uses local consts in index.astro).
│   │   ├── googleReviews.ts       ← 11 Google reviews (array, order matters)
│   │   ├── reports.ts             ← 3 live report detail pages
│   │   ├── about.json             ← About Us page copy
│   │   ├── press.json             ← In the Media page mentions
│   │   ├── sitemap.json           ← /sitemap/ custom sections
│   │   ├── media-meta.json        ← Alt-text registry for all images
│   │   └── schema-overrides.json  ← Per-page/global JSON-LD injection
│   ├── pages/                     ← Astro page routes
│   ├── components/                ← Astro components
│   ├── layouts/BaseLayout.astro
│   ├── styles/global.css          ← @theme tokens + all CSS utilities
│   └── content.config.ts          ← Zod schemas for all 5 collections
├── astro.config.mjs               ← site: 'https://alpinemar.com'
├── vercel.json                    ← 31 permanent 301 redirects (main site only)
├── package.json                   ← scripts: dev (4321), build, preview
├── integrations/
│   ├── absolute-links.mjs         ← Post-build: rewrites href to absolute (env ABSOLUTE_LINKS=true)
│   └── media-alt.mjs              ← Post-build: fills empty alt from media-meta.json
│
├── it-site/                       ← IT site (separate Astro app)
│   ├── src/
│   │   ├── content/
│   │   │   ├── services/          ← 17 .md files (raw HTML bodies)
│   │   │   ├── insights/          ← 19 .md files (blog posts)
│   │   │   ├── team/              ← 7 .md files (most status: draft)
│   │   │   └── authors/           ← 1 .md file (vanessa-holub.md)
│   │   ├── data/
│   │   │   ├── site.ts            ← IT firm identity; socials is an ARRAY, not object
│   │   │   ├── pages.ts           ← homeServices, values, serviceLineCards, serviceCta, businessHours, hubspot
│   │   │   └── schema-overrides.json
│   │   ├── components/
│   │   ├── layouts/BaseLayout.astro  ← NO ClientRouter; uses 'astro:page-load'
│   │   ├── styles/global.css      ← Same @theme tokens; adds .am-* IT-only utilities
│   │   └── content.config.ts      ← 4 collections: services, team, insights, authors (NO industries)
│   ├── astro.config.mjs           ← site: 'https://it.alpinemar.com'
│   ├── vercel.json                ← Empty redirects array (IT redirects go HERE, not root)
│   ├── public/fonts/              ← Self-hosted Satoshi woff2 (satoshi-400/500/700.woff2)
│   └── package.json               ← dev port 4322, build port 4322
│
└── admin/                         ← CMS (separate Next.js app)
    ├── app/                       ← Next.js App Router pages
    ├── lib/
    │   ├── store/
    │   │   ├── index.ts           ← Routes to fs-store or github-store via CONTENT_STORE env
    │   │   ├── fs-store.ts        ← Local dev: writes to disk (CONTENT_REPO_ROOT defaults to '..')
    │   │   └── github-store.ts    ← Production: commits via Octokit to main branch
    │   └── actions/               ← Server actions; it/ subfolder handles IT site paths
    ├── vercel.json                ← framework: nextjs, region: iad1
    └── package.json               ← dev port 3030
```

---

## Build commands

No top-level workspace or turborepo. Each project installs and runs independently.

```bash
# Main CPA site (repo root)
npm run dev        # http://localhost:4321
npm run build      # → dist/

# IT site
cd it-site
npm run dev        # http://localhost:4322
npm run build      # → it-site/dist/

# Admin CMS
cd admin
npm run dev        # http://localhost:3030
npm run build      # next build
npx tsc --noEmit   # TypeScript check (no typecheck script exists — run manually)
```

---

## Content collections — where everything lives

### Main site (`src/content.config.ts`)

Five collections. All `.md` bodies are **raw HTML** (Webflow migration) — use `<p>`, `<h2>`, `<ul><li>` etc., not Markdown syntax.

#### `src/content/services/` (34 files)

Required frontmatter: `title`, `path`, `summary`.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `title` | string | — | required |
| `heroTitle` | string | `title` | `<h1>` override |
| `path` | string | — | required; controls the URL, e.g. `/services/tax-planning-services/`. NOT the filename. |
| `summary` | string | — | required |
| `cover` | string | `/images/services/{slug}.jpg` | Hero image; falls back to `/images/about/hero.jpg` |
| `coverAlt` | string | `''` | |
| `order` | number | `0` | Sort order on hub page |
| `group` | string | — | Must exactly match a `serviceMenu[].label`: `Tax`, `Accounting`, `Advisory`, `Compliance`, `Audit & Attestation` |
| `industries` | string[] | `[]` | Slugs of related industry pages (cross-link section) |
| `sections` | enum[] | all 8 in order | Allowlist of sections to render. Valid values: `benefits`, `process`, `deepdive`, `reviews`, `industries`, `pillars`, `related`, `faq`. **Omit the key entirely to get the full default layout.** |
| `sectionCopy` | object | — | Per-section heading/eyebrow/intro overrides. Keys: `benefits`, `process`, `deepdive`, `reviews`, `industries`, `pillars`, `related`, `faq`, `cta` |
| `pillars` | `{title, body}`[] | `[]` → 3 firm defaults | "Why Alpine Mar" cards |
| `takeaways` | `{title, body}`[] | `[]` → 4 defaults | "What you get" cards |
| `process` | `{title, body}`[] | `[]` | Numbered process strip |
| `faq` | `{q, a}`[] | `[]` → 4 defaults | FAQ entries |
| `reviewIndex` | number | `0` | Index into `googleReviews` array |
| `status` | `draft`\|`published` | `published` | `draft` hides from listings; detail URL still renders |
| `updated` | date | — | |
| `seo.title` | string | — | |
| `seo.description` | string | — | |
| `seo.canonical` | string | — | Canonical URL override (main site only) |

> No current service file uses `sections`, `sectionCopy`, `takeaways`, `pillars`, `process`, or `faq` — all fall back to site-wide defaults.

#### `src/content/industries/` (11 files)

Required: `title`, `path`, `summary`. The IT site has no industries collection.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `title` | string | — | required |
| `heroTitle` | string | `title` | `<h1>` override |
| `path` | string | — | required; e.g. `/industries/crypto-cpa-services/` |
| `summary` | string | — | required |
| `cover` | string | — | Hero image |
| `coverAlt` | string | `''` | |
| `order` | number | `0` | Sort order on hub |
| `tagline` | string | — | Short hero metric/tagline |
| `kpis` | `{value, label}`[] | `[]` | |
| `services` | string[] | `[]` | Slugs of related services (cross-links) |
| `takeaways` | `{title, body}`[] | `[]` → 4 defaults | |
| `pillars` | `{title, body}`[] | `[]` → 3 defaults | |
| `faq` | `{q, a}`[] | `[]` → 4 defaults | |
| `sectionCopy` | object | — | Per-section overrides. Keys: `benefits`, `services`, `deepdive`, `reviews`, `pillars`, `related`, `faq`, `cta` |
| `status` | `draft`\|`published` | `published` | `draft` hides from the hub |
| `updated` | date | — | |
| `seo.title` / `seo.description` / `seo.canonical` | string | — | |

#### `src/content/insights/` (88 files)

Required: `title`, `excerpt`, `date`.

URL: `/blog/{filename-without-md}/`

| Field | Type | Notes |
|-------|------|-------|
| `author` | string | Fuzzy-matched (substring, both directions) against `authors.name`, then team |
| `category` | string | Drives `/blog/category/{category}/` listing pages |
| `tags` | string[] | Drives `/blog/topic/{tag}/` listing pages |
| `seo.canonical` | string | Supported on main site only |

Featured slot on main site blog index = newest published post by date. There is **no `featured:` flag** on the main site's insights schema.

#### `src/content/team/` (24 files)

Required: `name`, `role`. A member without `photo:` is excluded from the About carousel.

Main site team has `credentials: string[]` but **no `email` or `linkedin` fields** — those cause a build error if added here.

#### `src/content/authors/` (9 files)

Required: `name`. The body paragraph is the bio shown at the bottom of blog posts.

Author matching on the main site is **fuzzy** (substring in either direction): insight `author: "Pablo Martell, CPA"` matches author file `name: "Pablo Martell, CPA"` or `name: "Pablo Martell"`.

---

### IT site (`it-site/src/content.config.ts`)

Four collections: `services`, `insights`, `team`, `authors`. **No `industries` collection.**

#### `it-site/src/content/services/` (17 files)

Simpler schema — no `sections`, `sectionCopy`, `pillars`, `takeaways`, `process`, `faq`, `industries`, `kpis`, `reviewIndex`.

Required: `title`, `path`, `summary`. Optional: `heroTitle`, `cover`, `group`, `status`, `updated`, `seo.title`, `seo.description`.

**The body MUST be raw HTML.** Markdown headings (`##`) or bullets (`-`) render as literal text, not formatted elements.

Four IT service files contain a `.am-subsvc-grid` block of anchor tags cross-linking to child service pages. Preserve the exact HTML class names:

- `it-site/src/content/services/cybersecurity.md`
- `it-site/src/content/services/it-consulting.md`
- `it-site/src/content/services/remote-it-support.md`
- `it-site/src/content/services/ai-code-security-audit.md`

Structure to preserve:
```html
<div class="am-subsvc-grid">
  <a class="am-subsvc-card" href="/services/child-slug/">
    <span class="am-subsvc-eyebrow">Parent Group Name</span>
    <span class="am-subsvc-title">Sub-Service Name</span>
    <span class="am-subsvc-teaser">One-line teaser.</span>
    <span class="am-subsvc-more">Learn More ↗</span>
  </a>
</div>
```

#### `it-site/src/content/insights/` (19 files)

Same as main site insights minus `seo.canonical` and `coverAlt` (neither is in the IT insights schema), plus:

| Field | Type | Notes |
|-------|------|-------|
| `featured` | boolean | `true` pins post as hero on `/blog/`. Only one post should have this. Fallback: newest Cybersecurity post. |
| `category` | string | Special value: `"Media"` (capital M, exact) → post **also** appears on the `/media/` listing. It still appears on `/blog/` too (the blog index only filters `status: draft`). Use `status: draft` to keep it off `/blog/`. |

Author matching on IT site is **strict equality**: `author:` in the insight must exactly match `name:` in the author file.

#### `it-site/src/content/team/` (7 files)

IT team has `email` and `linkedin` but **no `credentials` field**. Most entries are currently `status: draft`.

#### `it-site/src/content/authors/` (1 file)

`vanessa-holub.md`. Author `name` must exactly match the `author:` string in insight files.

---

### Key schema differences between sites

| Feature | Main site | IT site |
|---------|-----------|---------|
| Collections | services, industries, insights, team, authors | services, insights, team, authors |
| Services rich fields | sections, sectionCopy, pillars, takeaways, process, faq, industries, kpis, reviewIndex | none |
| `insights.featured` | not in schema | boolean, pins blog hero |
| `category: "Media"` | no special routing | adds post to `/media/` listing (still on `/blog/` unless `status: draft`) |
| `seo.canonical` | supported | not in schema; has no effect if added |
| Author name matching | fuzzy (substring) | strict equality |
| Team `email`/`linkedin` | not in schema (build error if added) | supported |
| Team `credentials` | string[] | not in schema |
| Services body | HTML | HTML; 4 files have `.am-subsvc-grid` blocks |

---

## Editable data files

### Main site (`src/data/`)

All `.ts` files must stay valid TypeScript. Preserve `as const` at the end of every export. `.json` files are safer to edit (standard JSON — no trailing commas, double-quoted keys).

| File | Controls | Format |
|------|----------|--------|
| `site.ts` | Firm name, phone, email, address, maps embed/directions, socials (object), memberships, clientPortal, itPortal; also `primaryNav` | TS |
| `navigation.ts` | `serviceMenu` (5 groups with items), `industryMenu` (11 entries), `companyMenu`; `serviceGroupParent` is auto-derived — never hand-edit it | TS |
| `taxonomy.ts` | **`allServices`** → drives the "Related services" panel on service detail pages + service cross-links inside industry pages (entry shape `{title, group, href, image, summary}`). **`industries`** → the cards on the `/industries/` hub. ⚠️ The homepage-card exports (`featuredServices`, `featuredIndustries`, `partnerLogos`, `latestPosts`, `valueProps`, `integrations`) are editable via the admin Homepage form but are **not rendered on the live homepage** — the homepage uses local consts in `src/pages/index.astro` (see below). Keep verbatim texts verbatim. | TS |
| `googleReviews.ts` | Array of 11 reviews. `rating` field type is literal `5` — any other value is a TS error. Array order matters (slice positions). | TS |
| `reports.ts` | 3 live report detail pages. Also update `src/pages/reports/index.astro` local stub list when adding a report. | TS |
| `about.json` | All About Us page copy: heroTitle, journeyHeading, journeyBody[], drives[], journeyPhotos[], CTA | JSON |
| `press.json` | In the Media page: title, tagline, CTA, mentions[] | JSON |
| `sitemap.json` | /sitemap/ hero + custom sections only (services/industries auto-generated) | JSON |
| `media-meta.json` | Alt-text registry: maps `public/images/...` paths to `{alt: string}`. Add entry whenever you add an image. | JSON |
| `schema-overrides.json` | `global` (JSON-LD string on every page) + `byPath` ({path: JSON-LD string}). Both fields are currently empty. | JSON |

**`site.ts` socials is an object** (`site.socials.facebook`, `.instagram`, `.linkedin`, `.twitter`). The footer checks each key conditionally.

**`serviceGroupParent`** in `navigation.ts` is computed from `serviceMenu` labels at runtime:
```ts
export const serviceGroupParent: Record<string, string> = Object.fromEntries(
  serviceMenu.map((g) => [g.label, g.href]),
);
```
Never hand-edit this export. The `group:` field in every service `.md` must exactly match one of the five `serviceMenu[].label` strings — a mismatch silently breaks the breadcrumb and related-service panel.

### IT site (`it-site/src/data/`)

| File | Controls | Format |
|------|----------|--------|
| `site.ts` | IT firm identity, contact info; **socials is an ARRAY** `[{label, href}]` (order matters — Footer uses `socials[0]` through `[3]` with hardcoded aria-labels); also `primaryNav`, `serviceLines`, `moreServices`, `serviceMenu` | TS |
| `pages.ts` | `homeServices`, `values`, `serviceLineCards`, `serviceCta`, `businessHours`, `hubspot` ({region, portalId, formId}) | TS |
| `schema-overrides.json` | Same shape as main site; both fields currently empty | JSON |

IT Navigation (`serviceMenu` export) and IT Settings (`site` + `primaryNav` exports) both write to `it-site/src/data/site.ts` in the admin. They edit different exports within the same file — be careful when editing directly.

---

## How do I… (playbook)

### Add/edit a blog post — main site

1. Create or open `src/content/insights/{slug}.md`. The slug is the filename without `.md` and becomes the URL `/blog/{slug}/`.
2. Required frontmatter:
   ```yaml
   ---
   title: "Post Title"
   excerpt: "One-sentence teaser shown in cards and meta."
   date: 2026-07-21
   ---
   ```
3. Optional fields:
   ```yaml
   author: "Pablo Martell, CPA"   # substring-matches authors collection
   category: "Tax Strategy"        # drives category filter chips on /blog/
   tags: ["s-corp"]
   cover: "/images/blog/2026/my-post.jpg"
   coverAlt: "Alt text"
   status: draft                   # omit for published
   seo:
     title: "Custom <title>"
     description: "Custom meta description"
     canonical: "https://alpinemar.com/blog/slug/"
   ```
4. Write the body as raw HTML: `<p>...</p><h2>...</h2><ul><li>...</li></ul>`
5. **Verify:** `npm run build` at repo root (Zod validates all frontmatter). Visit `/blog/{slug}/` in dev.

### Add/edit a blog post — IT site

1. Create or open `it-site/src/content/insights/{slug}.md`.
2. Same required fields as main site. Additional optional field: `featured: true` (pins as hero on `/blog/`).
3. Set `category: "Media"` (capital M) to **also** surface the post on the `/media/` listing. This does **not** remove it from `/blog/` — the blog index only filters out `status: draft`, so a Media post appears on **both** `/blog/` and `/media/`. To keep a post off `/blog/` entirely, set `status: draft` (there is no "media-only" flag).
4. `author:` must **exactly match** the `name:` in `it-site/src/content/authors/`.
5. Only one post should have `featured: true` at a time.
6. **Verify:** `cd it-site && npm run build`. Visit `/blog/{slug}/` in dev (port 4322).

### Add/edit a service — main site

1. Create or open `src/content/services/{slug}.md`.
2. Required:
   ```yaml
   ---
   title: "Service Name"
   path: "/services/{slug}/"
   summary: "One-sentence pitch."
   ---
   ```
3. Set `group:` to one of the exact values: `Tax`, `Accounting`, `Advisory`, `Compliance`, `Audit & Attestation`.
4. To add to the nav mega-menu: add an entry to the correct group's `items` array in `src/data/navigation.ts`.
5. The `/services/` hub grid **auto-populates from the collection** — no action needed there. But to make this service appear in the **"Related services" panel** on other service detail pages (and in industry cross-link sections), add a `{title, group, href, image, summary}` entry to `allServices` in `src/data/taxonomy.ts`. Skipping this silently leaves the service out of cross-linking (no build error).
6. Place a hero image at `public/images/services/{slug}.jpg` (or set `cover:` in frontmatter).
7. **Verify:** `npm run build`. Visit `/services/{slug}/` in dev.

### Add/edit a service — IT site

1. Create or open `it-site/src/content/services/{slug}.md`.
2. Required: `title`, `path`, `summary`.
3. Body **must be raw HTML**.
4. Wire it into `it-site/src/data/site.ts`. Understand the three exports — they serve different surfaces:
   - **`serviceMenu`** = the mega-menu. Each entry is a top-level **service line** (a parent tab like "Cybersecurity Services") with a `children` array of slugs. To slot a service *under an existing line*, add its slug to that line's `children`.
   - **`moreServices`** = a flat "more" list for standalone services that don't belong to a line. Use this for a one-off service.
   - **`serviceLines`** = the data behind the line-level landing/parent pages.
   - If you're adding a **whole new primary service line** (not just a child), you also add a card for it in `it-site/src/data/pages.ts` → **`serviceLineCards`** (that's what renders the line on the homepage/hub), plus a new `serviceMenu` entry and matching `serviceLines` entry.
5. To add cross-link cards on a parent service page, edit the parent's `.am-subsvc-grid` block in HTML (see the four files listed under the IT services schema).
6. **Verify:** `cd it-site && npm run build`. Visit `/services/{slug}/` in dev.

### Add/edit an industry page — main site only

1. Create or open `src/content/industries/{slug}.md`. (IT site has no industries collection.)
2. Required: `title`, `path`, `summary`.
3. Add `services: [slug-list]` for cross-links to related service pages.
4. To add to the nav dropdown: add an entry to `industryMenu` in `src/data/navigation.ts`.
5. To add to the industries hub grid: add an entry to `industries` in `src/data/taxonomy.ts`.
6. **Verify:** `npm run build`. Visit `/industries/{slug}/` in dev.

### Add/edit a team member

Main site (`src/content/team/{slug}.md`):
- Required: `name`, `role`
- Optional: `photo`, `credentials: [CPA, MBA]`, `order`
- **No `email` or `linkedin` fields** — adding them causes a build error
- A member without `photo:` is excluded from the About carousel

IT site (`it-site/src/content/team/{slug}.md`):
- Required: `name`, `role`
- Optional: `photo`, `order`, `email`, `linkedin`
- **No `credentials` field**
- Images go in `it-site/public/images/team/` (not the root `public/`)

### Add/edit a blog author

Main site: `src/content/authors/{slug}.md`
IT site: `it-site/src/content/authors/{slug}.md`

Required: `name`. Optional: `title`, `photo`, `photoAlt`, `linkedin`, `email`, `order`.
Body paragraph = the bio shown at the bottom of blog posts.

Matching rules: main site uses substring match in either direction. IT site requires strict equality between `author:` in the insight and `name:` in the author file.

### Add a 301 redirect — main site

Edit `vercel.json` at the repo root:
```json
{ "source": "/old-path/", "destination": "/new-path/", "permanent": true }
```

`permanent: true` is the right choice for a "301" — but note Vercel serves it as HTTP **308** (Permanent Redirect), not literally 301. Both are permanent and SEO-equivalent; don't be alarmed by the 308. (`permanent: false` → 307.)

**Verify:** Redirects only activate on Vercel deploys, not in local `astro dev`. After pushing, `curl -I https://alpinemar.com/old-path/` should return 308.

### Add a 301 redirect — IT site

Edit `it-site/vercel.json` (currently has an empty `redirects` array). Use the same format. IT redirects must go in `it-site/vercel.json`, not in the root `vercel.json`.

### Update contact info / phone / email — main site

Edit `src/data/site.ts`. Change both `phone` (display string) and `phoneHref` (E.164, e.g. `+19547430147`) together. Also update `maps.embed` and `maps.directions` manually — they are not auto-derived.

The `socials` field is an object: `{ facebook, instagram, linkedin, twitter }`. Changes propagate site-wide automatically.

### Update contact info / phone / hours — IT site

Edit `it-site/src/data/site.ts` for phone, email, address, socials.
Edit `it-site/src/data/pages.ts` line for `businessHours` (shown in the "At a glance" sidebar on every service detail page).

IT `socials` is an **array** — do not reorder entries (Footer uses `socials[0]`–`[3]` by index with hardcoded aria-labels).

### Update the IT site HubSpot form

Edit `it-site/src/data/pages.ts` → `hubspot` object. Change `formId` to swap forms; `portalId` and `region` rarely change.

For the main site HubSpot form, edit `src/components/ContactForm.astro` line 5 (`const HS = {...}`). Change only `formId`.

### Add per-page JSON-LD schema

Edit `src/data/schema-overrides.json` (main) or `it-site/src/data/schema-overrides.json` (IT).

```json
{
  "global": "",
  "byPath": {
    "/about-us/": "{\"@context\":\"https://schema.org\",\"@type\":\"AboutPage\"}"
  }
}
```

The outer file is JSON. Each value in `global` and `byPath` must be the JSON-LD object **serialized as a string** (double-encoded). The schema renders at the **end of `<body>`** (after `<Footer/>`), not in `<head>`.

### Update About Us page copy — main site

Edit `src/data/about.json`. Fields: `heroTitle`, `journeyHeading`, `journeyBody[]`, `drivesHeading`, `drivesIntro`, `drives[]`, `journeyPhotos[]`, `ctaHeading`, `ctaButtonLabel`, `ctaHref`. Do not change `drives[].icon` paths unless the SVG file exists at that path in `public/icons/about/`.

### Add a press mention — main site

Edit `src/data/press.json`. Append to `mentions`:
```json
{ "outlet": "Publication Name", "date": "2026", "headline": "Article Headline", "href": "https://..." }
```

### Update the IT site service CTA band

Edit `it-site/src/data/pages.ts` → `serviceCta` object. This band appears at the bottom of every IT service detail page.

### Add a Google review — main site

Edit `src/data/googleReviews.ts`. Add to the `googleReviews` array:
```ts
{ name: 'Client Name', initials: 'CN', date: 'July 2026', rating: 5, quote: 'Quote text.' }
```
`rating` must be the literal `5` — any other value is a TypeScript error. Array order matters: different pages show different slices of the array (services and industries hubs, plus a single featured review), so reordering changes which reviews appear where.

### Rename a service slug

1. Rename the `.md` file and update `path:` in the frontmatter to the new URL.
2. Update all hrefs pointing to the old slug in: `src/data/navigation.ts`, `src/data/taxonomy.ts`, `src/components/Footer.astro`.
3. Add a redirect in `vercel.json`: `{ "source": "/services/old-slug/", "destination": "/services/new-slug/", "permanent": true }`.
4. Search all content for cross-links: `grep -r 'old-slug' src/content/` and update them.
5. **Verify:** `npm run build`.

### Rename a service slug — IT site

IT service links are hardcoded in several places (no `allServices`-style single source). Update **all** of these or the mega-menu, footer, and cross-links break silently:
1. Rename `it-site/src/content/services/{slug}.md` and update `path:` in its frontmatter.
2. `it-site/vercel.json` — add `{ "source": "/services/old-slug/", "destination": "/services/new-slug/", "permanent": true }`.
3. `it-site/src/data/site.ts` — update the slug wherever it appears in `serviceMenu` (`children` arrays), `serviceLines`, and `moreServices`.
4. `it-site/src/components/Footer.astro` — update the `serviceLinks` array (around lines 14–19).
5. Cross-links inside other services' raw HTML bodies: `grep -rn 'old-slug' it-site/src/content/` and fix each `href`.
6. **Verify:** `cd it-site && npm run build`.

### Rename a service group label

If you rename a `serviceMenu[].label` in `src/data/navigation.ts` (e.g. `Compliance` → `Regulatory`):
1. Update the `label` in `navigation.ts`.
2. Update `group:` in every service `.md` file that used the old label.
3. Update `group:` in every `allServices` entry in `src/data/taxonomy.ts`.
All three must match or breadcrumbs and related-service panels break silently.

### Undo a change / roll back

Every save is a git commit, so nothing is ever truly lost.
- **Undo the most recent change:** `git revert HEAD` (creates a new commit that reverses the last one), then push — `/publish`. This is safe: it never rewrites history.
- **Undo a specific older change:** find it with `git log --oneline`, then `git revert <hash>`.
- **Non-developer path:** on github.com, open the repo → **Commits**, find the change, and use the "Revert" button on that commit's page (opens a PR that undoes it). Or ask the AI assistant: "undo my last change and publish."
- Do **not** use `git reset --hard` or force-push to undo — it rewrites shared history and can break the other two Vercel projects. Always prefer `git revert`.

### Preview a change before it goes live

There is no separate staging site; `main` deploys straight to production. To check work before the public sees it:
- **Local preview (developers):** `npm run build && npm run preview` (main) or `cd it-site && npm run build && npm run preview` (IT) — this renders the real production build at `localhost`.
- **Hide a not-ready page in production:** set `status: draft` in its frontmatter. Draft pages are dropped from listings/hubs; the detail URL still renders but isn't linked anywhere. Flip to `published` when ready.
- **Vercel preview deploys:** if you push to a branch other than `main` (instead of committing directly), Vercel builds a private preview URL for that branch. Merging to `main` promotes it to production.

### A deploy failed — now what?

If a build breaks (the site shows the last good version until a build succeeds, so the live site is safe):
1. Open the Vercel dashboard for the failed project (`alpinemar`, `alpinemar-77xf`, or `alpinemar-qtnx`) → **Deployments** → click the failed one → read the build log for the first error.
2. If your last change caused it, roll it back: `git revert HEAD` → push (see "Undo a change" above). The site returns to the last working state.
3. Reproduce locally before re-pushing: run the matching build (`npm run build`, `cd it-site && npm run build`, or `cd admin && npm run build`) and fix the reported error.
4. Never leave `main` red — either fix forward quickly or revert.

---

## GOTCHAS / DO NOT TOUCH

### Critical deploy gotcha: commit author email

Vercel blocks builds when the commit author email is not linked to a GitHub account. The default fallback in `admin/lib/store/github-store.ts` is `admin@alpinemar.com` — this email is not linked to any GitHub account and will break all three Vercel deploys.

**Symptom:** Deployments show `UNKNOWN` status instead of `Ready` in the Vercel dashboard.

**Fix:** The env var `GITHUB_COMMIT_EMAIL` must be set on the admin Vercel project (`alpinemar-qtnx`) to a verified email on the GitHub account that has write access to the repo (currently `dgorenko115@gmail.com`). Any automation or bot committing to `main` must also use a GitHub-linked email.

### The two sites have separate public/ directories

- Main site images: `public/images/…` → served at `https://alpinemar.com/images/…`
- IT site images: `it-site/public/images/…` → served at `https://it.alpinemar.com/images/…`
- An image in the root `public/` does not exist on the IT site and vice versa.
- IT site fonts: `it-site/public/fonts/satoshi-{400,500,700}.woff2` — deleting or renaming causes silent fallback to system-ui with no build error.

### Service group coupling

The `group:` frontmatter in every main site service `.md` must **exactly match** one of the five `serviceMenu[].label` strings in `src/data/navigation.ts`:

```
'Tax' | 'Accounting' | 'Advisory' | 'Compliance' | 'Audit & Attestation'
```

A typo silently drops the breadcrumb middle crumb and breaks the related-service panel. No build error.

### Spanish service slugs — do not delete, do not add to EN nav

Three files exist intentionally outside the English navigation:
- `src/content/services/creacion-de-empresas.md`
- `src/content/services/servicios-contables.md`
- `src/content/services/servicios-tributarios-en-florida.md`

They appear in `src/components/Footer.astro` but are excluded from `serviceMenu` in `navigation.ts`. Do not add them to the EN mega-menu. Do not delete them without adding redirects.

### IT site socials array order is fixed

`it-site/src/components/Footer.astro` accesses socials by hardcoded index with hardcoded aria-labels:
- `socials[0]` → Facebook
- `socials[1]` → X (Twitter)
- `socials[2]` → Instagram
- `socials[3]` → LinkedIn

Reordering or inserting entries in the middle silently swaps which URL appears under which icon. Only update `href` values; never reorder.

### Main site socials is an object; IT site socials is an array

They have completely different shapes. Do not apply the same editing pattern to both.

### IT service bodies must be raw HTML

Writing Markdown syntax (`## Heading`, `- bullet`) in an IT service `.md` body renders as literal text. Use `<h2>`, `<ul><li>` etc.

### The `.am-subsvc-grid` HTML must be preserved exactly

The four IT service files with subsvc-grid blocks must be edited as raw text. Any rich-text editor that strips `class=` attributes will destroy the card grid layout. The CSS classes (`am-subsvc-grid`, `am-subsvc-card`, `am-subsvc-eyebrow`, `am-subsvc-title`, `am-subsvc-teaser`, `am-subsvc-more`) are defined in `it-site/src/styles/global.css`.

### `sections:` on main site services is an allowlist, not a blocklist

If `sections:` is present and empty (`sections: []`), zero sections render. To restore the full default layout, **delete the `sections:` key entirely**.

### Main site team has no email/linkedin; IT site team has no credentials

Adding `email:` or `linkedin:` to a main site team `.md` file causes a Zod validation error at build time. Adding `credentials:` to an IT site team file causes the same.

### IT site author matching is strict equality

The `author:` string in an IT site insight must exactly match the `name:` in the author file. A mismatch silently drops the author card with no error.

### schema-overrides.json is double-encoded

The outer file is JSON. Each value in `global` and `byPath` is a JSON-LD object serialized as a string. You must escape inner double quotes: `"{\"@context\":\"https://schema.org\"}"`.

### IT site `featured:` — only one post at a time

If multiple IT insights have `featured: true`, `posts.find()` returns the first in collection order. The rest are silently ignored.

### `status: published` should not be written explicitly

The Astro collection schema defaults `status` to `'published'` when the key is absent. Published entries should have no `status` key at all. Only write `status: draft` to hide from listings. (This is how the admin CMS writes it.)

### Redirects are not instant

`vercel.json` redirects only activate after a Vercel build. They do not run in local `astro dev`. Test redirects only after deploying.

### No pre-commit hooks

Nothing stops a broken build from being pushed. Always run `npm run build` locally before committing.

### DO NOT TOUCH

| Path | Reason |
|------|--------|
| `dist/` and `it-site/dist/` | Build output, overwritten on every build |
| `node_modules/` and `it-site/node_modules/` | Package dependencies |
| `.astro/` and `it-site/.astro/` | Generated Astro types |
| `@theme` token block in `src/styles/global.css` | Hundreds of Tailwind classes depend on exact token names |
| `@theme` token block in `it-site/src/styles/global.css` | Same |
| `it-site/public/fonts/satoshi-*.woff2` | Self-hosted fonts; renaming/deleting causes silent system-ui fallback |
| `socials` array order in `it-site/src/data/site.ts` | Footer hardcodes array indices 0–3 |
| `serviceGroupParent` export in `src/data/navigation.ts` | Auto-computed; never hand-edit |
| `src/data/schema.ts` and `it-site/src/data/schema.ts` | Generated code; edit `site.ts` instead |
| `src/data/schema-overrides.ts` and `it-site/src/data/schema-overrides.ts` | Thin wrappers; edit the `.json` files |
| `integrations/absolute-links.mjs` and `integrations/media-alt.mjs` | Custom Astro integrations; removing either breaks the main site build |
| `admin/vercel.json` | Controls Vercel build for admin; removing `framework` or `buildCommand` breaks deploy |
| `src/content.config.ts` | Zod schema source of truth; removing a field breaks existing `.md` files |
| `admin/.env.local` | Secrets; never commit |
| `serviceMenu` label strings in `src/data/navigation.ts` | Must match `group:` in every service `.md` |
| `overrides: { vite: "^7" }` in both `package.json` files | Required for Tailwind v4 `@tailwindcss/vite` compatibility |
| The `maps` object in `src/data/site.ts` | Preserved but not exposed in the Settings form; edit directly if changing map URL |
| `src/components/ContactForm.astro` HubSpot `portalId` | Only change `formId`; the portal ID rarely changes |

---

## Verify & deploy

### Before every commit

```bash
# For changes to main site content or data:
npm run build          # from repo root

# For changes to IT site content or data:
cd it-site && npm run build

# For changes to admin CMS code:
cd admin && npx tsc --noEmit && npm run build

# Sanity checks after editing content files:
grep -n 'path:' src/content/services/my-service.md      # must start/end with /
grep -n 'status:' src/content/services/my-service.md    # must be draft or published
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))" && echo OK
```

### Commit format (conventional commits)

```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, test, chore, perf, content, ci
```

Examples:
```
content(services): add managed-it-services service page
fix(it-site): correct path field in cybersecurity.md
feat(admin): batch content reads for industry listings
```

### Push to main = deploy to all three projects

Every push to `main` triggers all three Vercel projects to rebuild in parallel. Build time ~1–2 min each. A failure in one project does not block the others.

### How a CMS save reaches production

```
Admin UI → Save button
  → Server Action (admin/lib/actions/*.ts)
  → getStore() → github-store (CONTENT_STORE=github)
  → Octokit commits .md to main branch
  → Vercel detects push → rebuilds all 3 projects
  → Static HTML on CDN in ~1-2 min
```

Content for the **main site** lives at paths like `src/content/insights/<slug>.md`.
Content for the **IT site** lives at `it-site/src/content/services/<slug>.md` — note the `it-site/` prefix.

### Admin local dev setup

```bash
cd admin
# Create admin/.env.local with:
# ADMIN_PASSWORD=<any password>
# SESSION_SECRET=<32+ random chars>
# CONTENT_STORE=fs
# CONTENT_REPO_ROOT=..
npm install && npm run dev   # http://localhost:3030
```

In `fs` mode, saves write directly to the repo working tree. Commit manually with `git add` / `git commit`.

### Required Vercel env vars for admin (production)

Set on project `alpinemar-qtnx`:

| Variable | Notes |
|----------|-------|
| `ADMIN_PASSWORD` | Login password for /login |
| `SESSION_SECRET` | 32+ random chars for cookie signing |
| `CONTENT_STORE` | `github` |
| `GITHUB_TOKEN` | Fine-grained PAT, Contents R/W on alpinemar repo |
| `GITHUB_OWNER` | GitHub username/org owning the repo |
| `GITHUB_REPO` | `alpinemar` |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_COMMIT_NAME` | Display name for commits (e.g. `Alpine Mar Admin`) |
| `GITHUB_COMMIT_EMAIL` | **Must be a verified email on a real GitHub account** |
| `NEXT_PUBLIC_SITE_URL` | `https://alpinemar.com` — base for the admin's "View live" links. If unset it falls back to `https://alpinemar.vercel.app`, so preview links point at the wrong URL. |
| `NEXT_PUBLIC_IT_SITE_URL` | `https://it.alpinemar.com` — same, for IT-site "View live" links (fallback is the production domain). |

---

## Design system & styling

Both sites use **Tailwind v4** via the `@tailwindcss/vite` Vite plugin. There is no `tailwind.config.js`. All custom tokens live in the `@theme` block of each `global.css`.

Both sites share an identical color palette. Main site has additional semantic aliases (`--color-scooter`, `--color-delft`, `--color-brand-2`, `--color-paper`) in the `@theme` block.

**Never use arbitrary hex values in markup.** If you need a color, use a token:

| Token | Value | Usage |
|-------|-------|-------|
| `navy-900` / `navy` | `#12122d` | Dark section backgrounds, headings |
| `navy-500` / `mountain` | `#454561` | Body text on light backgrounds |
| `teal-500` / `teal` / `scooter` | `#33bbdc` | Accent, icons, dots, active states |
| `teal-700` | `#176a80` | Teal as text on white (accessible) |
| `delft` | `#1f3062` | Primary CTA button background |
| `paper` | `#f9fafb` | Page canvas (body background) |

### Typography

Every font token resolves to Satoshi:
- `--font-heading`, `--font-body`, `--font-serif`, `--font-display` → `"Satoshi", "Poppins", ui-sans-serif`
- `--font-mono` → `"Satoshi"` on the **main site** (not monospace); `ui-monospace` on the **IT site only**

Main site loads Satoshi via Fontshare CDN in `BaseLayout.astro`. IT site self-hosts at `it-site/public/fonts/`.

### Key CSS utilities

All headings have `font-heading`, `color: navy-900`, `font-weight: 600`, `line-height: 1.12`, `letter-spacing: -0.015em` applied site-wide via `@layer base`.

Display type scale: `.text-hero-xl` (home, clamp 2.9–6.5rem), `.text-hero-lg` (hubs), `.text-hero-md` (detail pages), `.am-hero-display` (redesign heroes, weight 500).

Gradient headings: `.am-gradient-ink` (dark → light on light backgrounds), `.am-gradient-ink-light` (white → light-blue on dark). Do not combine with a `text-*` color class — gradient headings set `color: transparent`.

Long-form body: wrap rendered HTML body in `<div class="prose-am">`. Always pair with `<Container width="reading">`. Do not use Tailwind's built-in `prose` class.

Dark sections: `class="grain relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 py-28 text-white"` with an inner `<div class="grid-pattern absolute inset-0 opacity-40" aria-hidden="true"></div>`.

Primary button (main site): `<Button href="/contact/" variant="primary" arrow>`. All buttons use `rounded-[6px]`. Background is `bg-delft` (`#1f3062`) → hover `bg-scooter`.

Scroll reveal: `data-reveal` (fade + slide-up 0.6s), `data-speed="fast"` (0.4s), `data-speed="slow"` (0.9s), `data-stagger` (staggered children). Respects `prefers-reduced-motion`. Only works when `html.js` class is present (set by BaseLayout inline script).

### Main site uses Astro ClientRouter (view transitions); IT site does not

Main site JS re-registers on `astro:after-swap`. IT site uses `astro:page-load`. Do not copy JS event handlers between the two sites.

### Admin CMS section-to-file mapping (quick reference)

| Admin section | Repo path edited |
|---------------|-----------------|
| Main Site > Blog | `src/content/insights/{slug}.md` |
| Main Site > Services | `src/content/services/{slug}.md` |
| Main Site > Industries | `src/content/industries/{slug}.md` |
| Main Site > Team | `src/content/team/{slug}.md` |
| Main Site > Authors | `src/content/authors/{slug}.md` |
| Main Site > Homepage | `src/data/taxonomy.ts` (6 managed exports) — ⚠️ these exports are **not** rendered on the live homepage yet (it uses local consts in `src/pages/index.astro`); editing them here has no visible effect until the homepage is wired to consume them |
| Main Site > Navigation | `src/data/navigation.ts` (serviceMenu + industryMenu only) |
| Main Site > Reviews | `src/data/googleReviews.ts` |
| Main Site > About Page | `src/data/about.json` |
| Main Site > In the Media | `src/data/press.json` |
| Main Site > HTML Sitemap | `src/data/sitemap.json` |
| Main Site > Schema | `src/data/schema-overrides.json` |
| Main Site > Redirects | `vercel.json` (redirects array only) |
| Main Site > Settings | `src/data/site.ts` (site + primaryNav exports) |
| Main Site > Media | `public/images/{folder}/{year}/{slug}.webp` + `src/data/media-meta.json` |
| IT Site > Blog | `it-site/src/content/insights/{slug}.md` |
| IT Site > Services | `it-site/src/content/services/{slug}.md` |
| IT Site > Team | `it-site/src/content/team/{slug}.md` |
| IT Site > Authors | `it-site/src/content/authors/{slug}.md` |
| IT Site > Pages | `it-site/src/data/pages.ts` |
| IT Site > Navigation | `it-site/src/data/site.ts` (serviceMenu export) |
| IT Site > Settings | `it-site/src/data/site.ts` (site + primaryNav exports) |
| IT Site > Schema | `it-site/src/data/schema-overrides.json` |
| IT Site > Redirects | `it-site/vercel.json` |

---

## Admin CMS vs Claude Code — which changes go where

The admin CMS is built for **content**. A few of its sections touch **structure** that is coupled across many files, or is code-driven — those are safer done by an AI assistant (Claude Code) that can update every linked file in one pass. The admin shows a one-time "prefer your AI assistant" popup on those pages (`admin/components/structural-notice.tsx`, rendered on Navigation, Redirects, Homepage, and Schema for both sites). This section is the authoritative explanation of that split.

### Safe to do in the admin (self-contained content)

Blog posts, services & industries copy/SEO/hero images, team, authors, reviews, About Page, In the Media, media library, **adding a single simple redirect**, and per-page schema values. None of these cascade into other files.

### Better done via Claude Code (structural / coupled / code-driven)

| Task | Why it's not a clean admin edit | What Claude Code does |
|------|--------------------------------|-----------------------|
| **Rename a page's URL (slug)** | One rename must change the `.md` `path`, the redirect in `vercel.json`, the mega-menu (`serviceMenu`) + `serviceLines` + `moreServices` in `site.ts`, the footer `serviceLinks`, and every cross-link in other bodies — **atomically**. The admin edits one place at a time, so a rename done piecemeal leaves dead links and broken breadcrumbs with no error. | Follows the "Rename a service slug — IT site" playbook and updates all coupling points + the redirect in one commit. |
| **Menu / mega-menu structure** (add, remove, reorder **top-level service lines** or their sub-services) | Menu items are keyed to page slugs and cross-links. Adding/removing a line usually also means creating/renaming/redirecting pages and regrouping sub-services — a multi-file change. Simple label/URL tweaks in the admin Navigation form are fine. | Restructures `serviceMenu`/`serviceLines`/`moreServices`, the service-line cards, the affected `.md` pages, footer, redirects, and homepage together (e.g. the "3 service lines" restructure). |
| **Redirects tied to a rename** | A redirect on its own is fine in the admin. But a redirect that exists *because* a URL changed is only half the job — the other half is the rename coupling above. | Adds the redirect as part of the rename, so old and new never drift apart. |
| **Homepage tiles / layout** | The **main-site** homepage is assembled from local consts in `src/pages/index.astro`, not from the admin Homepage form (which writes `taxonomy.ts`, currently not consumed on the live homepage). Editing the Homepage form there has no visible effect. IT homepage tiles/hero are likewise built in `it-site/src/pages/index.astro`. | Edits the actual homepage template (`index.astro`) so the change appears live. |
| **JSON-LD schema** | The per-page schema field must be valid, **escaped** JSON-LD (double-encoded string). It's easy to break by hand and hard to spot when wrong. | Writes/validates the escaped JSON-LD and confirms it builds. |
| **New pages, sections, or components** | These are `.astro` template/code changes, not content fields. | Builds them per "Building pages & sections" below. |

**One-line rule for non-developers:** *words, images, posts, people → admin; URLs/slugs, what's in the menu, the set of service lines, new pages → ask Claude Code.*

---

## Building pages & sections (developer tasks)

Adding a **new homepage/landing section**, a new component, or a new page is a code task (editing `.astro` templates), not a content edit. It is well-supported — the sites follow one repeatable section pattern. Match it and the result looks native.

### Where the templates are
- Main homepage: `src/pages/index.astro` · IT homepage: `it-site/src/pages/index.astro`
- Any page: `src/pages/**/*.astro` (main) · `it-site/src/pages/**/*.astro` (IT)
- Layout wrapper (`<head>`, Nav, Footer, scripts): `src/layouts/BaseLayout.astro` · `it-site/src/layouts/BaseLayout.astro`
- Reusable components: `src/components/**` · `it-site/src/components/**`

An `.astro` page = a `---` frontmatter block (imports + local data) followed by markup. Sections are just sequential `<section>` blocks inside the page.

### Section skeleton (copy this)
Every homepage section on the main site follows this shape. Reuse it verbatim, changing only the inner content:

```astro
{/* ── SECTION NAME ────────────────────────────────────────── */}
<section class="relative overflow-hidden bg-white py-24 md:py-32">
  <Container width="wide">
    {/* eyebrow row — MAIN-SITE pattern: square dot + font-display label */}
    <div data-reveal data-speed="fast" class="mb-10 flex items-center gap-3 text-[var(--color-text-head)]">
      <span class="block size-2 bg-scooter"></span>
      <span class="font-display text-[14px] tracking-[-0.005em]">Section label</span>
    </div>
    {/* IT-site eyebrow is different: <span class="am-eyebrow">Label</span> beside a
       <span class="block size-1.5 rounded-full bg-scooter"></span> dot. `am-eyebrow` exists on the IT site only. */}
    {/* heading grid — 12-col, heading left, intro right */}
    <div data-reveal class="grid grid-cols-1 gap-10 border-b border-line pb-14 md:grid-cols-12 md:gap-16">
      <h2 class="am-h1-display text-[var(--color-text-head)] md:col-span-7">Section heading.</h2>
      <p class="font-display text-[16px] leading-relaxed text-[var(--color-text-body)] md:col-span-5">Intro copy.</p>
    </div>
    {/* content — cards/list, animate children with data-stagger */}
    <ul data-stagger class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map((it) => (<li>…</li>))}
    </ul>
  </Container>
</section>
```

Rules that keep it native:
- **Vertical rhythm:** sections use `py-24 md:py-32` (or `py-20 md:py-28` for tighter ones). Keep it consistent with neighbours.
- **Alternate backgrounds:** light sections are `bg-white` or `bg-paper`; dark sections are `bg-[#12122d] text-white` (main) with an optional grid overlay `<div class="grid-pattern absolute inset-0 opacity-40" aria-hidden="true"></div>`. Alternate light/dark down the page as the existing homepage does.
- **Always wrap content in `<Container width="wide">`** (widths: `reading` | `narrow` | `default` | `wide` | `xl`). `wide` is the homepage standard.
- **Headings:** section `<h2>`s use **`am-h1-display`** (~56px). `am-hero-display` (~84px) is reserved for the page `<h1>` hero only — do NOT use it for a section heading. Add a gradient with `am-gradient-ink` (on light) or `am-gradient-ink-light` (on dark); a plain heading uses `text-[var(--color-text-head)]` (light) / `text-white` (dark). Never add a `text-*` color to a gradient heading (it sets `color: transparent`).
- **Animate on scroll:** put `data-reveal` on a block (fade + slide-up), `data-speed="fast"`/`"slow"` to tune, or `data-stagger` on a list to cascade its children. These are wired globally by `BaseLayout.astro` — no JS needed. (IT site uses the same attributes.)

### Reusable components (don't re-implement these)
| Component | Import | Key props |
|-----------|--------|-----------|
| `Container` | `@/components/Container.astro` | `width`, `as`, `class` |
| `Button` | `@/components/Button.astro` | `href`, `variant` (`primary`\|`secondary`\|`white`\|`ghost`\|`link`), `arrow` |
| `Eyebrow` | `@/components/Eyebrow.astro` | `align`, `tone` — or use the inline eyebrow pattern above (main) / the `am-eyebrow` class (IT only) |
| `Icon` | `@/components/Icon.astro` | `name` (key from the SVG set in the file), `class` |
| `CtaSection` | `@/components/CtaSection.astro` | `variant` — a ready-made contact CTA band |

The IT site has its own equivalents under `it-site/src/components/` (`Container`, `Nav`, `Footer`, `Schema`, `ContactCta`).

### Recipe — add a section to the homepage
1. Open the homepage template (`src/pages/index.astro` or the IT one).
2. If the section needs data, add a typed array in the `---` frontmatter — that's how the existing `services`/`industries` arrays on the homepage are done, and it's the reliable path. (Note: `src/data/taxonomy.ts` has homepage-card exports the admin Homepage form edits, but the live homepage does **not** currently import them, so putting data there will NOT make it CMS-editable end-to-end without also wiring the homepage to read it.)
3. Paste the **section skeleton** at the right position between existing `<section>` blocks. Pick a background that alternates with its neighbours.
4. Fill the content with the reusable components + design tokens. Match the class patterns of a nearby section — do not invent new spacing, colors, or fonts.
5. **Verify:** `npm run build` (main) or `cd it-site && npm run build` (IT), then `npm run dev` and eyeball the section. Check it looks right on mobile (the grids are `grid-cols-1 md:grid-cols-*`).
6. Commit + deploy (`/publish`).

### Conventions
- These are **Astro** components — no React, no `'use client'`. Interactivity is plain `<script>` in the component/layout (see how `data-reveal` and the counters are wired in `BaseLayout.astro`).
- Keep new components small and in `src/components/` (or `it-site/src/components/`); import with the `@/` alias.
- Do not add a CSS framework or new global styles — everything is Tailwind v4 utilities + the tokens/`am-*` classes already in `global.css`.
- For a whole **new page**, create `src/pages/<route>.astro`, wrap the body in `<BaseLayout title="…" description="…">`, and it auto-routes to `/<route>/`. Add it to `src/data/sitemap.json` and the nav if it should be discoverable.

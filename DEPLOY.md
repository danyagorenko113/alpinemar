# Deploying Alpine Mar (fresh setup)

This one repository contains **three deployable apps**. On Vercel each becomes its
own **Project**, all pointing at the same repo but with a different **Root Directory**.

| App | Root Directory | Framework | Needs env vars? |
|-----|---------------|-----------|-----------------|
| Main CPA site (`alpinemar.com`) | `/` (leave blank) | Astro | No |
| IT site (`it.alpinemar.com`) | `it-site` | Astro | No |
| Admin CMS (`admin.alpinemar.com`) | `admin` | Next.js | **Yes — see below** |

Every push to your default branch (`main`) automatically rebuilds all three
projects (~1–2 min each).

---

## Step 1 — Put the code in your own GitHub repo

1. Create a new **empty** repository on your GitHub account (e.g. `alpinemar`).
2. Upload the contents of this zip to it (or `git init && git add . && git commit && git push`).
   - The zip already excludes `node_modules/`, build output, and all secrets — nothing sensitive is inside.

## Step 2 — Create the three Vercel projects

For **each** of the three apps: Vercel → **Add New… → Project** → import your repo, then:

1. Set the **Root Directory** to the value in the table above (Main = blank, IT = `it-site`, Admin = `admin`).
2. Leave build settings on auto-detect (Astro / Next.js are detected automatically).
3. Deploy.

Do this three times — same repo, three projects, three root directories.

## Step 3 — Configure the Admin CMS environment variables

The admin is the only app that needs configuration. Set these on the **admin** Vercel
project → Settings → Environment Variables. See `admin/.env.example` for the full list.

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | A strong password you choose (used to log in to the CMS) |
| `SESSION_SECRET` | 32+ random characters (signs the login cookie) |
| `CONTENT_STORE` | `github` |
| `GITHUB_TOKEN` | A **fine-grained Personal Access Token on _your_ GitHub account**, scoped to _your_ repo, with **Contents: Read and write** |
| `GITHUB_OWNER` | **Your** GitHub username/org |
| `GITHUB_REPO` | The repo name you created in Step 1 |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_COMMIT_NAME` | Any display name, e.g. `Alpine Mar Admin` |
| `GITHUB_COMMIT_EMAIL` | A **verified email on your GitHub account** — see the critical note below |
| `NEXT_PUBLIC_SITE_URL` | Your main site URL, e.g. `https://alpinemar.com` |
| `NEXT_PUBLIC_IT_SITE_URL` | Your IT site URL, e.g. `https://it.alpinemar.com` |

> ### ⚠️ Critical: `GITHUB_TOKEN` and `GITHUB_COMMIT_EMAIL` must be YOURS
>
> The admin CMS saves content by **committing files back to your repo**. So the
> token, owner, repo, and email must all point at **your own** GitHub account and
> repository — not the original developer's.
>
> - `GITHUB_TOKEN`: create a fresh fine-grained PAT (GitHub → Settings → Developer
>   settings → Fine-grained tokens), repository access = your repo only,
>   permission = **Contents: Read and write**.
> - `GITHUB_COMMIT_EMAIL`: **must be a verified email on a real GitHub account.**
>   If it isn't, Vercel silently marks builds `UNKNOWN` and the site stops updating
>   after every CMS save. This is the single most common setup mistake.

## Step 4 — Domains

Add your custom domains in each Vercel project (Settings → Domains):
main site → `alpinemar.com`, IT site → `it.alpinemar.com`, admin → `admin.alpinemar.com`
(or whatever hostnames you use).

## Step 5 — Verify

1. All three projects show **Ready** (not `UNKNOWN`/`Error`) in Deployments.
2. Log into the admin, make one test edit, and Save → it should commit to your repo
   and trigger a rebuild. If the deploy goes `UNKNOWN`, fix `GITHUB_COMMIT_EMAIL` (Step 3).

---

For day-to-day content editing and the full content model, see **`CLAUDE.md`** (the
AI operating guide) and **`admin/README.md`** (CMS internals).

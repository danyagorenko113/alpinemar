# Alpine Mar — Design System (single source of truth)

> Synthesised from the `~/.agents/skills` design skills. Every page must comply.
> Only constraint inherited from the client: **our color palette**. Fonts, type,
> layout, motion are driven by the skills (client Figma fonts/guidelines dropped).
> Method: `stitch-design-taste` (this doc) + `design-taste-frontend` §0–1 (read below).

## 0. Design Read (design-taste-frontend §0)
- **Page kind:** marketing site for a premium CPA / advisory firm (trust + modern).
- **Audience:** business owners & high-net-worth individuals, desktop-first, design-conscious but conservative.
- **Committed aesthetic:** **Editorial Luxury × Premium Minimalism**, with Swiss
  structural rigor (industrial-brutalist *Swiss-print sub-mode only*). One language,
  committed — no mixing of contradictory skill defaults.
- **Dials:** Variance 5 (ordered editorial, not chaos) · Motion 4 (quiet, heavy ease,
  no spectacle) · Density 4 (airy, macro-whitespace).

## 1. Color — our palette as a monochrome+accent system
Canvas is light. Color is scarce and semantic (minimalist-ui §4).
- `--paper` `#FBFBFA` warm near-white — primary canvas
- `--paper-2` `#F4F4F7` (navy-50) — alternate sections / cards
- ink `#12122D` (navy-900) — headings (never pure black)
- body `#454561` (navy-500) → use navy-600 `#33335c` for small body (AA)
- muted `#5e5e7d` (navy-400) — labels/meta
- hairline `#e6e6ec` (navy-100) / `rgba(18,18,45,.06)` — borders, dividers
- **accent (Ocean Teal) `#33BBDC`** — ONLY: icons, hairline accents, small marks,
  underlines, focus. **No large teal-filled sections** (banned by minimalist-ui).
- accent text on white → `--color-teal-700 #176a80` (WCAG AA ≥4.5:1).
- dark anchors (hero/CTA optional): navy-950 `#0a0a1c` with grain + teal glow.

## 2. Typography (premium, non-generic — banned: Inter/Roboto/Open Sans)
- **Display (H1/H2, quotes): `Fraunces` (variable serif)** — high optical contrast,
  editorial luxury. Tracking −0.02 to −0.03em, line-height 1.05–1.1, `opsz` high.
- **Body / UI / buttons: `Geist` (variable grotesk).** line-height 1.6, ≥16px.
- **Meta / eyebrows / numerals labels: `Geist Mono`** — uppercase, tracking 0.18em.
- Type scale: H1 `clamp(2.75rem,6vw,6rem)` · H2 `clamp(2rem,4vw,3.5rem)` ·
  H3 `1.5–1.75rem` · body-lg 1.125rem · body 1rem · meta 0.72rem.
- 2-line heading iron rule (gpt-taste): headings live in wide containers, never wrap
  to 5–6 narrow lines. Use `text-wrap: balance`.

## 3. Layout & spacing
- Section rhythm: content `py-24 lg:py-32`; never cramped (high-end §4C, minimalist §8).
- Content width `max-w-7xl` page / `max-w-3xl` reading; gutters `px-6 lg:px-10`.
- **Sharp / Swiss structure:** radius **0** for cards, sections, media (industrial-
  brutalist Swiss-print + user preference). Buttons sharp too. (Overrides high-end's
  pill mandate — we committed to one language.)
- Hairline bento/Swiss grid: shared 1px `--hairline` borders, no gaps, oversized
  numerals bleeding at edges. Asymmetric editorial split heroes.
- Mobile: collapse to single column, `w-full`, `px-5`, `py-16`; use `min-h-[100dvh]`.

## 4. Components
- **Cards:** flat, `1px solid hairline`, radius 0, generous padding `p-8 lg:p-12`.
  Hover = ultra-diffuse shadow `0 2px 12px rgba(10,10,28,.05)` + teal top-hairline
  grow. No `-translate-y` jumps, no heavy shadow.
- **Buttons:** primary = solid navy-900 text white, sharp, `px-7 py-4`, mono-uppercase
  label, `:active scale-[.98]`; secondary = hairline border; link = teal-700 + arrow.
  Trailing arrow animates `translate-x` on hover (no naked default).
- **Eyebrow:** mono uppercase + short teal hairline (not a pill).
- **Tags:** small mono uppercase, hairline border, radius 0.
- **Icons:** refined thin line, stroke ~1.4, standardized size system (16/20/24).
- **Accordion (FAQ):** no boxes, only `border-bottom` hairline, sharp +/− toggle.

## 5. Motion (quiet sophistication)
- Scroll entry: `opacity 0 + translateY(16px) (+ blur 6px on hero)` → resolve over
  600–800ms, ease `cubic-bezier(0.16,1,0.3,1)`. IntersectionObserver only.
- Stagger children 80ms cascade. Magnetic button: inner arrow `translate` on hover.
- Ambient: one slow radial teal/navy blob (20s+, opacity .03–.05) on a fixed,
  pointer-events-none layer. Grain on dark sections only.
- GPU-safe: animate `transform`/`opacity` only. **Fail-safe:** hidden state gated to
  `html.js`; flush after 1.4s so content never stays invisible.

## 6. Imagery (fal.ai — nano-banana-pro)
- Per-section reference comps before coding (imagegen-frontend-web / image-to-code).
- Photography desaturated, warm, low-opacity grain overlay to blend into palette.
- Brand art / OG / abstract section backgrounds via `brandkit` prompts.
- All gens use ONE consistent palette (navy/teal/cloud). Pipeline: `scripts/falgen.mjs`.
  ⚠ blocked until fal balance topped up; real client photos used meanwhile.

## 7. Anti-patterns (hard fails — gpt-taste / minimalist / high-end)
Inter/Roboto · emojis in code/markup · gradients-as-decoration overuse · heavy
`shadow-md/lg` · big primary-color section fills · `rounded-full` large containers ·
cheap meta-labels ("QUESTION 05") · invisible button text · 6-line wrapped headings ·
placeholder names/Lorem · clichés (Elevate/Seamless/Unleash) · `linear`/`ease-in-out`
transitions · `window.scroll` listeners · symmetric bootstrap 3-col without whitespace.

## 7b. LOCKED conventions (committed — every page must follow)
- **Radius:** 0 everywhere (sharp / Swiss). No pills, no rounded cards.
- **Fonts:** headings = `Fraunces Variable` (serif, italic for accent words); body/UI = `Geist Variable`; eyebrows/labels/buttons/numbers = `Geist Mono Variable` (uppercase, tracking 0.1–0.22em).
- **Canvas:** `bg-paper` (#FBFBFA); alternate `bg-navy-50`. Dark only as ONE bottom zone (CTA `bg-gradient from-navy-900 to-navy-950` + dark footer). No lone mid-page dark sections.
- **Accent:** teal `#33BBDC` for fills/icons/hairlines only; **teal text → `text-teal-700`** (AA). Body small → `text-navy-600`.
- **Eyebrow:** `<Eyebrow>` = short teal hairline + mono uppercase label.
- **Buttons:** `<Button>` sharp, mono-uppercase, `active:scale-[.98]`, animated trailing arrow. variants: primary (navy/teal), secondary (hairline), white, ghost, link.
- **Cards / structure:** flat, `1px solid line` hairline grids (shared borders, no gaps), generous padding; hover = teal top-bar grow + `hover:bg-white` (no translate-jumps, no heavy shadow). `overflow-hidden` cards get `focus-visible:[outline-offset:-2px]`.
- **Icons:** `<Icon>` thin stroke 1.4, sizes 16/20/24.
- **Section rhythm:** content `pt-24 pb-28 lg:pt-32 lg:pb-36`; anchors (stats/CTA) larger; `border-t border-line` between sections.
- **Motion:** `[data-reveal]` opacity+translateY(24)+blur(2px) → ease `cubic-bezier(0.16,1,0.3,1)`; `[data-stagger]` 80ms cascade; hidden gated to `html.js` + 1.4s flush; counters `[data-counter]`; draw-line; cursor-follow hover preview pattern for editorial lists.
- **Signature touches:** editorial numbered list (services), asymmetric 7/5 bento (industries), pull-quote + plate (manifesto), grayscale→color logo marquee, contour `<Ridge>` + aurora blobs, mono captions on `<figure>`.
- **SEO:** every page copy is **verbatim from alpinemar.com** (titles, H1/H2, body, meta). Slugs preserved. OG = `/og-default.jpg`.
- **A11y:** one H1/page, sentence-case headings, alt on images, `aria-hidden` decorative, visible focus, AA contrast.
- **Nav/Footer:** every shipped page is linked from nav and/or footer so it's reachable.

## 7c. PAGE QUALITY GUARDRAILS (every page must pass ALL)
A page is not done until it meets every item:

**1. Content (SEO) — non-negotiable**
- All copy (title, meta, H1/H2/H3, body) is **verbatim from the matching alpinemar.com page**. Slugs preserved. No paraphrasing of headings/keywords.

**2. Readability — the top priority**
- Body text ≥ 1.0625rem (`text-lg` for lead/intro), `leading-relaxed`→`loose`, color `text-navy-700` (not 400/500) for real reading text; `navy-400` only for tiny meta.
- Measure capped ~60–68ch (`max-w-prose`/`max-w-2xl`). Never full-width paragraphs.
- One idea per block. No dense rows where the text is cramped or low-contrast. Generous vertical rhythm (`py-8`+ in lists). Summaries always visible on desktop at readable size.
- Strong hierarchy: clear size jump H1→H2→H3→body; eyebrow → heading → supporting text pattern.

**3. Depth — required**
- Layered hero (aurora blob + grid/dots + optional Ridge), `grain` on dark zones, real imagery where the page allows (client photos), motion (reveal/stagger, hover-preview where a list).

**4. Interest / variety — required**
- **At least 4 distinct section *types*** per page (not hero + one list + CTA). Mix from: editorial split, asymmetric bento, photo plates, pull-quote, stat/trust strip, numbered index, category cards, marquee, alternating dark/light-50 rhythm.
- Asymmetry over symmetry. A signature moment per page (one memorable block).
- Alternate `bg-paper` / `bg-navy-50` between sections for rhythm; each section `border-t border-line`.

**5. Consistency**
- Uses shared components (`Eyebrow`, `Button`, `Icon`, `CtaSection`, `Ridge`), locked conventions (§7b), and ends on the shared CTA → dark footer.

**6. A11y/perf** — one H1, alt text, focus states, AA contrast, reveal fail-safe.

> Self-review before shipping a page: screenshot desktop + mobile, read it as a visitor — is it scannable, is the text comfortable, is any section generic/thin? If yes, fix before moving on.

## 8. Skill application map (every skill accounted for; v1 excluded)
| Skill | Applied as |
|---|---|
| stitch-design-taste | this DESIGN.md (source of truth) |
| design-taste-frontend (v2) | §0 read + per-page design-engineering directives |
| high-end-visual-design | spatial rhythm, motion choreography, nav reveal, depth (sharp-adapted) |
| minimalist-ui | palette discipline, flat cards, hairlines, type, ambient motion |
| gpt-taste | 2-line headings, gapless bento, no cheap labels, big spacing |
| industrial-brutalist-ui | Swiss-print sub-mode only (grid, oversized numerals, dividers) |
| image-to-code | hero minimalism + image-first new sections |
| imagegen-frontend-web | one fal reference per section |
| brandkit | OG/brand-art generation |
| redesign-existing-projects | audit gate per page |
| web-design-guidelines | Vercel WIG compliance gate before ship |
| full-output-enforcement | no truncated/placeholder code, ever |
| supabase / postgres-best-practices | BOI form backend (Phase 5) |
| find-skills | on-demand capability discovery |
| imagegen-frontend-mobile | N/A (website, not app) |
| design-taste-frontend-v1 | excluded (superseded by v2) |

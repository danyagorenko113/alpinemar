# Alpine Mar — Design System

Single source of truth for the 2026 Figma redesign. Every page that gets ported should reuse the tokens, primitives and section recipes below — no one-off classes, no improvisation. If a primitive is missing, add it here first.

Reference implementations:

- Home: `src/pages/index.astro`
- About Us: `src/pages/about-us.astro`
- Header: `src/components/TopBar.astro`, `src/components/Nav.astro`
- Footer: `src/components/Footer.astro`
- Tokens: `src/styles/global.css` (`@theme` block + utility classes)

---

## 1. Tokens

All defined in `@theme` inside `src/styles/global.css`. Tailwind v4 auto-generates the matching utility classes (`bg-scooter`, `text-delft`, etc.).

### 1.1 Colour

| Token | Hex | Use |
|---|---|---|
| `--color-text-head` | `#12122D` | Headlines, body text on light bg |
| `--color-text-body` | `#454561` | Long-form body copy, captions |
| `--color-brand-1` | `#12122D` | Dark navy section bg |
| `--color-delft` | `#1F3062` | **All filled buttons** + active dot states |
| `--color-brand-2` | `#4986D5` | Royal blue gradient stop / glow accent |
| `--color-scooter` | `#33BBDC` | Cyan accent — indicators, hover, focus |
| `--color-paper` | `#F9FAFB` | Cool off-white page bg + tag chips |
| `--color-line` | `#D4D4DC` | Borders / dividers on light bg |

**Inline hex shortcuts** that show up across the codebase (avoid creating new ones):

| Hex | Meaning |
|---|---|
| `#12122D` | brand-1 navy — section bg, plain text |
| `#1F3062` | delft — every solid button |
| `#0A0A1C` | TopBar bg (one tone darker than brand-1) |

### 1.2 Typography

Font families (`@theme`):

- `--font-display: "Satoshi", "Poppins", system-ui` — **everything customer-facing** on the new pages (loaded via Fontshare CDN in `BaseLayout.astro`)
- `--font-mono: "Geist Mono"` — eyebrows / labels (used on the About-page sections, gradually being replaced by `font-display` on the home rebuild)
- `--font-heading: "Lora Variable"` — **legacy only**, do not use on new pages

**Display scale** (all Satoshi Medium 500, `tracking-[-0.01em]` to `tracking-[-0.02em]`):

| Class | Size | Line height | Letter spacing | Use |
|---|---|---|---|---|
| `am-hero-display` | `clamp(2.6rem, 6.8vw, 5.25rem)` (~84 px) | `0.95` | `-0.02em` | Hero h1, big page wordmarks. Force 3 lines + `pb-2 leading-[1.02]` if it clips |
| `am-h1-display` | `clamp(2.4rem, 5vw, 3.5rem)` (~56 px) | `1.1` | `-0.02em` | Section h2 |
| `am-h2-display` | `clamp(2rem, 4.2vw, 3rem)` (~48 px) | `1.1` | `-0.02em` | Sub-section h2 (rare) |
| `am-h5-display` | `clamp(1.125rem, 1.6vw, 1.5rem)` (~24 px) | `1.25` | `-0.02em` | Card titles, name headers |

**Body / UI scale (Satoshi 400 / 500):**

| Size | Use |
|---|---|
| `text-[12px]` | Card meta (Category / date) |
| `text-[13px]` | Tag chips, eyebrow labels |
| `text-[14px]` | Form labels, button copy, dl values |
| `text-[15px]` | Default paragraph body |
| `text-[18px]` | Hero "View More" link |
| `text-[20px]–[22px]` | Small card titles |
| `text-[26px]–[32px]` | Featured card titles |

**Gradient text helpers:**

- `am-gradient-ink` — `linear-gradient(124deg, #12122D 26%, #1E2A57 47%, #334B91 86%)` — for big headlines on **white / paper** bg
- `am-gradient-ink-light` — `linear-gradient(124deg, #FFFFFF 0%, #D6E4FF 45%, #7FBFE6 100%)` — for big headlines on **dark navy** bg

### 1.3 Spacing & radii

| Token | Value | Use |
|---|---|---|
| Section padding (vertical) | `py-24 md:py-32` | Standard light & dark sections |
| Section padding (asymmetric) | `pt-24 md:pt-32` only | Use when section ends in a full-bleed image (about-on-home, hero+collage) |
| Container | `<Container width="wide">` | Always — never raw `max-w-*` |
| Section gap between blocks | `gap-10 md:gap-16` | 2-col header (title + description) |
| Card radius | `rounded-[6px]` | Default card |
| Image radius inside card | `rounded-[4px]` | Tighter than card |
| Photo / portrait inside team card | `rounded-[6px]` | Equal to card |
| Pill button radius | `rounded-[6px]` | All filled CTAs |
| Icon-chip arrow square | `rounded-[4px]` | "Read more" arrow |
| Icon-chip square LinkedIn/email | `rounded-[3px]` | Team card actions |
| Round controls (carousel arrows, dots, medallions) | `rounded-full` | Only here |

### 1.4 Grid background

Used on **every dark navy section** plus white "Latest Insights" + Footer. CSS-only, no PNG:

```css
background-image:
  linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
background-size: 72px 72px;
```

- **On dark bg** → `rgba(255,255,255,0.04)` (lift to `0.05` if you need extra texture, as in What Drives Us)
- **On white bg** → `rgba(18,18,45,0.035)` (very subtle, used in Latest Insights + Footer)
- Always wrapped in `pointer-events-none absolute inset-0` div, ahead of `relative z-10` content

---

## 2. Layout primitives

### 2.1 Page chrome

```
<BaseLayout>           // global head, schema, scroll-reveal JS
  <TopBar />           // always-dark navy strip — Financial Services | IT | Client Portal
  <Nav />              // 88-px white nav, Request Consultation pill stuck right
  <main>{slot}</main>
  <Footer />           // white 4-col + AICPA/FICPA strip + big wordmark
</BaseLayout>
```

- **TopBar bg**: `bg-[#0A0A1C]` (always dark). Single row, hidden on mobile (`hidden md:block`).
- **Nav bg**: `bg-white/95 backdrop-blur-md` + bottom border `border-line`. Height `h-[88px]`. `Container width="wide" px-0` — Logo + menu live inside Container's normal padding; the dark `Request Consultation` button uses `items-stretch` to fill the whole nav height and butts up against the container's right padding.
- **Sticky**: nav is `sticky top-0 z-50`. TopBar is `z-50` but **not** sticky — it scrolls away.

### 2.2 Container

Single component, `src/components/Container.astro`. Always pick `width="wide"`. Don't compose with raw `max-w-*` — adjust the component if needed.

### 2.3 Section header (2-col title + description)

The single most reused pattern on the site.

```astro
<section class="relative bg-white py-24 md:py-32">
  <Container width="wide">

    <!-- 1. Indicator (square dot + label) -->
    <div data-reveal data-speed="fast"
         class="mb-10 flex items-center gap-3 text-[var(--color-text-head)]">
      <span class="block size-2 bg-scooter"></span>
      <span class="font-display text-[14px] tracking-[-0.005em]">Our Services</span>
    </div>

    <!-- 2. Heading grid -->
    <div data-reveal class="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
      <h2 class="am-h1-display text-[var(--color-text-head)] md:col-span-6">
        Section title goes here.
      </h2>
      <p class="font-display text-[15px] leading-[1.65] text-[var(--color-text-body)] md:col-span-6 md:pt-3">
        One-paragraph description.
      </p>
    </div>

    <!-- 3. Section body -->
  </Container>
</section>
```

Title column is **7/5**, **6/6** or **8/4** depending on title length — always two columns on `md+`. Description always sits in the right column with a tiny top padding (`md:pt-3`) so its top aligns to the cap-height of the heading.

**On dark sections** swap `text-[var(--color-text-head)]` for `text-white/80` on the indicator wrapper, and add the grid pattern overlay before the Container.

---

## 3. Components

### 3.1 Section indicator

Single source for every section eyebrow.

```html
<div class="mb-10 flex items-center gap-3 text-[var(--color-text-head)]">
  <span class="block size-2 bg-scooter"></span>
  <span class="font-display text-[14px] tracking-[-0.005em]">Label</span>
</div>
```

- Dot: **square 8×8**, scooter cyan, no border-radius. Never use circle.
- Label: `font-display text-[14px]`, navy on light bg / `text-white/80` on dark bg.
- Margin below: `mb-10` (40 px). Bump to `mb-16 md:mb-24` on the standalone CTA section.

### 3.2 Buttons

| Variant | Class snippet | Where |
|---|---|---|
| Filled (primary) | `inline-flex items-center gap-2 rounded-[6px] bg-[#1F3062] px-6 py-3.5 font-display text-[14px] font-medium text-white transition-colors hover:bg-scooter` | Submit, "View All Insights", "Request a Consultation", Nav CTA (Nav variant uses `h-full px-8` to stretch to nav height) |
| Outlined / link with arrow chip | `inline-flex w-fit items-center gap-3 rounded-[4px] border border-line px-5 py-3 font-display text-[14px] font-medium text-[var(--color-text-head)] hover:border-[#12122D]` + small `bg-[#12122D]` circle for the arrow | Hero "View More" (current home Hero replaces this with a thin underline link — both are acceptable; pick whichever the Figma frame shows) |
| Underline link with `>` | `inline-flex w-fit items-center gap-2 border-b border-[#12122D] pb-1.5 font-display text-[18px] font-medium text-[#12122D] hover:text-scooter` | Hero "View More" (overlay variant) |

**Inline arrow chip** (paired with "Read more"):

```html
<span class="inline-flex size-9 items-center justify-center rounded-[4px]
             bg-[#1F3062] text-white transition-transform group-hover:translate-x-1">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
    <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
  </svg>
</span>
```

- Featured card chip is `size-10`. Small card chip is `size-9`. Same delft fill.
- Hover: any filled button **always** transitions `bg-[#1F3062] → bg-scooter` on hover (no other variants).

### 3.3 Form fields

White card on dark navy section (`rounded-[6px] bg-white p-7 md:p-9`). Inside:

- **Label**: `font-display text-[14px] font-medium text-[var(--color-text-head)]`
- **Input / select / textarea**: `mt-2 block w-full rounded-[4px] border border-line bg-white px-4 py-3 font-display text-[14px] focus:border-scooter focus:outline-none focus:ring-0`
- **Placeholder**: `placeholder:text-[var(--color-text-body)]/55`
- **Select chevron**: native `appearance-none` + custom SVG positioned `absolute right-3.5 top-1/2 -translate-y-1/2`

Cloudflare Turnstile placeholder block stays inline above the submit (see `src/pages/index.astro` lines 387–402 for the canonical markup).

### 3.4 Card patterns

**Industry card (image + text under image):**

```html
<a class="group flex flex-col gap-6">
  <div class="aspect-[5/4] w-full overflow-hidden rounded-[4px] bg-navy-50">
    <img class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
  </div>
  <h3 class="font-display text-[22px] font-medium tracking-[-0.01em] text-[var(--color-text-head)]">Title</h3>
  <p class="font-display text-[15px] leading-[1.65] text-[var(--color-text-body)]">Blurb…</p>
</a>
```

**Team card (portrait + name + meta dl + LinkedIn/email):**

- Outer: `rounded-[6px] border border-line bg-white p-5 hover:bg-[#12122D] hover:text-white`
- Portrait: `size-[148px] rounded-[6px]`
- Name: `font-display text-[22px] font-medium`
- dl: `-mx-5 mt-5 border-t border-line` with rows `flex items-center gap-6 px-5 py-3`, dt = `w-12 font-mono text-[10px] uppercase`, dd = `font-display text-[13px]`
- Icon chips: `size-7 rounded-[3px] border border-line` — Stack in a footer row with `-mx-5 border-t pt-4`
- First card permanently in active dark state (see `:first-child` CSS in `src/pages/about-us.astro`)

**Insight feature card (image-left, content-right, both halves):**

- Outer grid: `grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[6px] border border-line bg-white`
- Image wrapper: `aspect-[5/4] md:aspect-auto md:min-h-[480px] bg-navy-50` with `<img class="absolute inset-0 h-full w-full object-cover">`. **Always provide a fallback** (`featured.data.heroImage || '/images/about/collage-1.jpg'`) so the grid doesn't collapse.
- Content: `flex flex-col gap-6 p-8 md:p-12`
- Header row: Category chip (`rounded-[4px] bg-paper px-3 py-1.5` with `size-1.5 bg-[#12122D]` dot) + date right-aligned
- Footer row: `flex items-center justify-between` — "Read more" text + delft arrow chip

**Insight small card (text-only):**

- `min-h-[320px] rounded-[6px] border border-line bg-white p-7 hover:border-[#12122D]`
- Same Category + Date row, then big title (`text-[20px] mt-7`), then "Read more" + size-9 arrow chip in a `mt-auto pt-8` footer row.

### 3.5 Carousel (horizontal-scroll)

Used for Industries, Meet the Team, and the About "Breaking molds" gallery. Structure:

```html
<div class="relative">
  <div id="X-track" class="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-3
                            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <!-- cards w-[80%] sm:w-[55%] md:w-[44%] lg:w-[calc((100%-3rem)/2.6)] -->
  </div>

  <!-- Dots + arrows -->
  <div class="mt-10 flex items-center justify-between gap-6">
    <div id="X-dots" class="flex items-center gap-2">
      <!-- h-1.5 w-6 rounded-full bg-line data-[active=1]:bg-[#12122D] -->
    </div>
    <div class="flex items-center gap-3">
      <!-- size-11 rounded-full border border-line hover:border-delft -->
    </div>
  </div>
</div>
```

Card widths control how many show at once. JS uses the canonical `initAudience` / `initTeamCarousel` pattern: bind once with `__audBound` guard, re-run on `astro:after-swap`. **Always** include the `astro:after-swap` re-bind — View Transitions kill the previous DOM.

### 3.6 Drag-to-scroll gallery (About "Breaking molds")

Same flex layout as a carousel, but bound through `initJourneyDrag()` which adds `mousedown / mousemove` listeners + a click-suppressor that prevents accidental navigation after a drag. See `src/pages/about-us.astro` lines 353–390.

### 3.7 Marquee (logo strip)

Use the existing `.marquee` utility from `global.css`. Duplicate the items array (`[...platforms, ...platforms]`) and wrap in a container with edge masks:

```html
<div class="relative w-full overflow-hidden"
     style="mask-image:linear-gradient(to right, transparent, black 6%, black 94%, transparent);
            -webkit-mask-image:linear-gradient(to right, transparent, black 6%, black 94%, transparent);">
  <div class="marquee items-center gap-12">
    {[...items, ...items].map((p) => <img src={p.src} class="h-7 md:h-8 w-auto shrink-0" />)}
  </div>
</div>
```

Animation runs 38 s linear infinite. **Do not** grayscale or dim logo marquees — colour stays on per client request.

---

## 4. Animations

### 4.1 Scroll reveal

`data-reveal` (plus optional `data-speed="fast|slow"` and `data-from="left|right"`) is the universal entrance. Defined globally in `global.css` and wired up by `BaseLayout.astro`'s `initReveals()` — also re-runs on `astro:after-swap`.

```html
<h2 data-reveal data-speed="slow">…</h2>
<ul data-stagger>
  <li>…</li>
  <li>…</li>
</ul>
```

- `data-reveal` → fade + translateY(24 px) over 0.6 s
- `data-reveal data-speed="fast"` → smaller translate over 0.4 s (use for indicators, small chips)
- `data-reveal data-speed="slow"` → bigger translate over 0.9 s (hero h1)
- `data-stagger` → children fade in one-by-one with delays from 0.04 s to 0.92 s

### 4.2 Counters

`data-counter data-to="120" data-suffix="+"` runs a 1.6-second eased count-up. Already global.

### 4.3 Hover transitions

| Target | Effect |
|---|---|
| Card-level hover | `transition-colors hover:border-[#12122D]` or `hover:bg-[#12122D] hover:text-white` |
| Image inside card | `transition-transform duration-700 group-hover:scale-105` |
| Arrow chip | `transition-transform group-hover:translate-x-1` |
| Service-row hover preview | `opacity-0 transition-opacity duration-300 group-hover:opacity-90` |
| Filled buttons | `transition-colors hover:bg-scooter` |

---

## 5. Section recipes

### 5.1 Light section with header + body

`bg-white py-24 md:py-32` → indicator → 2-col title/description → body grid.

### 5.2 Dark section with header + body

`bg-[#12122D] py-24 md:py-32` + grid pattern overlay (`rgba(255,255,255,0.04)` 72 px) + optional royal-blue radial glow (`background:radial-gradient(ellipse at center, rgba(73,134,213,0.32), transparent 70%)` on top half). Then indicator with `text-white/85`, gradient-light title, white/75 description.

### 5.3 Dark section ending in full-bleed image (About on home)

```
<section class="relative overflow-hidden bg-[#12122D] pt-24 md:pt-32">
  ...indicator + 2-col header with pb-20/28...
</Container>
<div class="relative">              <!-- full-bleed sibling, NOT inside Container -->
  <img class="h-[420px] md:h-[640px] lg:h-[720px] w-full object-cover" />
  <div class="absolute inset-x-0 bottom-0 h-1/2
              bg-gradient-to-t from-[#12122D] via-[#12122D]/70 to-transparent"></div>
  <Container width="wide" class="absolute inset-x-0 bottom-0">
    <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-10 md:pb-14">
      <!-- check pills -->
    </ul>
  </Container>
</div>
</section>
```

### 5.4 Standalone CTA strip ("We can't wait to meet you")

Same dark template as §5.2, but indicator margin is `mb-16 md:mb-24` and the body is a single grid with title `md:col-span-8` and a single delft button right-aligned in `md:col-span-4 md:flex md:justify-end`. The indicator label dims the last word with `<span class="text-white/55">you</span>` for the muted-tail effect.

### 5.5 Hero variants

| Variant | Use | Key markup |
|---|---|---|
| **Full-bleed video** (home) | Marketing landing pages | `relative overflow-hidden bg-paper`; absolute video fill; white fades top (`h-32 from-white/85`) + bottom (`h-48 from-white/70`); grid `min-h-[88vh] grid-rows-[1fr_auto]` with h1 top-left, description + underline link bottom-left |
| **Image banner + title** (About) | Sub-pages | `relative h-[460px] md:h-[560px]` div with absolute image + bottom white fade (`h-1/2 from-transparent via-white/55 to-white`); Container `absolute inset z-10 flex flex-col justify-end pb-10 md:pb-14` with h1 only |

### 5.6 Header (TopBar + Nav)

See §2.1. Don't override `onDark` — the redesign uses light nav everywhere; the Nav component's `onDark = false` constant is intentional.

### 5.7 Footer

Reference: `src/components/Footer.astro`. Skeleton:

```
white bg + light grid pattern
4-col grid (Quicklinks / Services / Industries / Contact Details)
  — column titles font-display 15px medium navy
  — links font-display 14px body text, hover scooter
membership strip (border-top line-grey)
  — AICPA + FICPA logos (h-12, grayscale, opacity-60)
copyright + social row
big "Alpine Mar" SVG wordmark (full-width)
```

---

## 6. Conventions when porting a page

1. Wrap content in `<BaseLayout>`. Set `rawTitle` and `description`.
2. Open with a **Hero** picked from §5.5.
3. Every following block uses §2.3 header pattern, possibly followed by a carousel/grid/card layout from §3.
4. Use a **dark** section (§5.2) when you want to break visual rhythm — usually right before the CTA.
5. End each page with the **CTA strip** (§5.4) if the page is sales-oriented.
6. Footer comes from `BaseLayout` — don't add your own bottom banner.
7. Buttons are always **delft `#1F3062`** filled or **outlined navy** — never scooter cyan as fill.
8. Indicator dots are **always square**. Active carousel dots are **navy `#12122D`**.
9. Card / button corners are **6 px**, image corners are **4 px**, big circles only on team-portrait *containers* (the medallion + carousel arrows + dots).
10. Run `npm run build` before every commit. The build currently produces **198 pages in ~2 s** — if it slows down or fails, something regressed.

---

## 7. What NOT to do

- ❌ Don't use `text-scooter` or `am-gradient-ink` inside titles as accent. Plain text only. The blue accent in the Hero/Services subtitle was rejected.
- ❌ Don't use circular indicator dots, round-corner pill buttons (`rounded-full` filled), or scooter as a button fill.
- ❌ Don't put a `<br>` inside a heading unless you've checked the Figma — it locks line counts and can clip descenders. If you do, also add `pb-2 leading-[1.02]` to the gradient h1.
- ❌ Don't grayscale the Trusted Platforms marquee.
- ❌ Don't embed `<Container>` inside `<Container>`. If you need a full-bleed element next to a contained one, close the parent Container, render the bleed sibling, then reopen.
- ❌ Don't add `data-reveal` to *every* element — use it on section headers, card grids (`data-stagger`), and signature elements. Over-using it makes the page feel laggy.
- ❌ Don't generate AI assets when an existing asset under `public/images/` already covers the slot (all 11 `ind-*.{png,jpg}` are in the repo).

---

## 8. Quick lookup — common values

```
Section pad   py-24 md:py-32
Grid pattern  72 × 72 px, white 4% on dark / navy 3.5% on light
Heading col   md:col-span-6 (or 7) | description md:col-span-6 (or 5)
Body text     font-display text-[15px] leading-[1.65]
Card corner   rounded-[6px]
Image corner  rounded-[4px]
Button corner rounded-[6px]
Button color  bg-[#1F3062]  hover:bg-scooter
Active dot    bg-[#12122D]
Arrow chip    size-9 / size-10 rounded-[4px] bg-[#1F3062]
Indicator     square 8 px bg-scooter + 14 px display label
```

That's the entire system. When in doubt, mirror what `index.astro` and `about-us.astro` already do — don't invent.

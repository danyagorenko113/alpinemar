// Generate unique hero images for every service via fal.ai nano-banana.
// Each service gets a distinct, brand-appropriate landing-page hero saved
// to public/images/services/<slug>.jpg.
//
// Run with:  FAL_KEY=<key> node scripts/generate-service-covers.mjs
// Or set the key inline (already in repo for one-off generation).

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SERVICE_DIR = join(ROOT, 'src', 'content', 'services');
const OUT_DIR = join(ROOT, 'public', 'images', 'services');
const KEY = process.env.FAL_KEY || '8a1d167c-4e27-4a01-ab71-42077ff77788:057be61159dce4a58ce9de2109eaa507';
const CONCURRENCY = 1;          // sequential — fal locks parallel bursts from one key
const DELAY_MS = 800;           // pause between requests so we don't trip rate-limit

// Per-service prompt overrides for sharper, less generic imagery.
// Anything not listed falls back to the auto-prompt builder.
const PROMPT_OVERRIDES = {
  'tax-planning-services':
    'A flat-lay overhead shot of a tax planning workspace: a leather-bound notebook with handwritten quarterly projections, a sleek calculator showing six-figure numbers, a coffee in a navy ceramic cup, fountain pen, and printed 1040 forms partially visible. Warm directional light, deep navy accent, paper-white background. Editorial commercial photography, shallow depth of field.',
  'individual-tax-services':
    'A confident professional woman in her 40s reviewing a tax return at a sleek glass desk in a modern Fort Lauderdale office, large window with palm trees out of focus behind her. Crisp navy suit, focused expression, laptop showing tax software. Cinematic, soft golden-hour light, editorial style.',
  'estate-trust-tax-planning':
    'A multi-generational family conversation around a polished walnut conference table, viewed from a low angle. Estate documents and a leather portfolio between them, navy and gold tones, soft late-afternoon light through floor-to-ceiling windows. Editorial commercial photography.',
  'international-tax-services':
    'A modern airport business lounge at dusk with a laptop open to a multi-currency dashboard, a passport beside it, city skyline through floor-to-ceiling glass behind. Warm interior lights, sophisticated atmosphere, deep navy accents.',
  'corporate-tax-services':
    'Aerial shot of a glass corporate boardroom from above: long polished table, eight people in suits gathered around printed schedules and tablets. Crisp daylight, navy palette, geometric symmetry, top-down commercial photography.',
  'business-tax':
    'Close-up of two business owners shaking hands across a modern desk, partial laptop visible showing financial dashboards. Warm tones, navy blue suit jacket, professional Florida office, soft natural light.',
  'small-business-tax-services':
    'A young restaurant owner reviewing tax documents at her own café before opening, neighborhood storefront visible through the window. Authentic, warm, hopeful atmosphere, editorial commercial photography.',
  's-corp-cpa-services':
    'Two business co-founders examining a printed S-Corp election letter on a modern industrial desk, exposed brick wall behind, hanging Edison bulb. Tight crop, navy and amber palette, documentary editorial style.',
  'partnership-tax-services':
    'Two partners reviewing a K-1 schedule together at a glass conference table, sketching capital-account flows on the document. Editorial, focused, warm light, navy accent.',
  'non-profit-tax-services':
    'An executive director of a non-profit reviewing Form 990 with a board volunteer in a community-center office, warm but professional atmosphere, soft window light, navy accent in clothing.',
  'multistate-tax-services':
    'A US map projected on a glass wall with state-by-state economic-nexus indicators glowing in cyan, a CPA pointing at three highlighted states with a laser pointer. Modern conference room, navy and scooter-cyan palette, cinematic.',
  'tax-advisory-and-compliance':
    'A senior CPA in a perfectly tailored navy suit reviewing a wall-mounted projection of tax compliance dashboards, side profile, late-afternoon golden light. Editorial, executive portraiture, high-end commercial.',

  // Spanish-language services for US-based Hispanic small-business owners.
  'creacion-de-empresas':
    'A Latin American entrepreneur couple signing incorporation paperwork at a sleek modern Fort Lauderdale office, an articles-of-incorporation cover sheet and a CPA briefing them across a glass desk. Warm, hopeful, professional atmosphere, navy blue and scooter-cyan accents, soft golden-hour light. Editorial commercial photography.',
  'servicios-contables':
    'A bilingual Latina CPA in a navy blazer reviewing monthly financial statements with a Hispanic small-business owner at a bright Fort Lauderdale office, ledger and laptop on a clean marble desk, warm professional rapport. Navy and cyan palette, editorial commercial photography, soft natural light.',
  'servicios-tributarios-en-florida':
    'Overhead flat-lay of a Spanish-language tax planning workspace: a leather notebook with handwritten quarterly notes in Spanish, calculator showing six-figure totals, printed Form 1040 partially visible, a CPA-stamped folder, navy ceramic coffee cup. Warm directional light, deep navy accent, paper-white background. Editorial commercial photography.',

  'outsourced-accounting-services':
    'A modern accounting team in a bright open-plan Florida office, three CPAs collaborating around a long table covered in laptops and dashboards. Crisp natural daylight, navy accents, editorial commercial.',
  'outsourced-bookkeeping-services':
    'Close-up of clean ledger pages and a tablet showing reconciled bank feeds side by side on a marble desk. Soft natural light, navy ink, paper-white background, editorial flat-lay.',
  'business-accounting':
    'A founder reviewing a monthly close packet at a sunlit desk in a modern office, organized stack of financial statements beside a coffee cup, navy palette. Calm, editorial atmosphere.',
  'financial-statement-preparation-services':
    'A professional CPA finalizing a printed financial statement at a clean desk, signed cover page visible, dark green binder, navy fountain pen. Editorial, sharply lit commercial photography.',
  'accounting-software-implementation':
    'Two consultants configuring a cloud accounting platform on dual monitors in a sleek modern office, screens visible with QuickBooks/NetSuite-style dashboards, navy and cyan palette, editorial commercial.',
  'trust-accounting-cpa':
    'An attorney and a CPA reviewing an IOLTA trust ledger together in a formal law-office library, leather chairs, bookshelves, warm tungsten light, navy accents, editorial executive setting.',
  'payroll-compliance-services':
    'A close-up of a payroll dashboard displayed on a tablet, with neatly stacked pay-stub printouts beside it on a marble desk, navy mug, editorial flat-lay commercial photography.',

  'financial-advisory':
    'A senior advisor in profile delivering a financial strategy briefing to a small executive team at a Florida boardroom, projected charts in deep blue, golden-hour light through the glass wall. Cinematic editorial.',
  'fractional-cfo-services':
    'A fractional CFO in a tailored navy suit presenting a cash-runway slide on a giant screen to a startup founding team in a modern industrial office. Editorial, confident posture, warm light.',
  'financial-modeling-services':
    'Three-screen workstation showing a multi-tab financial model with deep navy headers and cyan key-cell highlights, dimly lit modern office, late evening, focused atmosphere.',
  'transaction-advisory-services':
    'Two professionals reviewing an M&A due-diligence binder on a polished conference table in a downtown Miami high-rise, city skyline visible through the floor-to-ceiling windows behind, editorial executive photography.',
  'private-client-services':
    'A discreet private-banking style meeting between a wealth advisor and a high-net-worth client in a private lounge, leather furniture, low warm light, navy palette, editorial luxury photography.',
  'business-structure-consulting':
    'A consultant sketching entity structure diagrams on a glass whiteboard with LLC/S-Corp/C-Corp boxes connecting to a holding company, modern Miami office, navy markers, editorial.',

  'audit-attestation-services':
    'A CPA stamping an audit opinion letter on a dark walnut desk under a green banker lamp, leather portfolio open, paper-white pages with bold navy heading visible. Editorial, dramatic, low-key lighting.',
  'employee-benefit-plan-audits':
    'A close-up of a 401(k) compliance audit checklist on a clipboard with pension plan documents fanned beneath, professional Florida office setting, navy palette, editorial commercial.',
  'financial-statement-audits':
    'A senior auditor sitting at a paper-strewn audit room reviewing financial statements with red-flag stickers, navy folder closed beside her, warm side-lighting, documentary editorial.',
  'reviews-compilations':
    'A CPA reviewing a printed compilation report at a clean modern desk, tea cup beside the binder, soft window light from a Miami office, navy palette, editorial.',
  'financial-compliance':
    'A compliance officer reviewing a regulatory checklist on a tablet at a security-conscious modern desk, locked filing cabinet behind, navy accents, editorial.',
  'boi-reporting-services':
    'A CPA filling out a beneficial-ownership information disclosure form on a laptop, FinCEN logo subtly visible on screen, professional desk setup, navy accent, editorial commercial.',
};

const ASPECT = '16:9';

function buildPrompt(slug, title, group, summary) {
  if (PROMPT_OVERRIDES[slug]) return PROMPT_OVERRIDES[slug];
  return `Editorial commercial photography for a Florida CPA firm landing page, depicting "${title}". ${summary}. Modern Fort Lauderdale office aesthetic, navy blue and scooter-cyan accent palette, paper-white background. Cinematic, high-end, sophisticated, soft natural light. ${ASPECT} aspect ratio.`;
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (mm) out[mm[1]] = mm[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

async function generate(slug, prompt) {
  const res = await fetch('https://fal.run/fal-ai/nano-banana', {
    method: 'POST',
    headers: {
      Authorization: `Key ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, num_images: 1 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fal status ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 200)}`);

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`download failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  writeFileSync(join(OUT_DIR, `${slug}.jpg`), buf);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pool(items, fn, n) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const my = i++;
      try {
        await fn(items[my], my);
      } catch (e) {
        console.error(`[${items[my].slug}] failed:`, e.message);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  });
  await Promise.all(workers);
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(SERVICE_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const items = files
    .map((f) => {
      const slug = basename(f).replace(/\.(md|mdx)$/, '');
      const md = readFileSync(join(SERVICE_DIR, f), 'utf8');
      const fm = parseFrontmatter(md);
      return {
        slug,
        title: fm.title || slug,
        group: fm.group,
        summary: fm.summary || '',
      };
    })
    .filter(Boolean)
    // Skip ones that already exist (re-runs only do the new ones)
    .filter((it) => !existsSync(join(OUT_DIR, `${it.slug}.jpg`)));

  console.log(`Generating ${items.length} service covers (${CONCURRENCY} at a time)...`);
  const start = Date.now();

  await pool(items, async (it, idx) => {
    const prompt = buildPrompt(it.slug, it.title, it.group, it.summary);
    console.log(`  [${idx + 1}/${items.length}] ${it.slug}`);
    await generate(it.slug, prompt);
  }, CONCURRENCY);

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\nDone in ${elapsed}s. Images at public/images/services/<slug>.jpg`);
}

main().catch((e) => { console.error(e); process.exit(1); });

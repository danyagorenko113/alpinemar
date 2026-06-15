// Migrate Alpine Mar service pages from the live WordPress REST API into the
// `services` content collection. Fusion-built pages → extract only meaningful
// prose (headings/paragraphs/lists/links/images), drop builder chrome/forms.
//   node scripts/migrate-services.mjs [--limit N]

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = 'https://alpinemar.com/wp-json/wp/v2/pages';
const OUT = 'src/content/services';
const IMG = 'public/images/services';
const UA = { 'User-Agent': 'Mozilla/5.0 (migration)' };

// last-segment slugs of every service detail page (from sitemap)
const SLUGS = [
  'tax-planning-services', 'small-business-tax-services', 'corporate-tax-services',
  'individual-tax-services', 'partnership-tax-services', 'international-tax-services',
  'non-profit-tax-services', 'multistate-tax-services', 'estate-trust-tax-planning',
  'private-client-services', 'tax-advisory-and-compliance', 'outsourced-bookkeeping-services',
  'outsourced-accounting-services', 'financial-statement-preparation-services',
  'accounting-software-implementation', 'trust-accounting-cpa', 'fractional-cfo-services',
  'financial-modeling-services', 'transaction-advisory-services', 'business-structure-consulting',
  's-corp-cpa-services', 'payroll-compliance-services', 'boi-reporting-services',
  'audit-attestation-services', 'financial-statement-audits', 'employee-benefit-plan-audits',
  'reviews-compilations',
  // category hubs
  'business-accounting', 'business-tax', 'financial-advisory', 'financial-compliance',
  // Spanish pages (migrated as-is)
  'creacion-de-empresas', 'servicios-contables', 'servicios-tributarios-en-florida',
];

const limit = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity; })();

const decode = (s = '') => s
  .replace(/&#8217;|&#039;|&#39;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8220;/g, '“')
  .replace(/&#8221;/g, '”').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
  .replace(/&#8230;/g, '…').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = (s = '') => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const yaml = (s = '') => `"${String(s).replace(/"/g, '\\"')}"`;

function cleanBody(html) {
  let h = html;
  // drop blocks we never want
  h = h.replace(/<(script|style|noscript|svg|form|select|table)[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<(input|source)\b[^>]*\/?>/gi, '');
  h = h.replace(/<(button|label|option|figcaption)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // keep only an allowlist of tags; unwrap everything else
  const ALLOW = new Set(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i', 'blockquote', 'br', 'img']);
  h = h.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, ''); // page title shown by template
  h = h.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (m, tag) => {
    tag = tag.toLowerCase();
    if (!ALLOW.has(tag)) return '\n';
    if (m[1] === '/') return `</${tag}>`;
    // strip attrs except href (a) / src,alt (img)
    if (tag === 'a') { const href = m.match(/href="([^"]*)"/i); return `<a${href ? ` href="${href[1]}"` : ''}>`; }
    if (tag === 'img') { const src = m.match(/src="([^"]*)"/i); const alt = m.match(/alt="([^"]*)"/i); return src ? `<img src="${src[1]}"${alt ? ` alt="${alt[1]}"` : ' alt=""'}>` : ''; }
    return `<${tag}>`;
  });
  // collapse <br> runs and trim them from block edges
  h = h.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
       .replace(/<(p|li|h2|h3|h4)>(\s|<br\s*\/?>)+/gi, '<$1>')
       .replace(/(\s|<br\s*\/?>)+<\/(p|li|h2|h3|h4)>/gi, '</$2>');
  // drop empty / whitespace-only blocks (repeat until stable)
  const empty = /<(p|li|ul|ol|blockquote|h2|h3|h4)>(\s|&nbsp;|&#160;)*<\/\1>/gi;
  let prev;
  do { prev = h; h = h.replace(empty, ''); } while (h !== prev);
  h = h.replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  // make internal links relative; lazy-load body images
  h = h.replace(/href="https?:\/\/(www\.)?alpinemar\.com/gi, 'href="');
  h = h.replace(/<img (?![^>]*loading=)/gi, '<img loading="lazy" ');
  return h;
}

async function getJSON(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return null;
  return r.json();
}
async function dl(url, name, dir) {
  if (!url) return undefined;
  const ext = (url.split('.').pop() || 'jpg').split('?')[0].slice(0, 4);
  const path = `${dir}/${name}.${ext}`;
  if (!existsSync(path)) { const r = await fetch(url, { headers: UA }); if (r.ok) await writeFile(path, Buffer.from(await r.arrayBuffer())); }
  return `/images/services/${name}.${ext}`;
}

await mkdir(OUT, { recursive: true });
await mkdir(IMG, { recursive: true });

let done = 0;
for (const slug of SLUGS) {
  if (done >= limit) break;
  const arr = await getJSON(`${BASE}?slug=${slug}&_embed=wp:featuredmedia&_fields=slug,link,title,excerpt,content,_links,_embedded`);
  if (!arr || !arr.length) { console.log(`✗ ${slug} (not found)`); continue; }
  const p = arr[0];
  const path = new URL(p.link).pathname; // preserves nesting, trailing slash
  const title = decode(p.title?.rendered ?? '');
  const summary = strip(p.excerpt?.rendered ?? '') || `${title} from Alpine Mar.`;
  const cover = await dl(p._embedded?.['wp:featuredmedia']?.[0]?.source_url, slug, IMG);
  const body = cleanBody(p.content?.rendered ?? '');
  const fm = ['---', `title: ${yaml(title)}`, `path: ${yaml(path)}`, `summary: ${yaml(summary)}`, cover ? `cover: ${yaml(cover)}` : '', '---', ''].filter(Boolean).join('\n');
  await writeFile(`${OUT}/${slug}.md`, fm + body + '\n');
  done++; console.log(`✓ ${slug} → ${path}`);
}
console.log(`\nMigrated ${done} service pages.`);

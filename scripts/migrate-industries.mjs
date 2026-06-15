// Migrate Alpine Mar industry pages from the live WordPress REST API into the
// `industries` content collection (same clean-extraction approach as services).
//   node scripts/migrate-industries.mjs [--limit N]

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = 'https://alpinemar.com/wp-json/wp/v2/pages';
const OUT = 'src/content/industries';
const IMG = 'public/images/industries-detail';
const UA = { 'User-Agent': 'Mozilla/5.0 (migration)' };

const SLUGS = [
  'construction-cpa-services', 'family-office-accounting-services', 'healthcare-accounting-services',
  'high-net-worth-accounting-cpa', 'law-firm-accounting-services', 'marketing-agency-accounting-services',
  'real-estate-cpa-services', 'sports-accounting-services', 'crypto-cpa-services',
  'saas-accounting-services', 'startup-cpa-services',
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
  h = h.replace(/<(script|style|noscript|svg|form|select|table)[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<(input|source)\b[^>]*\/?>/gi, '');
  h = h.replace(/<(button|label|option|figcaption)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const ALLOW = new Set(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i', 'blockquote', 'br', 'img']);
  h = h.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');
  h = h.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (m, tag) => {
    tag = tag.toLowerCase();
    if (!ALLOW.has(tag)) return '\n';
    if (m[1] === '/') return `</${tag}>`;
    if (tag === 'a') { const href = m.match(/href="([^"]*)"/i); return `<a${href ? ` href="${href[1]}"` : ''}>`; }
    if (tag === 'img') { const src = m.match(/src="([^"]*)"/i); const alt = m.match(/alt="([^"]*)"/i); return src ? `<img src="${src[1]}"${alt ? ` alt="${alt[1]}"` : ' alt=""'}>` : ''; }
    return `<${tag}>`;
  });
  h = h.replace(/<p>\s*<\/p>/gi, '').replace(/<li>\s*<\/li>/gi, '').replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  // make internal links relative; lazy-load body images
  h = h.replace(/href="https?:\/\/(www\.)?alpinemar\.com/gi, 'href="');
  h = h.replace(/<img (?![^>]*loading=)/gi, '<img loading="lazy" ');
  return h;
}

async function getJSON(url) { const r = await fetch(url, { headers: UA }); return r.ok ? r.json() : null; }
async function dl(url, name) {
  if (!url) return undefined;
  const ext = (url.split('.').pop() || 'jpg').split('?')[0].slice(0, 4);
  const path = `${IMG}/${name}.${ext}`;
  if (!existsSync(path)) { const r = await fetch(url, { headers: UA }); if (r.ok) await writeFile(path, Buffer.from(await r.arrayBuffer())); }
  return `/images/industries-detail/${name}.${ext}`;
}

await mkdir(OUT, { recursive: true });
await mkdir(IMG, { recursive: true });

let done = 0;
for (const slug of SLUGS) {
  if (done >= limit) break;
  const arr = await getJSON(`${BASE}?slug=${slug}&_embed=wp:featuredmedia&_fields=slug,link,title,excerpt,content,_embedded`);
  if (!arr || !arr.length) { console.log(`✗ ${slug} (not found)`); continue; }
  const p = arr[0];
  const path = new URL(p.link).pathname;
  const title = decode(p.title?.rendered ?? '');
  const summary = strip(p.excerpt?.rendered ?? '') || `${title} from Alpine Mar.`;
  const cover = await dl(p._embedded?.['wp:featuredmedia']?.[0]?.source_url, slug);
  const body = cleanBody(p.content?.rendered ?? '');
  const fm = ['---', `title: ${yaml(title)}`, `path: ${yaml(path)}`, `summary: ${yaml(summary)}`, cover ? `cover: ${yaml(cover)}` : '', '---', ''].filter(Boolean).join('\n');
  await writeFile(`${OUT}/${slug}.md`, fm + body + '\n');
  done++; console.log(`✓ ${slug} → ${path}`);
}
console.log(`\nMigrated ${done} industry pages.`);

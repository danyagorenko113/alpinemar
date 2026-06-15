// Migrate Alpine Mar blog posts from the live WordPress REST API into the
// `insights` content collection. Pulls the client's own content for the site
// rebuild. Writes Markdown files + downloads cover images. Idempotent.
//
//   node scripts/migrate-blog.mjs            # all posts
//   node scripts/migrate-blog.mjs --limit 5  # first N (verify)

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = 'https://alpinemar.com/wp-json/wp/v2';
const OUT = 'src/content/insights';
const IMG = 'public/images/blog';
const UA = { 'User-Agent': 'Mozilla/5.0 (migration)' };

const limit = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity; })();

const decode = (s = '') =>
  s.replace(/&#8217;|&#039;|&#39;/g, '’').replace(/&#8216;/g, '‘')
   .replace(/&#8220;/g, '“').replace(/&#8221;/g, '”').replace(/&#8211;/g, '–')
   .replace(/&#8212;/g, '—').replace(/&#8230;/g, '…').replace(/&amp;/g, '&')
   .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = (s = '') => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const yaml = (s = '') => `"${String(s).replace(/"/g, '\\"')}"`;

async function getJSON(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function downloadCover(url, slug) {
  if (!url) return undefined;
  const ext = (url.split('.').pop() || 'jpg').split('?')[0].slice(0, 4);
  const file = `${slug}.${ext}`;
  const path = `${IMG}/${file}`;
  if (!existsSync(path)) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) await writeFile(path, Buffer.from(await r.arrayBuffer()));
  }
  return `/images/blog/${file}`;
}

await mkdir(OUT, { recursive: true });
await mkdir(IMG, { recursive: true });

let page = 1, done = 0;
outer: while (true) {
  const posts = await getJSON(`${BASE}/posts?per_page=50&page=${page}&_embed=wp:featuredmedia`);
  if (!posts.length) break;
  for (const p of posts) {
    if (done >= limit) break outer;
    const slug = p.slug;
    const title = decode(p.title?.rendered ?? '');
    const date = (p.date || '').slice(0, 10);
    const excerpt = strip(p.excerpt?.rendered ?? '').replace(/\s*\[?…\]?\s*$/, '…');
    const coverUrl = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const cover = await downloadCover(coverUrl, slug);
    let body = (p.content?.rendered ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/ class="[^"]*"/g, '')
      .replace(/ id="[^"]*"/g, '')
      .replace(/ style="[^"]*"/g, '')
      .trim();
    body = body
      .replace(/href="https?:\/\/(www\.)?alpinemar\.com/gi, 'href="')
      .replace(/<img (?![^>]*loading=)/gi, '<img loading="lazy" ');
    const fm = [
      '---',
      `title: ${yaml(title)}`,
      `date: ${date}`,
      `excerpt: ${yaml(excerpt)}`,
      cover ? `cover: ${yaml(cover)}` : '',
      'tags: []',
      '---',
      '',
    ].filter(Boolean).join('\n');
    await writeFile(`${OUT}/${slug}.md`, fm + body + '\n');
    done++;
    console.log(`✓ ${slug}`);
  }
  page++;
}
console.log(`\nMigrated ${done} posts.`);

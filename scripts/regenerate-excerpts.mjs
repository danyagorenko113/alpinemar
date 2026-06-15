#!/usr/bin/env node
/**
 * Rebuild blog-post excerpts from each article's actual first paragraph.
 *
 * The original WordPress migration truncated every excerpt to ~60 chars + "…",
 * which now shows up on blog cards, the search results, and the [slug] page
 * sub-headline. This script reads each post's body, takes the first one or
 * two real <p> blocks, strips inline tags + HTML entities, and rewrites the
 * `excerpt:` frontmatter line to a clean ~280-char summary.
 *
 * Run from repo root:  node scripts/regenerate-excerpts.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/insights';
const MAX_LEN = 280;

const ENTITIES = {
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#038;':  '&',
  '&amp;':   '&',
  '&nbsp;':  ' ',
  '&hellip;': '…',
  '&#39;':   "'",
  '&quot;':  '"',
  '&lt;':    '<',
  '&gt;':    '>',
};

const decode = (s) =>
  Object.entries(ENTITIES).reduce((acc, [k, v]) => acc.replaceAll(k, v), s);

const stripTags = (s) => s.replace(/<[^>]+>/g, '');

const tidy = (s) =>
  s.replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

/** Pull the first one or two meaningful <p> blocks, then condense to MAX_LEN. */
function buildExcerpt(body) {
  const paragraphs = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(body)) && paragraphs.length < 3) {
    const txt = tidy(stripTags(decode(m[1])));
    if (txt.length >= 30) paragraphs.push(txt);
  }
  if (!paragraphs.length) return null;

  // Combine first paragraph; pull a second if first is short
  let out = paragraphs[0];
  if (out.length < 140 && paragraphs[1]) out += ' ' + paragraphs[1];

  if (out.length > MAX_LEN) {
    // Cut at the last sentence boundary <= MAX_LEN
    let cut = out.slice(0, MAX_LEN);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (lastStop > 140) {
      out = cut.slice(0, lastStop + 1);
    } else {
      // Fallback: last word boundary
      const lastSpace = cut.lastIndexOf(' ');
      out = cut.slice(0, lastSpace > 0 ? lastSpace : MAX_LEN).trim() + '…';
    }
  }
  return out.trim();
}

let touched = 0, skipped = 0, blank = 0;
for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.md')) continue;
  const path = join(DIR, name);
  const src = readFileSync(path, 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { skipped++; continue; }
  const body = src.slice(fm[0].length);

  const newExcerpt = buildExcerpt(body);
  if (!newExcerpt) { blank++; continue; }

  // YAML-safe: escape backslashes and double-quotes
  const yamlValue = newExcerpt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const block = fm[1];
  // Replace the existing excerpt: line or insert after title: if missing
  let nextBlock;
  if (/^excerpt:\s*/m.test(block)) {
    nextBlock = block.replace(/^excerpt:.*$/m, `excerpt: "${yamlValue}"`);
  } else if (/^title:/m.test(block)) {
    nextBlock = block.replace(/^(title:[^\n]*)$/m, `$1\nexcerpt: "${yamlValue}"`);
  } else {
    nextBlock = block + `\nexcerpt: "${yamlValue}"`;
  }
  if (nextBlock === block) { skipped++; continue; }

  const out = `---\n${nextBlock}\n---` + body;
  writeFileSync(path, out, 'utf8');
  touched++;
}

console.log(`Done. ${touched} rewritten, ${skipped} unchanged, ${blank} had no usable body.`);

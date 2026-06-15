#!/usr/bin/env node
/**
 * Strip WordPress-migration artefacts from src/content/{services,industries}/*.md.
 *
 * What it removes:
 *  - The trailing "What our clients are saying:" / "Partner with nationally
 *    recognized CPAs:" / "Asóciese con contadores..." block — including FICPA
 *    logos, address blocks, form remnants, and the Airtable script comment that
 *    follow it. Templates render their own CTA + contact rail.
 *  - Empty SVG placeholder <img> tags wherever they appear.
 *  - Orphan FICPA/AICPA logo <img>s wherever they appear.
 *  - Empty <a></a> and <i></i> tags.
 *  - HTML numeric entities (&#038; → &, &#8217; → ’, etc.) in body AND
 *    frontmatter (so `title: "Audit &#038; Attestation Services"` becomes
 *    `title: "Audit & Attestation Services"`).
 *
 * What it preserves:
 *  - Frontmatter (decoded only).
 *  - All valid body content up to the first trailer marker.
 *
 * Run from repo root:  node scripts/scrub-migrated-content.mjs
 *
 * Backup at /tmp/alpinemar-content-backup/content/ (made outside this script).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/content/services', 'src/content/industries'];

// Trailer markers — match the first one we find, then strip from there to EOF.
const TRAILERS = [
  /<h2>\s*What our clients are saying:?\s*<\/h2>[\s\S]*$/i,
  /<h2>\s*Partner with nationally recognized CPAs:?\s*<\/h2>[\s\S]*$/i,
  /<h2>\s*As[oó]ciese con contadores p[uú]blicos con reconocimiento nacional:?\s*<\/h2>[\s\S]*$/i,
];

const ENTITY_MAP = {
  '&#038;': '&',
  '&amp;': '&',
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&nbsp;': ' ',
  '&hellip;': '…',
};

const decodeEntities = (s) =>
  Object.entries(ENTITY_MAP).reduce(
    (acc, [k, v]) => acc.replaceAll(k, v),
    s,
  );

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let scrubbed = 0;
let untouched = 0;
const trailerHits = { en1: 0, en2: 0, es: 0, none: 0 };

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const before = readFileSync(file, 'utf8');
    let after = before;
    let trailerCut = false;

    // 1) Cut at the FIRST matching trailer marker (preserve content above it).
    for (let i = 0; i < TRAILERS.length; i++) {
      const re = TRAILERS[i];
      if (re.test(after)) {
        after = after.replace(re, '');
        trailerCut = true;
        trailerHits[['en1', 'en2', 'es'][i]]++;
        break;
      }
    }
    if (!trailerCut) trailerHits.none++;

    // 2) Empty SVG placeholder images anywhere.
    after = after.replace(
      /<img[^>]*src="data:image\/svg\+xml[^"]*"[^>]*>/gi,
      '',
    );

    // 3) Orphan FICPA / AICPA logo images.
    after = after.replace(
      /<img[^>]*src="https:\/\/alpinemar\.com\/wp-content\/uploads\/[^"]*Ficpa[^"]*"[^>]*>/gi,
      '',
    );

    // 4) Empty <a></a> and self-closing equivalents (importer's link stubs).
    after = after.replace(/<a[^>]*>\s*<\/a>/gi, '');

    // 5) Empty <i></i> markers from the address list importer.
    after = after.replace(/<i>\s*<\/i>/gi, '');

    // 6) Airtable / form-related HTML comments left at the tail.
    after = after.replace(
      /<!--\s*=+\s*Custom Airtable Form Script\s*=+\s*-->/g,
      '',
    );

    // 7) Decode HTML numeric entities everywhere (body AND frontmatter).
    after = decodeEntities(after);

    // 8) Tidy: collapse trailing whitespace; drop orphan </p> sequences at EOF.
    after = after.replace(/[ \t]+$/gm, '');
    after = after.replace(/(<\/p>\s*)+$/g, '');
    after = after.replace(/\n{3,}/g, '\n\n');
    after = after.trimEnd() + '\n';

    if (before !== after) {
      writeFileSync(file, after, 'utf8');
      scrubbed++;
      console.log(`✓ ${file}`);
    } else {
      untouched++;
    }
  }
}

console.log(
  `\nDone. ${scrubbed} scrubbed, ${untouched} unchanged.\n` +
    `Trailer matches: EN(saying)=${trailerHits.en1}, EN(partner)=${trailerHits.en2}, ES(asóciese)=${trailerHits.es}, none=${trailerHits.none}`,
);

#!/usr/bin/env node
/**
 * Infer `tags: [...]` for every blog post in src/content/insights/*.md based
 * on a simple keyword classifier over the title and body.
 *
 * Existing non-empty `tags:` arrays are preserved — only empty ones are
 * rewritten. Each post gets between 1 and 4 tags.
 *
 * Run from repo root:  node scripts/infer-blog-tags.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const POSTS_DIR = 'src/content/insights';

/** Tag → regexp list. First match wins per tag. Order is alphabetic for stability. */
const RULES = [
  ['Audit',            /\b(audit|attestation|peer review|GAAS|GAAP)\b/i],
  ['Accounting',       /\b(bookkeep|book-keep|reconciliation|chart of accounts|outsourced accounting|month-end|close|gl |general ledger)\b/i],
  ['Advisory',         /\b(fractional CFO|CFO services|advisory|advisor|consult|strategic plan)\b/i],
  ['Crypto',           /\b(crypto|bitcoin|ethereum|web3|digital asset|blockchain|token)\b/i],
  ['Compliance',       /\b(BOI|FinCEN|compliance|beneficial ownership|FBAR|FATCA|filing requirement)\b/i],
  ['Estate Planning',  /\b(estate|trust|inheritance|legacy|gift tax|step-up|generational)\b/i],
  ['HNW',              /\b(high.{0,3}net.{0,3}worth|HNW|wealth manag|family office|UHNW|net worth)\b/i],
  ['M&A',              /\b(M&A|mergers|acquisition|due diligence|deal struct|transaction advisory|earn-?out)\b/i],
  ['Payroll',          /\b(payroll|W-?2|1099|employee benefit|401\(?k\)?|withholding)\b/i],
  ['Real Estate',      /\b(real estate|rental|1031|721|pied.{0,3}terre|landlord|property tax|REIT|short-term rental)\b/i],
  ['SaaS',             /\b(SaaS|software-as-a-service|ARR|MRR|deferred revenue|customer acquisition cost|CAC|LTV)\b/i],
  ['Startups',         /\b(startup|founders|seed round|series A|burn rate|runway|venture|cap table|equity comp|RSU|ISO|incentive stock)\b/i],
  ['Tax',              /\b(tax|IRS|deduction|credit|filing|return|FICA|self.?employ|withhold|IRC|R&D|Section 174|Section 179|Section 199A|capital gain|QBI)\b/i],
];

const FALLBACK_TAG = 'Tax'; // CPA-firm default

const stripHtml = (s) => s.replace(/<[^>]+>/g, ' ');

function inferTags(title, body) {
  const haystack = `${title}\n\n${stripHtml(body)}`;
  const matches = [];
  for (const [tag, re] of RULES) {
    if (re.test(haystack)) matches.push(tag);
  }
  if (matches.length === 0) return [FALLBACK_TAG];
  // Cap at 4 — most relevant tags ranked by rule order (specific → broad).
  return matches.slice(0, 4);
}

let touched = 0, skipped = 0;
for (const name of readdirSync(POSTS_DIR)) {
  if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
  const path = join(POSTS_DIR, name);
  const before = readFileSync(path, 'utf8');

  const fmMatch = before.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) { skipped++; continue; }
  const fm = fmMatch[1];
  const body = before.slice(fmMatch[0].length);

  // Skip files that already have a non-empty tags array.
  const tagsMatch = fm.match(/^tags:\s*(.*)$/m);
  if (tagsMatch) {
    const existing = tagsMatch[1].trim();
    if (existing && existing !== '[]') { skipped++; continue; }
  }

  const title = (fm.match(/^title:\s*["']?(.*?)["']?$/m) ?? [])[1] ?? '';
  const tags = inferTags(title, body);
  const literal = `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`;

  let newFm;
  if (tagsMatch) {
    newFm = fm.replace(/^tags:.*$/m, literal);
  } else {
    // Inject after excerpt:, or at the end
    newFm = /^excerpt:/m.test(fm)
      ? fm.replace(/^(excerpt:[^\n]*)$/m, `$1\n${literal}`)
      : `${fm}\n${literal}`;
  }
  const after = before.replace(fmMatch[0], `---\n${newFm}\n---\n`);
  if (after !== before) {
    writeFileSync(path, after, 'utf8');
    touched++;
    console.log(`✓ ${name} → [${tags.join(', ')}]`);
  } else {
    skipped++;
  }
}

console.log(`\nDone. ${touched} updated, ${skipped} skipped.`);

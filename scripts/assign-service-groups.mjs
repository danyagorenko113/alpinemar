#!/usr/bin/env node
/**
 * Inject `group: Tax|Accounting|Advisory|Compliance` into the YAML frontmatter
 * of every src/content/services/*.md, so the detail template can render the
 * typed hero (outline numeral + category meta + Mountains fallback plate) for
 * pages that aren't in src/data/taxonomy.ts:allServices.
 *
 * If `group:` already exists in frontmatter, skips that file.
 *
 * Run from repo root:  node scripts/assign-service-groups.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SERVICES_DIR = 'src/content/services';

/** slug-stem (filename without ".md") → category */
const GROUPS = {
  // Tax
  'corporate-tax-services':              'Tax',
  'estate-trust-tax-planning':           'Tax',
  'individual-tax-services':             'Tax',
  'international-tax-services':          'Tax',
  'multistate-tax-services':             'Tax',
  'non-profit-tax-services':             'Tax',
  'partnership-tax-services':            'Tax',
  'private-client-services':             'Tax',
  'servicios-tributarios-en-florida':    'Tax',
  'small-business-tax-services':         'Tax',
  'tax-advisory-and-compliance':         'Tax',
  'tax-planning-services':               'Tax',
  'business-tax':                        'Tax',

  // Accounting
  'accounting-software-implementation':  'Accounting',
  'business-accounting':                 'Accounting',
  'financial-statement-preparation-services': 'Accounting',
  'outsourced-accounting-services':      'Accounting',
  'outsourced-bookkeeping-services':     'Accounting',
  'servicios-contables':                 'Accounting',
  'trust-accounting-cpa':                'Accounting',

  // Advisory
  'financial-advisory':                  'Advisory',
  'financial-modeling-services':         'Advisory',
  'fractional-cfo-services':             'Advisory',
  'transaction-advisory-services':       'Advisory',

  // Compliance
  'audit-attestation-services':          'Compliance',
  'boi-reporting-services':              'Compliance',
  'business-structure-consulting':       'Compliance',
  'creacion-de-empresas':                'Compliance',
  'employee-benefit-plan-audits':        'Compliance',
  'financial-compliance':                'Compliance',
  'financial-statement-audits':          'Compliance',
  'payroll-compliance-services':         'Compliance',
  'reviews-compilations':                'Compliance',
  's-corp-cpa-services':                 'Compliance',
};

/** Find every .md file directly under the services dir. */
const files = readdirSync(SERVICES_DIR, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.md'))
  .map((e) => e.name);

let updated = 0;
let skipped = 0;
let unmapped = [];

for (const filename of files) {
  const stem = filename.replace(/\.md$/, '');
  const group = GROUPS[stem];
  if (!group) {
    unmapped.push(filename);
    continue;
  }

  const path = join(SERVICES_DIR, filename);
  const before = readFileSync(path, 'utf8');

  // Locate the frontmatter block: ---\n...\n---
  const fmMatch = before.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    console.warn(`! ${filename}: no frontmatter, skipping`);
    skipped++;
    continue;
  }
  const fm = fmMatch[1];
  if (/^group:\s*/m.test(fm)) {
    console.log(`= ${filename}: group already set, skipping`);
    skipped++;
    continue;
  }

  // Insert `group: …` after the `summary:` line (or at the end of fm).
  let newFm;
  if (/^summary:\s*/m.test(fm)) {
    newFm = fm.replace(/^(summary:[^\n]*)$/m, `$1\ngroup: ${group}`);
  } else {
    newFm = fm + `\ngroup: ${group}`;
  }
  const after = before.replace(fmMatch[0], `---\n${newFm}\n---`);
  writeFileSync(path, after, 'utf8');
  console.log(`✓ ${filename} → group: ${group}`);
  updated++;
}

console.log(
  `\nDone. ${updated} updated, ${skipped} skipped.\n` +
    (unmapped.length
      ? `! Unmapped (no entry in GROUPS): ${unmapped.join(', ')}\n`
      : '! All files mapped.\n'),
);

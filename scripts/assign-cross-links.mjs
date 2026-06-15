#!/usr/bin/env node
/**
 * Wire the bidirectional cross-link graph between services and industries.
 *
 *  - Each service MDX gets `industries: [slug, slug, …]` in frontmatter.
 *  - Each industry MDX gets `services: [slug, slug, …]` in frontmatter.
 *
 * Detail templates already read these arrays:
 *   - services/[...slug].astro renders "Often paired with" (industries list)
 *   - industries/[slug].astro  renders "Services we run for {industry}"
 *
 * Slugs match the last path segment of the corresponding URL.
 *
 * Run from repo root:  node scripts/assign-cross-links.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SERVICES_DIR = 'src/content/services';
const INDUSTRIES_DIR = 'src/content/industries';

// All 11 industry slugs (full filename stem)
const ALL_INDUSTRIES = [
  'construction-cpa-services',
  'family-office-accounting-services',
  'healthcare-accounting-services',
  'high-net-worth-accounting-cpa',
  'law-firm-accounting-services',
  'marketing-agency-accounting-services',
  'real-estate-cpa-services',
  'sports-accounting-services',
  'crypto-cpa-services',
  'saas-accounting-services',
  'startup-cpa-services',
];

// service stem → list of industry slugs (where this service makes sense)
const SERVICE_TO_INDUSTRIES = {
  // — Tax —
  'tax-planning-services':            ALL_INDUSTRIES,
  'tax-advisory-and-compliance':      ['high-net-worth-accounting-cpa', 'family-office-accounting-services', 'real-estate-cpa-services', 'crypto-cpa-services', 'startup-cpa-services'],
  'individual-tax-services':          ['high-net-worth-accounting-cpa', 'family-office-accounting-services', 'sports-accounting-services'],
  'partnership-tax-services':         ['real-estate-cpa-services', 'law-firm-accounting-services', 'marketing-agency-accounting-services'],
  'corporate-tax-services':           ['saas-accounting-services', 'startup-cpa-services', 'healthcare-accounting-services', 'construction-cpa-services'],
  's-corp-cpa-services':              ['marketing-agency-accounting-services', 'law-firm-accounting-services', 'construction-cpa-services'],
  'estate-trust-tax-planning':        ['high-net-worth-accounting-cpa', 'family-office-accounting-services', 'sports-accounting-services'],
  'private-client-services':          ['high-net-worth-accounting-cpa', 'family-office-accounting-services', 'sports-accounting-services'],
  'small-business-tax-services':      ['marketing-agency-accounting-services', 'law-firm-accounting-services', 'construction-cpa-services'],
  'international-tax-services':       ['high-net-worth-accounting-cpa', 'family-office-accounting-services', 'saas-accounting-services', 'crypto-cpa-services'],
  'non-profit-tax-services':          ['healthcare-accounting-services'],
  'multistate-tax-services':          ['real-estate-cpa-services', 'saas-accounting-services', 'construction-cpa-services'],
  'business-tax':                     ALL_INDUSTRIES,

  // — Accounting —
  'outsourced-accounting-services':           ALL_INDUSTRIES,
  'outsourced-bookkeeping-services':          ALL_INDUSTRIES,
  'financial-statement-preparation-services': ['saas-accounting-services', 'startup-cpa-services', 'healthcare-accounting-services', 'construction-cpa-services', 'real-estate-cpa-services', 'marketing-agency-accounting-services', 'law-firm-accounting-services'],
  'accounting-software-implementation':       ['saas-accounting-services', 'startup-cpa-services', 'construction-cpa-services', 'real-estate-cpa-services', 'marketing-agency-accounting-services', 'law-firm-accounting-services'],
  'business-accounting':                      ALL_INDUSTRIES,
  'trust-accounting-cpa':                     ['law-firm-accounting-services', 'real-estate-cpa-services', 'family-office-accounting-services'],

  // — Advisory —
  'fractional-cfo-services':          ['saas-accounting-services', 'startup-cpa-services', 'marketing-agency-accounting-services', 'law-firm-accounting-services', 'healthcare-accounting-services', 'high-net-worth-accounting-cpa', 'family-office-accounting-services'],
  'transaction-advisory-services':    ['real-estate-cpa-services', 'saas-accounting-services', 'startup-cpa-services', 'law-firm-accounting-services'],
  'financial-modeling-services':      ['saas-accounting-services', 'startup-cpa-services', 'real-estate-cpa-services', 'marketing-agency-accounting-services'],
  'financial-advisory':               ALL_INDUSTRIES,

  // — Compliance —
  'business-structure-consulting':    ALL_INDUSTRIES,
  'boi-reporting-services':           ALL_INDUSTRIES,
  'payroll-compliance-services':      ALL_INDUSTRIES,
  'financial-compliance':             ALL_INDUSTRIES,

  // — Audit & Attestation (parent + 3 sub) —
  'audit-attestation-services':       ['saas-accounting-services', 'healthcare-accounting-services', 'construction-cpa-services', 'real-estate-cpa-services', 'law-firm-accounting-services'],
  'financial-statement-audits':       ['saas-accounting-services', 'healthcare-accounting-services', 'construction-cpa-services', 'real-estate-cpa-services'],
  'reviews-compilations':             ['saas-accounting-services', 'marketing-agency-accounting-services', 'law-firm-accounting-services', 'startup-cpa-services'],
  'employee-benefit-plan-audits':     ['healthcare-accounting-services', 'construction-cpa-services', 'law-firm-accounting-services'],
};

// Spanish slugs — skip from cross-linking (orphan by design)
const SKIP_SERVICES = new Set(['creacion-de-empresas', 'servicios-contables', 'servicios-tributarios-en-florida']);

/** Read an MDX file, parse frontmatter, splice a new key:value into it. */
function injectFrontmatterArray(file, key, values) {
  const before = readFileSync(file, 'utf8');
  const fmMatch = before.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { changed: false, reason: 'no-frontmatter' };

  const fm = fmMatch[1];
  if (new RegExp(`^${key}:`, 'm').test(fm)) {
    return { changed: false, reason: 'already-set' };
  }

  // Build a flow-array literal — `key: [ "a", "b", "c" ]`
  const literal = `${key}: [${values.map((v) => `"${v}"`).join(', ')}]`;

  // Inject after summary: or at the end of frontmatter
  let newFm;
  if (/^summary:/m.test(fm)) {
    newFm = fm.replace(/^(summary:[^\n]*)$/m, `$1\n${literal}`);
  } else {
    newFm = fm + `\n${literal}`;
  }

  const after = before.replace(fmMatch[0], `---\n${newFm}\n---`);
  writeFileSync(file, after, 'utf8');
  return { changed: true };
}

// === Pass 1: services → industries ===
let svcUpdated = 0, svcSkipped = 0, svcUnmapped = [];
for (const name of readdirSync(SERVICES_DIR)) {
  if (!name.endsWith('.md')) continue;
  const stem = name.replace(/\.md$/, '');
  if (SKIP_SERVICES.has(stem)) { svcSkipped++; continue; }
  const industries = SERVICE_TO_INDUSTRIES[stem];
  if (!industries) { svcUnmapped.push(stem); continue; }
  const res = injectFrontmatterArray(join(SERVICES_DIR, name), 'industries', industries);
  if (res.changed) { svcUpdated++; console.log(`✓ service ${stem} → ${industries.length} industries`); }
  else { svcSkipped++; }
}

// === Pass 2: industries → services (invert the graph) ===
const industryToServices = new Map(ALL_INDUSTRIES.map((i) => [i, []]));
for (const [service, industries] of Object.entries(SERVICE_TO_INDUSTRIES)) {
  for (const ind of industries) {
    if (industryToServices.has(ind)) industryToServices.get(ind).push(service);
  }
}

let indUpdated = 0, indSkipped = 0;
for (const name of readdirSync(INDUSTRIES_DIR)) {
  if (!name.endsWith('.md')) continue;
  const stem = name.replace(/\.md$/, '');
  const services = industryToServices.get(stem);
  if (!services || !services.length) { indSkipped++; continue; }
  // Cap at 9 most-relevant services per industry to keep cross-link grid tidy.
  // Prefer the named-fit ones; "universal" services (which all 11 industries
  // share) come last so industry-specific services lead.
  const universal = ['tax-planning-services', 'outsourced-accounting-services', 'outsourced-bookkeeping-services', 'business-accounting', 'business-tax', 'boi-reporting-services', 'payroll-compliance-services', 'business-structure-consulting', 'financial-compliance', 'financial-advisory'];
  const sorted = [...services].sort((a, b) => {
    const ua = universal.includes(a) ? 1 : 0;
    const ub = universal.includes(b) ? 1 : 0;
    return ua - ub;
  });
  const top = sorted.slice(0, 9);
  const res = injectFrontmatterArray(join(INDUSTRIES_DIR, name), 'services', top);
  if (res.changed) { indUpdated++; console.log(`✓ industry ${stem} → ${top.length} services`); }
  else { indSkipped++; }
}

console.log(
  `\nDone.\n` +
  `Services: ${svcUpdated} linked, ${svcSkipped} skipped.\n` +
  `Industries: ${indUpdated} linked, ${indSkipped} skipped.\n` +
  (svcUnmapped.length ? `! Unmapped services: ${svcUnmapped.join(', ')}\n` : ''),
);

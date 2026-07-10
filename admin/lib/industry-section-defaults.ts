/**
 * The built-in "starter" content the industry-page template renders when a
 * section is empty. The CMS form prefills empty sections with these so an
 * editor SEES what's on the live page and can edit it. On save, a section
 * that still equals its default is written back as empty (so the file stays
 * clean and keeps using the template default) — only edited sections persist.
 *
 * These MUST stay in sync with the defaults in
 * src/pages/industries/[slug].astro.
 */

import type { IndustryTakeaway, IndustryPillar, IndustryFaqItem } from '@/lib/actions/industries'

export const DEFAULT_TAKEAWAYS: IndustryTakeaway[] = [
  { title: 'Industry-fluent partners', body: 'A CPA who knows your vertical from day one. No ramp-up, no "explain that again" calls.' },
  { title: 'Reporting that fits your vertical', body: 'Beyond GAAP: the metrics your investors, lenders, and operators actually care about.' },
  { title: 'Tested playbooks', body: "We've already solved the questions you're about to ask. Faster engagements, fewer surprises." },
  { title: 'A network already in place', body: 'Lawyers, lenders, brokers, and insurers who already know your space. Your shortlist gets shorter.' },
]

export const DEFAULT_PILLARS: IndustryPillar[] = [
  { title: 'Specialized by vertical', body: 'Construction, healthcare, SaaS, family office: every industry has its own playbook and we know yours.' },
  { title: 'Benchmarks that matter', body: 'We know the industry KPIs investors and lenders look at, and we report on them.' },
  { title: 'Network already in place', body: 'Lawyers, lenders, brokers, and insurers we work with daily. Your call list is shorter.' },
]

/** The FAQ default references the industry phrase (title lower-cased, cpa→CPA). */
export function industryPhraseOf(title: string): string {
  return (title || '').toLowerCase().replace(/\bcpa\b/g, 'CPA')
}

export function defaultFaq(title: string): IndustryFaqItem[] {
  const phrase = industryPhraseOf(title) || 'this industry'
  return [
    { q: 'How is this different from a generalist CPA firm?', a: `We run a dedicated ${phrase} practice — partners who've worked the vertical for years, benchmarks we already know, and a network of vertical-specific lawyers, lenders and operators we work with weekly.` },
    { q: 'How quickly can we start?', a: 'Intro call within a few business days, with scoping often started the same week.' },
    { q: 'Will I work with the same person?', a: 'Every engagement has partner involvement, with senior support staying close to your file instead of passing you through a queue.' },
    { q: 'Are you taking new clients in this industry?', a: `Yes — Alpine Mar is actively onboarding ${phrase} clients. We pace intake so every partner can deliver the service standard the firm is known for.` },
  ]
}

/** Deep structural equality for a list of flat string-record objects. */
export function equalsDefault<T extends Record<string, string>>(value: T[], def: T[]): boolean {
  if (value.length !== def.length) return false
  return value.every((item, i) =>
    Object.keys(def[i]).every((k) => (item[k] ?? '').trim() === (def[i][k] ?? '').trim()),
  )
}

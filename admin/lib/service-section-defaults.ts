/**
 * The built-in "starter" content the service-page template renders when a
 * section is empty. The CMS form prefills empty sections with these so an
 * editor SEES what's on the live page and can edit it. On save, a section
 * that still equals its default is written back as empty (so the file stays
 * clean and keeps using the template default) — only edited sections get
 * persisted.
 *
 * These MUST stay in sync with the defaults in
 * src/pages/services/[...slug].astro.
 */

import type { ServiceTakeaway, ServiceProcessStep, ServiceFaqItem, ServicePillar } from '@/lib/actions/services'

export const DEFAULT_TAKEAWAYS: ServiceTakeaway[] = [
  { title: 'Partner Involvement', body: 'A CPA on every engagement. No junior handoff once you sign.' },
  { title: 'Fixed-fee, scoped', body: 'Scope and price agreed before we start. No hourly meter or surprise invoices.' },
  { title: 'Year-round attention', body: 'We work the calendar, not just the deadline. Quarterly check-ins by default.' },
  { title: 'Modern finance stack', body: 'Cloud books, AI, automation, and secure portals. Work moves faster without losing rigor.' },
]

export const DEFAULT_PROCESS: ServiceProcessStep[] = [
  { title: 'Intro call', body: "An introductory call including the partner who'd run your engagement. We cover scope, timing, and fit." },
  { title: 'Discovery', body: 'We look at your books, prior filings, and stack. You get a scoping memo and a flat fee.' },
  { title: 'Engagement', body: 'Work is delivered by a senior team. You see drafts, not silence, with weekly status by default.' },
  { title: 'Wrap-up', body: 'Deliverables ship with a written summary. You keep working with the same team next round.' },
]

export const DEFAULT_PILLARS: ServicePillar[] = [
  { title: 'National and international expertise', body: 'Single-state, multistate, or cross-border, our CPAs know the complexity and know how to navigate it without leaving money on the table.' },
  { title: 'Proactive approach', body: "We don't wait for deadlines to find savings. We plan ahead so you're always in a better position than you were last year." },
  { title: 'Adapted to your needs', body: 'Individual, small business, S-Corp, or multijurisdictional, your situation is specific and our service should be too.' },
]

/** FAQ default — one answer references the service title, so it's title-dependent. */
export function defaultFaq(serviceTitle: string): ServiceFaqItem[] {
  const title = serviceTitle.trim() || 'This service'
  return [
    { q: 'How quickly can we start?', a: 'We schedule an intro call within a few business days and can begin scoping the same week.' },
    { q: 'How are fees structured?', a: `${title} is quoted as a fixed fee with a clearly scoped deliverable, after the intro call. We don't bill by the hour for known scopes. Ongoing work (like monthly close or fractional CFO) is a flat monthly retainer.` },
    { q: 'Will I work with the same person, or get passed around?', a: 'Every engagement is partner-led. The senior CPA you meet on the intro is the one running your file. Day-to-day support comes from a senior associate, with partner sign-off on every deliverable.' },
    { q: 'Are you taking new clients?', a: "Yes. We're actively onboarding new clients year-round, and we pace intake so every partner can hold the service standard the firm is known for." },
  ]
}

/** Deep structural equality for a list of flat string-record objects. */
export function equalsDefault<T extends Record<string, string>>(value: T[], def: T[]): boolean {
  if (value.length !== def.length) return false
  return value.every((item, i) =>
    Object.keys(def[i]).every((k) => (item[k] ?? '').trim() === (def[i][k] ?? '').trim()),
  )
}

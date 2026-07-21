'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'src/content/services'
const LIST_CACHE_KEY = 'services:list'
const LIST_TTL_MS = 60_000

/** Free-form group name — the canonical set lives in the mega-menu (navigation.ts). */
export type ServiceGroup = string
export type ContentStatus = 'draft' | 'published'

/** Detail-page sections, in the site's default render order. */
export type ServiceSectionKey =
  | 'benefits'
  | 'process'
  | 'deepdive'
  | 'reviews'
  | 'industries'
  | 'pillars'
  | 'related'
  | 'faq'

/** Sections whose headings/intros can be overridden ('cta' covers the final CTA block). */
export type ServiceCopyKey = ServiceSectionKey | 'cta'

export interface SectionCopy {
  eyebrow?: string
  heading?: string
  intro?: string
  aside?: string
  button?: string
}

export type ServiceSectionCopy = Partial<Record<ServiceCopyKey, SectionCopy>>

// Type aliases (not interfaces) so they satisfy StructList's
// Record<string, string> constraint via implicit index signatures.
export type ServiceProcessStep = { title: string; body: string }
export type ServiceFaqItem = { q: string; a: string }
export type ServicePillar = { title: string; body: string }
export type ServiceTakeaway = { title: string; body: string }

export interface ServiceSeo {
  title?: string
  description?: string
  /** Canonical URL override — defaults to the page's own URL on the site. */
  canonical?: string
}

export interface ServiceFrontmatter {
  title: string
  /** H1 override on the service page; falls back to title. */
  heroTitle?: string
  path: string
  summary: string
  cover?: string
  /** Alt text for the cover/banner image. */
  coverAlt?: string
  group?: ServiceGroup
  /** Section order + visibility; undefined = default full layout. */
  sections?: ServiceSectionKey[]
  /** Per-section heading/eyebrow/intro overrides; blank = built-in default. */
  sectionCopy?: ServiceSectionCopy
  /** "Why Alpine Mar" cards; empty = the default three pillars. */
  pillars: ServicePillar[]
  /** Which Google review to feature (index into the global reviews list). */
  reviewIndex?: number
  /** "What you get" cards — title + supporting line. */
  takeaways: ServiceTakeaway[]
  /** Ordered engagement steps (numbered process strip). */
  process: ServiceProcessStep[]
  /** FAQ entries for the detail page. */
  faq: ServiceFaqItem[]
  industries: string[]
  status: ContentStatus
  updated?: string
  seo?: ServiceSeo
}

export interface Service extends ServiceFrontmatter {
  slug: string
  body: string
  sha?: string
}

function slugFromPath(p: string): string {
  return p.replace(/^src\/content\/services\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): ServiceFrontmatter {
  const rawStatus = data.status
  const status: ContentStatus = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  const validSections: ServiceSectionKey[] = ['benefits', 'process', 'deepdive', 'reviews', 'industries', 'pillars', 'related', 'faq']
  const sections = Array.isArray(data.sections)
    ? (data.sections.filter((s): s is ServiceSectionKey => validSections.includes(s as ServiceSectionKey)))
    : undefined
  const validCopyKeys: ServiceCopyKey[] = [...validSections, 'cta']
  const copyFields = ['eyebrow', 'heading', 'intro', 'aside', 'button'] as const
  let sectionCopy: ServiceSectionCopy | undefined
  if (data.sectionCopy && typeof data.sectionCopy === 'object') {
    sectionCopy = {}
    for (const [key, raw] of Object.entries(data.sectionCopy as Record<string, unknown>)) {
      if (!validCopyKeys.includes(key as ServiceCopyKey) || !raw || typeof raw !== 'object') continue
      const entry: SectionCopy = {}
      for (const f of copyFields) {
        const v = (raw as Record<string, unknown>)[f]
        if (typeof v === 'string' && v.trim()) entry[f] = v
      }
      if (Object.keys(entry).length) sectionCopy[key as ServiceCopyKey] = entry
    }
    if (!Object.keys(sectionCopy).length) sectionCopy = undefined
  }
  return {
    title: String(data.title ?? ''),
    heroTitle: data.heroTitle ? String(data.heroTitle) : undefined,
    path: String(data.path ?? ''),
    summary: String(data.summary ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    group: data.group as ServiceGroup | undefined,
    sections: sections && sections.length > 0 ? sections : undefined,
    sectionCopy,
    pillars: Array.isArray(data.pillars)
      ? (data.pillars as Array<Record<string, unknown>>).map((p) => ({
          title: String(p?.title ?? ''),
          body: String(p?.body ?? ''),
        }))
      : [],
    reviewIndex: typeof data.reviewIndex === 'number' && data.reviewIndex >= 0 ? data.reviewIndex : undefined,
    takeaways: Array.isArray(data.takeaways)
      ? (data.takeaways as Array<Record<string, unknown> | string>).map((t) =>
          typeof t === 'string'
            ? { title: t, body: '' }
            : { title: String(t?.title ?? ''), body: String(t?.body ?? '') },
        )
      : [],
    process: Array.isArray(data.process)
      ? (data.process as Array<Record<string, unknown>>).map((p) => ({
          title: String(p?.title ?? ''),
          body: String(p?.body ?? ''),
        }))
      : [],
    faq: Array.isArray(data.faq)
      ? (data.faq as Array<Record<string, unknown>>).map((f) => ({
          q: String(f?.q ?? ''),
          a: String(f?.a ?? ''),
        }))
      : [],
    industries: Array.isArray(data.industries) ? (data.industries as string[]) : [],
    status,
    updated,
    seo: data.seo as ServiceFrontmatter['seo'],
  }
}

export type ServiceSummary = ServiceFrontmatter & { slug: string; sha?: string }

export async function listServices(): Promise<ServiceSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const items = files.map((f): ServiceSummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return items
      .filter((s): s is ServiceSummary => s !== null)
      .sort((a, b) => a.title.localeCompare(b.title))
  })
}

/**
 * Group options for the service form: the mega-menu category labels (the
 * canonical set) merged with any group already used by a service. Editors can
 * still type a brand-new group in the form.
 */
export async function listServiceGroups(): Promise<string[]> {
  const store = getStore()
  const set = new Set<string>()
  const services = await listServices()
  services.forEach((s) => { if (s.group) set.add(s.group) })
  const nav = await store.read('src/data/navigation.ts')
  if (nav) {
    const m = /export const serviceMenu = ([\s\S]*?) as const;/.exec(nav.content)
    if (m) {
      for (const lm of m[1].matchAll(/\blabel:\s*'((?:\\.|[^'])*)'/g)) set.add(lm[1])
    }
  }
  return [...set].sort()
}

export async function getService(slug: string): Promise<Service | null> {
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveServiceInput {
  slug: string
  frontmatter: ServiceFrontmatter
  body: string
  sha?: string
  /** When renaming, the slug being edited — its old file is removed. */
  originalSlug?: string
}

export async function saveService(input: SaveServiceInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const fm = input.frontmatter
  const path = pathFromSlug(finalSlug)
  const oldSlug = input.originalSlug ? slugify(input.originalSlug) : undefined
  const oldPath = oldSlug && oldSlug !== finalSlug ? pathFromSlug(oldSlug) : undefined
  const original = await readOriginalFrontmatter(store, oldPath ?? path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  // Deep-clean sectionCopy: drop blank strings, empty entries, empty object.
  let sectionCopy: ServiceSectionCopy | undefined
  if (fm.sectionCopy) {
    sectionCopy = {}
    for (const [key, entry] of Object.entries(fm.sectionCopy)) {
      if (!entry) continue
      const clean = Object.fromEntries(
        Object.entries(entry).filter(([, v]) => typeof v === 'string' && v.trim()),
      ) as SectionCopy
      if (Object.keys(clean).length) sectionCopy[key as ServiceCopyKey] = clean
    }
    if (!Object.keys(sectionCopy).length) sectionCopy = undefined
  }

  const updates: Record<string, unknown> = {
    title: fm.title,
    heroTitle: fm.heroTitle?.trim() || undefined,
    path: fm.path || `/services/${finalSlug}/`,
    summary: fm.summary,
    cover: fm.cover,
    coverAlt: fm.coverAlt,
    group: fm.group,
    // undefined = default full layout → key is dropped from frontmatter.
    sections: fm.sections,
    sectionCopy,
    pillars: fm.pillars.filter((p) => p.title.trim() || p.body.trim()),
    reviewIndex: fm.reviewIndex,
    takeaways: fm.takeaways.filter((t) => t.title.trim() || t.body.trim()),
    process: fm.process.filter((p) => p.title.trim() || p.body.trim()),
    faq: fm.faq.filter((f) => f.q.trim() || f.a.trim()),
    industries: fm.industries,
    status: fm.status === 'draft' ? 'draft' : undefined,
    updated: new Date().toISOString(),
    seo:
      fm.seo && (fm.seo.title || fm.seo.description || fm.seo.canonical)
        ? {
            ...(fm.seo.title ? { title: fm.seo.title } : {}),
            ...(fm.seo.description ? { description: fm.seo.description } : {}),
            ...(fm.seo.canonical ? { canonical: fm.seo.canonical } : {}),
          }
        : undefined,
  }

  const payload = mergeFrontmatter(original, updates)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await writeContentEntry(store, {
    newPath: path,
    oldPath,
    sha: input.sha,
    content: fileContent,
    message: `content(services): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('services:')
  revalidatePath('/services')
  revalidatePath(`/services/${finalSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteService(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(services): delete ${slug}`, sha })
  invalidatePrefix('services:')
  revalidatePath('/services')
}

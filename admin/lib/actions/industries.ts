'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'src/content/industries'
const LIST_CACHE_KEY = 'industries:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

/** Detail-page sections whose heading/eyebrow/intro can be overridden. */
export type IndustryCopyKey =
  | 'benefits'
  | 'services'
  | 'deepdive'
  | 'reviews'
  | 'pillars'
  | 'related'
  | 'faq'
  | 'cta'

export interface SectionCopy {
  eyebrow?: string
  heading?: string
  intro?: string
  aside?: string
  button?: string
}

export type IndustrySectionCopy = Partial<Record<IndustryCopyKey, SectionCopy>>

// Type aliases (not interfaces) so they satisfy StructList's
// Record<string, string> constraint via implicit index signatures.
export type IndustryTakeaway = { title: string; body: string }
export type IndustryPillar = { title: string; body: string }
export type IndustryFaqItem = { q: string; a: string }

export interface IndustrySeo {
  title?: string
  description?: string
  /** Canonical URL override — defaults to the page's own URL on the site. */
  canonical?: string
}

export interface IndustryFrontmatter {
  title: string
  path: string
  summary: string
  cover?: string
  /** Alt text for the cover/banner image. */
  coverAlt?: string
  services: string[]
  /** "What you get" cards — title + supporting line. */
  takeaways: IndustryTakeaway[]
  /** "Why Alpine Mar" cards; empty = the default three pillars. */
  pillars: IndustryPillar[]
  /** FAQ entries; empty = the default set. */
  faq: IndustryFaqItem[]
  /** Per-section heading/eyebrow/intro overrides; blank = built-in default. */
  sectionCopy?: IndustrySectionCopy
  status: ContentStatus
  updated?: string
  seo?: IndustrySeo
}

export interface Industry extends IndustryFrontmatter {
  slug: string
  body: string
  sha?: string
}

function slugFromPath(p: string): string {
  return p.replace(/^src\/content\/industries\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): IndustryFrontmatter {
  const rawStatus = data.status
  const status: ContentStatus = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  const validCopyKeys: IndustryCopyKey[] = ['benefits', 'services', 'deepdive', 'reviews', 'pillars', 'related', 'faq', 'cta']
  const copyFields = ['eyebrow', 'heading', 'intro', 'aside', 'button'] as const
  let sectionCopy: IndustrySectionCopy | undefined
  if (data.sectionCopy && typeof data.sectionCopy === 'object') {
    sectionCopy = {}
    for (const [key, raw] of Object.entries(data.sectionCopy as Record<string, unknown>)) {
      if (!validCopyKeys.includes(key as IndustryCopyKey) || !raw || typeof raw !== 'object') continue
      const entry: SectionCopy = {}
      for (const f of copyFields) {
        const v = (raw as Record<string, unknown>)[f]
        if (typeof v === 'string' && v.trim()) entry[f] = v
      }
      if (Object.keys(entry).length) sectionCopy[key as IndustryCopyKey] = entry
    }
    if (!Object.keys(sectionCopy).length) sectionCopy = undefined
  }
  return {
    title: String(data.title ?? ''),
    path: String(data.path ?? ''),
    summary: String(data.summary ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    services: Array.isArray(data.services) ? (data.services as string[]) : [],
    takeaways: Array.isArray(data.takeaways)
      ? (data.takeaways as Array<Record<string, unknown> | string>).map((t) =>
          typeof t === 'string'
            ? { title: t, body: '' }
            : { title: String(t?.title ?? ''), body: String(t?.body ?? '') },
        )
      : [],
    pillars: Array.isArray(data.pillars)
      ? (data.pillars as Array<Record<string, unknown>>).map((p) => ({
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
    sectionCopy,
    status,
    updated,
    seo: data.seo as IndustryFrontmatter['seo'],
  }
}

export type IndustrySummary = IndustryFrontmatter & { slug: string; sha?: string }

export async function listIndustries(): Promise<IndustrySummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const items = files.map((f): IndustrySummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return items
      .filter((i): i is IndustrySummary => i !== null)
      .sort((a, b) => a.title.localeCompare(b.title))
  })
}

export async function getIndustry(slug: string): Promise<Industry | null> {
  assertSafeSlug(slug)
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveIndustryInput {
  slug: string
  frontmatter: IndustryFrontmatter
  body: string
  sha?: string
  /** When renaming, the slug being edited — its old file is removed. */
  originalSlug?: string
}

export async function saveIndustry(input: SaveIndustryInput): Promise<{ slug: string; sha: string }> {
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
  let sectionCopy: IndustrySectionCopy | undefined
  if (fm.sectionCopy) {
    sectionCopy = {}
    for (const [key, entry] of Object.entries(fm.sectionCopy)) {
      if (!entry) continue
      const clean = Object.fromEntries(
        Object.entries(entry).filter(([, v]) => typeof v === 'string' && v.trim()),
      ) as SectionCopy
      if (Object.keys(clean).length) sectionCopy[key as IndustryCopyKey] = clean
    }
    if (!Object.keys(sectionCopy).length) sectionCopy = undefined
  }

  const updates: Record<string, unknown> = {
    title: fm.title,
    path: fm.path || `/industries/${finalSlug}/`,
    summary: fm.summary,
    cover: fm.cover,
    coverAlt: fm.coverAlt,
    services: fm.services,
    takeaways: fm.takeaways.filter((t) => t.title.trim() || t.body.trim()),
    pillars: fm.pillars.filter((p) => p.title.trim() || p.body.trim()),
    faq: fm.faq.filter((f) => f.q.trim() || f.a.trim()),
    sectionCopy,
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
    message: `content(industries): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('industries:')
  revalidatePath('/industries')
  revalidatePath(`/industries/${finalSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteIndustry(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(industries): delete ${slug}`, sha })
  invalidatePrefix('industries:')
  revalidatePath('/industries')
}

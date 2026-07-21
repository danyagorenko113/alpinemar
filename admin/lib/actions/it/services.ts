'use server'

/**
 * IT-site services actions → it-site/src/content/services.
 *
 * IT services are simpler than the main site's: the whole article lives in the
 * markdown BODY (prose HTML plus an `am-subsvc-grid` cross-link block). There
 * are no takeaways/process/pillars/faq/sectionCopy frontmatter fields. The body
 * is therefore edited as raw HTML source so the cross-link grid survives — a
 * rich-text editor would strip its custom markup.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'it-site/src/content/services'
const LIST_CACHE_KEY = 'it:services:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

export interface ITServiceSeo {
  title?: string
  description?: string
}

export interface ITServiceFrontmatter {
  title: string
  heroTitle?: string
  path: string
  summary: string
  cover?: string
  group?: string
  status: ContentStatus
  updated?: string
  seo?: ITServiceSeo
}

export interface ITService extends ITServiceFrontmatter {
  slug: string
  body: string
  sha?: string
}

export type ITServiceSummary = ITServiceFrontmatter & { slug: string; sha?: string }

function assertITPath(p: string): string {
  const normalized = p.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
    throw new Error(`Path traversal detected: ${p}`)
  }
  if (!normalized.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return normalized
}

function slugFromPath(p: string): string {
  return p.replace(/^it-site\/src\/content\/services\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): ITServiceFrontmatter {
  const rawStatus = data.status
  const status: ContentStatus = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  return {
    title: String(data.title ?? ''),
    heroTitle: data.heroTitle ? String(data.heroTitle) : undefined,
    path: String(data.path ?? ''),
    summary: String(data.summary ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    group: data.group ? String(data.group) : undefined,
    status,
    updated,
    seo: data.seo as ITServiceSeo | undefined,
  }
}

export async function listServices(): Promise<ITServiceSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const items = files.map((f): ITServiceSummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return items
      .filter((s): s is ITServiceSummary => s !== null)
      .sort((a, b) => a.title.localeCompare(b.title))
  })
}

export async function getService(slug: string): Promise<ITService | null> {
  assertSafeSlug(slug)
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveITServiceInput {
  slug: string
  frontmatter: ITServiceFrontmatter
  body: string
  sha?: string
  originalSlug?: string
}

export async function saveService(input: SaveITServiceInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const fm = input.frontmatter
  const path = assertITPath(pathFromSlug(finalSlug))
  const oldSlug = input.originalSlug ? slugify(input.originalSlug) : undefined
  const oldPath = oldSlug && oldSlug !== finalSlug ? assertITPath(pathFromSlug(oldSlug)) : undefined
  const original = await readOriginalFrontmatter(store, oldPath ?? path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  // `path` is required by the IT schema and drives every link to this service.
  const canonicalPath = fm.path?.trim() || `/services/${finalSlug}/`

  const updates: Record<string, unknown> = {
    title: fm.title,
    heroTitle: fm.heroTitle?.trim() || undefined,
    path: canonicalPath,
    summary: fm.summary,
    cover: fm.cover?.trim() || undefined,
    group: fm.group || undefined,
    status: fm.status === 'draft' ? 'draft' : undefined,
    updated: new Date().toISOString(),
  }
  const seo = fm.seo
  if (seo && (seo.title || seo.description)) {
    updates.seo = {
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
    }
  } else {
    updates.seo = undefined
  }

  const payload = mergeFrontmatter(original, updates)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await writeContentEntry(store, {
    newPath: path,
    oldPath,
    sha: input.sha,
    content: fileContent,
    message: `content(it-services): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('it:services:')
  revalidatePath('/it/services')
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteService(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(assertITPath(pathFromSlug(slug)), { message: `content(it-services): delete ${slug}`, sha })
  invalidatePrefix('it:services:')
  revalidatePath('/it/services')
}

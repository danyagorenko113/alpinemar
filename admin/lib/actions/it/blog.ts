'use server'

/**
 * IT-site blog (Insights) actions. Mirror of lib/actions/blog.ts but pointed at
 * the IT site's collection (it-site/src/content/insights) with its own cache
 * namespace and revalidation paths. Types are shared with the main blog action.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, toDateString, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'
import type { BlogFrontmatter, BlogPost, BlogSummary, SaveBlogInput } from '@/lib/actions/blog'

const COLLECTION_DIR = 'it-site/src/content/insights'
const LIST_CACHE_KEY = 'it:blog:list'
const LIST_TTL_MS = 60_000

/** Guard: every IT write must stay under it-site/ — never the main collection. */
function assertITPath(p: string): string {
  if (!p.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return p
}

function slugFromPath(p: string): string {
  return p
    .replace(/^it-site\/src\/content\/insights\//, '')
    .replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): BlogFrontmatter {
  const rawStatus = data.status
  const status = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  return {
    title: String(data.title ?? ''),
    excerpt: String(data.excerpt ?? ''),
    date: toDateString(data.date as string | Date | undefined),
    author: data.author ? String(data.author) : undefined,
    cover: data.cover ? String(data.cover) : undefined,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    status,
    updated,
    seo: data.seo as BlogFrontmatter['seo'],
    featured: data.featured === true,
  }
}

export async function listBlogPosts(): Promise<BlogSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const posts = files.map((f): BlogSummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return posts
      .filter((p): p is BlogSummary => p !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  })
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export async function saveBlogPost(input: SaveBlogInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const path = assertITPath(pathFromSlug(finalSlug))
  const oldSlug = input.originalSlug ? slugify(input.originalSlug) : undefined
  const oldPath = oldSlug && oldSlug !== finalSlug ? assertITPath(pathFromSlug(oldSlug)) : undefined
  const original = await readOriginalFrontmatter(store, oldPath ?? path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  const fm = input.frontmatter
  const updates: Record<string, unknown> = {
    title: fm.title,
    excerpt: fm.excerpt,
    date: fm.date,
    author: fm.author,
    cover: fm.cover,
    coverAlt: fm.coverAlt,
    category: fm.category,
    tags: fm.tags,
    status: fm.status === 'draft' ? 'draft' : undefined,
    updated: fm.updated || new Date().toISOString(),
    // IT-only: manual Featured flag. Written only when true; cleared otherwise.
    featured: fm.featured ? true : undefined,
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
    message: `content(it-blog): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('it:blog:')
  revalidatePath('/it/blog')
  revalidatePath(`/it/blog/${finalSlug}`)
  if (oldSlug && oldSlug !== finalSlug) revalidatePath(`/it/blog/${oldSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteBlogPost(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(assertITPath(pathFromSlug(slug)), { message: `content(it-blog): delete ${slug}`, sha })
  invalidatePrefix('it:blog:')
  revalidatePath('/it/blog')
}

export async function listAllTags(): Promise<string[]> {
  const posts = await listBlogPosts()
  const tags = new Set<string>()
  posts.forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return [...tags].sort()
}

export async function listAllCategories(): Promise<string[]> {
  const posts = await listBlogPosts()
  const categories = new Set<string>()
  posts.forEach((p) => {
    if (p.category) categories.add(p.category)
  })
  return [...categories].sort()
}

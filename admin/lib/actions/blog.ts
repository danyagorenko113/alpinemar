'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, toDateString, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'src/content/insights'
const LIST_CACHE_KEY = 'blog:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

export interface BlogSeo {
  title?: string
  description?: string
  /** Canonical URL override — defaults to the post's own URL on the site. */
  canonical?: string
}

export interface BlogFrontmatter {
  title: string
  excerpt: string
  date: string // YYYY-MM-DD
  author?: string
  cover?: string
  /** Alt text for the cover image. */
  coverAlt?: string
  /** Single category (original-site convention); tags stay separate. */
  category?: string
  tags: string[]
  status: ContentStatus
  updated?: string // ISO datetime
  seo?: BlogSeo
  /**
   * IT-site only: marks the manually-chosen Featured post. The main site
   * features page.data[0] and never writes this field.
   */
  featured?: boolean
}

export interface BlogPost extends BlogFrontmatter {
  slug: string
  body: string
  sha?: string
}

export interface BlogSummary extends BlogFrontmatter {
  slug: string
  sha?: string
}

function slugFromPath(p: string): string {
  return p
    .replace(/^src\/content\/insights\//, '')
    .replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): BlogFrontmatter {
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
  assertSafeSlug(slug)
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveBlogInput {
  slug: string
  frontmatter: BlogFrontmatter
  body: string
  sha?: string
  /** When renaming, the slug being edited — its old file is removed. */
  originalSlug?: string
}

export async function saveBlogPost(input: SaveBlogInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const path = pathFromSlug(finalSlug)
  const oldSlug = input.originalSlug ? slugify(input.originalSlug) : undefined
  const oldPath = oldSlug && oldSlug !== finalSlug ? pathFromSlug(oldSlug) : undefined
  const original = await readOriginalFrontmatter(store, oldPath ?? path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  const updates: Record<string, unknown> = {
    title: input.frontmatter.title,
    excerpt: input.frontmatter.excerpt,
    date: input.frontmatter.date,
    author: input.frontmatter.author,
    cover: input.frontmatter.cover,
    coverAlt: input.frontmatter.coverAlt,
    category: input.frontmatter.category,
    tags: input.frontmatter.tags,
    status: input.frontmatter.status === 'draft' ? 'draft' : undefined,
    // Explicit override wins; otherwise the CMS stamps the save time.
    updated: input.frontmatter.updated || new Date().toISOString(),
  }
  const seo = input.frontmatter.seo
  if (seo && (seo.title || seo.description || seo.canonical)) {
    updates.seo = {
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      ...(seo.canonical ? { canonical: seo.canonical } : {}),
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
    message: `content(blog): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('blog:')
  revalidatePath('/blog')
  revalidatePath(`/blog/${finalSlug}`)
  if (oldSlug && oldSlug !== finalSlug) revalidatePath(`/blog/${oldSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteBlogPost(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(blog): delete ${slug}`, sha })
  invalidatePrefix('blog:')
  revalidatePath('/blog')
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

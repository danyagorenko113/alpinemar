'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { parseDoc, serializeDoc, toDateString } from '@/lib/store/markdown'
import { slugify } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'src/content/insights'
const LIST_CACHE_KEY = 'blog:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

export interface BlogFrontmatter {
  title: string
  excerpt: string
  date: string // YYYY-MM-DD
  author?: string
  cover?: string
  tags: string[]
  status: ContentStatus
  updated?: string // ISO datetime
  seo?: { title?: string; description?: string }
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
    const posts = await Promise.all(
      files.map(async (f): Promise<BlogSummary | null> => {
        const doc = await store.read(f.path)
        if (!doc) return null
        const { data } = parseDoc(doc.content)
        return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
      })
    )
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

export interface SaveBlogInput {
  slug: string
  frontmatter: BlogFrontmatter
  body: string
  sha?: string
}

export async function saveBlogPost(input: SaveBlogInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const payload: Record<string, unknown> = {
    title: input.frontmatter.title,
    excerpt: input.frontmatter.excerpt,
    date: input.frontmatter.date,
  }
  if (input.frontmatter.author) payload.author = input.frontmatter.author
  if (input.frontmatter.cover) payload.cover = input.frontmatter.cover
  if (input.frontmatter.tags?.length) payload.tags = input.frontmatter.tags
  if (input.frontmatter.status === 'draft') payload.status = 'draft'
  payload.updated = new Date().toISOString()
  if (input.frontmatter.seo && (input.frontmatter.seo.title || input.frontmatter.seo.description)) {
    payload.seo = {
      ...(input.frontmatter.seo.title ? { title: input.frontmatter.seo.title } : {}),
      ...(input.frontmatter.seo.description ? { description: input.frontmatter.seo.description } : {}),
    }
  }

  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const path = pathFromSlug(finalSlug)
  const res = await store.write(path, fileContent, {
    message: `content(blog): ${input.sha ? 'update' : 'create'} ${finalSlug}`,
    sha: input.sha,
  })
  invalidatePrefix('blog:')
  revalidatePath('/blog')
  revalidatePath(`/blog/${finalSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteBlogPost(slug: string, sha?: string): Promise<void> {
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

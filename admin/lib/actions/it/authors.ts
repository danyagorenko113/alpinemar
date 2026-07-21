'use server'

/** IT-site authors → it-site/src/content/authors. Mirror of lib/actions/authors.ts. */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'
import type { Author, AuthorFrontmatter, AuthorSummary, SaveAuthorInput } from '@/lib/actions/authors'

const COLLECTION_DIR = 'it-site/src/content/authors'
const LIST_CACHE_KEY = 'it:authors:list'
const LIST_TTL_MS = 60_000

function assertITPath(p: string): string {
  const normalized = p.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
    throw new Error(`Path traversal detected: ${p}`)
  }
  if (!normalized.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return normalized
}

function slugFromPath(p: string): string {
  return p.replace(/^it-site\/src\/content\/authors\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): AuthorFrontmatter {
  const rawStatus = data.status
  const status = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  return {
    name: String(data.name ?? ''),
    title: data.title ? String(data.title) : undefined,
    photo: data.photo ? String(data.photo) : undefined,
    photoAlt: data.photoAlt ? String(data.photoAlt) : undefined,
    linkedin: data.linkedin ? String(data.linkedin) : undefined,
    email: data.email ? String(data.email) : undefined,
    order: typeof data.order === 'number' ? data.order : 0,
    status,
    updated,
  }
}

export async function listAuthors(): Promise<AuthorSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const items = files.map((f): AuthorSummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return items
      .filter((a): a is AuthorSummary => a !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
  })
}

export async function listAuthorNames(): Promise<string[]> {
  const authors = await listAuthors()
  return [...new Set(authors.map((a) => a.name).filter(Boolean))]
}

export async function getAuthor(slug: string): Promise<Author | null> {
  assertSafeSlug(slug)
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export async function saveAuthor(input: SaveAuthorInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.name)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.name) throw new Error('Name is required')

  const fm = input.frontmatter
  const path = assertITPath(pathFromSlug(finalSlug))
  const oldSlug = input.originalSlug ? slugify(input.originalSlug) : undefined
  const oldPath = oldSlug && oldSlug !== finalSlug ? assertITPath(pathFromSlug(oldSlug)) : undefined
  const original = await readOriginalFrontmatter(store, oldPath ?? path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  const updates: Record<string, unknown> = {
    name: fm.name,
    title: fm.title,
    photo: fm.photo,
    photoAlt: fm.photoAlt,
    linkedin: fm.linkedin,
    email: fm.email,
    order: fm.order,
    status: fm.status === 'draft' ? 'draft' : undefined,
    updated: new Date().toISOString(),
  }

  const payload = mergeFrontmatter(original, updates)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await writeContentEntry(store, {
    newPath: path,
    oldPath,
    sha: input.sha,
    content: fileContent,
    message: `content(it-authors): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('it:authors:')
  revalidatePath('/it/authors')
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteAuthor(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(assertITPath(pathFromSlug(slug)), { message: `content(it-authors): delete ${slug}`, sha })
  invalidatePrefix('it:authors:')
  revalidatePath('/it/authors')
}

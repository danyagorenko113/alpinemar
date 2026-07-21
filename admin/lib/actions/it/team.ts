'use server'

/**
 * IT-site team actions. Mirror of lib/actions/team.ts pointed at
 * it-site/src/content/team. The IT schema differs: it has `email` and
 * `linkedin` fields and no `credentials`.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc, writeContentEntry } from '@/lib/store/markdown'
import { slugify, assertSafeSlug } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'it-site/src/content/team'
const LIST_CACHE_KEY = 'it:team:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

export interface ITTeamFrontmatter {
  name: string
  role: string
  photo?: string
  email?: string
  linkedin?: string
  order: number
  status: ContentStatus
  updated?: string
}

export interface ITTeamMember extends ITTeamFrontmatter {
  slug: string
  body: string
  sha?: string
}

export type ITTeamSummary = ITTeamFrontmatter & { slug: string; sha?: string }

function assertITPath(p: string): string {
  if (!p.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return p
}

function slugFromPath(p: string): string {
  return p.replace(/^it-site\/src\/content\/team\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): ITTeamFrontmatter {
  const rawStatus = data.status
  const status: ContentStatus = rawStatus === 'draft' ? 'draft' : 'published'
  const rawUpdated = data.updated
  const updated = rawUpdated instanceof Date
    ? rawUpdated.toISOString()
    : typeof rawUpdated === 'string' && rawUpdated
      ? rawUpdated
      : undefined
  return {
    name: String(data.name ?? ''),
    role: String(data.role ?? ''),
    photo: data.photo ? String(data.photo) : undefined,
    email: data.email ? String(data.email) : undefined,
    linkedin: data.linkedin ? String(data.linkedin) : undefined,
    order: typeof data.order === 'number' ? data.order : 0,
    status,
    updated,
  }
}

export async function listTeam(): Promise<ITTeamSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const contents = await store.readManyText(files.map((f) => f.path))
    const items = files.map((f): ITTeamSummary | null => {
      const doc = contents.get(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
    return items
      .filter((m): m is ITTeamSummary => m !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
  })
}

export async function getTeamMember(slug: string): Promise<ITTeamMember | null> {
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveITTeamInput {
  slug: string
  frontmatter: ITTeamFrontmatter
  body: string
  sha?: string
  originalSlug?: string
}

export async function saveTeamMember(input: SaveITTeamInput): Promise<{ slug: string; sha: string }> {
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
    role: fm.role,
    photo: fm.photo,
    email: fm.email,
    linkedin: fm.linkedin,
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
    message: `content(it-team): ${oldPath ? 'rename' : input.sha ? 'update' : 'create'} ${finalSlug}`,
  })
  invalidatePrefix('it:team:')
  revalidatePath('/it/team')
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteTeamMember(slug: string, sha?: string): Promise<void> {
  assertSafeSlug(slug)
  const store = getStore()
  await store.remove(assertITPath(pathFromSlug(slug)), { message: `content(it-team): delete ${slug}`, sha })
  invalidatePrefix('it:team:')
  revalidatePath('/it/team')
}

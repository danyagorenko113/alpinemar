'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { mergeFrontmatter, parseDoc, readOriginalFrontmatter, serializeDoc } from '@/lib/store/markdown'
import { slugify } from '@/lib/utils'
import { cached, invalidatePrefix } from '@/lib/cache'

const COLLECTION_DIR = 'src/content/team'
const LIST_CACHE_KEY = 'team:list'
const LIST_TTL_MS = 60_000

export type ContentStatus = 'draft' | 'published'

export interface TeamFrontmatter {
  name: string
  role: string
  photo?: string
  credentials: string[]
  order: number
  status: ContentStatus
  updated?: string
}

export interface TeamMember extends TeamFrontmatter {
  slug: string
  body: string
  sha?: string
}

function slugFromPath(p: string): string {
  return p.replace(/^src\/content\/team\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): TeamFrontmatter {
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
    credentials: Array.isArray(data.credentials) ? (data.credentials as string[]) : [],
    order: typeof data.order === 'number' ? data.order : 0,
    status,
    updated,
  }
}

export type TeamSummary = TeamFrontmatter & { slug: string; sha?: string }

export async function listTeam(): Promise<TeamSummary[]> {
  return cached(LIST_CACHE_KEY, LIST_TTL_MS, async () => {
    const store = getStore()
    const files = await store.list(COLLECTION_DIR, '.md')
    const items = await Promise.all(
      files.map(async (f): Promise<TeamSummary | null> => {
        const doc = await store.read(f.path)
        if (!doc) return null
        const { data } = parseDoc(doc.content)
        return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
      })
    )
    return items
      .filter((m): m is TeamSummary => m !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
  })
}

export async function getTeamMember(slug: string): Promise<TeamMember | null> {
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveTeamInput {
  slug: string
  frontmatter: TeamFrontmatter
  body: string
  sha?: string
}

export async function saveTeamMember(input: SaveTeamInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.name)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.name) throw new Error('Name is required')

  const fm = input.frontmatter
  const path = pathFromSlug(finalSlug)
  const original = await readOriginalFrontmatter(store, path, {
    collectionDir: COLLECTION_DIR,
    sha: input.sha,
  })

  const updates: Record<string, unknown> = {
    name: fm.name,
    role: fm.role,
    photo: fm.photo,
    credentials: fm.credentials,
    order: fm.order,
    status: fm.status === 'draft' ? 'draft' : undefined,
    updated: new Date().toISOString(),
  }

  const payload = mergeFrontmatter(original, updates)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await store.write(path, fileContent, {
    message: `content(team): ${input.sha ? 'update' : 'create'} ${finalSlug}`,
    sha: input.sha,
  })
  invalidatePrefix('team:')
  revalidatePath('/team')
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteTeamMember(slug: string, sha?: string): Promise<void> {
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(team): delete ${slug}`, sha })
  invalidatePrefix('team:')
  revalidatePath('/team')
}

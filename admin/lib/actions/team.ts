'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { parseDoc, serializeDoc } from '@/lib/store/markdown'
import { slugify } from '@/lib/utils'

const COLLECTION_DIR = 'src/content/team'

export interface TeamFrontmatter {
  name: string
  role: string
  photo?: string
  credentials: string[]
  order: number
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
  return {
    name: String(data.name ?? ''),
    role: String(data.role ?? ''),
    photo: data.photo ? String(data.photo) : undefined,
    credentials: Array.isArray(data.credentials) ? (data.credentials as string[]) : [],
    order: typeof data.order === 'number' ? data.order : 0,
  }
}

export type TeamSummary = TeamFrontmatter & { slug: string; sha?: string }

export async function listTeam(): Promise<TeamSummary[]> {
  const store = getStore()
  const files = await store.list(COLLECTION_DIR, '.md')
  const items: TeamSummary[] = []
  for (const f of files) {
    const doc = await store.read(f.path)
    if (!doc) continue
    const { data } = parseDoc(doc.content)
    items.push({ slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) })
  }
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
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
  const payload: Record<string, unknown> = {
    name: fm.name,
    role: fm.role,
  }
  if (fm.photo) payload.photo = fm.photo
  if (fm.credentials.length) payload.credentials = fm.credentials
  if (typeof fm.order === 'number') payload.order = fm.order

  const path = pathFromSlug(finalSlug)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await store.write(path, fileContent, {
    message: `content(team): ${input.sha ? 'update' : 'create'} ${finalSlug}`,
    sha: input.sha,
  })
  revalidatePath('/team')
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteTeamMember(slug: string, sha?: string): Promise<void> {
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(team): delete ${slug}`, sha })
  revalidatePath('/team')
}

'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { parseDoc, serializeDoc } from '@/lib/store/markdown'
import { slugify } from '@/lib/utils'

const COLLECTION_DIR = 'src/content/industries'

export interface IndustryFrontmatter {
  title: string
  path: string
  summary: string
  cover?: string
  order?: number
  tagline?: string
  kpis: { value: string; label: string }[]
  services: string[]
  seo?: { title?: string; description?: string }
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
  return {
    title: String(data.title ?? ''),
    path: String(data.path ?? ''),
    summary: String(data.summary ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    order: typeof data.order === 'number' ? data.order : 0,
    tagline: data.tagline ? String(data.tagline) : undefined,
    kpis: Array.isArray(data.kpis) ? (data.kpis as { value: string; label: string }[]) : [],
    services: Array.isArray(data.services) ? (data.services as string[]) : [],
    seo: data.seo as IndustryFrontmatter['seo'],
  }
}

export type IndustrySummary = IndustryFrontmatter & { slug: string; sha?: string }

export async function listIndustries(): Promise<IndustrySummary[]> {
  const store = getStore()
  const files = await store.list(COLLECTION_DIR, '.md')
  const items: IndustrySummary[] = []
  for (const f of files) {
    const doc = await store.read(f.path)
    if (!doc) continue
    const { data } = parseDoc(doc.content)
    items.push({ slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) })
  }
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
}

export async function getIndustry(slug: string): Promise<Industry | null> {
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
}

export async function saveIndustry(input: SaveIndustryInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const fm = input.frontmatter
  const payload: Record<string, unknown> = {
    title: fm.title,
    path: fm.path || `/industries/${finalSlug}/`,
    summary: fm.summary,
  }
  if (fm.cover) payload.cover = fm.cover
  if (typeof fm.order === 'number') payload.order = fm.order
  if (fm.tagline) payload.tagline = fm.tagline
  if (fm.kpis.length) payload.kpis = fm.kpis
  if (fm.services.length) payload.services = fm.services
  if (fm.seo && (fm.seo.title || fm.seo.description)) payload.seo = fm.seo

  const path = pathFromSlug(finalSlug)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await store.write(path, fileContent, {
    message: `content(industries): ${input.sha ? 'update' : 'create'} ${finalSlug}`,
    sha: input.sha,
  })
  revalidatePath('/industries')
  revalidatePath(`/industries/${finalSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteIndustry(slug: string, sha?: string): Promise<void> {
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(industries): delete ${slug}`, sha })
  revalidatePath('/industries')
}

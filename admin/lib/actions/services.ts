'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import { parseDoc, serializeDoc } from '@/lib/store/markdown'
import { slugify } from '@/lib/utils'

const COLLECTION_DIR = 'src/content/services'

export type ServiceGroup = 'Tax' | 'Accounting' | 'Advisory' | 'Compliance'

export interface ServiceFrontmatter {
  title: string
  path: string
  summary: string
  cover?: string
  group?: ServiceGroup
  industries: string[]
  seo?: { title?: string; description?: string }
}

export interface Service extends ServiceFrontmatter {
  slug: string
  body: string
  sha?: string
}

function slugFromPath(p: string): string {
  return p.replace(/^src\/content\/services\//, '').replace(/\.(md|mdx)$/i, '')
}

function pathFromSlug(slug: string): string {
  return `${COLLECTION_DIR}/${slug}.md`
}

function normalize(data: Record<string, unknown>): ServiceFrontmatter {
  return {
    title: String(data.title ?? ''),
    path: String(data.path ?? ''),
    summary: String(data.summary ?? ''),
    cover: data.cover ? String(data.cover) : undefined,
    group: data.group as ServiceGroup | undefined,
    industries: Array.isArray(data.industries) ? (data.industries as string[]) : [],
    seo: data.seo as ServiceFrontmatter['seo'],
  }
}

export type ServiceSummary = ServiceFrontmatter & { slug: string; sha?: string }

export async function listServices(): Promise<ServiceSummary[]> {
  const store = getStore()
  const files = await store.list(COLLECTION_DIR, '.md')
  const items = await Promise.all(
    files.map(async (f): Promise<ServiceSummary | null> => {
      const doc = await store.read(f.path)
      if (!doc) return null
      const { data } = parseDoc(doc.content)
      return { slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) }
    })
  )
  return items
    .filter((s): s is ServiceSummary => s !== null)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function getService(slug: string): Promise<Service | null> {
  const store = getStore()
  const doc = await store.read(pathFromSlug(slug))
  if (!doc) return null
  const { data, body } = parseDoc(doc.content)
  return { slug, body, sha: doc.sha, ...normalize(data) }
}

export interface SaveServiceInput {
  slug: string
  frontmatter: ServiceFrontmatter
  body: string
  sha?: string
}

export async function saveService(input: SaveServiceInput): Promise<{ slug: string; sha: string }> {
  const store = getStore()
  const finalSlug = slugify(input.slug || input.frontmatter.title)
  if (!finalSlug) throw new Error('Slug is required')
  if (!input.frontmatter.title) throw new Error('Title is required')

  const fm = input.frontmatter
  const payload: Record<string, unknown> = {
    title: fm.title,
    path: fm.path || `/services/${finalSlug}/`,
    summary: fm.summary,
  }
  if (fm.cover) payload.cover = fm.cover
  if (fm.group) payload.group = fm.group
  if (fm.industries.length) payload.industries = fm.industries
  if (fm.seo && (fm.seo.title || fm.seo.description)) payload.seo = fm.seo

  const path = pathFromSlug(finalSlug)
  const fileContent = serializeDoc(payload, input.body.trim() + '\n')
  const res = await store.write(path, fileContent, {
    message: `content(services): ${input.sha ? 'update' : 'create'} ${finalSlug}`,
    sha: input.sha,
  })
  revalidatePath('/services')
  revalidatePath(`/services/${finalSlug}`)
  return { slug: finalSlug, sha: res.sha }
}

export async function deleteService(slug: string, sha?: string): Promise<void> {
  const store = getStore()
  await store.remove(pathFromSlug(slug), { message: `content(services): delete ${slug}`, sha })
  revalidatePath('/services')
}

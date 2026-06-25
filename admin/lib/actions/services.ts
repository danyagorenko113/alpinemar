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
  order?: number
  group?: ServiceGroup
  takeaways: string[]
  included: string[]
  process: { title: string; body: string }[]
  industries: string[]
  faq: { q: string; a: string }[]
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
    order: typeof data.order === 'number' ? data.order : 0,
    group: data.group as ServiceGroup | undefined,
    takeaways: Array.isArray(data.takeaways) ? (data.takeaways as string[]) : [],
    included: Array.isArray(data.included) ? (data.included as string[]) : [],
    process: Array.isArray(data.process) ? (data.process as { title: string; body: string }[]) : [],
    industries: Array.isArray(data.industries) ? (data.industries as string[]) : [],
    faq: Array.isArray(data.faq) ? (data.faq as { q: string; a: string }[]) : [],
    seo: data.seo as ServiceFrontmatter['seo'],
  }
}

export type ServiceSummary = ServiceFrontmatter & { slug: string; sha?: string }

export async function listServices(): Promise<ServiceSummary[]> {
  const store = getStore()
  const files = await store.list(COLLECTION_DIR, '.md')
  const items: ServiceSummary[] = []
  for (const f of files) {
    const doc = await store.read(f.path)
    if (!doc) continue
    const { data } = parseDoc(doc.content)
    items.push({ slug: slugFromPath(f.path), sha: doc.sha, ...normalize(data) })
  }
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
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
  if (typeof fm.order === 'number') payload.order = fm.order
  if (fm.group) payload.group = fm.group
  if (fm.takeaways.length) payload.takeaways = fm.takeaways
  if (fm.included.length) payload.included = fm.included
  if (fm.process.length) payload.process = fm.process
  if (fm.industries.length) payload.industries = fm.industries
  if (fm.faq.length) payload.faq = fm.faq
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

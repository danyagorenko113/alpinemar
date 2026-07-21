'use server'

/**
 * HTML Sitemap page → src/data/sitemap.json. Edits the hero copy and the
 * custom link sections (Company / Tools / Reports). The Services / Industries /
 * Insights sections are generated from the collections and not editable here.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/sitemap.json'

export interface SitemapLink {
  title: string
  href: string
  [key: string]: string
}

export interface SitemapSection {
  title: string
  items: SitemapLink[]
}

export interface SitemapPayload {
  heroTitle: string
  heroTagline: string
  customSections: SitemapSection[]
}

function normalize(p: Partial<SitemapPayload>): SitemapPayload {
  return {
    heroTitle: String(p.heroTitle ?? ''),
    heroTagline: String(p.heroTagline ?? ''),
    customSections: Array.isArray(p.customSections)
      ? p.customSections.map((s) => ({
          title: String(s.title ?? ''),
          items: Array.isArray(s.items) ? s.items.map((it) => ({ title: String(it.title ?? ''), href: String(it.href ?? '') })) : [],
        }))
      : [],
  }
}

export async function getSitemap(): Promise<SitemapPayload> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  try {
    return normalize(JSON.parse(doc.content))
  } catch {
    throw new Error(`Could not parse ${FILE_PATH}`)
  }
}

export async function saveSitemap(input: SitemapPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  const payload = normalize(input)
  payload.customSections = payload.customSections
    .filter((s) => s.title.trim())
    .map((s) => ({ title: s.title, items: s.items.filter((it) => it.title.trim() || it.href.trim()) }))
  const content = JSON.stringify(payload, null, 2) + '\n'
  const res = await store.write(FILE_PATH, content, { message: 'content(sitemap): update HTML sitemap page', sha: doc?.sha })
  revalidatePath('/sitemap-page')
  return { sha: res.sha }
}

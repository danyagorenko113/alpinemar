import matter from 'gray-matter'
import type { ContentStore } from './types'

export interface ParsedDoc<T = Record<string, unknown>> {
  data: T
  body: string
}

export function parseDoc<T = Record<string, unknown>>(raw: string): ParsedDoc<T> {
  const parsed = matter(raw)
  return { data: parsed.data as T, body: parsed.content }
}

/**
 * Serialize frontmatter + body back into a Markdown file.
 *
 * Field order is preserved by the order keys appear in `data`. Empty arrays,
 * empty strings, null and undefined are dropped so the on-disk file stays
 * minimal — matches the hand-written posts already in src/content/insights/.
 */
export function serializeDoc(data: Record<string, unknown>, body: string): string {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) continue
    clean[k] = v
  }
  return matter.stringify(body, clean, {
    /* gray-matter's default uses js-yaml — single quotes & no flow style */
  })
}

function isEmptyFrontmatterValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return true
  return false
}

/**
 * Preserve fields the admin UI does not edit while allowing edited fields to
 * be cleared. This keeps rich Astro frontmatter such as `heroTitle`, `faq`,
 * `process`, `kpis`, etc. intact when editors save a page.
 */
export function mergeFrontmatter(
  original: Record<string, unknown>,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...original }
  for (const [key, value] of Object.entries(updates)) {
    if (isEmptyFrontmatterValue(value)) {
      delete next[key]
    } else {
      next[key] = value
    }
  }
  return next
}

export async function readOriginalFrontmatter(
  store: Pick<ContentStore, 'read' | 'list'>,
  path: string,
  opts: { collectionDir?: string; sha?: string } = {},
): Promise<Record<string, unknown>> {
  const current = await store.read(path)
  if (current) return parseDoc(current.content).data

  if (opts.sha && opts.collectionDir) {
    const files = await store.list(opts.collectionDir, '.md')
    for (const file of files) {
      if (file.sha !== opts.sha) continue
      const bySha = await store.read(file.path)
      if (bySha) return parseDoc(bySha.content).data
    }
  }

  return {}
}

/** Convenience: turn a YYYY-MM-DD string into the Date Astro's `z.coerce.date()` accepts. */
export function toDateString(input: string | Date | undefined | null): string {
  if (!input) return ''
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

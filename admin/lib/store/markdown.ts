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

/**
 * Write a content entry with collision + rename safety:
 *  - Create (no sha) or rename (oldPath differs) into an existing path throws
 *    instead of silently overwriting someone else's file.
 *  - Rename writes the new path fresh (no stale sha) and removes the old file.
 */
export async function writeContentEntry(
  store: Pick<ContentStore, 'read' | 'write' | 'remove'>,
  opts: {
    newPath: string
    oldPath?: string
    sha?: string
    content: string
    message: string
  },
): Promise<{ sha: string }> {
  const isRename = !!opts.oldPath && opts.oldPath !== opts.newPath
  const isCreate = !opts.sha && !isRename

  if (isCreate || isRename) {
    const existing = await store.read(opts.newPath)
    if (existing) {
      const name = opts.newPath.split('/').pop()
      throw new Error(`An entry with this slug already exists (${name}). Choose a different slug.`)
    }
  }

  const res = await store.write(opts.newPath, opts.content, {
    message: opts.message,
    sha: isRename ? undefined : opts.sha,
  })

  if (isRename && opts.oldPath) {
    await store.remove(opts.oldPath, { message: opts.message, sha: opts.sha })
  }
  return { sha: res.sha }
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

/**
 * Convenience: turn a YYYY-MM-DD string or Date into a plain calendar date
 * string. Uses UTC accessors: gray-matter parses bare YAML dates
 * (`date: 2025-09-03`) as UTC-midnight Date objects, so local-time accessors
 * would return the previous day on any UTC-negative server (Vercel iad1,
 * US machines) and each save would decrement the date by one.
 */
export function toDateString(input: string | Date | undefined | null): string {
  if (!input) return ''
  // A bare YYYY-MM-DD string is already the calendar date we want — return it
  // as-is to avoid any Date parsing/offset round-trip.
  if (typeof input === 'string') {
    const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`
  }
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Today's calendar date as YYYY-MM-DD (UTC), for save-time stamps. */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

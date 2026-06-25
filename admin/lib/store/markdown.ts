import matter from 'gray-matter'

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

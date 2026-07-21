'use server'

/**
 * 301/302 redirect management → edits the `redirects` array in the main site's
 * vercel.json. Vercel applies these at the platform level on deploy. Other keys
 * in vercel.json ($schema, etc.) are preserved.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'vercel.json'

export interface Redirect {
  source: string
  destination: string
  /** true → 301 permanent, false → 302 temporary. */
  permanent: boolean
}

function normalize(list: unknown): Redirect[] {
  if (!Array.isArray(list)) return []
  return list
    .map((r): Redirect | null => {
      if (!r || typeof r !== 'object') return null
      const o = r as Record<string, unknown>
      const source = String(o.source ?? '').trim()
      const destination = String(o.destination ?? '').trim()
      if (!source || !destination) return null
      return { source, destination, permanent: o.permanent !== false }
    })
    .filter((r): r is Redirect => r !== null)
}

export async function getRedirects(): Promise<Redirect[]> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) return []
  try {
    const parsed = JSON.parse(doc.content) as { redirects?: unknown }
    return normalize(parsed.redirects)
  } catch {
    throw new Error(`Could not parse ${FILE_PATH}`)
  }
}

export async function saveRedirects(list: Redirect[]): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  const base = doc ? (JSON.parse(doc.content) as Record<string, unknown>) : { $schema: 'https://openapi.vercel.sh/vercel.json' }

  const clean = normalize(list)
  // Guard against duplicate sources — the last one would silently win on Vercel.
  const seen = new Set<string>()
  for (const r of clean) {
    if (seen.has(r.source)) throw new Error(`Duplicate redirect source: ${r.source}`)
    seen.add(r.source)
    if (!r.source.startsWith('/')) throw new Error(`Source must start with "/": ${r.source}`)
  }

  base.redirects = clean.map((r) => ({ source: r.source, destination: r.destination, permanent: r.permanent }))
  const content = JSON.stringify(base, null, 2) + '\n'

  const res = await store.write(FILE_PATH, content, {
    message: 'content(redirects): update vercel.json redirects',
    sha: doc?.sha,
  })
  revalidatePath('/redirects')
  return { sha: res.sha }
}

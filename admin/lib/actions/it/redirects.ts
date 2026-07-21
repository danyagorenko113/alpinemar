'use server'

/** IT-site redirects → it-site/vercel.json (Vercel project alpinemar-77xf). */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import type { Redirect } from '@/lib/actions/redirects'

const FILE_PATH = 'it-site/vercel.json'

function assertITPath(p: string): string {
  if (!p.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return p
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
      return { source, destination, permanent: o.permanent === true }
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
  let base: Record<string, unknown>
  if (doc) {
    try {
      base = JSON.parse(doc.content) as Record<string, unknown>
    } catch {
      throw new Error('Could not parse it-site/vercel.json — fix the JSON before saving.')
    }
  } else {
    base = { $schema: 'https://openapi.vercel.sh/vercel.json' }
  }

  const clean = normalize(list)
  const seen = new Set<string>()
  for (const r of clean) {
    if (seen.has(r.source)) throw new Error(`Duplicate redirect source: ${r.source}`)
    seen.add(r.source)
    if (!r.source.startsWith('/')) throw new Error(`Source must start with "/": ${r.source}`)
  }

  base.redirects = clean.map((r) => ({ source: r.source, destination: r.destination, permanent: r.permanent }))
  const content = JSON.stringify(base, null, 2) + '\n'

  const res = await store.write(assertITPath(FILE_PATH), content, {
    message: 'content(it-redirects): update it-site/vercel.json redirects',
    sha: doc?.sha,
  })
  revalidatePath('/it/redirects')
  return { sha: res.sha }
}

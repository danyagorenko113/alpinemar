'use server'

/**
 * CMS-managed JSON-LD schema overrides → src/data/schema-overrides.json.
 * `global` renders on every page; `byPath` maps a URL path to raw JSON-LD.
 * Both are injected at the end of <body> by BaseLayout.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/schema-overrides.json'

export interface SchemaOverrides {
  global: string
  byPath: Record<string, string>
}

function validateJsonLd(label: string, value: string) {
  const v = value.trim()
  if (!v) return
  try {
    JSON.parse(v)
  } catch {
    throw new Error(`Invalid JSON in ${label} — check for a missing comma or quote.`)
  }
}

export async function getSchemaOverrides(): Promise<SchemaOverrides> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) return { global: '', byPath: {} }
  try {
    const p = JSON.parse(doc.content) as Partial<SchemaOverrides>
    return { global: String(p.global ?? ''), byPath: (p.byPath as Record<string, string>) ?? {} }
  } catch {
    throw new Error(`Could not parse ${FILE_PATH}`)
  }
}

export async function saveSchemaOverrides(input: SchemaOverrides): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)

  validateJsonLd('the site-wide (global) schema', input.global)
  const byPath: Record<string, string> = {}
  for (const [rawPath, val] of Object.entries(input.byPath ?? {})) {
    const path = rawPath.trim()
    if (!path || !val.trim()) continue
    if (!path.startsWith('/')) throw new Error(`Path must start with "/": ${path}`)
    validateJsonLd(`the schema for ${path}`, val)
    byPath[path] = val.trim()
  }

  const payload: SchemaOverrides = { global: input.global.trim(), byPath }
  const content = JSON.stringify(payload, null, 2) + '\n'
  const res = await store.write(FILE_PATH, content, {
    message: 'content(schema): update JSON-LD overrides',
    sha: doc?.sha,
  })
  revalidatePath('/schema')
  return { sha: res.sha }
}

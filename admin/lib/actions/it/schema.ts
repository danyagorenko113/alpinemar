'use server'

/** IT-site JSON-LD schema overrides → it-site/src/data/schema-overrides.json. */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import type { SchemaOverrides } from '@/lib/actions/schema'

const FILE_PATH = 'it-site/src/data/schema-overrides.json'

function assertITPath(p: string): string {
  const normalized = p.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
    throw new Error(`Path traversal detected: ${p}`)
  }
  if (!normalized.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return normalized
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
  const res = await store.write(assertITPath(FILE_PATH), content, {
    message: 'content(it-schema): update JSON-LD overrides',
    sha: doc?.sha,
  })
  revalidatePath('/it/schema')
  return { sha: res.sha }
}

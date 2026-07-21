'use server'

/**
 * IT-site Services mega-menu editor → the `serviceMenu` export in
 * it-site/src/data/site.ts. Each entry is a primary line (a service slug) with
 * a list of child service slugs. Other exports in site.ts are preserved.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'it-site/src/data/site.ts'
const MENU_RE = /export const serviceMenu = ([\s\S]*?) as const;/

export interface ServiceLine {
  line: string
  children: string[]
}

function assertITPath(p: string): string {
  const normalized = p.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
    throw new Error(`Path traversal detected: ${p}`)
  }
  if (!normalized.startsWith('it-site/')) throw new Error(`Refusing to write outside it-site/: ${p}`)
  return normalized
}

function stripCommentsOutsideStrings(input: string): string {
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  while (i < input.length) {
    const c = input[i]
    const n = input[i + 1]
    if (!inSingle && !inDouble) {
      if (c === '/' && n === '/') { while (i < input.length && input[i] !== '\n') i++; continue }
      if (c === '/' && n === '*') { i += 2; while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++; i += 2; continue }
      if (c === "'") inSingle = true
      else if (c === '"') inDouble = true
    } else if (inSingle) {
      if (c === '\\' && i + 1 < input.length) { out += c + input[i + 1]; i += 2; continue }
      if (c === "'") inSingle = false
    } else if (inDouble) {
      if (c === '\\' && i + 1 < input.length) { out += c + input[i + 1]; i += 2; continue }
      if (c === '"') inDouble = false
    }
    out += c
    i++
  }
  return out
}

function tsLiteralToJson(literal: string): string {
  let s = literal.trim()
  s = stripCommentsOutsideStrings(s)
  s = s.replace(/'((?:\\.|[^'\\])*)'/g, (_m, inner: string) => `"${inner.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`)
  s = s.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3')
  s = s.replace(/,(\s*[}\]])/g, '$1')
  return s
}

function normalize(list: unknown): ServiceLine[] {
  if (!Array.isArray(list)) return []
  return list.map((g) => {
    const o = (g ?? {}) as Record<string, unknown>
    const children = Array.isArray(o.children) ? o.children.map((c) => String(c)) : []
    return { line: String(o.line ?? ''), children }
  })
}

export async function getServiceMenu(): Promise<ServiceLine[]> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  const m = MENU_RE.exec(doc.content)
  if (!m) throw new Error('Could not locate `export const serviceMenu` in it-site/src/data/site.ts')
  return normalize(JSON.parse(tsLiteralToJson(m[1])))
}

export async function saveServiceMenu(input: ServiceLine[]): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)

  const clean = normalize(input)
    .filter((g) => g.line.trim())
    .map((g) => ({ line: g.line.trim(), children: g.children.map((c) => c.trim()).filter(Boolean) }))

  if (!MENU_RE.test(doc.content)) throw new Error('serviceMenu block not found')
  const next = doc.content.replace(MENU_RE, `export const serviceMenu = ${JSON.stringify(clean, null, 2)} as const;`)

  const res = await store.write(assertITPath(FILE_PATH), next, {
    message: 'content(it-navigation): update services mega-menu',
    sha: doc.sha,
  })
  revalidatePath('/it/navigation')
  return { sha: res.sha }
}

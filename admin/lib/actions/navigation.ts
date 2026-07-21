'use server'

/**
 * Navigation / mega-menu editor → src/data/navigation.ts. Edits the two big
 * dropdowns: `serviceMenu` (categories, each with a landing href + items) and
 * `industryMenu` (flat list). serviceMenu categories are also the canonical
 * service groups (serviceGroupParent derives from them). Other exports in the
 * file (companyMenu, serviceGroupParent, etc.) are preserved.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/navigation.ts'

export interface NavLink {
  name: string
  href: string
  desc: string
  [key: string]: string
}

export interface ServiceCategory {
  label: string
  href: string
  icon: string
  blurb: string
  items: NavLink[]
}

export interface IndustryLink {
  name: string
  href: string
  icon: string
  desc: string
  [key: string]: string
}

export interface NavigationPayload {
  serviceMenu: ServiceCategory[]
  industryMenu: IndustryLink[]
}

const SERVICE_RE = /export const serviceMenu = ([\s\S]*?) as const;/
const INDUSTRY_RE = /export const industryMenu = ([\s\S]*?) as const;/

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

function parseArray<T>(content: string, re: RegExp, name: string): T[] {
  const m = re.exec(content)
  if (!m) throw new Error(`Could not locate \`export const ${name}\` in navigation.ts`)
  const parsed = JSON.parse(tsLiteralToJson(m[1]))
  if (!Array.isArray(parsed)) throw new Error(`${name} must be an array`)
  return parsed as T[]
}

function normalizeService(list: unknown[]): ServiceCategory[] {
  return list.map((c) => {
    const o = (c ?? {}) as Record<string, unknown>
    const items = Array.isArray(o.items) ? o.items : []
    return {
      label: String(o.label ?? ''),
      href: String(o.href ?? ''),
      icon: String(o.icon ?? ''),
      blurb: String(o.blurb ?? ''),
      items: items.map((it) => {
        const io = (it ?? {}) as Record<string, unknown>
        return { name: String(io.name ?? ''), href: String(io.href ?? ''), desc: String(io.desc ?? '') }
      }),
    }
  })
}

function normalizeIndustry(list: unknown[]): IndustryLink[] {
  return list.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>
    return { name: String(o.name ?? ''), href: String(o.href ?? ''), icon: String(o.icon ?? ''), desc: String(o.desc ?? '') }
  })
}

export async function getNavigation(): Promise<NavigationPayload> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  return {
    serviceMenu: normalizeService(parseArray(doc.content, SERVICE_RE, 'serviceMenu')),
    industryMenu: normalizeIndustry(parseArray(doc.content, INDUSTRY_RE, 'industryMenu')),
  }
}

export async function saveNavigation(input: NavigationPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)

  const service = normalizeService(input.serviceMenu).filter((c) => c.label.trim())
  const industry = normalizeIndustry(input.industryMenu).filter((i) => i.name.trim())

  let next = doc.content
  if (!SERVICE_RE.test(next)) throw new Error('serviceMenu block not found')
  next = next.replace(SERVICE_RE, `export const serviceMenu = ${JSON.stringify(service, null, 2)} as const;`)
  if (!INDUSTRY_RE.test(next)) throw new Error('industryMenu block not found')
  next = next.replace(INDUSTRY_RE, `export const industryMenu = ${JSON.stringify(industry, null, 2)} as const;`)

  const res = await store.write(FILE_PATH, next, {
    message: 'content(navigation): update mega-menu',
    sha: doc.sha,
  })
  revalidatePath('/navigation')
  return { sha: res.sha }
}

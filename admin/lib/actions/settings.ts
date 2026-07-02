'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const SITE_FILE_PATH = 'src/data/site.ts'

export interface SiteAddress {
  street: string
  city: string
  state: string
  zip: string
}

export interface SiteSocials {
  facebook: string
  instagram: string
  linkedin: string
  twitter: string
}

export interface SiteConfig {
  name: string
  legalName: string
  tagline: string
  description: string
  url: string
  email: string
  phone: string
  phoneHref: string
  address: SiteAddress
  socials: SiteSocials
  memberships: string[]
  clientPortal: string
  itPortal: string
}

export type NavItem = {
  label: string
  href: string
  [key: string]: string
}

export interface SettingsPayload {
  site: SiteConfig
  primaryNav: NavItem[]
}

const SITE_EXPORT_RE = /export const site = ([\s\S]*?) as const;/
const NAV_EXPORT_RE = /export const primaryNav = ([\s\S]*?) as const;/

/**
 * Normalizes a TypeScript object/array literal into strict JSON so JSON.parse
 * can consume it.
 *
 * Handles the current site.ts shape:
 *  - Single-quoted strings → double-quoted strings (escapes any embedded ")
 *  - Unquoted object keys → quoted keys
 *  - Trailing commas before `}` or `]`
 *  - Line and block comments (only when outside strings)
 *
 * This is intentionally targeted at the shape of `src/data/site.ts`. If the
 * file grows exotic syntax (template literals, computed keys, spreads), this
 * will need to be revisited.
 */
function stripCommentsOutsideStrings(input: string): string {
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  while (i < input.length) {
    const c = input[i]
    const n = input[i + 1]
    if (!inSingle && !inDouble) {
      if (c === '/' && n === '/') {
        while (i < input.length && input[i] !== '\n') i++
        continue
      }
      if (c === '/' && n === '*') {
        i += 2
        while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++
        i += 2
        continue
      }
      if (c === "'") inSingle = true
      else if (c === '"') inDouble = true
    } else if (inSingle) {
      if (c === '\\' && i + 1 < input.length) {
        out += c + input[i + 1]
        i += 2
        continue
      }
      if (c === "'") inSingle = false
    } else if (inDouble) {
      if (c === '\\' && i + 1 < input.length) {
        out += c + input[i + 1]
        i += 2
        continue
      }
      if (c === '"') inDouble = false
    }
    out += c
    i++
  }
  return out
}

function tsLiteralToJson(literal: string): string {
  let s = literal.trim()

  // Strip comments first, but skip anything inside string literals so we
  // don't chew through URL protocols like `https://`.
  s = stripCommentsOutsideStrings(s)

  // Convert single-quoted strings to double-quoted, escaping embedded double
  // quotes and unescaping the previously escaped single quotes.
  s = s.replace(/'((?:\\.|[^'\\])*)'/g, (_m, inner: string) => {
    const escaped = inner.replace(/\\'/g, "'").replace(/"/g, '\\"')
    return `"${escaped}"`
  })

  // Quote unquoted object keys: `  name:` → `  "name":`.
  s = s.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3')

  // Strip trailing commas before `}` or `]`.
  s = s.replace(/,(\s*[}\]])/g, '$1')

  return s
}

function parseSite(fileContent: string): SiteConfig {
  const match = SITE_EXPORT_RE.exec(fileContent)
  if (!match) throw new Error('Could not locate `export const site` in site.ts')
  const json = tsLiteralToJson(match[1])
  const parsed = JSON.parse(json) as SiteConfig
  return normalizeSite(parsed)
}

function parseNav(fileContent: string): NavItem[] {
  const match = NAV_EXPORT_RE.exec(fileContent)
  if (!match) throw new Error('Could not locate `export const primaryNav` in site.ts')
  const json = tsLiteralToJson(match[1])
  const parsed = JSON.parse(json) as NavItem[]
  if (!Array.isArray(parsed)) throw new Error('primaryNav must be an array')
  return parsed.map((item) => ({
    label: String(item.label ?? ''),
    href: String(item.href ?? ''),
  }))
}

function normalizeSite(input: Partial<SiteConfig>): SiteConfig {
  const address = input.address ?? ({} as Partial<SiteAddress>)
  const socials = input.socials ?? ({} as Partial<SiteSocials>)
  return {
    name: String(input.name ?? ''),
    legalName: String(input.legalName ?? ''),
    tagline: String(input.tagline ?? ''),
    description: String(input.description ?? ''),
    url: String(input.url ?? ''),
    email: String(input.email ?? ''),
    phone: String(input.phone ?? ''),
    phoneHref: String(input.phoneHref ?? ''),
    address: {
      street: String(address.street ?? ''),
      city: String(address.city ?? ''),
      state: String(address.state ?? ''),
      zip: String(address.zip ?? ''),
    },
    socials: {
      facebook: String(socials.facebook ?? ''),
      instagram: String(socials.instagram ?? ''),
      linkedin: String(socials.linkedin ?? ''),
      twitter: String(socials.twitter ?? ''),
    },
    memberships: Array.isArray(input.memberships) ? input.memberships.map(String) : [],
    clientPortal: String(input.clientPortal ?? ''),
    itPortal: String(input.itPortal ?? ''),
  }
}

export async function getSettings(): Promise<SettingsPayload> {
  const store = getStore()
  const doc = await store.read(SITE_FILE_PATH)
  if (!doc) throw new Error(`Missing ${SITE_FILE_PATH}`)
  return {
    site: parseSite(doc.content),
    primaryNav: parseNav(doc.content),
  }
}

export async function saveSettings(input: SettingsPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(SITE_FILE_PATH)
  if (!doc) throw new Error(`Missing ${SITE_FILE_PATH}`)

  const site = normalizeSite(input.site)
  const nav = input.primaryNav.map((n) => ({
    label: String(n.label ?? ''),
    href: String(n.href ?? ''),
  }))

  const siteLiteral = JSON.stringify(site, null, 2)
  const navLiteral = JSON.stringify(nav, null, 2)

  let next = doc.content
  if (!SITE_EXPORT_RE.test(next)) throw new Error('site export block not found')
  next = next.replace(SITE_EXPORT_RE, `export const site = ${siteLiteral} as const;`)

  if (!NAV_EXPORT_RE.test(next)) throw new Error('primaryNav export block not found')
  next = next.replace(NAV_EXPORT_RE, `export const primaryNav = ${navLiteral} as const;`)

  const res = await store.write(SITE_FILE_PATH, next, {
    message: 'content(settings): update site config',
    sha: doc.sha,
  })
  revalidatePath('/settings')
  return { sha: res.sha }
}

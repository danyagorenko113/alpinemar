'use server'

/**
 * IT-site settings — edits the `site` and `primaryNav` exports in
 * it-site/src/data/site.ts. The structural exports (serviceLines,
 * moreServices, serviceMenu) are intentionally left untouched: they are
 * slug-level wiring for the mega-menu and are not safe to edit from a CMS.
 *
 * The IT site.ts differs from the main one: `socials` is an array of
 * { label, href } (rendered by index in Footer.astro), and it carries
 * parentSiteUrl / mapsUrl / primaryCta instead of itPortal.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const SITE_FILE_PATH = 'it-site/src/data/site.ts'

export interface SiteAddress {
  street: string
  city: string
  state: string
  zip: string
}

export interface SocialLink {
  label: string
  href: string
  [key: string]: string
}

export interface ITSiteConfig {
  name: string
  legalName: string
  tagline: string
  description: string
  url: string
  email: string
  phone: string
  phoneHref: string
  address: SiteAddress
  parentSiteUrl: string
  clientPortal: string
  mapsUrl: string
  primaryCta: string
  socials: SocialLink[]
}

export type NavItem = { label: string; href: string; [key: string]: string }

export interface ITSettingsPayload {
  site: ITSiteConfig
  primaryNav: NavItem[]
}

const SITE_EXPORT_RE = /export const site = ([\s\S]*?) as const;/
const NAV_EXPORT_RE = /export const primaryNav = ([\s\S]*?) as const;/

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
  s = stripCommentsOutsideStrings(s)
  s = s.replace(/'((?:\\.|[^'\\])*)'/g, (_m, inner: string) => {
    const escaped = inner.replace(/\\'/g, "'").replace(/"/g, '\\"')
    return `"${escaped}"`
  })
  s = s.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3')
  s = s.replace(/,(\s*[}\]])/g, '$1')
  return s
}

function normalizeSite(input: Partial<ITSiteConfig>): ITSiteConfig {
  const address = input.address ?? ({} as Partial<SiteAddress>)
  const socials = Array.isArray(input.socials) ? input.socials : []
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
    parentSiteUrl: String(input.parentSiteUrl ?? ''),
    clientPortal: String(input.clientPortal ?? ''),
    mapsUrl: String(input.mapsUrl ?? ''),
    primaryCta: String(input.primaryCta ?? ''),
    socials: socials.map((s) => ({ label: String(s.label ?? ''), href: String(s.href ?? '') })),
  }
}

function parseSite(fileContent: string): ITSiteConfig {
  const match = SITE_EXPORT_RE.exec(fileContent)
  if (!match) throw new Error('Could not locate `export const site` in it-site/src/data/site.ts')
  const parsed = JSON.parse(tsLiteralToJson(match[1])) as Partial<ITSiteConfig>
  return normalizeSite(parsed)
}

function parseNav(fileContent: string): NavItem[] {
  const match = NAV_EXPORT_RE.exec(fileContent)
  if (!match) throw new Error('Could not locate `export const primaryNav` in it-site/src/data/site.ts')
  const parsed = JSON.parse(tsLiteralToJson(match[1])) as NavItem[]
  if (!Array.isArray(parsed)) throw new Error('primaryNav must be an array')
  return parsed.map((item) => ({ label: String(item.label ?? ''), href: String(item.href ?? '') }))
}

export async function getSettings(): Promise<ITSettingsPayload> {
  const store = getStore()
  const doc = await store.read(SITE_FILE_PATH)
  if (!doc) throw new Error(`Missing ${SITE_FILE_PATH}`)
  return { site: parseSite(doc.content), primaryNav: parseNav(doc.content) }
}

export async function saveSettings(input: ITSettingsPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(SITE_FILE_PATH)
  if (!doc) throw new Error(`Missing ${SITE_FILE_PATH}`)

  const site = normalizeSite(input.site)
  const nav = input.primaryNav.map((n) => ({ label: String(n.label ?? ''), href: String(n.href ?? '') }))

  const siteLiteral = JSON.stringify(site, null, 2)
  const navLiteral = JSON.stringify(nav, null, 2)

  let next = doc.content
  if (!SITE_EXPORT_RE.test(next)) throw new Error('site export block not found')
  next = next.replace(SITE_EXPORT_RE, `export const site = ${siteLiteral} as const;`)
  if (!NAV_EXPORT_RE.test(next)) throw new Error('primaryNav export block not found')
  next = next.replace(NAV_EXPORT_RE, `export const primaryNav = ${navLiteral} as const;`)

  const res = await store.write(SITE_FILE_PATH, next, {
    message: 'content(it-settings): update site config',
    sha: doc.sha,
  })
  revalidatePath('/it/settings')
  return { sha: res.sha }
}

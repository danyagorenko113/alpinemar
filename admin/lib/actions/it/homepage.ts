'use server'

/**
 * IT-site "pages" editor — edits the named exports in it-site/src/data/pages.ts:
 * homeServices, values, serviceLineCards, businessHours, and the HubSpot config.
 * Each export's value is replaced in place so the file's doc comments survive.
 */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'it-site/src/data/pages.ts'

export interface HomeServiceCard {
  title: string
  href: string
  blurb: string
  [key: string]: string
}

export interface ValueCard {
  title: string
  body: string
  [key: string]: string
}

export interface ServiceLineCard {
  slug: string
  title: string
  blurb: string
  [key: string]: string
}

export interface HubspotConfig {
  region: string
  portalId: string
  formId: string
}

export interface ITPagesPayload {
  homeServices: HomeServiceCard[]
  values: ValueCard[]
  serviceLineCards: ServiceLineCard[]
  businessHours: string
  hubspot: HubspotConfig
}

const HOME_RE = /export const homeServices = (\[[\s\S]*?\]);/
const VALUES_RE = /export const values = (\[[\s\S]*?\]);/
const CARDS_RE = /export const serviceLineCards = (\[[\s\S]*?\]);/
const HOURS_RE = /export const businessHours = ('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*");/
const HUBSPOT_RE = /export const hubspot = (\{[\s\S]*?\});/

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
  s = s.replace(/'((?:\\.|[^'\\])*)'/g, (_m, inner: string) => {
    const escaped = inner.replace(/\\'/g, "'").replace(/"/g, '\\"')
    return `"${escaped}"`
  })
  s = s.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3')
  s = s.replace(/,(\s*[}\]])/g, '$1')
  return s
}

function parseArray<T>(content: string, re: RegExp, name: string): T[] {
  const m = re.exec(content)
  if (!m) throw new Error(`Could not locate \`export const ${name}\` in pages.ts`)
  const parsed = JSON.parse(tsLiteralToJson(m[1]))
  if (!Array.isArray(parsed)) throw new Error(`${name} must be an array`)
  return parsed as T[]
}

function parseString(content: string, re: RegExp, name: string): string {
  const m = re.exec(content)
  if (!m) throw new Error(`Could not locate \`export const ${name}\` in pages.ts`)
  return JSON.parse(tsLiteralToJson(m[1])) as string
}

function parseObject<T>(content: string, re: RegExp, name: string): T {
  const m = re.exec(content)
  if (!m) throw new Error(`Could not locate \`export const ${name}\` in pages.ts`)
  return JSON.parse(tsLiteralToJson(m[1])) as T
}

export async function getPages(): Promise<ITPagesPayload> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  const c = doc.content
  return {
    homeServices: parseArray<HomeServiceCard>(c, HOME_RE, 'homeServices').map((x) => ({
      title: String(x.title ?? ''), href: String(x.href ?? ''), blurb: String(x.blurb ?? ''),
    })),
    values: parseArray<ValueCard>(c, VALUES_RE, 'values').map((x) => ({
      title: String(x.title ?? ''), body: String(x.body ?? ''),
    })),
    serviceLineCards: parseArray<ServiceLineCard>(c, CARDS_RE, 'serviceLineCards').map((x) => ({
      slug: String(x.slug ?? ''), title: String(x.title ?? ''), blurb: String(x.blurb ?? ''),
    })),
    businessHours: parseString(c, HOURS_RE, 'businessHours'),
    hubspot: (() => {
      const h = parseObject<HubspotConfig>(c, HUBSPOT_RE, 'hubspot')
      return { region: String(h.region ?? ''), portalId: String(h.portalId ?? ''), formId: String(h.formId ?? '') }
    })(),
  }
}

export async function savePages(input: ITPagesPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)

  const home = input.homeServices.map((x) => ({ title: x.title, href: x.href, blurb: x.blurb }))
  const values = input.values.map((x) => ({ title: x.title, body: x.body }))
  const cards = input.serviceLineCards.map((x) => ({ slug: x.slug, title: x.title, blurb: x.blurb }))
  const hubspot = { region: input.hubspot.region, portalId: input.hubspot.portalId, formId: input.hubspot.formId }

  let next = doc.content
  const replace = (re: RegExp, name: string, replacement: string) => {
    if (!re.test(next)) throw new Error(`${name} block not found in pages.ts`)
    next = next.replace(re, replacement)
  }

  replace(HOME_RE, 'homeServices', `export const homeServices = ${JSON.stringify(home, null, 2)};`)
  replace(VALUES_RE, 'values', `export const values = ${JSON.stringify(values, null, 2)};`)
  replace(CARDS_RE, 'serviceLineCards', `export const serviceLineCards = ${JSON.stringify(cards, null, 2)};`)
  replace(HOURS_RE, 'businessHours', `export const businessHours = ${JSON.stringify(input.businessHours)};`)
  replace(HUBSPOT_RE, 'hubspot', `export const hubspot = ${JSON.stringify(hubspot, null, 2)};`)

  const res = await store.write(FILE_PATH, next, {
    message: 'content(it-pages): update page copy',
    sha: doc.sha,
  })
  revalidatePath('/it/homepage')
  return { sha: res.sha }
}

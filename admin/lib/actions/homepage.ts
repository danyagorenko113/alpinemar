'use server'

import JSON5 from 'json5'
import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const TAXONOMY_PATH = 'src/data/taxonomy.ts'

export interface FeaturedService {
  title: string
  href: string
  icon: string
  image: string
  summary: string
}

export interface FeaturedIndustry {
  title: string
  href: string
  image: string
  body: string
}

export interface PartnerLogo {
  name: string
  src: string
}

export interface LatestPost {
  title: string
  href: string
  cover: string
  excerpt: string
}

export interface ValueProp {
  title: string
  icon: string
  body: string
}

export interface Homepage {
  featuredServices: FeaturedService[]
  featuredIndustries: FeaturedIndustry[]
  partnerLogos: PartnerLogo[]
  latestPosts: LatestPost[]
  valueProps: ValueProp[]
  integrations: string[]
}

/**
 * Managed exports in src/data/taxonomy.ts. Each is parsed & re-serialized
 * independently via a targeted regex so we never touch surrounding code
 * (comments, imports, or unmanaged exports like `industries`, `allServices`,
 * `team`).
 */
const MANAGED_KEYS = [
  'featuredServices',
  'featuredIndustries',
  'partnerLogos',
  'latestPosts',
  'valueProps',
  'integrations',
] as const satisfies readonly (keyof Homepage)[]

type ManagedKey = (typeof MANAGED_KEYS)[number]

function blockRegex(key: ManagedKey): RegExp {
  // Matches: `export const <key> = <literal> as const;`
  // The literal spans everything up to the terminating `] as const;` (or
  // `} as const;` — future-proof, though all current exports are arrays).
  return new RegExp(
    String.raw`(export const ${key} = )([\s\S]*?)( as const;)`,
    'm',
  )
}

function extractLiteral(source: string, key: ManagedKey): string {
  const m = source.match(blockRegex(key))
  if (!m) throw new Error(`Could not find export "${key}" in ${TAXONOMY_PATH}`)
  return m[2]
}

function parseBlock<T>(source: string, key: ManagedKey): T {
  const literal = extractLiteral(source, key)
  try {
    return JSON5.parse<T>(literal)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to parse export "${key}": ${msg}`)
  }
}

export async function getHomepage(): Promise<Homepage> {
  const store = getStore()
  const doc = await store.read(TAXONOMY_PATH)
  if (!doc) throw new Error(`Missing ${TAXONOMY_PATH}`)
  const src = doc.content
  return {
    featuredServices: parseBlock<FeaturedService[]>(src, 'featuredServices'),
    featuredIndustries: parseBlock<FeaturedIndustry[]>(src, 'featuredIndustries'),
    partnerLogos: parseBlock<PartnerLogo[]>(src, 'partnerLogos'),
    latestPosts: parseBlock<LatestPost[]>(src, 'latestPosts'),
    valueProps: parseBlock<ValueProp[]>(src, 'valueProps'),
    integrations: parseBlock<string[]>(src, 'integrations'),
  }
}

function sanitizeString(s: unknown): string {
  return typeof s === 'string' ? s : ''
}

function sanitize<T>(
  items: unknown,
  shape: readonly (keyof T & string)[],
): T[] {
  if (!Array.isArray(items)) return []
  return items.map((raw) => {
    const src = (raw ?? {}) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const k of shape) out[k] = sanitizeString(src[k])
    return out as unknown as T
  })
}

function sanitizeInput(input: Homepage): Homepage {
  return {
    featuredServices: sanitize<FeaturedService>(input.featuredServices, [
      'title',
      'href',
      'icon',
      'image',
      'summary',
    ]),
    featuredIndustries: sanitize<FeaturedIndustry>(input.featuredIndustries, [
      'title',
      'href',
      'image',
      'body',
    ]),
    partnerLogos: sanitize<PartnerLogo>(input.partnerLogos, ['name', 'src']),
    latestPosts: sanitize<LatestPost>(input.latestPosts, [
      'title',
      'href',
      'cover',
      'excerpt',
    ]),
    valueProps: sanitize<ValueProp>(input.valueProps, ['title', 'icon', 'body']),
    integrations: Array.isArray(input.integrations)
      ? input.integrations.map(sanitizeString).filter((s) => s.length > 0)
      : [],
  }
}

/**
 * Serialize a value as a TS array literal. Uses JSON.stringify (which is valid
 * TypeScript) with 2-space indentation. Quoted keys and double-quoted strings
 * differ stylistically from the hand-written source, but produce equivalent
 * runtime output and the file is auto-formatted anyway.
 */
function serializeLiteral(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export async function saveHomepage(input: Homepage): Promise<void> {
  const store = getStore()
  const doc = await store.read(TAXONOMY_PATH)
  if (!doc) throw new Error(`Missing ${TAXONOMY_PATH}`)

  const clean = sanitizeInput(input)

  let src = doc.content
  for (const key of MANAGED_KEYS) {
    const literal = serializeLiteral(clean[key])
    const rx = blockRegex(key)
    if (!rx.test(src)) throw new Error(`Could not locate export "${key}" for rewrite`)
    src = src.replace(rx, `$1${literal}$3`)
  }

  await store.write(TAXONOMY_PATH, src, {
    message: 'content(homepage): update taxonomy featured lists',
    sha: doc.sha,
  })

  // Astro homepage + admin editor page
  revalidatePath('/homepage')
  revalidatePath('/')
}

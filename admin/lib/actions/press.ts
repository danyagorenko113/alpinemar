'use server'

/** "In the Media" page → src/data/press.json (copy + press-mention list). */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/press.json'

export interface PressMention {
  outlet: string
  date: string
  headline: string
  href: string
  [key: string]: string
}

export interface PressPayload {
  title: string
  tagline: string
  ctaHeading: string
  ctaButtonLabel: string
  ctaHref: string
  mentions: PressMention[]
}

const EMPTY: PressPayload = { title: '', tagline: '', ctaHeading: '', ctaButtonLabel: '', ctaHref: '/contact/', mentions: [] }

function normalize(p: Partial<PressPayload>): PressPayload {
  return {
    title: String(p.title ?? ''),
    tagline: String(p.tagline ?? ''),
    ctaHeading: String(p.ctaHeading ?? ''),
    ctaButtonLabel: String(p.ctaButtonLabel ?? ''),
    ctaHref: String(p.ctaHref ?? '/contact/'),
    mentions: Array.isArray(p.mentions)
      ? p.mentions.map((m) => ({
          outlet: String(m.outlet ?? ''),
          date: String(m.date ?? ''),
          headline: String(m.headline ?? ''),
          href: String(m.href ?? ''),
        }))
      : [],
  }
}

export async function getPress(): Promise<PressPayload> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) return EMPTY
  try {
    return normalize(JSON.parse(doc.content))
  } catch {
    throw new Error(`Could not parse ${FILE_PATH}`)
  }
}

export async function savePress(input: PressPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  const payload = normalize(input)
  payload.mentions = payload.mentions.filter((m) => m.outlet.trim() || m.headline.trim())
  const content = JSON.stringify(payload, null, 2) + '\n'
  const res = await store.write(FILE_PATH, content, { message: 'content(press): update In the Media page', sha: doc?.sha })
  revalidatePath('/press')
  return { sha: res.sha }
}

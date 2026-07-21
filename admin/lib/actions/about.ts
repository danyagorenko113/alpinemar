'use server'

/** About Us page → src/data/about.json (page copy; team stays in the Team CMS). */

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/about.json'

export interface DriveValue {
  title: string
  icon: string
  [key: string]: string
}

export interface AboutPayload {
  heroTitle: string
  journeyHeading: string
  journeyBody: string[]
  drivesHeading: string
  drivesIntro: string
  drives: DriveValue[]
  journeyPhotos: string[]
  ctaHeading: string
  ctaButtonLabel: string
  ctaHref: string
}

function normalize(p: Partial<AboutPayload>): AboutPayload {
  return {
    heroTitle: String(p.heroTitle ?? ''),
    journeyHeading: String(p.journeyHeading ?? ''),
    journeyBody: Array.isArray(p.journeyBody) ? p.journeyBody.map(String) : [],
    drivesHeading: String(p.drivesHeading ?? ''),
    drivesIntro: String(p.drivesIntro ?? ''),
    drives: Array.isArray(p.drives) ? p.drives.map((d) => ({ title: String(d.title ?? ''), icon: String(d.icon ?? '') })) : [],
    journeyPhotos: Array.isArray(p.journeyPhotos) ? p.journeyPhotos.map(String) : [],
    ctaHeading: String(p.ctaHeading ?? ''),
    ctaButtonLabel: String(p.ctaButtonLabel ?? ''),
    ctaHref: String(p.ctaHref ?? '/contact/'),
  }
}

export async function getAbout(): Promise<AboutPayload> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  try {
    return normalize(JSON.parse(doc.content))
  } catch {
    throw new Error(`Could not parse ${FILE_PATH}`)
  }
}

export async function saveAbout(input: AboutPayload): Promise<{ sha: string }> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  const payload = normalize(input)
  payload.journeyBody = payload.journeyBody.filter((s) => s.trim())
  payload.drives = payload.drives.filter((d) => d.title.trim())
  payload.journeyPhotos = payload.journeyPhotos.filter((s) => s.trim())
  const content = JSON.stringify(payload, null, 2) + '\n'
  const res = await store.write(FILE_PATH, content, { message: 'content(about): update About Us page', sha: doc?.sha })
  revalidatePath('/about-page')
  return { sha: res.sha }
}

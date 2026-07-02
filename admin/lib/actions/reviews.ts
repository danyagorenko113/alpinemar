'use server'

import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'

const FILE_PATH = 'src/data/googleReviews.ts'

export interface GoogleReview {
  name: string
  initials: string
  date: string
  rating: 5
  quote: string
}

const ARRAY_BLOCK_RE = /export const googleReviews:\s*GoogleReview\[\]\s*=\s*(\[[\s\S]*?\]);?\s*(?=\n\s*(?:export|$))/

interface FileState {
  content: string
  arrayText: string
  list: GoogleReview[]
  sha?: string
}

/**
 * Read `src/data/googleReviews.ts` and extract the array literal.
 *
 * The source file is TypeScript with single-quoted keys/values, unquoted keys,
 * trailing commas, curly apostrophes (’) inside quotes, etc. We evaluate the
 * literal in an isolated function scope — inputs come from our own repo, so
 * this is safe. `Function('return ' + text)()` handles TS/JSON5-ish object
 * literals natively without a parser dep.
 */
async function readState(): Promise<FileState> {
  const store = getStore()
  const doc = await store.read(FILE_PATH)
  if (!doc) throw new Error(`Missing ${FILE_PATH}`)
  const match = doc.content.match(ARRAY_BLOCK_RE)
  if (!match) throw new Error(`Could not locate googleReviews array in ${FILE_PATH}`)
  const arrayText = match[1]
  let parsed: unknown
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    parsed = new Function(`"use strict"; return (${arrayText});`)()
  } catch (err) {
    throw new Error(`Failed to parse googleReviews array: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (!Array.isArray(parsed)) throw new Error('googleReviews is not an array')
  const list = parsed.map(normalize)
  return { content: doc.content, arrayText, list, sha: doc.sha }
}

function normalize(raw: unknown): GoogleReview {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    name: String(r.name ?? ''),
    initials: String(r.initials ?? ''),
    date: String(r.date ?? ''),
    rating: 5,
    quote: String(r.quote ?? ''),
  }
}

/**
 * Serialize the list back into the source file. JSON.stringify emits
 * double-quoted keys and strings — valid TypeScript, and it safely escapes
 * embedded quotes, curly apostrophes (kept as-is in UTF-8), and newlines.
 */
function serialize(prevContent: string, list: GoogleReview[]): string {
  const normalizedList = list.map((r) => ({
    name: r.name,
    initials: r.initials,
    date: r.date,
    rating: 5 as const,
    quote: r.quote,
  }))
  const nextArrayText = JSON.stringify(normalizedList, null, 2)
  const replaced = prevContent.replace(ARRAY_BLOCK_RE, (whole) => {
    // Preserve any trailing semicolon behavior — normalize to `= [...];`
    void whole
    return `export const googleReviews: GoogleReview[] = ${nextArrayText};\n`
  })
  if (replaced === prevContent) {
    throw new Error('Failed to rewrite googleReviews array — regex did not match on write')
  }
  return replaced
}

export async function listReviews(): Promise<GoogleReview[]> {
  const { list } = await readState()
  return list
}

export async function getReview(id: number): Promise<GoogleReview | null> {
  if (!Number.isInteger(id) || id < 0) return null
  const { list } = await readState()
  return list[id] ?? null
}

export interface SaveReviewResult {
  id: number
}

export async function saveReview(id: number | null, input: GoogleReview): Promise<SaveReviewResult> {
  const clean: GoogleReview = {
    name: input.name.trim(),
    initials: input.initials.trim(),
    date: input.date.trim(),
    rating: 5,
    quote: input.quote.trim(),
  }
  if (!clean.name) throw new Error('Name is required')
  if (!clean.quote) throw new Error('Quote is required')
  if (!clean.initials) throw new Error('Initials are required')

  const state = await readState()
  const next = [...state.list]
  let outId: number
  if (id === null || id === undefined) {
    next.push(clean)
    outId = next.length - 1
  } else {
    if (!Number.isInteger(id) || id < 0 || id >= state.list.length) {
      throw new Error(`Invalid review id: ${id}`)
    }
    next[id] = clean
    outId = id
  }

  const nextContent = serialize(state.content, next)
  const store = getStore()
  await store.write(FILE_PATH, nextContent, {
    message: `content(reviews): ${id === null ? 'add' : 'update'} google review`,
    sha: state.sha,
  })
  revalidatePath('/reviews')
  return { id: outId }
}

export async function deleteReview(id: number): Promise<void> {
  if (!Number.isInteger(id) || id < 0) throw new Error(`Invalid review id: ${id}`)
  const state = await readState()
  if (id >= state.list.length) throw new Error(`Review ${id} does not exist`)
  const next = state.list.filter((_, i) => i !== id)
  const nextContent = serialize(state.content, next)
  const store = getStore()
  await store.write(FILE_PATH, nextContent, {
    message: `content(reviews): delete google review #${id}`,
    sha: state.sha,
  })
  revalidatePath('/reviews')
}

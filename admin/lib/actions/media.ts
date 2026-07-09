'use server'

import path from 'path'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { getStore } from '@/lib/store'
import type { ContentStore } from '@/lib/store/types'
import { slugify, assertRepoPath } from '@/lib/utils'

const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const MAX_DIMENSION = 2400 // px; resize larger images down for web use
const WEBP_QUALITY = 82

// Formats we transcode to WebP for smaller footprint. SVG/GIF/AVIF are kept
// as-is (SVG is XML, GIF may be animated, AVIF is already efficient).
const TRANSCODE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Repo path of the media metadata manifest (alt text + upload dates). */
const META_PATH = 'src/data/media-meta.json'

export interface MediaMetaEntry {
  alt?: string
  /** ISO datetime the file was uploaded through the admin. */
  uploadedAt?: string
}

/** image repo path (public/…) → metadata */
export type MediaMeta = Record<string, MediaMetaEntry>

export interface MediaItem {
  /** Public URL the Astro site serves, e.g. /images/blog/2026/foo.webp */
  url: string
  /** Repo path, e.g. public/images/blog/2026/foo.webp */
  path: string
  alt?: string
  uploadedAt?: string
}

interface UploadResult {
  url: string
  path: string
}

// ---------------------------------------------------------------------------
// Manifest helpers
// ---------------------------------------------------------------------------

async function readMeta(store: ContentStore): Promise<{ meta: MediaMeta; sha?: string }> {
  const doc = await store.read(META_PATH)
  if (!doc) return { meta: {} }
  try {
    const parsed = JSON.parse(doc.content) as MediaMeta
    return { meta: parsed && typeof parsed === 'object' ? parsed : {}, sha: doc.sha }
  } catch {
    return { meta: {}, sha: doc.sha }
  }
}

async function writeMeta(store: ContentStore, meta: MediaMeta, sha: string | undefined, message: string): Promise<void> {
  const sorted: MediaMeta = {}
  for (const key of Object.keys(meta).sort()) sorted[key] = meta[key]
  await store.write(META_PATH, JSON.stringify(sorted, null, 2) + '\n', { message, sha })
}

/**
 * Apply `mutate` to the manifest and persist it. Best-effort — media files are
 * the source of truth. Retries on sha conflict so a concurrent upload doesn't
 * lose the other uploader's entry (read-modify-write race).
 */
async function updateMeta(store: ContentStore, message: string, mutate: (meta: MediaMeta) => void): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { meta, sha } = await readMeta(store)
    mutate(meta)
    try {
      await writeMeta(store, meta, sha, message)
      return
    } catch (err) {
      const conflict = (err as { code?: string })?.code === 'conflict'
      if (conflict && attempt < 2) continue // re-read latest and re-apply
      throw err
    }
  }
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/**
 * Upload an image. We store under `public/<dir>/<year>/<slug>.<ext>` so the
 * Astro site serves it at `/<dir>/<year>/<slug>.<ext>` after the next build.
 */
export async function uploadImage(form: FormData, opts: { dir?: string; alt?: string } = {}): Promise<UploadResult> {
  const file = form.get('file') as File | null
  if (!file) throw new Error('No file provided')
  if (!VALID_TYPES.has(file.type)) throw new Error(`Unsupported file type: ${file.type}`)
  if (file.size > MAX_BYTES) throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB > 8MB)`)

  // Sanitize the destination dir: strip leading/trailing slashes, slugify each
  // segment so a hostile `dir` can't write outside public/images/.
  const rawDir = opts.dir ?? 'images/blog'
  const dirSegments = rawDir.split('/').map((seg) => slugify(seg)).filter(Boolean)
  const dir = dirSegments.length ? dirSegments.join('/') : 'images/blog'
  const originalExt = path.extname(file.name) || extFromType(file.type)
  const baseName = slugify(path.basename(file.name, originalExt)) || `upload-${Date.now()}`
  const year = new Date().getFullYear()

  const inputBuf = Buffer.from(await file.arrayBuffer())
  const { buffer, ext } = await optimize(inputBuf, file.type, originalExt)

  const uniqueName = `${baseName}-${Date.now().toString(36)}${ext}`
  const repoPath = `public/${dir}/${year}/${uniqueName}`

  const store = getStore()
  await store.write(repoPath, buffer, { message: `chore(admin): upload ${uniqueName}` })

  // Record upload metadata (best-effort — the image itself is already saved).
  try {
    await updateMeta(store, `chore(admin): media meta for ${uniqueName}`, (meta) => {
      meta[repoPath] = {
        ...(opts.alt?.trim() ? { alt: opts.alt.trim() } : {}),
        uploadedAt: new Date().toISOString(),
      }
    })
  } catch {
    // Ignore manifest write races; alt can be set later from the media library.
  }

  revalidatePath('/media')
  return { url: `/${dir}/${year}/${uniqueName}`, path: repoPath }
}

/**
 * Downscale large images, transcode JPEG/PNG/WebP → WebP.
 * SVG, GIF (may be animated), and AVIF pass through unchanged.
 */
async function optimize(
  input: Buffer,
  mime: string,
  originalExt: string,
): Promise<{ buffer: Buffer; ext: string }> {
  if (!TRANSCODE_TYPES.has(mime)) {
    return { buffer: input, ext: originalExt }
  }
  try {
    const pipeline = sharp(input, { failOn: 'error' }).rotate() // respect EXIF orientation
    const meta = await pipeline.metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION
    const out = await (needsResize
      ? pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      : pipeline
    )
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer()
    // Only accept the transcode if it actually shrinks the file; otherwise
    // keep the original (avoid re-compressing already-tiny assets).
    if (out.length < input.length) return { buffer: out, ext: '.webp' }
    return { buffer: input, ext: originalExt }
  } catch {
    // Sharp choked (corrupt image, unsupported subformat) — fall back to raw.
    return { buffer: input, ext: originalExt }
  }
}

// ---------------------------------------------------------------------------
// Listing & metadata
// ---------------------------------------------------------------------------

export async function listImages(dir = 'images'): Promise<MediaItem[]> {
  const store = getStore()
  const [files, { meta }] = await Promise.all([store.list(`public/${dir}`), readMeta(store)])
  return files
    .filter((f) => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f.path))
    .map((f) => ({
      path: f.path,
      url: f.path.replace(/^public/, ''),
      alt: meta[f.path]?.alt,
      uploadedAt: meta[f.path]?.uploadedAt,
    }))
    .sort((a, b) => b.path.localeCompare(a.path))
}

/**
 * Top-level folders under public/images/ — includes empty folders held open
 * by a .gitkeep, which the image listing filters out.
 */
export async function listImageFolders(): Promise<string[]> {
  const store = getStore()
  const files = await store.list('public/images')
  const set = new Set<string>()
  for (const f of files) {
    const rel = f.path.replace(/^public\/images\//, '')
    const seg = rel.split('/')[0]
    if (seg && !seg.includes('.')) set.add(seg)
  }
  return [...set].sort()
}

/** Set (or clear, when empty) the ALT text stored for an image. */
export async function setImageAlt(repoPath: string, alt: string): Promise<void> {
  repoPath = assertRepoPath(repoPath, 'public/images/')
  const store = getStore()
  await updateMeta(store, `chore(admin): alt text for ${path.basename(repoPath)}`, (meta) => {
    const entry = { ...(meta[repoPath] ?? {}) }
    if (alt.trim()) entry.alt = alt.trim()
    else delete entry.alt
    if (Object.keys(entry).length === 0) delete meta[repoPath]
    else meta[repoPath] = entry
  })
  revalidatePath('/media')
}

/** Look up manifest metadata by public URL (e.g. /images/blog/2026/foo.webp). */
export async function getImageMetaByUrl(url: string): Promise<MediaMetaEntry | null> {
  if (!url.startsWith('/')) return null
  const store = getStore()
  const { meta } = await readMeta(store)
  return meta[`public${url}`] ?? null
}

// ---------------------------------------------------------------------------
// Deletion & folder management
// ---------------------------------------------------------------------------

export async function deleteImage(repoPath: string): Promise<void> {
  repoPath = assertRepoPath(repoPath, 'public/images/')
  const store = getStore()
  await store.remove(repoPath, { message: `chore(admin): delete ${path.basename(repoPath)}` })
  try {
    await updateMeta(store, `chore(admin): drop media meta for ${path.basename(repoPath)}`, (meta) => {
      delete meta[repoPath]
    })
  } catch {
    // Stale manifest entries are harmless.
  }
  revalidatePath('/media')
}

function validFolderName(name: string): string {
  const clean = slugify(name)
  if (!clean) throw new Error('Folder name is required')
  return clean
}

/** Create an empty folder under public/images/ (held open by a .gitkeep). */
export async function createFolder(name: string): Promise<string> {
  const clean = validFolderName(name)
  const store = getStore()
  await store.write(`public/images/${clean}/.gitkeep`, '', {
    message: `chore(admin): create media folder images/${clean}`,
  })
  revalidatePath('/media')
  return clean
}

/**
 * Rename a top-level folder under public/images/. GitHub's Contents API has
 * no move, so this copies every file (delete + create) — can take a while
 * for large folders.
 */
export async function renameFolder(from: string, to: string): Promise<string> {
  const src = validFolderName(from)
  const dest = validFolderName(to)
  if (src === dest) return dest

  const store = getStore()
  const files = await store.list(`public/images/${src}`)
  const realFiles = files.filter((f) => !f.path.endsWith('/.gitkeep'))
  if (realFiles.length === 0) throw new Error(`Folder images/${src} is empty or does not exist`)

  // A .gitkeep-only destination is an "empty" folder (created via createFolder)
  // and is a legitimate rename target, so ignore it in the collision check.
  const destFiles = (await store.list(`public/images/${dest}`)).filter((f) => !f.path.endsWith('/.gitkeep'))
  if (destFiles.length > 0) throw new Error(`Folder images/${dest} already exists`)

  // Move each file (copy then delete). Track what actually moved so a mid-loop
  // failure still leaves the manifest consistent for the files that did move.
  const renamed: Array<{ from: string; to: string }> = []
  let moveError: unknown = null
  for (const f of realFiles) {
    try {
      const raw = await store.readRaw(f.path, f.sha)
      if (!raw) continue
      const newPath = f.path.replace(`public/images/${src}/`, `public/images/${dest}/`)
      const written = await store.write(newPath, raw.content, { message: `chore(admin): move ${f.path} → ${newPath}` })
      // Pass the source blob sha so remove() never falls back to getContent
      // (which 403s for files >1 MB) and never deletes a stale revision.
      await store.remove(f.path, { message: `chore(admin): move ${f.path} → ${newPath}`, sha: f.sha })
      renamed.push({ from: f.path, to: newPath })
      void written
    } catch (err) {
      moveError = err
      break
    }
  }

  // Always reconcile the manifest for whatever moved — even on partial failure —
  // so alt text / upload dates don't silently vanish for the moved files.
  if (renamed.length > 0) {
    try {
      await updateMeta(store, `chore(admin): rename media folder images/${src} → images/${dest}`, (meta) => {
        for (const r of renamed) {
          if (meta[r.from]) {
            meta[r.to] = meta[r.from]
            delete meta[r.from]
          }
        }
      })
    } catch {
      // Manifest is advisory; a failed rewrite only loses alt/upload dates.
    }
  }

  revalidatePath('/media')
  if (moveError) {
    throw new Error(
      `Rename stopped after ${renamed.length}/${realFiles.length} files — ${moveError instanceof Error ? moveError.message : 'unknown error'}. Retry to finish moving the rest.`,
    )
  }
  return dest
}

/** Delete a top-level folder under public/images/ and every file inside it. */
export async function deleteFolder(name: string): Promise<number> {
  const clean = validFolderName(name)
  const store = getStore()
  const files = await store.list(`public/images/${clean}`)
  for (const f of files) {
    await store.remove(f.path, { message: `chore(admin): delete media folder images/${clean}`, sha: f.sha })
  }
  try {
    await updateMeta(store, `chore(admin): drop media meta for images/${clean}`, (meta) => {
      for (const key of Object.keys(meta)) {
        if (key.startsWith(`public/images/${clean}/`)) delete meta[key]
      }
    })
  } catch {
    // Stale manifest entries are harmless.
  }
  revalidatePath('/media')
  return files.length
}

function extFromType(t: string): string {
  if (t === 'image/jpeg') return '.jpg'
  if (t === 'image/png') return '.png'
  if (t === 'image/webp') return '.webp'
  if (t === 'image/gif') return '.gif'
  if (t === 'image/avif') return '.avif'
  if (t === 'image/svg+xml') return '.svg'
  return ''
}

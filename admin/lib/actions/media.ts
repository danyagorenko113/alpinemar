'use server'

import path from 'path'
import sharp from 'sharp'
import { getStore } from '@/lib/store'
import { slugify } from '@/lib/utils'

const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const MAX_DIMENSION = 2400 // px; resize larger images down for web use
const WEBP_QUALITY = 82

// Formats we transcode to WebP for smaller footprint. SVG/GIF/AVIF are kept
// as-is (SVG is XML, GIF may be animated, AVIF is already efficient).
const TRANSCODE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface UploadResult {
  /** Public URL the Astro site will resolve at build time. */
  url: string
  /** Repo path, e.g. public/images/blog/2026/foo.jpg */
  path: string
}

/**
 * Upload an image. We store under `public/<dir>/<year>/<slug>.<ext>` so the
 * Astro site serves it at `/<dir>/<year>/<slug>.<ext>` after the next build.
 */
export async function uploadImage(form: FormData, opts: { dir?: string } = {}): Promise<UploadResult> {
  const file = form.get('file') as File | null
  if (!file) throw new Error('No file provided')
  if (!VALID_TYPES.has(file.type)) throw new Error(`Unsupported file type: ${file.type}`)
  if (file.size > MAX_BYTES) throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB > 8MB)`)

  const dir = opts.dir ?? 'images/blog'
  const originalExt = path.extname(file.name) || extFromType(file.type)
  const baseName = slugify(path.basename(file.name, originalExt)) || `upload-${Date.now()}`
  const year = new Date().getFullYear()

  const inputBuf = Buffer.from(await file.arrayBuffer())
  const { buffer, ext } = await optimize(inputBuf, file.type, originalExt)

  const uniqueName = `${baseName}-${Date.now().toString(36)}${ext}`
  const repoPath = `public/${dir}/${year}/${uniqueName}`

  const store = getStore()
  await store.write(repoPath, buffer, { message: `chore(admin): upload ${uniqueName}` })

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

export async function listImages(dir = 'images'): Promise<{ url: string; path: string }[]> {
  const store = getStore()
  const files = await store.list(`public/${dir}`)
  return files
    .filter((f) => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f.path))
    .map((f) => ({
      path: f.path,
      url: f.path.replace(/^public/, ''),
    }))
    .sort((a, b) => b.path.localeCompare(a.path))
}

export async function deleteImage(repoPath: string): Promise<void> {
  if (!repoPath.startsWith('public/')) throw new Error('Refusing to delete outside public/')
  const store = getStore()
  await store.remove(repoPath, { message: `chore(admin): delete ${path.basename(repoPath)}` })
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

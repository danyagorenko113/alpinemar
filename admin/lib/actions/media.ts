'use server'

import path from 'path'
import { getStore } from '@/lib/store'
import { slugify } from '@/lib/utils'

const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

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
  const ext = path.extname(file.name) || extFromType(file.type)
  const baseName = slugify(path.basename(file.name, ext)) || `upload-${Date.now()}`
  const year = new Date().getFullYear()
  const uniqueName = `${baseName}-${Date.now().toString(36)}${ext}`
  const repoPath = `public/${dir}/${year}/${uniqueName}`

  const store = getStore()
  const buf = Buffer.from(await file.arrayBuffer())
  await store.write(repoPath, buf, { message: `chore(admin): upload ${uniqueName}` })

  return { url: `/${dir}/${year}/${uniqueName}`, path: repoPath }
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

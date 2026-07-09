import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * A single content slug — no path separators or traversal. Delete/read actions
 * receive a slug directly (not via slugify), so this guards against callers
 * passing "../../../etc" to escape the collection directory.
 */
export function assertSafeSlug(slug: string): string {
  const s = (slug ?? '').trim()
  if (!s || s.includes('/') || s.includes('\\') || s.includes('..') || s.startsWith('.')) {
    throw new Error(`Invalid slug: ${JSON.stringify(slug)}`)
  }
  return s
}

/**
 * Ensure a repo path stays inside `prefix` (e.g. "public/") after normalizing
 * away any "../" segments. Returns the normalized path.
 */
export function assertRepoPath(repoPath: string, prefix: string): string {
  const normalized = (repoPath ?? '').replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  // Reject any traversal segment outright — no legitimate media path has one.
  if (normalized.split('/').some((seg) => seg === '..')) {
    throw new Error(`Invalid path: ${JSON.stringify(repoPath)}`)
  }
  if (!normalized.startsWith(prefix)) {
    throw new Error(`Path must be within ${prefix}: ${JSON.stringify(repoPath)}`)
  }
  return normalized
}

/**
 * Turns a content-path URL like "/images/team/Pablo.jpeg" into a fully
 * qualified preview URL against the live site (e.g. https://alpinemar.com).
 * Necessary because the admin runs on a different origin than the site,
 * so relative paths would 404 in <img src=…>.
 *
 * Left alone: absolute URLs (http…, https…), protocol-relative (//…),
 * data: URIs, blob: URIs, and empty strings.
 */
export function previewSrc(path: string | undefined | null): string {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path)) return path
  if (path.startsWith('data:') || path.startsWith('blob:')) return path
  if (!path.startsWith('/')) return path
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app').replace(/\/$/, '')
  return `${base}${path}`
}

/**
 * Rewrites root-relative <img src="/…"> and <a href="/…"> URLs in an
 * HTML string to absolute site URLs — for preview modals inside the
 * admin, where the admin runs on a different origin than the live site.
 */
export function rewriteRelativeUrls(html: string): string {
  if (!html) return html
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app').replace(/\/$/, '')
  return html
    .replace(/(<img\b[^>]*\bsrc=)"(\/[^"/][^"]*)"/gi, (_, pre: string, src: string) => `${pre}"${base}${src}"`)
    .replace(/(<img\b[^>]*\bsrc=)'(\/[^'/][^']*)'/gi, (_, pre: string, src: string) => `${pre}'${base}${src}'`)
    .replace(/(<a\b[^>]*\bhref=)"(\/[^"/][^"]*)"/gi, (_, pre: string, href: string) => `${pre}"${base}${href}"`)
    .replace(/(<a\b[^>]*\bhref=)'(\/[^'/][^']*)'/gi, (_, pre: string, href: string) => `${pre}'${base}${href}'`)
}

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Coarse-grained "2 hours ago" formatting for admin list views. Not a full
 * i18n solution — English only, resolves at buckets: seconds, minutes,
 * hours, days, weeks, months, years.
 */
export function formatRelative(input: string | Date | undefined | null): string {
  if (!input) return ''
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  const diffWk = Math.floor(diffDay / 7)
  if (diffWk < 5) return `${diffWk} wk${diffWk === 1 ? '' : 's'} ago`
  const diffMo = Math.floor(diffDay / 30)
  if (diffMo < 12) return `${diffMo} mo${diffMo === 1 ? '' : 's'} ago`
  const diffYr = Math.floor(diffDay / 365)
  return `${diffYr} yr${diffYr === 1 ? '' : 's'} ago`
}

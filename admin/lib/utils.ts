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

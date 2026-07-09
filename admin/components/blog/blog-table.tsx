'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BlogSummary } from '@/lib/actions/blog'
import { cn, formatDate, formatRelative } from '@/lib/utils'

type SortKey = 'title' | 'author' | 'category' | 'status' | 'date'
type SortDir = 'asc' | 'desc'

interface Props {
  posts: BlogSummary[]
}

const COLUMNS: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author', className: 'hidden lg:table-cell' },
  { key: 'category', label: 'Category', className: 'hidden md:table-cell' },
  { key: 'status', label: 'Status', className: 'hidden sm:table-cell w-24' },
  { key: 'date', label: 'Date', className: 'hidden sm:table-cell w-32' },
]

function sortValue(p: BlogSummary, key: SortKey): string {
  switch (key) {
    case 'title':
      return p.title.toLowerCase()
    case 'author':
      return (p.author ?? '').toLowerCase()
    case 'category':
      return (p.category ?? '').toLowerCase()
    case 'status':
      return p.status
    case 'date':
      return p.date
  }
}

export function BlogTable({ posts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...posts].sort((a, b) => {
      const cmp = sortValue(a, sortKey).localeCompare(sortValue(b, sortKey))
      if (cmp !== 0) return dir * cmp
      // Stable tiebreak on date desc so equal cells keep a sane order.
      return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)
    })
  }, [posts, sortKey, sortDir])

  function SortIcon({ column }: { column: SortKey }) {
    if (column !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-navy-50 text-left text-[11px] uppercase tracking-wider text-navy-500">
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className={cn('px-4 py-2.5 font-semibold', c.className)}>
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className={cn(
                    'inline-flex items-center gap-1 uppercase tracking-wider hover:text-navy-900 transition-colors',
                    c.key === sortKey && 'text-navy-900',
                  )}
                  title={`Sort by ${c.label.toLowerCase()}`}
                >
                  {c.label}
                  <SortIcon column={c.key} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                No posts match the filter.
              </td>
            </tr>
          )}
          {sorted.map((p) => (
            <tr key={p.slug} className="hover:bg-navy-50/50 transition-colors">
              <td className="px-4 py-3 align-top">
                <Link href={`/blog/${p.slug}`} className="block group">
                  <div className="font-medium text-navy-900 group-hover:text-scooter-dark transition-colors line-clamp-1">
                    {p.title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.excerpt}</div>
                </Link>
              </td>
              <td className="px-4 py-3 align-top hidden lg:table-cell text-xs text-muted-foreground">
                {p.author ?? '—'}
              </td>
              <td className="px-4 py-3 align-top hidden md:table-cell">
                {p.category ? (
                  <Badge variant="muted" className="text-[10px]">{p.category}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 align-top hidden sm:table-cell">
                {p.status === 'draft' ? (
                  <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">Draft</Badge>
                ) : (
                  <Badge variant="muted" className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">Published</Badge>
                )}
              </td>
              <td className="px-4 py-3 align-top hidden sm:table-cell text-xs text-muted-foreground">
                <div>{formatDate(p.date)}</div>
                {p.updated && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5" title={new Date(p.updated).toLocaleString()}>
                    Edited {formatRelative(p.updated)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

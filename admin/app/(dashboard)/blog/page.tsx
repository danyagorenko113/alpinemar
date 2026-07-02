export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listBlogPosts, listAllTags } from '@/lib/actions/blog'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatRelative } from '@/lib/utils'

interface SP {
  q?: string
  tag?: string
}

export default async function BlogListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const [allPosts, allTags] = await Promise.all([listBlogPosts(), listAllTags()])

  const q = (sp.q ?? '').toLowerCase()
  const tag = sp.tag ?? ''

  const filtered = allPosts.filter((p) => {
    if (q && !`${p.title} ${p.excerpt}`.toLowerCase().includes(q)) return false
    if (tag && !p.tags.includes(tag)) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Blog"
        description={`${allPosts.length} posts in src/content/insights/`}
        actions={
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>
        }
      />

      <form method="GET" className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search title or excerpt…" className="pl-9" />
        </div>
        <select
          name="tag"
          defaultValue={tag}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
        {(q || tag) && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/blog">Clear</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-50 text-left text-[11px] uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Tags</th>
              <th className="px-4 py-2.5 font-semibold w-32 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No posts match the filter.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.slug} className="hover:bg-navy-50/50 transition-colors">
                <td className="px-4 py-3 align-top">
                  <Link href={`/blog/${p.slug}`} className="block group">
                    <div className="font-medium text-navy-900 group-hover:text-scooter-dark transition-colors line-clamp-1 flex items-center gap-2">
                      {p.title}
                      {p.status === 'draft' && (
                        <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">Draft</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.excerpt}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 align-top hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">+{p.tags.length - 3}</span>
                    )}
                  </div>
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
    </div>
  )
}
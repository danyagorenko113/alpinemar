export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listBlogPosts, listAllTags, listAllCategories } from '@/lib/actions/it/blog'
import { BlogTable } from '@/components/blog/blog-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SP {
  q?: string
  tag?: string
  category?: string
}

export default async function ITBlogListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const [allPosts, allTags, allCategories] = await Promise.all([
    listBlogPosts(),
    listAllTags(),
    listAllCategories(),
  ])

  const q = (sp.q ?? '').toLowerCase()
  const tag = sp.tag ?? ''
  const category = sp.category ?? ''

  const filtered = allPosts.filter((p) => {
    if (q && !`${p.title} ${p.excerpt}`.toLowerCase().includes(q)) return false
    if (tag && !p.tags.includes(tag)) return false
    if (category && p.category !== category) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="IT Blog"
        description={`${allPosts.length} posts · it.alpinemar.com/blog`}
        actions={
          <Button asChild>
            <Link href="/it/blog/new">
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
          name="category"
          defaultValue={category}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
        {(q || tag || category) && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/it/blog">Clear</Link>
          </Button>
        )}
      </form>

      <BlogTable posts={filtered} basePath="/it/blog" />
    </div>
  )
}

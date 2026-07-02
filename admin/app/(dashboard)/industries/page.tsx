export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listIndustries } from '@/lib/actions/industries'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SP {
  q?: string
}

export default async function IndustriesListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const all = await listIndustries()
  const q = (sp.q ?? '').toLowerCase()

  const items = all.filter((i) => {
    if (q && !`${i.title} ${i.summary}`.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Industries"
        description={`${all.length} industries in src/content/industries/`}
        actions={
          <Button asChild>
            <Link href="/industries/new"><Plus className="h-4 w-4" />New industry</Link>
          </Button>
        }
      />

      <form method="GET" className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search title or summary…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/industries">Clear</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-50 text-left text-[11px] uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="px-4 py-2.5 font-semibold w-32 hidden sm:table-cell">Slug</th>
              <th className="px-4 py-2.5 font-semibold w-24 hidden md:table-cell text-right">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No industries match.</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.slug} className="hover:bg-navy-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/industries/${i.slug}`} className="block group">
                    <div className="font-medium text-navy-900 group-hover:text-scooter-dark line-clamp-1">{i.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{i.summary}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-xs font-mono text-muted-foreground line-clamp-1">{i.slug}</td>
                <td className="px-4 py-3 hidden md:table-cell text-right text-xs text-muted-foreground font-mono">{i.services.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

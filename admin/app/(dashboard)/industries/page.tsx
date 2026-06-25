export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listIndustries } from '@/lib/actions/industries'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export default async function IndustriesListPage() {
  const items = await listIndustries()
  return (
    <div>
      <PageHeader
        title="Industries"
        description={`${items.length} industries in src/content/industries/`}
        actions={
          <Button asChild>
            <Link href="/industries/new"><Plus className="h-4 w-4" />New industry</Link>
          </Button>
        }
      />
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-50 text-left text-[11px] uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="px-4 py-2.5 font-semibold w-32 hidden sm:table-cell">Tagline</th>
              <th className="px-4 py-2.5 font-semibold w-20 hidden md:table-cell text-right">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No industries yet.</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.slug} className="hover:bg-navy-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/industries/${i.slug}`} className="block group">
                    <div className="font-medium text-navy-900 group-hover:text-scooter-dark line-clamp-1">{i.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{i.summary}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground line-clamp-1">{i.tagline}</td>
                <td className="px-4 py-3 hidden md:table-cell text-right text-xs text-muted-foreground font-mono">{i.order ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
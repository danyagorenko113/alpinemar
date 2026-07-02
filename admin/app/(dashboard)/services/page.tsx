export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listServices } from '@/lib/actions/services'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ServicesListPage() {
  const items = await listServices()
  return (
    <div>
      <PageHeader
        title="Services"
        description={`${items.length} services in src/content/services/`}
        actions={
          <Button asChild>
            <Link href="/services/new"><Plus className="h-4 w-4" />New service</Link>
          </Button>
        }
      />
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy-50 text-left text-[11px] uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="px-4 py-2.5 font-semibold w-32 hidden sm:table-cell">Group</th>
              <th className="px-4 py-2.5 font-semibold w-24 hidden md:table-cell text-right">Industries</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No services yet.</td></tr>
            )}
            {items.map((s) => (
              <tr key={s.slug} className="hover:bg-navy-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/services/${s.slug}`} className="block group">
                    <div className="font-medium text-navy-900 group-hover:text-scooter-dark transition-colors line-clamp-1">{s.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.summary}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {s.group && <Badge variant="muted">{s.group}</Badge>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-right text-xs text-muted-foreground font-mono">{s.industries.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
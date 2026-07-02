export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listServices } from '@/lib/actions/services'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SP {
  q?: string
  group?: string
}

const GROUPS = ['Tax', 'Accounting', 'Advisory', 'Compliance']

export default async function ServicesListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const all = await listServices()

  const q = (sp.q ?? '').toLowerCase()
  const group = sp.group ?? ''

  const items = all.filter((s) => {
    if (q && !`${s.title} ${s.summary}`.toLowerCase().includes(q)) return false
    if (group && s.group !== group) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Services"
        description={`${all.length} services in src/content/services/`}
        actions={
          <Button asChild>
            <Link href="/services/new"><Plus className="h-4 w-4" />New service</Link>
          </Button>
        }
      />

      <form method="GET" className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search title or summary…" className="pl-9" />
        </div>
        <select
          name="group"
          defaultValue={group}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
        {(q || group) && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/services">Clear</Link>
          </Button>
        )}
      </form>

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
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No services match.</td></tr>
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

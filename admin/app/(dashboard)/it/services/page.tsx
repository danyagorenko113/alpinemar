export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listServices } from '@/lib/actions/it/services'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SP {
  q?: string
}

export default async function ITServicesListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const all = await listServices()
  const q = (sp.q ?? '').toLowerCase()
  const items = all.filter((s) => !q || `${s.title} ${s.group ?? ''}`.toLowerCase().includes(q))

  return (
    <div>
      <PageHeader
        title="IT Services"
        description={`${all.length} service pages · click a row to edit`}
        actions={
          <Button asChild>
            <Link href="/it/services/new"><Plus className="h-4 w-4" />New service</Link>
          </Button>
        }
      />

      <form method="GET" className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search title or group…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/it/services">Clear</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border bg-card divide-y">
        {items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {all.length === 0 ? 'No services yet.' : 'No services match the filter.'}
          </p>
        )}
        {items.map((s) => (
          <Link key={s.slug} href={`/it/services/${s.slug}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-navy-50/50 transition-colors group">
            <div className="min-w-0">
              <div className="font-medium text-sm text-navy-900 group-hover:text-scooter-dark transition-colors flex items-center gap-2">
                {s.title}
                {s.status === 'draft' && (
                  <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">Draft</Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{s.path}</div>
            </div>
            {s.group && <Badge variant="muted" className="text-[10px] shrink-0">{s.group}</Badge>}
          </Link>
        ))}
      </div>
    </div>
  )
}

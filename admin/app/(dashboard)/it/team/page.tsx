export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { listTeam } from '@/lib/actions/it/team'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { previewSrc } from '@/lib/utils'

interface SP {
  q?: string
}

export default async function ITTeamListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams
  const all = await listTeam()
  const q = (sp.q ?? '').toLowerCase()

  const items = all.filter((t) => {
    if (q && !`${t.name} ${t.role}`.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="IT Team"
        description={`${all.length} team members · shown on the IT About page · click a row to edit`}
        actions={
          <Button asChild>
            <Link href="/it/team/new"><Plus className="h-4 w-4" />New member</Link>
          </Button>
        }
      />

      <form method="GET" className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="Search name or role…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/it/team">Clear</Link>
          </Button>
        )}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-10 text-center">
            {all.length === 0 ? 'No team members yet.' : 'No members match the filter.'}
          </p>
        )}
        {items.map((t) => (
          <Link
            key={t.slug}
            href={`/it/team/${t.slug}`}
            className="rounded-lg border bg-card overflow-hidden hover:border-navy-300 hover:shadow-sm transition group"
          >
            <div className="aspect-[4/3] bg-navy-50 overflow-hidden">
              {t.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc(t.photo)} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No photo</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-navy-900 group-hover:text-scooter-dark transition-colors flex items-center gap-2">
                {t.name}
                {t.status === 'draft' && (
                  <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">Draft</Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
              {t.email && <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.email}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

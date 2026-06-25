export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listTeam } from '@/lib/actions/team'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function TeamListPage() {
  const items = await listTeam()
  return (
    <div>
      <PageHeader
        title="Team"
        description={`${items.length} members in src/content/team/`}
        actions={
          <Button asChild>
            <Link href="/team/new"><Plus className="h-4 w-4" />New member</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-10 text-center">No team members yet.</p>
        )}
        {items.map((t) => (
          <Link
            key={t.slug}
            href={`/team/${t.slug}`}
            className="rounded-lg border bg-card overflow-hidden hover:border-navy-300 hover:shadow-sm transition group"
          >
            <div className="aspect-[4/3] bg-navy-50 overflow-hidden">
              {t.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No photo</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-navy-900 group-hover:text-scooter-dark transition-colors">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
              {t.credentials.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.credentials.slice(0, 4).map((c) => (
                    <Badge key={c} variant="muted" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
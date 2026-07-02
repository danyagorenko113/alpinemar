export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listReviews } from '@/lib/actions/reviews'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

function excerpt(text: string, len = 60): string {
  const t = text.trim()
  if (t.length <= len) return t
  return `${t.slice(0, len).trimEnd()}…`
}

export default async function ReviewsListPage() {
  const items = await listReviews()
  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Google review testimonials shown on the /services page."
        actions={
          <Button asChild>
            <Link href="/reviews/new"><Plus className="h-4 w-4" />New review</Link>
          </Button>
        }
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No reviews yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-navy-700">Name</th>
                <th className="px-4 py-2.5 font-medium text-navy-700 w-20">Initials</th>
                <th className="px-4 py-2.5 font-medium text-navy-700 w-40">Date</th>
                <th className="px-4 py-2.5 font-medium text-navy-700">Quote</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-navy-900">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-700">{r.initials}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-navy-700">{excerpt(r.quote, 60)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/reviews/${i}`}
                      className="text-scooter-dark hover:text-navy-900 font-medium"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

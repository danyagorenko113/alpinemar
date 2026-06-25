export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FileText, Briefcase, Building2, Users, ImageIcon } from 'lucide-react'
import { listBlogPosts } from '@/lib/actions/blog'
import { listServices } from '@/lib/actions/services'
import { listIndustries } from '@/lib/actions/industries'
import { listTeam } from '@/lib/actions/team'

const tiles = [
  { href: '/blog', label: 'Blog', icon: FileText, count: async () => (await listBlogPosts()).length, hint: 'Articles & insights' },
  { href: '/services', label: 'Services', icon: Briefcase, count: async () => (await listServices()).length, hint: 'Service pages' },
  { href: '/industries', label: 'Industries', icon: Building2, count: async () => (await listIndustries()).length, hint: 'Industry pages' },
  { href: '/team', label: 'Team', icon: Users, count: async () => (await listTeam()).length, hint: 'People' },
  { href: '/media', label: 'Media', icon: ImageIcon, count: async () => 0, hint: 'Library' },
]

export default async function DashboardPage() {
  const counts = await Promise.all(tiles.map((t) => t.count().catch(() => 0)))
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage content for alpinemar.com. Changes commit to the repo and trigger a site rebuild.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((t, i) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-lg border bg-card p-5 hover:border-navy-300 hover:shadow-sm transition group"
            >
              <Icon className="h-5 w-5 text-navy-500 group-hover:text-scooter transition-colors" />
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{counts[i]}</span>
                <span className="text-sm text-navy-500">{t.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
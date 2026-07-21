export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  FileText,
  Users,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { listBlogPosts } from '@/lib/actions/it/blog'
import { listTeam } from '@/lib/actions/it/team'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/utils'
import { IT_SITE_URL } from '@/lib/it-site'

type Kind = 'blog' | 'team'
interface RecentItem {
  kind: Kind
  slug: string
  title: string
  updated?: string
  status: 'draft' | 'published'
  editHref: string
}

const KIND_META: Record<Kind, { label: string; icon: typeof FileText }> = {
  blog: { label: 'Blog', icon: FileText },
  team: { label: 'Team', icon: Users },
}

export default async function ITDashboardPage() {
  const [blog, team] = await Promise.all([
    listBlogPosts().catch(() => []),
    listTeam().catch(() => []),
  ])

  const tiles = [
    { href: '/it/blog', label: 'Blog', icon: FileText, count: blog.length, drafts: blog.filter((p) => p.status === 'draft').length, hint: 'Insights articles' },
    { href: '/it/team', label: 'Team', icon: Users, count: team.length, drafts: team.filter((t) => t.status === 'draft').length, hint: 'People' },
  ]

  const recent: RecentItem[] = [
    ...blog.map<RecentItem>((p) => ({ kind: 'blog', slug: p.slug, title: p.title, updated: p.updated, status: p.status, editHref: `/it/blog/${p.slug}` })),
    ...team.map<RecentItem>((t) => ({ kind: 'team', slug: t.slug, title: t.name, updated: t.updated, status: t.status, editHref: `/it/team/${t.slug}` })),
  ]
    .filter((r) => !!r.updated)
    .sort((a, b) => (b.updated! < a.updated! ? -1 : 1))
    .slice(0, 8)

  const drafts: RecentItem[] = [
    ...blog.filter((p) => p.status === 'draft').map<RecentItem>((p) => ({ kind: 'blog', slug: p.slug, title: p.title, updated: p.updated, status: p.status, editHref: `/it/blog/${p.slug}` })),
    ...team.filter((t) => t.status === 'draft').map<RecentItem>((t) => ({ kind: 'team', slug: t.slug, title: t.name, updated: t.updated, status: t.status, editHref: `/it/team/${t.slug}` })),
  ]

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="am-eyebrow mb-3">IT Dashboard</div>
          <h1 className="am-h1-display am-gradient-ink">IT content overview</h1>
          <p className="font-display mt-2 text-sm text-navy-500">
            Manage content for it.alpinemar.com. Every save commits to the repo and triggers a rebuild.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={IT_SITE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View IT site
            </a>
          </Button>
          <Button asChild>
            <Link href="/it/blog/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => {
            const Icon = t.icon
            return (
              <Link key={t.href} href={t.href} className="rounded-lg border bg-card p-5 hover:border-navy-300 hover:shadow-sm transition group">
                <Icon className="h-5 w-5 text-navy-500 group-hover:text-scooter transition-colors" />
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-medium tracking-tight text-navy-900">{t.count}</span>
                  <span className="font-display text-sm text-navy-500">{t.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
                {t.drafts > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                    <Clock className="h-2.5 w-2.5" />
                    {t.drafts} draft{t.drafts === 1 ? '' : 's'}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="am-eyebrow" style={{ color: 'var(--color-scooter)' }}>Recent activity</div>
            <span className="text-xs text-muted-foreground">Latest IT edits</span>
          </div>
          <div className="divide-y">
            {recent.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No edits tracked yet.</p>
            )}
            {recent.map((r) => {
              const KIcon = KIND_META[r.kind].icon
              return (
                <Link key={`${r.kind}:${r.slug}`} href={r.editHref} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50 transition-colors group">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-500 group-hover:bg-scooter/10 group-hover:text-scooter transition-colors">
                    <KIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-navy-900 line-clamp-1 flex items-center gap-2">
                      {r.title}
                      {r.status === 'draft' && (
                        <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">Draft</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {KIND_META[r.kind].label} · Edited {formatRelative(r.updated)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border bg-card overflow-hidden self-start">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="am-eyebrow" style={{ color: 'var(--color-scooter)' }}>Drafts</div>
            <span className="text-xs text-muted-foreground">{drafts.length}</span>
          </div>
          <div className="divide-y">
            {drafts.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <p className="text-sm text-muted-foreground">No drafts — everything is live.</p>
              </div>
            )}
            {drafts.slice(0, 8).map((d) => {
              const KIcon = KIND_META[d.kind].icon
              return (
                <Link key={`d:${d.kind}:${d.slug}`} href={d.editHref} className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-amber-50/40 transition-colors group">
                  <KIcon className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-navy-900 line-clamp-1 group-hover:text-amber-800 transition-colors">{d.title}</div>
                    <div className="text-[10px] text-muted-foreground">{KIND_META[d.kind].label}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

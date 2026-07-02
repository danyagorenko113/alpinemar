export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  FileText,
  Briefcase,
  Building2,
  Users,
  ImageIcon,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { listBlogPosts } from '@/lib/actions/blog'
import { listServices } from '@/lib/actions/services'
import { listIndustries } from '@/lib/actions/industries'
import { listTeam } from '@/lib/actions/team'
import { listImages } from '@/lib/actions/media'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/utils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

type Kind = 'blog' | 'services' | 'industries' | 'team'
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
  services: { label: 'Services', icon: Briefcase },
  industries: { label: 'Industries', icon: Building2 },
  team: { label: 'Team', icon: Users },
}

export default async function DashboardPage() {
  const [blog, services, industries, team, images] = await Promise.all([
    listBlogPosts().catch(() => []),
    listServices().catch(() => []),
    listIndustries().catch(() => []),
    listTeam().catch(() => []),
    listImages('images').catch(() => []),
  ])

  const tiles = [
    {
      href: '/blog', label: 'Blog', icon: FileText, count: blog.length,
      drafts: blog.filter((p) => p.status === 'draft').length,
      hint: 'Articles & insights',
    },
    {
      href: '/services', label: 'Services', icon: Briefcase, count: services.length,
      drafts: services.filter((s) => s.status === 'draft').length,
      hint: 'Service pages',
    },
    {
      href: '/industries', label: 'Industries', icon: Building2, count: industries.length,
      drafts: industries.filter((i) => i.status === 'draft').length,
      hint: 'Industry pages',
    },
    {
      href: '/team', label: 'Team', icon: Users, count: team.length,
      drafts: team.filter((t) => t.status === 'draft').length,
      hint: 'People',
    },
    {
      href: '/media', label: 'Media', icon: ImageIcon, count: images.length,
      drafts: 0,
      hint: 'Library',
    },
  ]

  // ── Recent activity — merged feed across collections, sorted by `updated` desc.
  const recent: RecentItem[] = [
    ...blog.map<RecentItem>((p) => ({
      kind: 'blog', slug: p.slug, title: p.title, updated: p.updated, status: p.status,
      editHref: `/blog/${p.slug}`,
    })),
    ...services.map<RecentItem>((s) => ({
      kind: 'services', slug: s.slug, title: s.title, updated: s.updated, status: s.status,
      editHref: `/services/${s.slug}`,
    })),
    ...industries.map<RecentItem>((i) => ({
      kind: 'industries', slug: i.slug, title: i.title, updated: i.updated, status: i.status,
      editHref: `/industries/${i.slug}`,
    })),
    ...team.map<RecentItem>((t) => ({
      kind: 'team', slug: t.slug, title: t.name, updated: t.updated, status: t.status,
      editHref: `/team/${t.slug}`,
    })),
  ]
    .filter((r) => !!r.updated)
    .sort((a, b) => (b.updated! < a.updated! ? -1 : 1))
    .slice(0, 8)

  // ── Draft inbox
  const drafts: RecentItem[] = [
    ...blog.filter((p) => p.status === 'draft').map<RecentItem>((p) => ({
      kind: 'blog', slug: p.slug, title: p.title, updated: p.updated, status: p.status,
      editHref: `/blog/${p.slug}`,
    })),
    ...services.filter((s) => s.status === 'draft').map<RecentItem>((s) => ({
      kind: 'services', slug: s.slug, title: s.title, updated: s.updated, status: s.status,
      editHref: `/services/${s.slug}`,
    })),
    ...industries.filter((i) => i.status === 'draft').map<RecentItem>((i) => ({
      kind: 'industries', slug: i.slug, title: i.title, updated: i.updated, status: i.status,
      editHref: `/industries/${i.slug}`,
    })),
    ...team.filter((t) => t.status === 'draft').map<RecentItem>((t) => ({
      kind: 'team', slug: t.slug, title: t.name, updated: t.updated, status: t.status,
      editHref: `/team/${t.slug}`,
    })),
  ]

  // ── SEO gaps — pages without seo.description or (blog) without a cover.
  const seoGaps = {
    blog: blog.filter((p) => !p.seo?.description).length,
    services: services.filter((s) => !s.seo?.description).length,
    industries: industries.filter((i) => !i.seo?.description).length,
    coversMissing: blog.filter((p) => !p.cover).length,
  }
  const totalGaps = seoGaps.blog + seoGaps.services + seoGaps.industries + seoGaps.coversMissing

  return (
    <div className="space-y-10">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="am-eyebrow mb-3">Dashboard</div>
          <h1 className="am-h1-display am-gradient-ink">Content overview</h1>
          <p className="font-display mt-2 text-sm text-navy-500">
            Manage content for alpinemar.com. Every save commits to the repo and triggers a rebuild.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View site
            </a>
          </Button>
          <Button asChild>
            <Link href="/blog/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>
        </div>
      </header>

      {/* ── OVERVIEW TILES ─────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tiles.map((t) => {
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-lg border bg-card p-5 hover:border-navy-300 hover:shadow-sm transition group"
              >
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

      {/* ── RECENT ACTIVITY + DRAFTS INBOX ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="am-eyebrow" style={{ color: 'var(--color-scooter)' }}>Recent activity</div>
            <span className="text-xs text-muted-foreground">Latest edits across all collections</span>
          </div>
          <div className="divide-y">
            {recent.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No edits tracked yet — save any item to start populating this feed.
              </p>
            )}
            {recent.map((r) => {
              const KIcon = KIND_META[r.kind].icon
              return (
                <Link
                  key={`${r.kind}:${r.slug}`}
                  href={r.editHref}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50 transition-colors group"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-500 group-hover:bg-scooter/10 group-hover:text-scooter transition-colors">
                    <KIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-navy-900 line-clamp-1 flex items-center gap-2">
                      {r.title}
                      {r.status === 'draft' && (
                        <Badge variant="muted" className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200">
                          Draft
                        </Badge>
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

        {/* Drafts inbox */}
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
                <Link
                  key={`d:${d.kind}:${d.slug}`}
                  href={d.editHref}
                  className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-amber-50/40 transition-colors group"
                >
                  <KIcon className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-navy-900 line-clamp-1 group-hover:text-amber-800 transition-colors">{d.title}</div>
                    <div className="text-[10px] text-muted-foreground">{KIND_META[d.kind].label}</div>
                  </div>
                </Link>
              )
            })}
            {drafts.length > 8 && (
              <div className="px-5 py-2 text-[11px] text-muted-foreground text-center">
                +{drafts.length - 8} more
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── SEO HEALTH ──────────────────────────────────────── */}
      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="am-eyebrow" style={{ color: 'var(--color-scooter)' }}>SEO health</div>
          <span className="text-xs text-muted-foreground">
            {totalGaps === 0 ? 'All content has SEO metadata' : `${totalGaps} gap${totalGaps === 1 ? '' : 's'} to review`}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
          <SeoStat
            label="Blog"
            count={seoGaps.blog}
            total={blog.length}
            hint="missing meta description"
            href="/blog"
          />
          <SeoStat
            label="Services"
            count={seoGaps.services}
            total={services.length}
            hint="missing meta description"
            href="/services"
          />
          <SeoStat
            label="Industries"
            count={seoGaps.industries}
            total={industries.length}
            hint="missing meta description"
            href="/industries"
          />
          <SeoStat
            label="Blog covers"
            count={seoGaps.coversMissing}
            total={blog.length}
            hint="missing cover image"
            href="/blog"
          />
        </div>
      </section>

      {/* ── QUICK CREATE ────────────────────────────────────── */}
      <section>
        <div className="am-eyebrow mb-4">Quick create</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickCreate href="/blog/new" icon={FileText} label="New post" hint="Insights article" />
          <QuickCreate href="/services/new" icon={Briefcase} label="New service" hint="Service page" />
          <QuickCreate href="/industries/new" icon={Building2} label="New industry" hint="Industry page" />
          <QuickCreate href="/team/new" icon={Users} label="New team member" hint="About page roster" />
        </div>
      </section>
    </div>
  )
}

// ─── Little presentational bits ─────────────────────────────

function SeoStat({
  label, count, total, hint, href,
}: { label: string; count: number; total: number; hint: string; href: string }) {
  const ok = count === 0
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 p-5 hover:bg-navy-50/50 transition-colors group"
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        <span className="font-display text-sm font-medium text-navy-900">{label}</span>
      </div>
      <div className="font-display text-xl font-medium text-navy-900">
        {ok ? '0' : count} <span className="text-sm text-navy-400 font-normal">/ {total}</span>
      </div>
      <p className="text-xs text-muted-foreground">{ok ? `All ${total} have descriptions` : hint}</p>
    </Link>
  )
}

function QuickCreate({
  href, icon: Icon, label, hint,
}: { href: string; icon: typeof FileText; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-5 hover:border-scooter hover:shadow-sm transition group"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 text-white group-hover:bg-scooter group-hover:text-navy-900 transition-colors">
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-4 font-display text-sm font-medium text-navy-900">{label}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  )
}

import Link from 'next/link'
import { FileText, Users, Settings as SettingsIcon, Briefcase, PenLine, LayoutTemplate, ArrowRight, Rocket } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: typeof FileText
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-lg border bg-card p-6">
      <h2 className="flex items-center gap-2.5 text-base font-semibold">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-navy-50">
          <Icon className="h-4 w-4 text-navy-700" />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-navy-700">{children}</div>
    </section>
  )
}

function GoTo({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-medium text-scooter-dark hover:underline">
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

export default function ITGuidePage() {
  return (
    <div>
      <PageHeader title="IT Guide" description="What you can edit on the IT site (it.alpinemar.com) and where." />

      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {[
          ['it-overview', 'Overview'],
          ['it-blog', 'Blog & Featured'],
          ['it-services', 'Services'],
          ['it-team', 'Team'],
          ['it-authors', 'Authors'],
          ['it-pages', 'Pages & Navigation'],
          ['it-settings', 'Settings'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border px-3 py-1 text-navy-600 hover:border-scooter hover:text-scooter-dark">
            {label}
          </a>
        ))}
      </div>

      <div className="space-y-4 max-w-3xl">
        <Section id="it-overview" icon={Rocket} title="Overview">
          <p>
            This is the <strong>IT Site</strong> half of the CMS — use the{' '}
            <strong>Main Site / IT Site</strong> switcher at the top of the sidebar to move
            between the two. Everything here writes to the IT site&rsquo;s content
            (<span className="font-mono text-xs">it-site/…</span>) and, on save, commits to
            the repo and rebuilds <strong>it.alpinemar.com</strong>.
          </p>
        </Section>

        <Section id="it-blog" icon={FileText} title="Blog & the Featured post">
          <p>
            <GoTo href="/it/blog">IT Blog</GoTo> manages the Insights articles. Each post has a
            title, excerpt, body (rich text), cover image, category, tags, author, and SEO
            title/description.
          </p>
          <p>
            The <strong>Featured on the blog home</strong> checkbox pins a post to the large
            Featured card at the top of <span className="font-mono text-xs">/blog/</span>. Leave
            it off on every post and the site falls back to the newest Cybersecurity article. If
            more than one is checked, the newest wins.
          </p>
          <p className="text-xs text-muted-foreground">
            Note: the cover image and tags are stored but not yet shown on the IT blog template —
            they&rsquo;re kept for future use.
          </p>
        </Section>

        <Section id="it-services" icon={Briefcase} title="Services">
          <p>
            <GoTo href="/it/services">IT Services</GoTo> manages the service pages. Each has a
            title, hero title, path, summary, group, cover, SEO, and the article body edited as
            raw HTML — leave the <span className="font-mono">am-subsvc-grid</span> block intact.
          </p>
        </Section>

        <Section id="it-team" icon={Users} title="Team">
          <p>
            <GoTo href="/it/team">IT Team</GoTo> manages the members shown on the IT About page,
            sorted by Order. Each has a name, role, photo, email, and a LinkedIn URL. Only
            members with a photo appear on the live site.
          </p>
        </Section>

        <Section id="it-authors" icon={PenLine} title="Authors">
          <p>
            <GoTo href="/it/authors">IT Authors</GoTo> manages blog author profiles (name, title,
            photo, bio). The IT Blog author field is a dropdown fed by this collection, and the
            author&rsquo;s role on a post is looked up here.
          </p>
        </Section>

        <Section id="it-pages" icon={LayoutTemplate} title="Pages & Navigation">
          <p>
            <GoTo href="/it/homepage">IT Pages</GoTo> edits the homepage cards, About values,
            service-line blurbs, business hours, the service-page CTA, and HubSpot config.{' '}
            <GoTo href="/it/navigation">IT Navigation</GoTo> edits the Services mega-menu (primary
            tabs and their sub-services). <GoTo href="/it/schema">IT Schema</GoTo> manages JSON-LD,
            and <GoTo href="/it/redirects">IT Redirects</GoTo> the 301s.
          </p>
        </Section>

        <Section id="it-settings" icon={SettingsIcon} title="Settings">
          <p>
            <GoTo href="/it/settings">IT Settings</GoTo> edits site-wide details:
            firm name, tagline, description, contact info, address, socials, portal links, and
            the top navigation.
          </p>
          <p className="text-xs text-muted-foreground">
            The footer renders social icons <strong>by position</strong> — keep the order
            Facebook · X · Instagram · LinkedIn. The Services mega-menu is edited under
            <strong> IT Navigation</strong>, not here.
          </p>
        </Section>
      </div>
    </div>
  )
}

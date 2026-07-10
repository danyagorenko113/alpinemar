import Link from 'next/link'
import {
  FileText,
  Briefcase,
  PenLine,
  ImageIcon,
  Table,
  Search,
  LayoutList,
  ArrowRight,
  Rocket,
  Home,
  Star,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'

/**
 * Static "what can I edit?" guide. One section per capability the client
 * asked about in the CMS audit — written so a first-time editor can confirm
 * a feature exists and find it without asking.
 */

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
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-medium text-scooter-dark hover:underline"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

const TOC = [
  { id: 'publishing', label: 'Saving & publishing (start here)' },
  { id: 'services', label: 'Service pages — every section' },
  { id: 'banners', label: 'Banner images & ALT text' },
  { id: 'authors', label: 'Authors & bios' },
  { id: 'categories', label: 'Blog categories vs tags' },
  { id: 'tables', label: 'Tables in the editor' },
  { id: 'seo', label: 'SEO & canonical URLs' },
  { id: 'media', label: 'Media manager' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Site settings' },
]

export default function GuidePage() {
  return (
    <div>
      <PageHeader
        title="CMS Guide"
        description="What you can edit and where to find it — everything on the live site is controlled from here."
      />

      <nav className="mb-5 flex flex-wrap gap-2">
        {TOC.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-navy-600 hover:border-scooter hover:text-scooter-dark"
          >
            {t.label}
          </a>
        ))}
      </nav>

      <div className="space-y-5 max-w-3xl">
        <Section id="publishing" icon={Rocket} title="Saving & publishing — how changes go live">
          <p>
            Every editor has a <strong>Save</strong> button in the bar at the bottom. When you
            save, the change is committed and the live site rebuilds automatically — it appears
            on alpinemar.com within about a minute. There is no separate &ldquo;publish&rdquo;
            step.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Draft vs Published</strong> — set in each editor&rsquo;s Status box. Drafts are saved but hidden from the live site; switch to Published to show them.</li>
            <li><strong>Unsaved changes</strong> — the bottom bar warns you if you try to leave with edits you haven&rsquo;t saved.</li>
            <li><strong>View on site</strong> — the button in the bottom bar opens the live page so you can check your change after the rebuild.</li>
            <li><strong>Delete</strong> — the red &ldquo;Danger zone&rdquo; at the bottom of an editor removes that item from the site (asks for confirmation first).</li>
          </ul>
        </Section>

        <Section id="services" icon={Briefcase} title="Service pages — every section is editable">
          <p>
            Open any service and you control the whole page, not just the body copy:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Hero title (H1)</strong> — its own field under Title.</li>
            <li><strong>Key takeaways</strong> — the &ldquo;What you get&rdquo; cards.</li>
            <li><strong>What&rsquo;s included</strong> — the deliverables checklist.</li>
            <li><strong>Process</strong> — the &ldquo;How we work&rdquo; numbered steps.</li>
            <li><strong>FAQ</strong> — questions and answers (blank = the default set).</li>
            <li><strong>Why Alpine Mar</strong> — the three pillar cards (blank = firm default).</li>
            <li><strong>Section headings</strong> — each section&rsquo;s on-page label, heading, and intro sentence are edited right inside that section&rsquo;s card (the &ldquo;Heading &amp; intro text&rdquo; toggle). Blank fields keep the default shown as the greyed placeholder.</li>
            <li><strong>Page sections</strong> (right sidebar) — hide any of the nine sections with a checkbox or reorder them with arrows, per page.</li>
            <li><strong>Featured review</strong> (right sidebar) — choose which Google review shows on this page.</li>
          </ul>
          <p><GoTo href="/services">Open Services</GoTo></p>
        </Section>

        <Section id="banners" icon={ImageIcon} title="Banner images & ALT text">
          <p>
            Every page type has a <strong>Cover image</strong> card in the right sidebar of its
            editor — that image is the banner at the top of the live page (and the social-share
            image). The same card has the <strong>alt text</strong> field. Images inside article
            bodies get an alt-text prompt on upload; click an image in the editor for an
            &ldquo;Edit alt&rdquo; button, or change any file&rsquo;s alt in the Media library —
            it applies site-wide wherever content didn&rsquo;t set its own.
          </p>
          <p><GoTo href="/services">Services</GoTo> · <GoTo href="/industries">Industries</GoTo> · <GoTo href="/blog">Blog</GoTo></p>
        </Section>

        <Section id="authors" icon={PenLine} title="Authors & bios">
          <p>
            Blog authors live under <strong>Authors</strong> in the sidebar. Each author has a
            name, job title, photo with alt text, LinkedIn URL, a rich-text bio, and a
            draft/published status. Blog posts pick their author from this list, and the post
            page renders the photo + bio automatically.
          </p>
          <p><GoTo href="/authors">Open Authors</GoTo></p>
        </Section>

        <Section id="categories" icon={LayoutList} title="Blog categories vs tags">
          <p>
            Following the original site&rsquo;s convention, every post has exactly{' '}
            <strong>one Category</strong> (dropdown in the post editor — these were imported
            from the WordPress site). Category is the <strong>primary</strong> way readers
            browse: it&rsquo;s the chip on every blog card, the filter bar on the blog home,
            and each category has its own <code>/blog/category/…</code> page — plus it drives
            the &ldquo;Read next&rdquo; sidebar. <strong>Tags</strong> are a separate, optional
            layer shown at the bottom of the article. The post list here can be filtered by
            category, tag, or search.
          </p>
          <p><GoTo href="/blog">Open Blog</GoTo></p>
        </Section>

        <Section id="tables" icon={Table} title="Tables in the editor">
          <p>
            The editor renders tables exactly like the live site (header row, striped rows).
            Insert one with the <strong>table button</strong> in the toolbar; when your cursor
            is inside a table a control bar appears with add/remove row &amp; column, header-row
            toggle, and delete. Existing tables in migrated posts open and edit the same way —
            no HTML needed.
          </p>
        </Section>

        <Section id="seo" icon={Search} title="SEO & canonical URLs">
          <p>
            Every page type has an <strong>SEO</strong> card: title tag, meta description, and a{' '}
            <strong>canonical URL</strong> field. Canonical is self-referencing by default —
            only fill it to point somewhere else. Meta data for services was imported from the
            live site. Internal links are converted to absolute URLs at publish time
            automatically.
          </p>
        </Section>

        <Section id="media" icon={ImageIcon} title="Media manager">
          <p>
            The Media library supports <strong>folders</strong> (create, rename, delete),
            <strong> sorting</strong> by upload date (newest / oldest) or name (A–Z / Z–A),
            folder filtering, and search. Click any image to edit its <strong>alt text</strong>,
            copy its URL, or <strong>move it to another folder</strong>. Uploads pick their
            destination folder from a dropdown (with a &ldquo;New folder&rdquo; option).
          </p>
          <p><GoTo href="/media">Open Media</GoTo></p>
        </Section>

        <Section id="homepage" icon={Home} title="Homepage">
          <p>
            The <strong>Homepage</strong> editor holds curated lists (featured services and
            industries, value props, latest posts, partner logos, integrations). <strong>Note:</strong>{' '}
            the live homepage currently renders fixed content, so edits here don&rsquo;t change
            the homepage yet — wiring these lists into the homepage is a pending dev task, called
            out at the top of that editor. The Services/Industries menus and hub pages are driven
            from the master service and industry lists, not from these fields.
          </p>
          <p><GoTo href="/homepage">Open Homepage</GoTo></p>
        </Section>

        <Section id="reviews" icon={Star} title="Reviews">
          <p>
            <strong>Reviews</strong> holds the 5-star Google testimonials. Each service page
            picks one to feature (the &ldquo;Featured review&rdquo; box in the service editor).
            Name, initials (the avatar letters), the &ldquo;4 months ago&rdquo;-style date, and
            the quote are all editable.
          </p>
          <p><GoTo href="/reviews">Open Reviews</GoTo></p>
        </Section>

        <Section id="team" icon={Users} title="Team">
          <p>
            <strong>Team</strong> members appear in the &ldquo;Meet the Team&rdquo; carousel on
            the About page, sorted by the Order field (lower first). The live card shows the
            photo, name, and role — so a member <strong>must have a photo</strong> to appear,
            and any letters like &ldquo;CPA&rdquo; should be typed into the Name. Credentials and
            Bio are stored but not shown on the current card. Set Status to Draft to hide someone
            without deleting them.
          </p>
          <p><GoTo href="/team">Open Team</GoTo></p>
        </Section>

        <Section id="settings" icon={SettingsIcon} title="Site settings">
          <p>
            <strong>Settings</strong> controls site-wide info — firm name, contact details,
            address, social links, and portal URLs — used in the header, footer, contact page,
            and structured data. A change here shows up everywhere at once, so double-check
            before saving.
          </p>
          <p><GoTo href="/settings">Open Settings</GoTo></p>
        </Section>
      </div>
    </div>
  )
}

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
  { id: 'services', label: 'Service pages — every section' },
  { id: 'banners', label: 'Banner images & ALT text' },
  { id: 'authors', label: 'Authors & bios' },
  { id: 'categories', label: 'Blog categories vs tags' },
  { id: 'tables', label: 'Tables in the editor' },
  { id: 'seo', label: 'SEO & canonical URLs' },
  { id: 'media', label: 'Media manager' },
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
            <li><strong>Section headings &amp; intro copy</strong> — override the eyebrow, heading, and intro of every section, plus button labels. Placeholders show what renders when a field is left blank.</li>
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
            <strong> sorting by upload date</strong> (newest / oldest), search, and per-image{' '}
            <strong>alt text</strong> — click any image to edit its alt or rename the file.
            Uploads pick their destination folder from a dropdown (with a &ldquo;New
            folder&rdquo; option).
          </p>
          <p><GoTo href="/media">Open Media</GoTo></p>
        </Section>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUploader } from '@/components/shared/image-uploader'
import { TagInput } from '@/components/shared/tag-input'
import { StringList } from '@/components/shared/string-list'
import { StructList } from '@/components/shared/struct-list'
import { HelpTip } from '@/components/shared/help-tip'
import { SectionOrder, type SectionDef } from '@/components/shared/section-order'
import { SectionCopyEditor, type CopySectionDef } from '@/components/shared/section-copy-editor'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveService,
  deleteService,
  type Service,
  type ServiceFrontmatter,
  type ServiceGroup,
  type ServiceSectionKey,
} from '@/lib/actions/services'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Service
  industrySlugs: string[]
  /** Names of the global Google reviews, in list order — for the review picker. */
  reviewNames?: string[]
}

const GROUPS: ServiceGroup[] = ['Tax', 'Accounting', 'Advisory', 'Compliance']
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

/** Detail-page sections in the site's default render order. */
const SECTION_DEFS: SectionDef<ServiceSectionKey>[] = [
  { key: 'benefits', label: 'What you get', hint: '(takeaways)' },
  { key: 'included', label: "What's included" },
  { key: 'process', label: 'How we work' },
  { key: 'deepdive', label: 'Deep dive', hint: '(body)' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'industries', label: 'Industries' },
  { key: 'pillars', label: 'Why Alpine Mar' },
  { key: 'related', label: 'Related services' },
  { key: 'faq', label: 'FAQ' },
]

/** Placeholders mirror the defaults baked into src/pages/services/[...slug].astro. */
const COPY_DEFS: CopySectionDef[] = [
  { key: 'benefits', label: 'What you get', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'What you get' },
    { key: 'heading', label: 'Heading', placeholder: 'The engagement, in a nutshell.' },
    { key: 'intro', label: 'Intro', placeholder: 'Every Alpine Mar … engagement is built on the same four commitments.', textarea: true },
  ]},
  { key: 'included', label: "What's included", fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: "What's included" },
    { key: 'heading', label: 'Heading', placeholder: 'A defined scope, not a black box.' },
    { key: 'intro', label: 'Intro', placeholder: "Engagements are scoped before they start. Here's what a typical … engagement covers.", textarea: true },
  ]},
  { key: 'process', label: 'How we work', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'How we work' },
    { key: 'heading', label: 'Heading', placeholder: 'From first call to closed loop.' },
    { key: 'intro', label: 'Intro', placeholder: 'Four predictable steps. No surprise scope creep, no junior handoffs…', textarea: true },
  ]},
  { key: 'deepdive', label: 'Deep dive (body)', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Deep dive' },
    { key: 'heading', label: 'Heading', placeholder: 'The detail, if you want it.' },
    { key: 'intro', label: 'Intro', placeholder: 'The full breakdown of how we approach …', textarea: true },
    { key: 'aside', label: 'Sidebar card text', placeholder: 'Skip the long read? The summary above plus the FAQ below cover 90%…', textarea: true },
  ]},
  { key: 'reviews', label: 'Reviews', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Client view' },
  ]},
  { key: 'industries', label: 'Industries', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: "Who it's for" },
    { key: 'heading', label: 'Heading', placeholder: 'Industries we run this for.' },
    { key: 'intro', label: 'Intro', placeholder: 'Specialized playbooks for the verticals we know best…', textarea: true },
  ]},
  { key: 'pillars', label: 'Why Alpine Mar', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Why Alpine Mar' },
    { key: 'heading', label: 'Heading', placeholder: 'A strategy that works as hard as you do.' },
    { key: 'intro', label: 'Intro', placeholder: "You'll hear from us before tax season, not just during it…", textarea: true },
  ]},
  { key: 'related', label: 'Related services', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'More <group> services' },
    { key: 'heading', label: 'Heading', placeholder: 'Often booked alongside this one.' },
    { key: 'button', label: 'Link label', placeholder: 'All services' },
  ]},
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Common questions' },
    { key: 'heading', label: 'Heading', placeholder: 'Before you book the call.' },
    { key: 'intro', label: 'Intro', placeholder: 'Quick answers to the things most people ask…', textarea: true },
  ]},
  { key: 'cta', label: 'Final CTA', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Ready to start?' },
    { key: 'heading', label: 'Heading', placeholder: "Let's get on a first name basis." },
    { key: 'button', label: 'Button label (both CTA buttons)', placeholder: 'Request a Consultation' },
  ]},
]

const empty: Service = {
  slug: '',
  title: '',
  heroTitle: '',
  path: '',
  summary: '',
  cover: '',
  coverAlt: '',
  group: undefined,
  sections: undefined,
  sectionCopy: undefined,
  pillars: [],
  reviewIndex: undefined,
  takeaways: [],
  included: [],
  process: [],
  faq: [],
  industries: [],
  status: 'published',
  seo: { title: '', description: '', canonical: '' },
  body: '',
}

export function ServicesForm({ initial, industrySlugs, reviewNames = [] }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [s, setS] = useState<Service>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof Service>(k: K, v: Service[K]) {
    setS((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }
  function updateSeo<K extends keyof NonNullable<ServiceFrontmatter['seo']>>(
    k: K,
    v: NonNullable<ServiceFrontmatter['seo']>[K],
  ) {
    setS((p) => ({ ...p, seo: { ...(p.seo ?? {}), [k]: v } }))
    setDirty(true)
  }

  function handleTitleChange(v: string) {
    update('title', v)
    if (!slugTouched) update('slug', slugify(v))
  }

  function handleSave() {
    if (!s.title.trim()) return toast.error('Title is required')
    if (!s.slug.trim()) return toast.error('Slug is required')
    if (!s.summary.trim()) return toast.error('Summary is required')

    startTransition(async () => {
      try {
        const fm: ServiceFrontmatter = {
          title: s.title,
          heroTitle: s.heroTitle?.trim() || undefined,
          path: s.path || `/services/${s.slug}/`,
          summary: s.summary,
          cover: s.cover || undefined,
          coverAlt: s.coverAlt?.trim() || undefined,
          group: s.group,
          sections: s.sections,
          sectionCopy: s.sectionCopy,
          pillars: s.pillars,
          reviewIndex: s.reviewIndex || undefined,
          takeaways: s.takeaways,
          included: s.included,
          process: s.process,
          faq: s.faq,
          industries: s.industries,
          status: s.status,
          seo: s.seo,
        }
        const res = await saveService({ slug: s.slug, frontmatter: fm, body: s.body, sha: s.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/services/${res.slug}`)
        else { setS((prev) => ({ ...prev, sha: res.sha })); router.refresh() }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleDelete() {
    if (!initial) return
    startTransition(async () => {
      try {
        await deleteService(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push('/services')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  const livePath = initial ? initial.path || `/services/${initial.slug}/` : ''
  const canonicalPlaceholder = `${SITE_URL}${s.path || `/services/${s.slug || '…'}/`}`

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-24">
        <div className="space-y-5 min-w-0">
          <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
            Every section of the live page is controlled here — takeaways, process steps, FAQ,
            pillars, section headings, and the banner. Use <strong>Page sections</strong> (right
            sidebar) to hide or reorder sections.{' '}
            <a href="/guide#services" className="font-medium text-scooter-dark hover:underline">
              See the guide
            </a>
          </div>
          <section className="rounded-lg border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={s.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Audit & Attestation Services"
                className="text-lg h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-title">
                Hero title (H1)
                <HelpTip title="How this works">
                  The big headline over the banner image on the live page. Blank = the Title
                  above. Title is also used for the browser tab, breadcrumb, and cards
                  linking to this service.
                </HelpTip>
              </Label>
              <Input
                id="hero-title"
                value={s.heroTitle ?? ''}
                onChange={(e) => update('heroTitle', e.target.value)}
                placeholder={s.title || 'Falls back to Title'}
              />
              <p className="text-xs text-muted-foreground">
                The big headline on the page banner. Leave blank to use the Title.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={s.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    update('slug', slugify(e.target.value))
                  }}
                />
                <p className="text-xs text-muted-foreground">URL: /services/{s.slug || '…'}/</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="path">Path override</Label>
                <Input id="path" value={s.path} onChange={(e) => update('path', e.target.value)} placeholder="/services/…/" />
                <p className="text-xs text-muted-foreground">Leave blank to auto-derive from slug.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={s.summary}
                onChange={(e) => update('summary', e.target.value)}
                rows={3}
                placeholder="Short paragraph shown on the services hub & service hero."
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Body</h2>
              <span className="text-xs text-muted-foreground">Long-form content</span>
            </div>
            <RichTextEditor
              value={s.body}
              onChange={(html) => update('body', html)}
              placeholder="Long-form service description, methodology, FAQs, etc."
              uploadDir="images/services"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Key takeaways
                <HelpTip title="What you get section">
                  Each line becomes a numbered card in the &ldquo;What you get&rdquo; section.
                  Leave the list empty to show the four standard Alpine Mar commitments. Hide
                  or move the whole section via Page sections in the sidebar.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">"What you get" cards — 4 per row, any count renders</span>
            </div>
            <StringList
              value={s.takeaways}
              onChange={(v) => update('takeaways', v)}
              placeholder="e.g. Audit-ready financials every quarter"
              addLabel="Add takeaway"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                What's included
                <HelpTip title="Deliverables checklist">
                  Renders as the checkmark list in the dark &ldquo;What&rsquo;s included&rdquo;
                  band. If the list is empty the section is hidden automatically.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Deliverables list</span>
            </div>
            <StringList
              value={s.included}
              onChange={(v) => update('included', v)}
              placeholder="e.g. Monthly close & reconciliations"
              addLabel="Add deliverable"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Process
                <HelpTip title="How we work section">
                  Each entry is one numbered step card (Step 01, 02…). Leave empty to show
                  the standard four-step engagement process.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">"How we work" — numbered steps</span>
            </div>
            <StructList
              value={s.process}
              onChange={(v) => update('process', v)}
              fields={[
                { key: 'title', label: 'Step title', placeholder: 'e.g. Discovery & scoping' },
                { key: 'body', label: 'Step description', textarea: true, placeholder: 'What happens in this step…' },
              ]}
              defaultItem={{ title: '', body: '' }}
              addLabel="Add step"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                FAQ
                <HelpTip title="Common questions section">
                  Accordion at the bottom of the page (the first question renders open).
                  Empty = the default set of four engagement questions.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Empty = default 4-question set</span>
            </div>
            <StructList
              value={s.faq}
              onChange={(v) => update('faq', v)}
              fields={[
                { key: 'q', label: 'Question', placeholder: 'e.g. How long does an audit take?' },
                { key: 'a', label: 'Answer', textarea: true, placeholder: 'Answer…' },
              ]}
              defaultItem={{ q: '', a: '' }}
              addLabel="Add question"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Why Alpine Mar
                <HelpTip title="Pillar cards">
                  The three white cards in the dark &ldquo;Why Alpine Mar&rdquo; band. Add
                  your own to replace the firm-wide defaults on this page only.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Empty = default three pillars</span>
            </div>
            <StructList
              value={s.pillars}
              onChange={(v) => update('pillars', v)}
              fields={[
                { key: 'title', label: 'Pillar title', placeholder: 'e.g. Proactive approach' },
                { key: 'body', label: 'Pillar text', textarea: true, placeholder: 'Why clients pick Alpine Mar…' },
              ]}
              defaultItem={{ title: '', body: '' }}
              addLabel="Add pillar"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Section headings & intro copy
                <HelpTip title="Override any section's copy">
                  Every section&rsquo;s eyebrow label, big heading, and intro paragraph (plus
                  CTA button labels) can be overridden per page. Placeholders show exactly
                  what renders when a field is left blank — type only where you want to
                  differ.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Blank = site default (shown as placeholder)</span>
            </div>
            <SectionCopyEditor
              defs={COPY_DEFS}
              value={s.sectionCopy}
              onChange={(v) => update('sectionCopy', v)}
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold">SEO</h2>
            <div className="space-y-1.5">
              <Label>SEO title</Label>
              <Input value={s.seo?.title ?? ''} onChange={(e) => updateSeo('title', e.target.value)} placeholder="Falls back to title" />
            </div>
            <div className="space-y-1.5">
              <Label>Meta description</Label>
              <Textarea value={s.seo?.description ?? ''} onChange={(e) => updateSeo('description', e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Canonical URL
                <HelpTip title="How canonical works">
                  Every page gets a self-referencing canonical tag automatically. Only fill
                  this to point search engines at a different URL.
                </HelpTip>
              </Label>
              <Input
                value={s.seo?.canonical ?? ''}
                onChange={(e) => updateSeo('canonical', e.target.value)}
                placeholder={canonicalPlaceholder}
              />
              <p className="text-xs text-muted-foreground">Leave blank for the self-referencing default shown above.</p>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={s.status}
              onChange={(e) => update('status', e.target.value as Service['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground">Drafts hidden from the services hub.</p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Cover image
              <HelpTip title="This is the page banner">
                The full-width banner image at the top of the service page — and the image
                used for social sharing. Upload or replace it here and set its ALT text in
                the field below.
              </HelpTip>
            </Label>
            <ImageUploader
              value={s.cover ?? ''}
              onChange={(url) => update('cover', url)}
              uploadDir="images/services"
              alt={s.coverAlt ?? ''}
              onAltChange={(v) => update('coverAlt', v)}
              altLabel="Cover alt text"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="group">Group</Label>
              <select
                id="group"
                value={s.group ?? ''}
                onChange={(e) => update('group', (e.target.value || undefined) as ServiceGroup | undefined)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— None —</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Categorizes the service on the hub.</p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Page sections
              <HelpTip title="Hide & reorder sections">
                Controls the live page layout: uncheck a section to remove it from this page,
                use the arrows to change the order. All nine sections are controllable —
                including the body (Deep dive), Industries, Why Alpine Mar, and Related
                services.
              </HelpTip>
            </Label>
            <SectionOrder<ServiceSectionKey>
              defs={SECTION_DEFS}
              value={s.sections}
              onChange={(v) => update('sections', v)}
            />
            <p className="text-xs text-muted-foreground">
              Uncheck to hide a section; reorder with the arrows. Default arrangement keeps the frontmatter clean.
            </p>
          </section>

          {reviewNames.length > 0 && (
            <section className="rounded-lg border bg-card p-5 space-y-3">
              <Label htmlFor="review-pick">
                Featured review
                <HelpTip title="Per-page review">
                  Which Google review appears in this page&rsquo;s Reviews section. The
                  reviews themselves are managed under <strong>Reviews</strong> in the
                  sidebar; hide the section entirely via Page sections above.
                </HelpTip>
              </Label>
              <select
                id="review-pick"
                value={s.reviewIndex ?? 0}
                onChange={(e) => update('reviewIndex', Number(e.target.value) || undefined)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {reviewNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Shown in the Reviews section of this page. Manage the reviews themselves under Reviews.
              </p>
            </section>
          )}

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cross-link industries</Label>
            <TagInput
              value={s.industries}
              onChange={(v) => update('industries', v)}
              suggestions={industrySlugs}
              placeholder="Add industry slug…"
            />
            <p className="text-xs text-muted-foreground">Renders as related industries on this page.</p>
          </section>

          {initial && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                Delete service
              </Button>
            </section>
          )}
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            {initial ? (
              <>
                Editing <span className="font-mono text-navy-700">{initial.slug}</span>
                {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
              </>
            ) : (
              'New service'
            )}
          </div>
          <div className="flex items-center gap-2">
            {initial && (
              <Button asChild variant="outline">
                <a href={`${SITE_URL}${livePath}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on site
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create service'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.title}"?`}
        description="The .md file will be removed from the repo."
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

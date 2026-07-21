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
import { SectionCopyEditor, type CopySectionDef, type SectionCopy } from '@/components/shared/section-copy-editor'
import { SectionHeadingFields } from '@/components/shared/section-heading-fields'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveService,
  deleteService,
  type Service,
  type ServiceFrontmatter,
  type ServiceGroup,
  type ServiceSectionKey,
  type ServiceCopyKey,
} from '@/lib/actions/services'
import { slugify } from '@/lib/utils'
import {
  DEFAULT_TAKEAWAYS,
  DEFAULT_PROCESS,
  DEFAULT_PILLARS,
  defaultFaq,
  equalsDefault,
} from '@/lib/service-section-defaults'

interface Props {
  initial?: Service
  industrySlugs: string[]
  /** Names of the global Google reviews, in list order — for the review picker. */
  reviewNames?: string[]
  /** Existing group names (mega-menu categories + groups already in use). */
  groupOptions?: string[]
}

const NEW_GROUP = '__new_group__'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

/** Detail-page sections in the site's default render order. */
const SECTION_DEFS: SectionDef<ServiceSectionKey>[] = [
  { key: 'benefits', label: 'What you get', hint: '(takeaways)' },
  { key: 'process', label: 'How we work' },
  { key: 'deepdive', label: 'Deep dive', hint: '(body)' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'industries', label: 'Industries' },
  { key: 'pillars', label: 'Why Alpine Mar' },
  { key: 'related', label: 'Related services' },
  { key: 'faq', label: 'FAQ' },
]

/** Placeholders mirror the defaults baked into src/pages/services/[...slug].astro. */
const COPY_DEFS: CopySectionDef<ServiceCopyKey>[] = [
  { key: 'benefits', label: 'What you get', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'What you get' },
    { key: 'heading', label: 'Heading', placeholder: 'The engagement, in a nutshell.' },
    { key: 'intro', label: 'Intro', placeholder: 'Every Alpine Mar … engagement is built on the same four commitments.', textarea: true },
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

/** Heading fields for one section, embedded inside that section's card. */
const copyFieldsFor = (key: ServiceCopyKey) => COPY_DEFS.find((d) => d.key === key)?.fields ?? []
/** Sections with no content card of their own (auto/sidebar-driven) — their
 *  headings live in one small block instead. */
const AUTO_COPY_DEFS = COPY_DEFS.filter((d) => (['reviews', 'industries', 'related', 'cta'] as string[]).includes(d.key))

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
  process: [],
  faq: [],
  industries: [],
  status: 'published',
  seo: { title: '', description: '', canonical: '' },
  body: '',
}

/**
 * The auto-generated per-service hero the page falls back to when `cover` is
 * unset: /images/services/<slug>.jpg (derived from the path, same as the site).
 */
function autoHeroFor(svc: Service): string {
  const slug = (svc.path || `/services/${svc.slug}/`).replace(/^\/services\//, '').replace(/\/$/, '')
  return slug ? `/images/services/${slug}.jpg` : ''
}

/**
 * Prefill the structured sections with the site's default content when empty,
 * so the editor sees exactly what renders on the live page and can edit it.
 * The cover is prefilled with the auto hero (existing services only) so the
 * banner shows in the CMS; on save it's stripped back if left unchanged.
 */
function withSectionPrefills(svc: Service): Service {
  return {
    ...svc,
    cover: svc.cover || (svc.slug ? autoHeroFor(svc) : ''),
    takeaways: svc.takeaways.length ? svc.takeaways : DEFAULT_TAKEAWAYS.map((t) => ({ ...t })),
    process: svc.process.length ? svc.process : DEFAULT_PROCESS.map((p) => ({ ...p })),
    pillars: svc.pillars.length ? svc.pillars : DEFAULT_PILLARS.map((p) => ({ ...p })),
    faq: svc.faq.length ? svc.faq : defaultFaq(svc.title).map((f) => ({ ...f })),
  }
}

export function ServicesForm({ initial, industrySlugs, reviewNames = [], groupOptions = [] }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [s, setS] = useState<Service>(() => withSectionPrefills(initial ?? empty))
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [newGroup, setNewGroup] = useState(
    () => !!initial?.group && groupOptions.length > 0 && !groupOptions.includes(initial.group),
  )

  useUnsavedChanges(dirty)

  // Current group may not be in the options list yet — keep it selectable.
  const groupChoices = [...groupOptions]
  if (s.group && !groupChoices.includes(s.group)) groupChoices.push(s.group)
  groupChoices.sort()

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
  function updateSectionCopy(key: ServiceCopyKey, val: SectionCopy | undefined) {
    setS((p) => {
      const next = { ...(p.sectionCopy ?? {}) }
      if (val) next[key] = val
      else delete next[key]
      return { ...p, sectionCopy: Object.keys(next).length ? next : undefined }
    })
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

    // Sections still equal to the site defaults are saved as empty, so the
    // file stays clean and keeps using the template default — only edited
    // sections get written to the .md file.
    const takeaways = equalsDefault(s.takeaways, DEFAULT_TAKEAWAYS) ? [] : s.takeaways
    const process = equalsDefault(s.process, DEFAULT_PROCESS) ? [] : s.process
    const pillars = equalsDefault(s.pillars, DEFAULT_PILLARS) ? [] : s.pillars
    const faq = equalsDefault(s.faq, defaultFaq(s.title)) ? [] : s.faq

    startTransition(async () => {
      try {
        const fm: ServiceFrontmatter = {
          title: s.title,
          heroTitle: s.heroTitle?.trim() || undefined,
          path: s.path || `/services/${s.slug}/`,
          summary: s.summary,
          cover: s.cover && s.cover !== autoHeroFor(s) ? s.cover : undefined,
          coverAlt: s.coverAlt?.trim() || undefined,
          group: s.group,
          sections: s.sections,
          sectionCopy: s.sectionCopy,
          pillars: pillars,
          reviewIndex: s.reviewIndex || undefined,
          takeaways: takeaways,
          process: process,
          faq: faq,
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

          {/* Sections are ordered to match the live page: What you get →
              How we work → Deep dive → Why Alpine Mar → FAQ. */}
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Key takeaways
                <HelpTip title="What you get section">
                  Each entry is a numbered card in the &ldquo;What you get&rdquo; section — a
                  title plus a short supporting line. These are pre-filled with the site&rsquo;s
                  default cards; edit them to make this service specific. Clear all to fall back
                  to the defaults.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">"What you get" cards — title + line</span>
            </div>
            <SectionHeadingFields
              value={s.sectionCopy?.benefits}
              fields={copyFieldsFor('benefits')}
              onChange={(v) => updateSectionCopy('benefits', v)}
            />
            <StructList
              value={s.takeaways}
              onChange={(v) => update('takeaways', v)}
              fields={[
                { key: 'title', label: 'Card title', placeholder: 'e.g. Partner Involvement' },
                { key: 'body', label: 'Supporting line', textarea: true, placeholder: 'One sentence under the title…' },
              ]}
              defaultItem={{ title: '', body: '' }}
              addLabel="Add takeaway"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Process
                <HelpTip title="How we work section">
                  Each entry is one numbered step card (Step 01, 02…). Pre-filled with the
                  standard four-step process — edit to customize this service, or clear all to
                  fall back to the default.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">"How we work" — numbered steps</span>
            </div>
            <SectionHeadingFields
              value={s.sectionCopy?.process}
              fields={copyFieldsFor('process')}
              onChange={(v) => updateSectionCopy('process', v)}
            />
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
                Body
                <HelpTip title="The Deep dive section">
                  Renders as the &ldquo;Deep dive&rdquo; section of the page. Tables work like
                  on the live site (table button in the toolbar); images ask for ALT text on
                  upload, and clicking an image shows an &ldquo;Edit alt&rdquo; button.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Long-form content</span>
            </div>
            <SectionHeadingFields
              value={s.sectionCopy?.deepdive}
              fields={copyFieldsFor('deepdive')}
              onChange={(v) => updateSectionCopy('deepdive', v)}
            />
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
                Why Alpine Mar
                <HelpTip title="Pillar cards">
                  The three white cards in the dark &ldquo;Why Alpine Mar&rdquo; band.
                  Pre-filled with the firm-wide pillars — edit to customize this page, or clear
                  all to fall back to the defaults.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Empty = default three pillars</span>
            </div>
            <SectionHeadingFields
              value={s.sectionCopy?.pillars}
              fields={copyFieldsFor('pillars')}
              onChange={(v) => updateSectionCopy('pillars', v)}
            />
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
                FAQ
                <HelpTip title="Common questions section">
                  Accordion at the bottom of the page (the first question renders open).
                  Pre-filled with four default questions — edit to customize, or clear all to
                  fall back to the default set.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Empty = default 4-question set</span>
            </div>
            <SectionHeadingFields
              value={s.sectionCopy?.faq}
              fields={copyFieldsFor('faq')}
              onChange={(v) => updateSectionCopy('faq', v)}
            />
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
                Other section headings
                <HelpTip title="Headings for the automatic sections">
                  The sections above each have their heading text right inside their own card.
                  These four sections have no content card because they&rsquo;re built
                  automatically — Reviews (pulls from your Reviews), Industries and Related
                  services (auto-linked), and the final call-to-action. Edit their on-page
                  labels/headings here; blank = the site default shown as placeholder.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Reviews · Industries · Related · Final CTA</span>
            </div>
            <SectionCopyEditor
              defs={AUTO_COPY_DEFS}
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
                The full-width banner at the top of the service page (and the social-share
                image). Each service ships with an auto-generated hero — shown here — so this
                is never empty. Upload to replace it; if you leave the default, nothing is
                written and the auto image keeps rendering.
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
            {s.cover === autoHeroFor(s) && (
              <p className="text-xs text-muted-foreground">
                Showing the auto-generated hero for this service. Upload above to use your own.
              </p>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="group">
                Group
                <HelpTip title="Service category">
                  Categorizes the service on the hub and drives the breadcrumb + related links.
                  Pick an existing group or choose <strong>+ New group…</strong> to create one.
                  Mega-menu categories are the canonical groups (edit them under Navigation).
                </HelpTip>
              </Label>
              <select
                id="group"
                value={newGroup ? NEW_GROUP : (s.group ?? '')}
                onChange={(e) => {
                  if (e.target.value === NEW_GROUP) {
                    setNewGroup(true)
                    update('group', undefined)
                  } else {
                    setNewGroup(false)
                    update('group', (e.target.value || undefined) as ServiceGroup | undefined)
                  }
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— None —</option>
                {groupChoices.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value={NEW_GROUP}>+ New group…</option>
              </select>
              {newGroup && (
                <Input
                  value={s.group ?? ''}
                  onChange={(e) => update('group', (e.target.value || undefined) as ServiceGroup | undefined)}
                  placeholder="New group name"
                  autoFocus
                />
              )}
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

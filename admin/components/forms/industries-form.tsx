'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { HelpTip } from '@/components/shared/help-tip'
import { ImageUploader } from '@/components/shared/image-uploader'
import { TagInput } from '@/components/shared/tag-input'
import { StructList } from '@/components/shared/struct-list'
import { SectionCopyEditor, type CopySectionDef, type SectionCopy } from '@/components/shared/section-copy-editor'
import { SectionHeadingFields } from '@/components/shared/section-heading-fields'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveIndustry, deleteIndustry, type Industry, type IndustryFrontmatter, type IndustryCopyKey } from '@/lib/actions/industries'
import { slugify } from '@/lib/utils'
import {
  DEFAULT_TAKEAWAYS,
  DEFAULT_PILLARS,
  defaultFaq,
  equalsDefault,
} from '@/lib/industry-section-defaults'

interface Props {
  initial?: Industry
  serviceSlugs: string[]
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

/** Placeholders mirror the defaults baked into src/pages/industries/[...slug].astro. */
const COPY_DEFS: CopySectionDef<IndustryCopyKey>[] = [
  { key: 'benefits', label: 'What you get', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'What you get' },
    { key: 'heading', label: 'Heading', placeholder: 'A team that already speaks your language.' },
    { key: 'intro', label: 'Intro', placeholder: 'The same four commitments on every … engagement.', textarea: true },
  ]},
  { key: 'services', label: 'Services we run', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Services we run for …' },
    { key: 'heading', label: 'Heading', placeholder: 'From day-to-day books to high-stakes transactions.' },
    { key: 'intro', label: 'Intro', placeholder: 'The most-booked services in this vertical…', textarea: true },
  ]},
  { key: 'deepdive', label: 'Industry overview (body)', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Industry overview' },
    { key: 'heading', label: 'Heading', placeholder: 'What to know before you hire.' },
  ]},
  { key: 'reviews', label: 'Client view', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Client view' },
  ]},
  { key: 'pillars', label: 'Why Alpine Mar', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Why Alpine Mar' },
    { key: 'heading', label: 'Heading', placeholder: 'A firm that knows your world, not just your numbers.' },
    { key: 'intro', label: 'Intro', placeholder: 'Beyond the books: we know the industry mechanics…', textarea: true },
  ]},
  { key: 'related', label: 'More industries', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'More industries' },
    { key: 'heading', label: 'Heading', placeholder: "Industries we're just as fluent in:" },
    { key: 'button', label: 'Link label', placeholder: 'All industries' },
  ]},
  { key: 'faq', label: 'FAQ', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Common questions' },
    { key: 'heading', label: 'Heading', placeholder: 'Before you book the call.' },
    { key: 'intro', label: 'Intro', placeholder: 'Quick answers to the things most people ask…', textarea: true },
  ]},
  { key: 'cta', label: 'Final CTA', fields: [
    { key: 'eyebrow', label: 'Eyebrow', placeholder: 'Ready to start?' },
    { key: 'heading', label: 'Heading', placeholder: "Let's get on a first name basis." },
    { key: 'button', label: 'Button label', placeholder: 'Request a Consultation' },
  ]},
]

/** Heading fields for one section, embedded inside that section's card. */
const copyFieldsFor = (key: IndustryCopyKey) => COPY_DEFS.find((d) => d.key === key)?.fields ?? []
/** Sections with no content card of their own (auto/sidebar-driven). */
const AUTO_COPY_DEFS = COPY_DEFS.filter((d) => (['services', 'reviews', 'related', 'cta'] as string[]).includes(d.key))

const empty: Industry = {
  slug: '',
  title: '',
  path: '',
  summary: '',
  cover: '',
  coverAlt: '',
  services: [],
  takeaways: [],
  pillars: [],
  faq: [],
  sectionCopy: undefined,
  status: 'published',
  seo: { title: '', description: '', canonical: '' },
  body: '',
}

/**
 * Prefill the structured sections with the site's default content when empty,
 * so the editor sees exactly what renders on the live page and can edit it.
 */
function withSectionPrefills(ind: Industry): Industry {
  return {
    ...ind,
    takeaways: ind.takeaways.length ? ind.takeaways : DEFAULT_TAKEAWAYS.map((t) => ({ ...t })),
    pillars: ind.pillars.length ? ind.pillars : DEFAULT_PILLARS.map((p) => ({ ...p })),
    faq: ind.faq.length ? ind.faq : defaultFaq(ind.title).map((f) => ({ ...f })),
  }
}

export function IndustriesForm({ initial, serviceSlugs }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [i, setI] = useState<Industry>(() => withSectionPrefills(initial ?? empty))
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)
  // Snapshot the FAQ default at mount so a title rename doesn't write the stale
  // (old-title) default FAQ into the .md file at save time.
  const initialFaqDefault = useRef(defaultFaq((initial ?? empty).title))

  useUnsavedChanges(dirty)

  function update<K extends keyof Industry>(k: K, v: Industry[K]) {
    setI((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }
  function updateSeo<K extends keyof NonNullable<IndustryFrontmatter['seo']>>(
    k: K,
    v: NonNullable<IndustryFrontmatter['seo']>[K],
  ) {
    setI((p) => ({ ...p, seo: { ...(p.seo ?? {}), [k]: v } }))
    setDirty(true)
  }
  function updateSectionCopy(key: IndustryCopyKey, val: SectionCopy | undefined) {
    setI((p) => {
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
    if (!i.title.trim()) return toast.error('Title is required')
    if (!i.slug.trim()) return toast.error('Slug is required')
    if (!i.summary.trim()) return toast.error('Summary is required')

    // Sections still equal to the site defaults are saved as empty, so the
    // file stays clean and keeps using the template default — only edited
    // sections get written to the .md file.
    const takeaways = equalsDefault(i.takeaways, DEFAULT_TAKEAWAYS) ? [] : i.takeaways
    const pillars = equalsDefault(i.pillars, DEFAULT_PILLARS) ? [] : i.pillars
    const faq = equalsDefault(i.faq, initialFaqDefault.current) ? [] : i.faq

    startTransition(async () => {
      try {
        const fm: IndustryFrontmatter = {
          title: i.title,
          path: i.path || `/industries/${i.slug}/`,
          summary: i.summary,
          cover: i.cover || undefined,
          coverAlt: i.coverAlt?.trim() || undefined,
          services: i.services,
          takeaways,
          pillars,
          faq,
          sectionCopy: i.sectionCopy,
          status: i.status,
          seo: i.seo,
        }
        const res = await saveIndustry({ slug: i.slug, frontmatter: fm, body: i.body, sha: i.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/industries/${res.slug}`)
        else { setI((prev) => ({ ...prev, sha: res.sha })); router.refresh() }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleDelete() {
    if (!initial) return
    startTransition(async () => {
      try {
        await deleteIndustry(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push('/industries')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  const livePath = initial ? initial.path || `/industries/${initial.slug}/` : ''

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-24">
        <div className="space-y-5 min-w-0">
          <section className="rounded-lg border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={i.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Construction"
                className="text-lg h-11"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={i.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    update('slug', slugify(e.target.value))
                  }}
                />
                <p className="text-xs text-muted-foreground">URL: /industries/{i.slug || '…'}/</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="path">Path override</Label>
                <Input id="path" value={i.path} onChange={(e) => update('path', e.target.value)} placeholder="/industries/…/" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={i.summary}
                onChange={(e) => update('summary', e.target.value)}
                rows={3}
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Body
                <HelpTip title="Editor features">
                  Tables work like on the live site (table button in the toolbar); images ask
                  for ALT text on upload, and clicking an image shows an &ldquo;Edit
                  alt&rdquo; button.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Long-form content</span>
            </div>
            <SectionHeadingFields
              value={i.sectionCopy?.deepdive}
              fields={copyFieldsFor('deepdive')}
              onChange={(v) => updateSectionCopy('deepdive', v)}
            />
            <RichTextEditor
              value={i.body}
              onChange={(html) => update('body', html)}
              placeholder="Long-form industry description, regulatory context, our approach…"
              uploadDir="images/industries"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Key takeaways
                <HelpTip title="What you get section">
                  Each entry is a numbered card in the &ldquo;What you get&rdquo; section — a
                  title plus a short supporting line. Pre-filled with the site&rsquo;s default
                  cards; edit them to make this industry specific, or clear all to fall back to
                  the defaults.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">"What you get" cards — title + line</span>
            </div>
            <SectionHeadingFields
              value={i.sectionCopy?.benefits}
              fields={copyFieldsFor('benefits')}
              onChange={(v) => updateSectionCopy('benefits', v)}
            />
            <StructList
              value={i.takeaways}
              onChange={(v) => update('takeaways', v)}
              fields={[
                { key: 'title', label: 'Card title', placeholder: 'e.g. Industry-fluent partners' },
                { key: 'body', label: 'Supporting line', textarea: true, placeholder: 'One sentence under the title…' },
              ]}
              defaultItem={{ title: '', body: '' }}
              addLabel="Add takeaway"
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
              value={i.sectionCopy?.pillars}
              fields={copyFieldsFor('pillars')}
              onChange={(v) => updateSectionCopy('pillars', v)}
            />
            <StructList
              value={i.pillars}
              onChange={(v) => update('pillars', v)}
              fields={[
                { key: 'title', label: 'Pillar title', placeholder: 'e.g. Specialized by vertical' },
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
              value={i.sectionCopy?.faq}
              fields={copyFieldsFor('faq')}
              onChange={(v) => updateSectionCopy('faq', v)}
            />
            <StructList
              value={i.faq}
              onChange={(v) => update('faq', v)}
              fields={[
                { key: 'q', label: 'Question', placeholder: 'e.g. How quickly can we start?' },
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
                  These sections have no content card because they&rsquo;re built automatically —
                  the Services strip (from cross-linked services), Reviews, More industries, and
                  the final call-to-action. Edit their on-page labels/headings here; blank = the
                  site default shown as placeholder.
                </HelpTip>
              </h2>
              <span className="text-xs text-muted-foreground">Services · Reviews · More industries · Final CTA</span>
            </div>
            <SectionCopyEditor
              defs={AUTO_COPY_DEFS}
              value={i.sectionCopy}
              onChange={(v) => update('sectionCopy', v)}
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold">SEO</h2>
            <div className="space-y-1.5">
              <Label>SEO title</Label>
              <Input value={i.seo?.title ?? ''} onChange={(e) => updateSeo('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta description</Label>
              <Textarea value={i.seo?.description ?? ''} onChange={(e) => updateSeo('description', e.target.value)} rows={2} />
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
                value={i.seo?.canonical ?? ''}
                onChange={(e) => updateSeo('canonical', e.target.value)}
                placeholder={`${SITE_URL}${i.path || `/industries/${i.slug || '…'}/`}`}
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
              value={i.status}
              onChange={(e) => update('status', e.target.value as Industry['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground">Drafts hidden from the industries hub.</p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Cover image
              <HelpTip title="This is the page banner">
                The full-width banner at the top of the industry page (and the social-share
                image) — shown here so you can see and replace it. Upload to change it; set its
                ALT text in the field below.
              </HelpTip>
            </Label>
            <ImageUploader
              value={i.cover ?? ''}
              onChange={(url) => update('cover', url)}
              uploadDir="images/industries"
              alt={i.coverAlt ?? ''}
              onAltChange={(v) => update('coverAlt', v)}
              altLabel="Cover alt text"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cross-link services</Label>
            <TagInput
              value={i.services}
              onChange={(v) => update('services', v)}
              suggestions={serviceSlugs}
              placeholder="Add service slug…"
            />
          </section>

          {initial && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                Delete industry
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
              'New industry'
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
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create industry'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.title}"?`}
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

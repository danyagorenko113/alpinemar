'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUploader } from '@/components/shared/image-uploader'
import { StringList } from '@/components/shared/string-list'
import { StructList } from '@/components/shared/struct-list'
import { TagInput } from '@/components/shared/tag-input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { saveService, deleteService, type Service, type ServiceFrontmatter, type ServiceGroup } from '@/lib/actions/services'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Service
  industrySlugs: string[]
}

const GROUPS: ServiceGroup[] = ['Tax', 'Accounting', 'Advisory', 'Compliance']

const empty: Service = {
  slug: '',
  title: '',
  path: '',
  summary: '',
  cover: '',
  order: 0,
  group: undefined,
  takeaways: [],
  included: [],
  process: [],
  industries: [],
  faq: [],
  seo: { title: '', description: '' },
  body: '',
}

export function ServicesForm({ initial, industrySlugs }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [s, setS] = useState<Service>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function update<K extends keyof Service>(k: K, v: Service[K]) {
    setS((p) => ({ ...p, [k]: v }))
  }
  function updateSeo<K extends keyof NonNullable<ServiceFrontmatter['seo']>>(
    k: K,
    v: NonNullable<ServiceFrontmatter['seo']>[K],
  ) {
    setS((p) => ({ ...p, seo: { ...(p.seo ?? {}), [k]: v } }))
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
          path: s.path || `/services/${s.slug}/`,
          summary: s.summary,
          cover: s.cover || undefined,
          order: Number(s.order) || 0,
          group: s.group,
          takeaways: s.takeaways.filter(Boolean),
          included: s.included.filter(Boolean),
          process: s.process.filter((p) => p.title || p.body),
          industries: s.industries,
          faq: s.faq.filter((f) => f.q || f.a),
          seo: s.seo,
        }
        const res = await saveService({ slug: s.slug, frontmatter: fm, body: s.body, sha: s.sha })
        toast.success(initial ? 'Saved' : 'Created')
        if (!initial || res.slug !== initial.slug) router.push(`/services/${res.slug}`)
        else router.refresh()
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
        router.push('/services')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-24">
        <div className="space-y-5 min-w-0">
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
            <h2 className="text-base font-semibold">Key takeaways</h2>
            <p className="text-xs text-muted-foreground -mt-2">3–5 bullets surfaced above the body.</p>
            <StringList
              value={s.takeaways}
              onChange={(v) => update('takeaways', v)}
              placeholder="A short, scannable takeaway"
              addLabel="Add takeaway"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-base font-semibold">What's included</h2>
            <StringList
              value={s.included}
              onChange={(v) => update('included', v)}
              placeholder="Deliverable"
              addLabel="Add deliverable"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-base font-semibold">Engagement process</h2>
            <p className="text-xs text-muted-foreground -mt-2">Renders as a numbered process strip.</p>
            <StructList
              value={s.process}
              onChange={(v) => update('process', v)}
              fields={[
                { key: 'title', label: 'Step title' },
                { key: 'body', label: 'Step description', textarea: true },
              ]}
              defaultItem={{ title: '', body: '' }}
              addLabel="Add step"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-base font-semibold">FAQ</h2>
            <StructList
              value={s.faq}
              onChange={(v) => update('faq', v)}
              fields={[
                { key: 'q', label: 'Question' },
                { key: 'a', label: 'Answer', textarea: true },
              ]}
              defaultItem={{ q: '', a: '' }}
              addLabel="Add FAQ"
            />
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
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cover image</Label>
            <ImageUploader value={s.cover ?? ''} onChange={(url) => update('cover', url)} uploadDir="images/services" />
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={s.order ?? 0}
                onChange={(e) => update('order', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cross-link industries</Label>
            <TagInput
              value={s.industries}
              onChange={(v) => update('industries', v)}
              suggestions={industrySlugs}
              placeholder="Add industry slug…"
            />
            <p className="text-xs text-muted-foreground">Slugs of industries from /industries/.</p>
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
            {initial ? <>Editing <span className="font-mono text-navy-700">{initial.slug}</span></> : 'New service'}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : initial ? 'Save changes' : 'Create service'}
          </Button>
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

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
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveService, deleteService, type Service, type ServiceFrontmatter, type ServiceGroup } from '@/lib/actions/services'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Service
  industrySlugs: string[]
}

const GROUPS: ServiceGroup[] = ['Tax', 'Accounting', 'Advisory', 'Compliance']
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.com'

const empty: Service = {
  slug: '',
  title: '',
  path: '',
  summary: '',
  cover: '',
  group: undefined,
  industries: [],
  status: 'published',
  seo: { title: '', description: '' },
  body: '',
}

export function ServicesForm({ initial, industrySlugs }: Props) {
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
          path: s.path || `/services/${s.slug}/`,
          summary: s.summary,
          cover: s.cover || undefined,
          group: s.group,
          industries: s.industries,
          status: s.status,
          seo: s.seo,
        }
        const res = await saveService({ slug: s.slug, frontmatter: fm, body: s.body, sha: s.sha })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
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
        setDirty(false)
        router.push('/services')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  const livePath = initial ? initial.path || `/services/${initial.slug}/` : ''

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
              <p className="text-xs text-muted-foreground">Categorizes the service on the hub.</p>
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

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
import { StructList } from '@/components/shared/struct-list'
import { TagInput } from '@/components/shared/tag-input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { saveIndustry, deleteIndustry, type Industry, type IndustryFrontmatter } from '@/lib/actions/industries'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Industry
  serviceSlugs: string[]
}

const empty: Industry = {
  slug: '',
  title: '',
  path: '',
  summary: '',
  cover: '',
  order: 0,
  tagline: '',
  kpis: [],
  services: [],
  seo: { title: '', description: '' },
  body: '',
}

export function IndustriesForm({ initial, serviceSlugs }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [i, setI] = useState<Industry>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function update<K extends keyof Industry>(k: K, v: Industry[K]) {
    setI((p) => ({ ...p, [k]: v }))
  }
  function updateSeo<K extends keyof NonNullable<IndustryFrontmatter['seo']>>(
    k: K,
    v: NonNullable<IndustryFrontmatter['seo']>[K],
  ) {
    setI((p) => ({ ...p, seo: { ...(p.seo ?? {}), [k]: v } }))
  }

  function handleTitleChange(v: string) {
    update('title', v)
    if (!slugTouched) update('slug', slugify(v))
  }

  function handleSave() {
    if (!i.title.trim()) return toast.error('Title is required')
    if (!i.slug.trim()) return toast.error('Slug is required')
    if (!i.summary.trim()) return toast.error('Summary is required')

    startTransition(async () => {
      try {
        const fm: IndustryFrontmatter = {
          title: i.title,
          path: i.path || `/industries/${i.slug}/`,
          summary: i.summary,
          cover: i.cover || undefined,
          order: Number(i.order) || 0,
          tagline: i.tagline || undefined,
          kpis: i.kpis.filter((k) => k.value || k.label),
          services: i.services,
          seo: i.seo,
        }
        const res = await saveIndustry({ slug: i.slug, frontmatter: fm, body: i.body, sha: i.sha })
        toast.success(initial ? 'Saved' : 'Created')
        if (!initial || res.slug !== initial.slug) router.push(`/industries/${res.slug}`)
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
        await deleteIndustry(initial.slug, initial.sha)
        toast.success('Deleted')
        router.push('/industries')
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
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={i.tagline ?? ''}
                onChange={(e) => update('tagline', e.target.value)}
                placeholder="Optional short tagline / metric for the hero"
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="text-base font-semibold">KPIs</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Hero stat cards. e.g. value "11", label "Active engagements".
            </p>
            <StructList
              value={i.kpis}
              onChange={(v) => update('kpis', v)}
              fields={[
                { key: 'value', label: 'Value', placeholder: 'e.g. 11' },
                { key: 'label', label: 'Label', placeholder: 'e.g. Active engagements' },
              ]}
              defaultItem={{ value: '', label: '' }}
              addLabel="Add KPI"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Body</h2>
              <span className="text-xs text-muted-foreground">Long-form content</span>
            </div>
            <RichTextEditor
              value={i.body}
              onChange={(html) => update('body', html)}
              placeholder="Long-form industry description, regulatory context, our approach…"
              uploadDir="images/industries"
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
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Cover image</Label>
            <ImageUploader value={i.cover ?? ''} onChange={(url) => update('cover', url)} uploadDir="images/industries" />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" value={i.order ?? 0} onChange={(e) => update('order', Number(e.target.value))} />
            </div>
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
            {initial ? <>Editing <span className="font-mono text-navy-700">{initial.slug}</span></> : 'New industry'}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : initial ? 'Save changes' : 'Create industry'}
          </Button>
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

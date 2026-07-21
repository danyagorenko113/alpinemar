'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUploader } from '@/components/shared/image-uploader'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveService,
  deleteService,
  type ITService,
  type ITServiceFrontmatter,
} from '@/lib/actions/it/services'
import { IT_SERVICE_GROUPS } from '@/lib/it-service-groups'
import { slugify } from '@/lib/utils'
import { IT_SITE_URL } from '@/lib/it-site'

interface Props {
  initial?: ITService
}

const empty: ITService = {
  slug: '',
  title: '',
  heroTitle: '',
  path: '',
  summary: '',
  cover: '',
  group: '',
  status: 'published',
  seo: { title: '', description: '' },
  body: '',
}

export function ITServicesForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [s, setS] = useState<ITService>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof ITService>(k: K, v: ITService[K]) {
    setS((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }
  function updateSeo<K extends keyof NonNullable<ITServiceFrontmatter['seo']>>(k: K, v: string) {
    setS((p) => ({ ...p, seo: { ...(p.seo ?? {}), [k]: v } }))
    setDirty(true)
  }

  function handleTitleChange(v: string) {
    update('title', v)
    if (!slugTouched) {
      const sl = slugify(v)
      setS((p) => ({ ...p, slug: sl, path: p.path?.trim() ? p.path : `/services/${sl}/` }))
    }
  }

  function handleSave() {
    if (!s.title.trim()) return toast.error('Title is required')
    if (!s.slug.trim()) return toast.error('Slug is required')

    startTransition(async () => {
      try {
        const fm: ITServiceFrontmatter = {
          title: s.title.trim(),
          heroTitle: s.heroTitle?.trim() || undefined,
          path: s.path?.trim() || `/services/${slugify(s.slug)}/`,
          summary: s.summary.trim(),
          cover: s.cover?.trim() || undefined,
          group: s.group || undefined,
          status: s.status,
          seo: s.seo,
        }
        const res = await saveService({ slug: s.slug, frontmatter: fm, body: s.body, sha: s.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/it/services/${res.slug}`)
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
        router.push('/it/services')
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
              <Input id="title" value={s.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Service title" className="text-lg h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heroTitle">
                Hero title
                <HelpTip title="Big headline override">
                  Optional larger headline shown at the top of the page. Falls back to Title.
                </HelpTip>
              </Label>
              <Input id="heroTitle" value={s.heroTitle ?? ''} onChange={(e) => update('heroTitle', e.target.value)} placeholder="Falls back to Title" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={s.slug} onChange={(e) => { setSlugTouched(true); update('slug', slugify(e.target.value)) }} placeholder="cybersecurity" />
                <p className="text-xs text-muted-foreground">Names the .md file.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="path">
                  Path *
                  <HelpTip title="Canonical URL">
                    The page&rsquo;s URL on the IT site, e.g. <span className="font-mono">/services/cybersecurity/</span>.
                    Every link to this service uses it — keep it in sync with the slug.
                  </HelpTip>
                </Label>
                <Input id="path" value={s.path} onChange={(e) => update('path', e.target.value)} placeholder="/services/cybersecurity/" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea id="summary" value={s.summary} onChange={(e) => update('summary', e.target.value)} rows={3} placeholder="Lead paragraph shown in the hero and service listings." />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="body" className="text-base font-semibold">
                Body (HTML)
                <HelpTip title="Raw HTML — edit with care">
                  The article is raw HTML: paragraphs, headings, lists, and (on the four main
                  service lines) a <span className="font-mono">am-subsvc-grid</span> block of
                  cross-link cards at the bottom. Edit the prose freely, but leave the
                  <span className="font-mono"> &lt;div class=&quot;am-subsvc-grid&quot;&gt;</span>
                  block intact — it renders the linked sub-service cards.
                </HelpTip>
              </Label>
            </div>
            <Textarea
              id="body"
              value={s.body}
              onChange={(e) => update('body', e.target.value)}
              rows={22}
              className="font-mono text-xs leading-relaxed"
              placeholder="<p>…</p>"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold">SEO</h2>
            <p className="text-xs text-muted-foreground -mt-2">Optional overrides — leave blank to use Title / Summary.</p>
            <div className="space-y-1.5">
              <Label htmlFor="seo-title">SEO title</Label>
              <Input id="seo-title" value={s.seo?.title ?? ''} onChange={(e) => updateSeo('title', e.target.value)} placeholder="Falls back to title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-description">Meta description</Label>
              <Textarea id="seo-description" value={s.seo?.description ?? ''} onChange={(e) => updateSeo('description', e.target.value)} rows={2} placeholder="Falls back to summary" />
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={s.status}
              onChange={(e) => update('status', e.target.value as ITService['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="group">
              Group
              <HelpTip title="Service grouping">
                Drives the breadcrumb and the &ldquo;Related services&rdquo; heading on the page.
              </HelpTip>
            </Label>
            <select
              id="group"
              value={s.group ?? ''}
              onChange={(e) => update('group', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— None —</option>
              {IT_SERVICE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>
              Cover image
              <HelpTip title="Stored, not shown yet">
                Saved to the frontmatter for future use — the current IT service template does
                not render a cover image.
              </HelpTip>
            </Label>
            <ImageUploader
              value={s.cover ?? ''}
              onChange={(url) => update('cover', url)}
              uploadDir="images/services"
              uploadRoot="it-site/public"
            />
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
                <a href={`${IT_SITE_URL}${s.path || `/services/${initial.slug}/`}`} target="_blank" rel="noopener noreferrer">
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
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

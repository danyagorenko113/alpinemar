'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUploader } from '@/components/shared/image-uploader'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveAuthor, deleteAuthor, type Author, type AuthorFrontmatter } from '@/lib/actions/authors'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: Author
}

const empty: Author = {
  slug: '',
  name: '',
  title: '',
  photo: '',
  photoAlt: '',
  linkedin: '',
  email: '',
  order: 0,
  status: 'published',
  body: '',
}

export function AuthorForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [a, setA] = useState<Author>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof Author>(k: K, v: Author[K]) {
    setA((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  function handleNameChange(v: string) {
    update('name', v)
    if (!slugTouched) update('slug', slugify(v))
  }

  function handleSave() {
    if (!a.name.trim()) return toast.error('Name is required')
    if (!a.slug.trim()) return toast.error('Slug is required')

    startTransition(async () => {
      try {
        const fm: AuthorFrontmatter = {
          name: a.name.trim(),
          title: a.title?.trim() || undefined,
          photo: a.photo || undefined,
          photoAlt: a.photoAlt?.trim() || undefined,
          linkedin: a.linkedin?.trim() || undefined,
          email: a.email?.trim() || undefined,
          order: Number(a.order) || 0,
          status: a.status,
        }
        const res = await saveAuthor({ slug: a.slug, frontmatter: fm, body: a.body, sha: a.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/authors/${res.slug}`)
        else { setA((prev) => ({ ...prev, sha: res.sha })); router.refresh() }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleDelete() {
    if (!initial) return
    startTransition(async () => {
      try {
        await deleteAuthor(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push('/authors')
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={a.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Cody Mar, CPA"
                className="text-lg h-11"
              />
              <p className="text-xs text-muted-foreground">
                Blog posts reference this exact name in their Author field.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={a.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    update('slug', slugify(e.target.value))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={a.title ?? ''}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Managing Partner"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={a.linkedin ?? ''}
                  onChange={(e) => update('linkedin', e.target.value)}
                  placeholder="https://www.linkedin.com/in/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={a.email ?? ''}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="name@alpinemar.com"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label className="text-base font-semibold">Bio</Label>
            <RichTextEditor
              value={a.body}
              onChange={(html) => update('body', html)}
              placeholder="Background, expertise, prior experience…"
              uploadDir="images/team"
            />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={a.status}
              onChange={(e) => update('status', e.target.value as Author['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground">Drafts hidden from author bylines on the site.</p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Photo</Label>
            <ImageUploader
              value={a.photo ?? ''}
              onChange={(url) => update('photo', url)}
              uploadDir="images/team"
              alt={a.photoAlt ?? ''}
              onAltChange={(v) => update('photoAlt', v)}
              altLabel="Photo alt text"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" value={a.order ?? 0} onChange={(e) => update('order', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in author listings.</p>
            </div>
          </section>

          {initial && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                Delete author
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
              'New author'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create author'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.name}"?`}
        description="Posts referencing this author keep their byline text but lose the bio link."
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUploader } from '@/components/shared/image-uploader'
import { StringList } from '@/components/shared/string-list'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveTeamMember, deleteTeamMember, type TeamMember, type TeamFrontmatter } from '@/lib/actions/team'
import { slugify } from '@/lib/utils'

interface Props {
  initial?: TeamMember
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

const empty: TeamMember = {
  slug: '',
  name: '',
  role: '',
  photo: '',
  credentials: [],
  order: 0,
  status: 'published',
  body: '',
}

export function TeamForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [m, setM] = useState<TeamMember>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof TeamMember>(k: K, v: TeamMember[K]) {
    setM((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  function handleNameChange(v: string) {
    update('name', v)
    if (!slugTouched) update('slug', slugify(v))
  }

  function handleSave() {
    if (!m.name.trim()) return toast.error('Name is required')
    if (!m.role.trim()) return toast.error('Role is required')
    if (!m.slug.trim()) return toast.error('Slug is required')

    startTransition(async () => {
      try {
        const fm: TeamFrontmatter = {
          name: m.name,
          role: m.role,
          photo: m.photo || undefined,
          credentials: m.credentials.filter(Boolean),
          order: Number(m.order) || 0,
          status: m.status,
        }
        const res = await saveTeamMember({ slug: m.slug, frontmatter: fm, body: m.body, sha: m.sha })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/team/${res.slug}`)
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
        await deleteTeamMember(initial.slug, initial.sha)
        toast.success('Deleted')
        setDirty(false)
        router.push('/team')
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
                value={m.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Cody Mar, CPA"
                className="text-lg h-11"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={m.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    update('slug', slugify(e.target.value))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role *</Label>
                <Input id="role" value={m.role} onChange={(e) => update('role', e.target.value)} placeholder="Founding Partner" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label className="text-base font-semibold">Credentials</Label>
            <StringList
              value={m.credentials}
              onChange={(v) => update('credentials', v)}
              placeholder="e.g. CPA, MBA"
              addLabel="Add credential"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label className="text-base font-semibold">Bio</Label>
            <RichTextEditor
              value={m.body}
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
              value={m.status}
              onChange={(e) => update('status', e.target.value as TeamMember['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="text-xs text-muted-foreground">Drafts hidden from the About page roster.</p>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Photo</Label>
            <ImageUploader value={m.photo ?? ''} onChange={(url) => update('photo', url)} uploadDir="images/team" />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" value={m.order ?? 0} onChange={(e) => update('order', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Lower numbers appear first on /about-us.</p>
            </div>
          </section>

          {initial && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                Delete member
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
              'New team member'
            )}
          </div>
          <div className="flex items-center gap-2">
            {initial && (
              <Button asChild variant="outline">
                <a href={`${SITE_URL}/about-us/`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on site
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create member'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${initial?.name}"?`}
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

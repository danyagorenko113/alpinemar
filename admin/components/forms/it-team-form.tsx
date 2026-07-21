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
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveTeamMember, deleteTeamMember, type ITTeamMember, type ITTeamFrontmatter } from '@/lib/actions/it/team'
import { slugify } from '@/lib/utils'
import { IT_SITE_URL } from '@/lib/it-site'

interface Props {
  initial?: ITTeamMember
}

const empty: ITTeamMember = {
  slug: '',
  name: '',
  role: '',
  photo: '',
  email: '',
  linkedin: '',
  order: 0,
  status: 'published',
  body: '',
}

export function ITTeamForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [m, setM] = useState<ITTeamMember>(initial ?? empty)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof ITTeamMember>(k: K, v: ITTeamMember[K]) {
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
        const fm: ITTeamFrontmatter = {
          name: m.name,
          role: m.role,
          photo: m.photo || undefined,
          email: m.email?.trim() || undefined,
          linkedin: m.linkedin?.trim() || undefined,
          order: Number(m.order) || 0,
          status: m.status,
        }
        const res = await saveTeamMember({ slug: m.slug, frontmatter: fm, body: m.body, sha: m.sha, originalSlug: initial?.slug })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial || res.slug !== initial.slug) router.push(`/it/team/${res.slug}`)
        else { setM((prev) => ({ ...prev, sha: res.sha })); router.refresh() }
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
        router.push('/it/team')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-24">
        <div className="space-y-5 min-w-0">
          <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
            Team members appear in the <strong>Meet the Team</strong> section on the
            IT About page, sorted by Order. Only members with a Photo are shown.
          </div>
          <section className="rounded-lg border bg-card p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={m.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Vanessa Holub"
                className="text-lg h-11"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug
                  <HelpTip title="File identifier">
                    Auto-generated from the Name. It names the member&rsquo;s .md file and
                    the admin URL — it is not shown on the live site.
                  </HelpTip>
                </Label>
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
                <Input id="role" value={m.role} onChange={(e) => update('role', e.target.value)} placeholder="COO" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                  <HelpTip title="Contact link">
                    Rendered as a mailto link on the member&rsquo;s card on the IT About page.
                  </HelpTip>
                </Label>
                <Input id="email" type="email" value={m.email ?? ''} onChange={(e) => update('email', e.target.value)} placeholder="name@it.alpinemar.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">
                  LinkedIn URL
                  <HelpTip title="Not shown yet">
                    Stored for future use — the current IT About card does not render a
                    LinkedIn link yet.
                  </HelpTip>
                </Label>
                <Input id="linkedin" value={m.linkedin ?? ''} onChange={(e) => update('linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label className="text-base font-semibold">
              Bio
              <HelpTip title="Background notes">
                Longer background for this member. The current IT About card shows the
                photo, name, and role, so the bio is stored for future use — it does not
                yet render on the live site.
              </HelpTip>
            </Label>
            <RichTextEditor
              value={m.body}
              onChange={(html) => update('body', html)}
              placeholder="Background, expertise, prior experience…"
              uploadDir="images/team"
              uploadRoot="it-site/public"
            />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="status">
              Status
              <HelpTip title="Published vs. draft">
                Draft is the working state for members whose bio is still placeholder.
                Set to Published once the profile is ready.
              </HelpTip>
            </Label>
            <select
              id="status"
              value={m.status}
              onChange={(e) => update('status', e.target.value as ITTeamMember['status'])}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label>Photo</Label>
            <ImageUploader
              value={m.photo ?? ''}
              onChange={(url) => update('photo', url)}
              uploadDir="images/team"
              uploadRoot="it-site/public"
            />
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order">
                Order
                <HelpTip title="Sort position">
                  Lower numbers appear first in the IT About team section. Ties fall back
                  to file order.
                </HelpTip>
              </Label>
              <Input id="order" type="number" value={m.order ?? 0} onChange={(e) => update('order', Number(e.target.value))} />
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
                <a href={`${IT_SITE_URL}/about/`} target="_blank" rel="noopener noreferrer">
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

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveReview, deleteReview, type GoogleReview } from '@/lib/actions/reviews'

interface Props {
  id?: number
  initial?: GoogleReview
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.com'

const empty: GoogleReview = {
  name: '',
  initials: '',
  date: '',
  rating: 5,
  quote: '',
}

function deriveInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ReviewForm({ id, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [r, setR] = useState<GoogleReview>(initial ?? empty)
  const [initialsTouched, setInitialsTouched] = useState(!!initial)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function update<K extends keyof GoogleReview>(k: K, v: GoogleReview[K]) {
    setR((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }

  function handleNameChange(v: string) {
    update('name', v)
    if (!initialsTouched) update('initials', deriveInitials(v))
  }

  function handleInitialsChange(v: string) {
    setInitialsTouched(true)
    update('initials', v.slice(0, 3).toUpperCase())
  }

  function handleSave() {
    if (!r.name.trim()) return toast.error('Name is required')
    if (!r.initials.trim()) return toast.error('Initials are required')
    if (!r.quote.trim() || r.quote.trim().length < 8) return toast.error('Quote is too short')

    startTransition(async () => {
      try {
        const res = await saveReview(id ?? null, {
          name: r.name,
          initials: r.initials,
          date: r.date,
          rating: 5,
          quote: r.quote,
        })
        toast.success(initial ? 'Saved' : 'Created')
        setDirty(false)
        if (!initial) router.push(`/reviews/${res.id}`)
        else router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleDelete() {
    if (id === undefined || id === null) return
    startTransition(async () => {
      try {
        await deleteReview(id)
        toast.success('Deleted')
        setDirty(false)
        router.push('/reviews')
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
                value={r.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Josh Tasman"
                className="text-lg h-11"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="initials">Initials *</Label>
                <Input
                  id="initials"
                  value={r.initials}
                  onChange={(e) => handleInitialsChange(e.target.value)}
                  maxLength={3}
                  placeholder="JT"
                />
                <p className="text-xs text-muted-foreground">
                  1–3 characters. Auto-derived from name unless you edit it.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={r.date}
                  onChange={(e) => update('date', e.target.value)}
                  placeholder="4 months ago"
                />
                <p className="text-xs text-muted-foreground">
                  Free text as shown on Google (e.g. &quot;a year ago&quot;).
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-3">
            <Label htmlFor="quote" className="text-base font-semibold">Quote *</Label>
            <Textarea
              id="quote"
              value={r.quote}
              onChange={(e) => update('quote', e.target.value)}
              placeholder="What the client said…"
              rows={8}
              className="min-h-[220px]"
            />
            <p className="text-xs text-muted-foreground">
              Full review text. Curly quotes (’ “ ”) are preserved.
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-navy-900">Preview</h3>
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-900">
                  {r.initials || '—'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">{r.name || 'Client name'}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.date || 'date'} · ★★★★★</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-navy-700 line-clamp-6">
                {r.quote || 'Review text will appear here.'}
              </p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 space-y-2">
            <h3 className="text-sm font-semibold text-navy-900">Rating</h3>
            <p className="text-sm text-muted-foreground">
              Always 5 stars — Alpine Mar only surfaces 5-star Google reviews.
            </p>
          </section>

          {initial && id !== undefined && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                Delete review
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
                Editing review <span className="font-mono text-navy-700">#{id}</span>
                {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
              </>
            ) : (
              'New review'
            )}
          </div>
          <div className="flex items-center gap-2">
            {initial && (
              <Button asChild variant="outline">
                <a href={`${SITE_URL}/services/`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on site
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create review'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete review from "${initial?.name}"?`}
        variant="destructive"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </>
  )
}

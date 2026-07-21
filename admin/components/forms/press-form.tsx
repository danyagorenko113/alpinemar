'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StructList } from '@/components/shared/struct-list'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { savePress, type PressPayload, type PressMention } from '@/lib/actions/press'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

export function PressForm({ initial }: { initial: PressPayload }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<PressPayload>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function patch(p: Partial<PressPayload>) {
    setState((s) => ({ ...s, ...p }))
    setDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await savePress(state)
        toast.success('Saved')
        setDirty(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <div className="space-y-5 pb-24 max-w-3xl">
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Page copy</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={state.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={state.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaHeading">CTA heading</Label>
            <Input id="ctaHeading" value={state.ctaHeading} onChange={(e) => patch({ ctaHeading: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ctaButtonLabel">CTA button label</Label>
              <Input id="ctaButtonLabel" value={state.ctaButtonLabel} onChange={(e) => patch({ ctaButtonLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctaHref">CTA button link</Label>
              <Input id="ctaHref" value={state.ctaHref} onChange={(e) => patch({ ctaHref: e.target.value })} placeholder="/contact/" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Press mentions</h2>
          <p className="text-xs text-muted-foreground">Each row links out to the article. Reorder with the arrows.</p>
          <StructList<PressMention>
            value={state.mentions}
            onChange={(mentions) => patch({ mentions })}
            fields={[
              { key: 'outlet', label: 'Outlet', placeholder: 'e.g. Bloomberg Tax' },
              { key: 'date', label: 'Year', placeholder: '2025' },
              { key: 'headline', label: 'Headline', placeholder: 'Article title', textarea: true },
              { key: 'href', label: 'Link', placeholder: 'https://…' },
            ]}
            defaultItem={{ outlet: '', date: '', headline: '', href: '' }}
            addLabel="Add mention"
          />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">src/data/press.json</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href={`${SITE_URL}/in-the-media/`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on site
              </a>
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

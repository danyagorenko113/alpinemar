'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StringList } from '@/components/shared/string-list'
import { StructList } from '@/components/shared/struct-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveAbout, type AboutPayload, type DriveValue } from '@/lib/actions/about'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

export function AboutForm({ initial }: { initial: AboutPayload }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<AboutPayload>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)
  function patch(p: Partial<AboutPayload>) {
    setState((s) => ({ ...s, ...p }))
    setDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveAbout(state)
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
        <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
          Copy for the About Us page. The team roster is managed under <strong>Team</strong>.
          Etymology overlay text stays in code (rarely changes).
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="heroTitle">Hero title</Label>
            <Input id="heroTitle" value={state.heroTitle} onChange={(e) => patch({ heroTitle: e.target.value })} />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Journey</h2>
          <div className="space-y-1.5">
            <Label htmlFor="journeyHeading">Heading</Label>
            <Input id="journeyHeading" value={state.journeyHeading} onChange={(e) => patch({ journeyHeading: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Paragraphs</Label>
            <StringList value={state.journeyBody} onChange={(v) => patch({ journeyBody: v })} placeholder="Paragraph text" addLabel="Add paragraph" multiline />
          </div>
          <div className="space-y-1.5">
            <Label>
              Journey photos
              <HelpTip title="Gallery images">Public image paths (e.g. <span className="font-mono">/images/about/collage-1.jpg</span>). Upload files under Media first.</HelpTip>
            </Label>
            <StringList value={state.journeyPhotos} onChange={(v) => patch({ journeyPhotos: v })} placeholder="/images/about/…" addLabel="Add photo" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">What drives us</h2>
          <div className="space-y-1.5">
            <Label htmlFor="drivesHeading">Heading</Label>
            <Input id="drivesHeading" value={state.drivesHeading} onChange={(e) => patch({ drivesHeading: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drivesIntro">Intro</Label>
            <Textarea id="drivesIntro" rows={3} value={state.drivesIntro} onChange={(e) => patch({ drivesIntro: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Values</Label>
            <StructList<DriveValue>
              value={state.drives}
              onChange={(drives) => patch({ drives })}
              fields={[
                { key: 'title', label: 'Title', placeholder: 'e.g. Quality' },
                { key: 'icon', label: 'Icon path', placeholder: '/icons/about/quality.svg' },
              ]}
              defaultItem={{ title: '', icon: '' }}
              addLabel="Add value"
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Bottom CTA</h2>
          <div className="space-y-1.5">
            <Label htmlFor="ctaHeading">Heading</Label>
            <Input id="ctaHeading" value={state.ctaHeading} onChange={(e) => patch({ ctaHeading: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ctaButtonLabel">Button label</Label>
              <Input id="ctaButtonLabel" value={state.ctaButtonLabel} onChange={(e) => patch({ ctaButtonLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctaHref">Button link</Label>
              <Input id="ctaHref" value={state.ctaHref} onChange={(e) => patch({ ctaHref: e.target.value })} placeholder="/contact/" />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">src/data/about.json</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href={`${SITE_URL}/about-us/`} target="_blank" rel="noopener noreferrer">
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

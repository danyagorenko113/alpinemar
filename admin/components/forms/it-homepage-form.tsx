'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StructList } from '@/components/shared/struct-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  savePages,
  type ITPagesPayload,
  type HomeServiceCard,
  type ValueCard,
  type ServiceLineCard,
} from '@/lib/actions/it/homepage'

interface Props {
  initial: ITPagesPayload
}

export function ITHomepageForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ITPagesPayload>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function patch(next: Partial<ITPagesPayload>) {
    setState((p) => ({ ...p, ...next }))
    setDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await savePages(state)
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
          Editable copy for the IT site&rsquo;s homepage, About, Services, and contact
          sections. Saving writes to <span className="font-mono">it-site/src/data/pages.ts</span>{' '}
          and rebuilds it.alpinemar.com.
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">
            Homepage service cards
            <HelpTip title="Homepage section">
              The five cards under &ldquo;IT solutions that move your business forward.&rdquo;
              Each card links to <strong>Href</strong> (a path on the IT site, e.g.
              <span className="font-mono"> /services/cybersecurity/</span>). Reorder with the arrows.
            </HelpTip>
          </h2>
          <StructList<HomeServiceCard>
            value={state.homeServices}
            onChange={(v) => patch({ homeServices: v })}
            fields={[
              { key: 'title', label: 'Title', placeholder: 'Card title' },
              { key: 'href', label: 'Link (href)', placeholder: '/services/…/' },
              { key: 'blurb', label: 'Blurb', placeholder: 'Card description', textarea: true },
            ]}
            defaultItem={{ title: '', href: '/services/', blurb: '' }}
            addLabel="Add card"
          />
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">
            About page — “What guides us”
            <HelpTip title="About section">
              The principles shown on the IT About page. Title + one-line body each.
            </HelpTip>
          </h2>
          <StructList<ValueCard>
            value={state.values}
            onChange={(v) => patch({ values: v })}
            fields={[
              { key: 'title', label: 'Title', placeholder: 'e.g. Clarity' },
              { key: 'body', label: 'Body', placeholder: 'One-line description', textarea: true },
            ]}
            defaultItem={{ title: '', body: '' }}
            addLabel="Add value"
          />
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">
            Services page — service-line cards
            <HelpTip title="Services section">
              The four large cards on the Services page. <strong>Slug</strong> must match a
              service page (e.g. <span className="font-mono">cybersecurity</span>) so the card
              links to the right page — changing it to an unknown slug falls back to
              <span className="font-mono"> /services/&lt;slug&gt;/</span>.
            </HelpTip>
          </h2>
          <StructList<ServiceLineCard>
            value={state.serviceLineCards}
            onChange={(v) => patch({ serviceLineCards: v })}
            fields={[
              { key: 'slug', label: 'Service slug', placeholder: 'cybersecurity' },
              { key: 'title', label: 'Title', placeholder: 'Card title' },
              { key: 'blurb', label: 'Blurb', placeholder: 'Card description', textarea: true },
            ]}
            defaultItem={{ slug: '', title: '', blurb: '' }}
            addLabel="Add service-line card"
          />
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">
            Service page CTA band
            <HelpTip title="Bottom of every service page">
              The &ldquo;Ready to Secure What&rsquo;s Next?&rdquo; block shown near the bottom
              of every service page, with two buttons.
            </HelpTip>
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="cta-heading">Heading</Label>
            <Input id="cta-heading" value={state.serviceCta.heading} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, heading: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cta-body">Body</Label>
            <Textarea id="cta-body" rows={3} value={state.serviceCta.body} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, body: e.target.value } })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cta-plabel">Primary button label</Label>
              <Input id="cta-plabel" value={state.serviceCta.primaryLabel} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, primaryLabel: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-phref">Primary button link</Label>
              <Input id="cta-phref" value={state.serviceCta.primaryHref} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, primaryHref: e.target.value } })} placeholder="/contact/" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-slabel">Secondary button label</Label>
              <Input id="cta-slabel" value={state.serviceCta.secondaryLabel} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, secondaryLabel: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-shref">Secondary button link</Label>
              <Input id="cta-shref" value={state.serviceCta.secondaryHref} onChange={(e) => patch({ serviceCta: { ...state.serviceCta, secondaryHref: e.target.value } })} placeholder="/services/" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Business hours</h2>
          <p className="text-xs text-muted-foreground">
            Shown next to the phone number on the contact page, the bottom contact block, and
            service pages.
          </p>
          <Input
            value={state.businessHours}
            onChange={(e) => patch({ businessHours: e.target.value })}
            placeholder="Monday–Friday, 9 AM–5 PM ET"
          />
        </section>

        <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-5 space-y-3">
          <h2 className="text-base font-semibold">
            HubSpot form
            <HelpTip title="Handle with care">
              These IDs connect the contact forms to HubSpot. Wrong values break every form on
              the site. Only change them if HubSpot gives you new ones.
            </HelpTip>
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hs-region">Region</Label>
              <Input id="hs-region" value={state.hubspot.region} onChange={(e) => patch({ hubspot: { ...state.hubspot, region: e.target.value } })} placeholder="na1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-portal">Portal ID</Label>
              <Input id="hs-portal" value={state.hubspot.portalId} onChange={(e) => patch({ hubspot: { ...state.hubspot, portalId: e.target.value } })} placeholder="42958375" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-form">Form ID</Label>
              <Input id="hs-form" value={state.hubspot.formId} onChange={(e) => patch({ hubspot: { ...state.hubspot, formId: e.target.value } })} placeholder="1636ed35-…" />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">it-site/src/data/pages.ts</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </>
  )
}

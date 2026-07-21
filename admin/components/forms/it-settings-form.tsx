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
  saveSettings,
  type NavItem,
  type ITSettingsPayload,
  type ITSiteConfig,
  type SiteAddress,
  type SocialLink,
} from '@/lib/actions/it/settings'

interface Props {
  initial: ITSettingsPayload
}

export function ITSettingsForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [site, setSite] = useState<ITSiteConfig>(initial.site)
  const [nav, setNav] = useState<NavItem[]>([...initial.primaryNav])
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function updateSite<K extends keyof ITSiteConfig>(k: K, v: ITSiteConfig[K]) {
    setSite((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }
  function updateAddress<K extends keyof SiteAddress>(k: K, v: SiteAddress[K]) {
    setSite((p) => ({ ...p, address: { ...p.address, [k]: v } }))
    setDirty(true)
  }

  function handleSave() {
    if (!site.name.trim()) return toast.error('Firm name is required')
    if (!site.url.trim()) return toast.error('Site URL is required')

    startTransition(async () => {
      try {
        await saveSettings({ site, primaryNav: nav })
        toast.success('Settings saved')
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
          IT-site details used across the header, footer, contact page, and structured
          data on it.alpinemar.com. A change here updates every IT page at once.
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Firm identity</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={site.name} onChange={(e) => updateSite('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Legal name</Label>
              <Input id="legalName" value={site.legalName} onChange={(e) => updateSite('legalName', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={site.tagline} onChange={(e) => updateSite('tagline', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={site.description} onChange={(e) => updateSite('description', e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground">Used as the site meta description and default open-graph blurb.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">
              Site URL *
              <HelpTip title="Canonical domain">
                The IT site&rsquo;s primary domain (it.alpinemar.com). Drives canonical URLs,
                Open Graph links, sitemap, and structured data. Only change it if the domain changes.
              </HelpTip>
            </Label>
            <Input id="url" value={site.url} onChange={(e) => updateSite('url', e.target.value)} placeholder="https://it.alpinemar.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primaryCta">
              Primary CTA label
              <HelpTip title="Main call to action">
                The recurring button label, e.g. &ldquo;Book a Free IT Assessment&rdquo;.
              </HelpTip>
            </Label>
            <Input id="primaryCta" value={site.primaryCta} onChange={(e) => updateSite('primaryCta', e.target.value)} placeholder="Book a Free IT Assessment" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Contact</h2>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={site.email} onChange={(e) => updateSite('email', e.target.value)} placeholder="hello@alpinemar.com" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone (display)
                <HelpTip title="Shown to visitors">
                  The formatted number people see. The field beside it holds the dialable digits.
                </HelpTip>
              </Label>
              <Input id="phone" value={site.phone} onChange={(e) => updateSite('phone', e.target.value)} placeholder="(954) 208 4040" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneHref">
                Phone (tel: link)
                <HelpTip title="Digits for click-to-call">
                  E.164 format — plus sign, country code, then digits only, e.g. +19542084040.
                </HelpTip>
              </Label>
              <Input id="phoneHref" value={site.phoneHref} onChange={(e) => updateSite('phoneHref', e.target.value)} placeholder="+19542084040" />
              <p className="text-xs text-muted-foreground">E.164 format. Used in tel: hrefs.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Address</h2>
          <div className="space-y-1.5">
            <Label htmlFor="street">Street</Label>
            <Input id="street" value={site.address.street} onChange={(e) => updateAddress('street', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={site.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={site.address.state} onChange={(e) => updateAddress('state', e.target.value)} placeholder="FL" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={site.address.zip} onChange={(e) => updateAddress('zip', e.target.value)} placeholder="33301" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mapsUrl">Google Maps URL</Label>
            <Input id="mapsUrl" value={site.mapsUrl} onChange={(e) => updateSite('mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/…" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">
            Socials
            <HelpTip title="Order matters">
              The footer renders these icons <strong>by position</strong>, not by name — the
              1st entry gets the Facebook icon, 2nd the X icon, 3rd Instagram, 4th LinkedIn.
              Reordering here swaps which icon each link gets, so keep the order
              Facebook · X · Instagram · LinkedIn unless you also change the footer.
            </HelpTip>
          </h2>
          <StructList<SocialLink>
            value={site.socials}
            onChange={(next) => updateSite('socials', next)}
            fields={[
              { key: 'label', label: 'Label', placeholder: 'Facebook' },
              { key: 'href', label: 'URL', placeholder: 'https://…' },
            ]}
            defaultItem={{ label: '', href: '' }}
            addLabel="Add social link"
          />
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">
            Links
            <HelpTip title="External links">
              The <strong>Client portal</strong> is the secure client login (top bar).
              The <strong>Parent site</strong> links back to the main firm site
              (alpinemar.com) from the division switcher.
            </HelpTip>
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="clientPortal">Client portal URL</Label>
            <Input id="clientPortal" value={site.clientPortal} onChange={(e) => updateSite('clientPortal', e.target.value)} placeholder="https://alpinemar.clientportal.com/…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentSiteUrl">Parent site URL</Label>
            <Input id="parentSiteUrl" value={site.parentSiteUrl} onChange={(e) => updateSite('parentSiteUrl', e.target.value)} placeholder="https://alpinemar.com" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Primary navigation</h2>
          <p className="text-xs text-muted-foreground">
            Top-nav items rendered in the IT site header. Reorder with the arrows.
          </p>
          <StructList<NavItem>
            value={nav}
            onChange={(next) => { setNav(next); setDirty(true) }}
            fields={[
              { key: 'label', label: 'Label', placeholder: 'Label (e.g. Services)' },
              { key: 'href', label: 'Href', placeholder: 'Href (e.g. /services/)' },
            ]}
            defaultItem={{ label: '', href: '' }}
            addLabel="Add nav item"
          />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">it-site/src/data/site.ts</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

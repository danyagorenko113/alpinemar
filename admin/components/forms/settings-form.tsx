'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StringList } from '@/components/shared/string-list'
import { StructList } from '@/components/shared/struct-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveSettings,
  type NavItem,
  type SettingsPayload,
  type SiteAddress,
  type SiteConfig,
  type SiteSocials,
} from '@/lib/actions/settings'

interface Props {
  initial: SettingsPayload
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [site, setSite] = useState<SiteConfig>(initial.site)
  const [nav, setNav] = useState<NavItem[]>([...initial.primaryNav])
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function updateSite<K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) {
    setSite((p) => ({ ...p, [k]: v }))
    setDirty(true)
  }
  function updateAddress<K extends keyof SiteAddress>(k: K, v: SiteAddress[K]) {
    setSite((p) => ({ ...p, address: { ...p.address, [k]: v } }))
    setDirty(true)
  }
  function updateMaps(k: 'embed' | 'directions', v: string) {
    setSite((p) => ({ ...p, maps: { ...p.maps, [k]: v } }))
    setDirty(true)
  }
  function updateSocial<K extends keyof SiteSocials>(k: K, v: SiteSocials[K]) {
    setSite((p) => ({ ...p, socials: { ...p.socials, [k]: v } }))
    setDirty(true)
  }
  function updateNav(next: NavItem[]) {
    setNav(next)
    setDirty(true)
  }
  function updateMemberships(next: string[]) {
    setSite((p) => ({ ...p, memberships: next }))
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
          Site-wide firm details used across the header, footer, contact page, and search-engine structured data — a change here updates every page at once.
        </div>
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Firm identity</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={site.name} onChange={(e) => updateSite('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">
                Legal name
                <HelpTip title="Full registered name">
                  The full legal entity name (e.g. &ldquo;Alpine Mar CPAs &amp; Advisors&rdquo;). Used in the Organization structured data that search engines read. The shorter <strong>Name</strong> field above is the everyday display name shown in the page title, footer copyright, and social shares.
                </HelpTip>
              </Label>
              <Input
                id="legalName"
                value={site.legalName}
                onChange={(e) => updateSite('legalName', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={site.tagline} onChange={(e) => updateSite('tagline', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={site.description}
              onChange={(e) => updateSite('description', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Used as the site meta description and default open-graph blurb.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">
              Site URL *
              <HelpTip title="Canonical domain">
                The site&rsquo;s primary domain. Used to build canonical URLs, absolute Open Graph image links, sitemap/llms.txt entries, and structured data. Changing it affects SEO across the whole site, so only edit it if the domain actually changes.
              </HelpTip>
            </Label>
            <Input
              id="url"
              value={site.url}
              onChange={(e) => updateSite('url', e.target.value)}
              placeholder="https://alpinemar.com"
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Contact</h2>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={site.email}
              onChange={(e) => updateSite('email', e.target.value)}
              placeholder="hello@alpinemar.com"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone (display)
                <HelpTip title="Shown to visitors">
                  The formatted number people see, e.g. (954) 743-0147. Appears in the footer, contact page, homepage, and CTA sections. The field beside it holds the digits that make the number clickable.
                </HelpTip>
              </Label>
              <Input
                id="phone"
                value={site.phone}
                onChange={(e) => updateSite('phone', e.target.value)}
                placeholder="(954) 743-0147"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneHref">
                Phone (tel: link)
                <HelpTip title="Digits for the click-to-call link">
                  The dialable version used behind the clickable phone link (tel:). Enter it in E.164 format &mdash; a plus sign, country code, then digits only, e.g. +19547430147. It&rsquo;s also the telephone value in the structured data. Keep it in sync with the display number.
                </HelpTip>
              </Label>
              <Input
                id="phoneHref"
                value={site.phoneHref}
                onChange={(e) => updateSite('phoneHref', e.target.value)}
                placeholder="+19547430147"
              />
              <p className="text-xs text-muted-foreground">E.164 format. Used in tel: hrefs.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Address</h2>
          <div className="space-y-1.5">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={site.address.street}
              onChange={(e) => updateAddress('street', e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={site.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={site.address.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  placeholder="FL"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={site.address.zip}
                  onChange={(e) => updateAddress('zip', e.target.value)}
                  placeholder="33301"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
            Changing the address? Also update the two Google Maps URLs below, or the
            footer map keeps pointing at the old location.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mapsEmbed">
              Google Maps embed URL
              <HelpTip title="Footer map iframe">
                The <span className="font-mono">src</span> of the embedded map in the footer.
                In Google Maps: Share → Embed a map → copy the URL inside <span className="font-mono">src=&quot;…&quot;</span>.
              </HelpTip>
            </Label>
            <Textarea id="mapsEmbed" rows={2} value={site.maps.embed} onChange={(e) => updateMaps('embed', e.target.value)} className="font-mono text-xs" placeholder="https://www.google.com/maps/embed?pb=…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mapsDirections">Get-directions URL</Label>
            <Textarea id="mapsDirections" rows={2} value={site.maps.directions} onChange={(e) => updateMaps('directions', e.target.value)} className="font-mono text-xs" placeholder="https://www.google.com/maps/dir//…" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Socials</h2>
          <div className="space-y-1.5">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={site.socials.facebook}
              onChange={(e) => updateSocial('facebook', e.target.value)}
              placeholder="https://www.facebook.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={site.socials.instagram}
              onChange={(e) => updateSocial('instagram', e.target.value)}
              placeholder="https://www.instagram.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={site.socials.linkedin}
              onChange={(e) => updateSocial('linkedin', e.target.value)}
              placeholder="https://www.linkedin.com/company/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twitter">Twitter / X</Label>
            <Input
              id="twitter"
              value={site.socials.twitter}
              onChange={(e) => updateSocial('twitter', e.target.value)}
              placeholder="https://twitter.com/…"
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">
            Memberships
            <HelpTip title="Professional bodies">
              The professional associations the firm belongs to, e.g. AICPA, FICPA. Used to convey membership and credibility. Keep the list accurate, as it reflects the firm&rsquo;s standing.
            </HelpTip>
          </h2>
          <p className="text-xs text-muted-foreground">
            Professional bodies the firm belongs to (e.g. AICPA, FICPA).
          </p>
          <StringList
            value={site.memberships}
            onChange={updateMemberships}
            placeholder="e.g. AICPA"
            addLabel="Add membership"
          />
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">
            Portals
            <HelpTip title="External login links">
              Links to the two external portals clients and staff use. The <strong>Client portal</strong> is the secure client login (opens from the top bar and the mobile nav); the <strong>IT portal</strong> links to the sister IT site (it.alpinemar.com) from the top bar. Both open in a new tab.
            </HelpTip>
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="clientPortal">Client portal URL</Label>
            <Input
              id="clientPortal"
              value={site.clientPortal}
              onChange={(e) => updateSite('clientPortal', e.target.value)}
              placeholder="https://alpinemar.clientportal.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itPortal">IT portal URL</Label>
            <Input
              id="itPortal"
              value={site.itPortal}
              onChange={(e) => updateSite('itPortal', e.target.value)}
              placeholder="https://it.alpinemar.com"
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">Primary navigation</h2>
          <p className="text-xs text-muted-foreground">
            Top-nav items rendered in the site header. Reorder with the arrows.
          </p>
          <StructList<NavItem>
            value={nav}
            onChange={updateNav}
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
            Editing <span className="font-mono text-navy-700">src/data/site.ts</span>
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

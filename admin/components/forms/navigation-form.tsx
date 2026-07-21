'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StructList } from '@/components/shared/struct-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import {
  saveNavigation,
  type NavigationPayload,
  type ServiceCategory,
  type NavLink,
  type IndustryLink,
} from '@/lib/actions/navigation'

interface Props {
  initial: NavigationPayload
}

export function NavigationForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cats, setCats] = useState<ServiceCategory[]>(initial.serviceMenu)
  const [industries, setIndustries] = useState<IndustryLink[]>(initial.industryMenu)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function updateCat(idx: number, patch: Partial<ServiceCategory>) {
    setCats((p) => p.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
    setDirty(true)
  }
  function moveCat(idx: number, dir: -1 | 1) {
    setCats((p) => {
      const next = [...p]
      const j = idx + dir
      if (j < 0 || j >= next.length) return p
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
    setDirty(true)
  }
  function removeCat(idx: number) {
    setCats((p) => p.filter((_, i) => i !== idx))
    setDirty(true)
  }
  function addCat() {
    setCats((p) => [...p, { label: '', href: '/services/', icon: 'briefcase', blurb: '', items: [] }])
    setDirty(true)
  }

  function handleSave() {
    for (const c of cats) {
      if (!c.label.trim()) return toast.error('Every category needs a label')
      if (!c.href.trim().startsWith('/')) return toast.error(`Category "${c.label}" href must start with "/"`)
    }
    startTransition(async () => {
      try {
        await saveNavigation({ serviceMenu: cats, industryMenu: industries })
        toast.success('Navigation saved')
        setDirty(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <div className="space-y-6 pb-24 max-w-3xl">
        <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
          The <strong>Services</strong> mega-menu. Each category is a dropdown column with a
          landing page (<span className="font-mono">Href</span>) and a list of links. Category
          labels are also the service <strong>groups</strong>. Reorder with the arrows.
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Services menu — categories</h2>
            <Button type="button" variant="outline" size="sm" onClick={addCat}>
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </div>

          {cats.map((c, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Category label (= group name)</Label>
                  <Input value={c.label} onChange={(e) => updateCat(i, { label: e.target.value })} placeholder="e.g. Tax" className="font-medium" />
                </div>
                <div className="flex items-center gap-1 pt-6">
                  <button type="button" onClick={() => moveCat(i, -1)} disabled={i === 0} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveCat(i, 1)} disabled={i === cats.length - 1} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeCat(i)} className="p-1.5 text-muted-foreground hover:text-destructive" title="Remove category"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Landing page (href)</Label>
                  <Input value={c.href} onChange={(e) => updateCat(i, { href: e.target.value })} placeholder="/services/…/" className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Icon
                    <HelpTip title="Lucide icon key">Kebab-case Lucide icon name, e.g. <span className="font-mono">trending-up</span>.</HelpTip>
                  </Label>
                  <Input value={c.icon} onChange={(e) => updateCat(i, { icon: e.target.value })} placeholder="trending-up" className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Blurb</Label>
                <Input value={c.blurb} onChange={(e) => updateCat(i, { blurb: e.target.value })} placeholder="Short description shown under the category" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Links in this dropdown</Label>
                <StructList<NavLink>
                  value={c.items}
                  onChange={(items) => updateCat(i, { items })}
                  fields={[
                    { key: 'name', label: 'Name', placeholder: 'Link label' },
                    { key: 'href', label: 'Href', placeholder: '/services/…/' },
                    { key: 'desc', label: 'Description', placeholder: 'Short description' },
                  ]}
                  defaultItem={{ name: '', href: '/services/', desc: '' }}
                  addLabel="Add link"
                />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Industries menu</h2>
          <p className="text-xs text-muted-foreground">The Industries dropdown — a flat list of links.</p>
          <StructList<IndustryLink>
            value={industries}
            onChange={(v) => { setIndustries(v); setDirty(true) }}
            fields={[
              { key: 'name', label: 'Name', placeholder: 'Industry label' },
              { key: 'href', label: 'Href', placeholder: '/industries/…/' },
              { key: 'icon', label: 'Icon', placeholder: 'building' },
              { key: 'desc', label: 'Description', placeholder: 'Short description' },
            ]}
            defaultItem={{ name: '', href: '/industries/', icon: 'briefcase', desc: '' }}
            addLabel="Add industry"
          />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">src/data/navigation.ts</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : 'Save navigation'}
          </Button>
        </div>
      </div>
    </>
  )
}

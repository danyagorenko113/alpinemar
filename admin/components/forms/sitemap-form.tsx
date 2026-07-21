'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StructList } from '@/components/shared/struct-list'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveSitemap, type SitemapPayload, type SitemapSection, type SitemapLink } from '@/lib/actions/sitemap'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app'

export function SitemapForm({ initial }: { initial: SitemapPayload }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<SitemapPayload>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)
  function patch(p: Partial<SitemapPayload>) {
    setState((s) => ({ ...s, ...p }))
    setDirty(true)
  }
  function updateSection(idx: number, p: Partial<SitemapSection>) {
    patch({ customSections: state.customSections.map((s, i) => (i === idx ? { ...s, ...p } : s)) })
  }
  function moveSection(idx: number, dir: -1 | 1) {
    const next = [...state.customSections]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    patch({ customSections: next })
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSitemap(state)
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
          The Services, Industries, and Insights sections are generated automatically. Edit
          the hero and the manual link sections (Company, Tools, Reports) here.
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="heroTitle">Hero title</Label>
            <Input id="heroTitle" value={state.heroTitle} onChange={(e) => patch({ heroTitle: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="heroTagline">Hero tagline</Label>
            <Input id="heroTagline" value={state.heroTagline} onChange={(e) => patch({ heroTagline: e.target.value })} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Link sections</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => patch({ customSections: [...state.customSections, { title: '', items: [] }] })}>
              <Plus className="h-4 w-4" />
              Add section
            </Button>
          </div>

          {state.customSections.map((sec, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Section title</Label>
                  <Input value={sec.title} onChange={(e) => updateSection(i, { title: e.target.value })} placeholder="e.g. Company" className="font-medium" />
                </div>
                <div className="flex items-center gap-1 pt-6">
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === state.customSections.length - 1} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => patch({ customSections: state.customSections.filter((_, idx) => idx !== i) })} className="p-1.5 text-muted-foreground hover:text-destructive" title="Remove section"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <StructList<SitemapLink>
                value={sec.items}
                onChange={(items) => updateSection(i, { items })}
                fields={[
                  { key: 'title', label: 'Label', placeholder: 'Link label' },
                  { key: 'href', label: 'Href', placeholder: '/path/' },
                ]}
                defaultItem={{ title: '', href: '/' }}
                addLabel="Add link"
              />
            </div>
          ))}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">src/data/sitemap.json</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href={`${SITE_URL}/sitemap/`} target="_blank" rel="noopener noreferrer">
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

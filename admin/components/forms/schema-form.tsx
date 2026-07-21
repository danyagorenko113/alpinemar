'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import type { SchemaOverrides } from '@/lib/actions/schema'

interface Row {
  path: string
  jsonLd: string
}

interface Props {
  initial: SchemaOverrides
  saveAction: (input: SchemaOverrides) => Promise<{ sha: string }>
  filePath: string
}

export function SchemaForm({ initial, saveAction, filePath }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [global, setGlobal] = useState(initial.global ?? '')
  const [rows, setRows] = useState<Row[]>(
    Object.entries(initial.byPath ?? {}).map(([path, jsonLd]) => ({ path, jsonLd })),
  )
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  function touch() {
    setDirty(true)
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((p) => p.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
    touch()
  }

  function handleSave() {
    // Client-side JSON check for clearer errors before the server round-trip.
    const check = (label: string, v: string) => {
      const t = v.trim()
      if (!t) return true
      try {
        JSON.parse(t)
        return true
      } catch {
        toast.error(`Invalid JSON in ${label}`)
        return false
      }
    }
    if (!check('the site-wide schema', global)) return
    const byPath: Record<string, string> = {}
    for (const r of rows) {
      const path = r.path.trim()
      if (!path || !r.jsonLd.trim()) continue
      if (!path.startsWith('/')) return toast.error(`Path must start with "/": ${path}`)
      if (!check(`the schema for ${path}`, r.jsonLd)) return
      byPath[path] = r.jsonLd.trim()
    }

    startTransition(async () => {
      try {
        await saveAction({ global: global.trim(), byPath })
        toast.success('Schema saved')
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
          Paste JSON-LD (the content inside{' '}
          <span className="font-mono">&lt;script type=&quot;application/ld+json&quot;&gt;</span>).
          It is injected at the end of <span className="font-mono">&lt;/body&gt;</span> on the
          matching page(s). Validate your markup with Google&rsquo;s Rich Results Test.
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <Label htmlFor="global" className="text-base font-semibold">
            Site-wide schema
            <HelpTip title="Every page">
              Rendered on <strong>every</strong> page. Use for one graph that applies site-wide.
              Leave empty if you only need per-page schema below.
            </HelpTip>
          </Label>
          <Textarea
            id="global"
            value={global}
            onChange={(e) => { setGlobal(e.target.value); touch() }}
            rows={8}
            className="font-mono text-xs leading-relaxed"
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  ...\n}'}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Per-page schema</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => { setRows((p) => [...p, { path: '', jsonLd: '' }]); touch() }}>
              <Plus className="h-4 w-4" />
              Add page
            </Button>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Match a specific URL path (e.g. <span className="font-mono">/about-us/</span>) to its JSON-LD.
          </p>

          {rows.length === 0 && (
            <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No per-page schema yet — add one above.
            </p>
          )}

          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={r.path}
                  onChange={(e) => updateRow(i, { path: e.target.value })}
                  placeholder="/about-us/"
                  className="font-mono text-sm"
                />
                <button type="button" onClick={() => { setRows((p) => p.filter((_, idx) => idx !== i)); touch() }} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                value={r.jsonLd}
                onChange={(e) => updateRow(i, { jsonLd: e.target.value })}
                rows={8}
                className="font-mono text-xs leading-relaxed"
                placeholder={'{\n  "@context": "https://schema.org",\n  ...\n}'}
              />
            </div>
          ))}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">{filePath}</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : 'Save schema'}
          </Button>
        </div>
      </div>
    </>
  )
}

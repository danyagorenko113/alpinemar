'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Save, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import type { Redirect } from '@/lib/actions/redirects'

interface Props {
  initial: Redirect[]
  saveAction: (list: Redirect[]) => Promise<{ sha: string }>
  /** File being edited, shown in the status bar. */
  filePath: string
}

export function RedirectsForm({ initial, saveAction, filePath }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState<Redirect[]>(initial)
  const [dirty, setDirty] = useState(false)
  const [q, setQ] = useState('')

  useUnsavedChanges(dirty)

  function update(idx: number, patch: Partial<Redirect>) {
    setRows((p) => p.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
    setDirty(true)
  }
  function add() {
    setRows((p) => [{ source: '', destination: '', permanent: true }, ...p])
    setDirty(true)
  }
  function remove(idx: number) {
    setRows((p) => p.filter((_, i) => i !== idx))
    setDirty(true)
  }

  // Filtered view keeps original indices so edits target the right row.
  const view = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !needle || `${r.source} ${r.destination}`.toLowerCase().includes(needle))
  }, [rows, q])

  function handleSave() {
    const clean = rows.filter((r) => r.source.trim() || r.destination.trim())
    for (const r of clean) {
      if (!r.source.trim().startsWith('/')) return toast.error(`Source must start with "/": ${r.source || '(empty)'}`)
      if (!r.destination.trim()) return toast.error(`Missing destination for ${r.source}`)
    }
    const sources = clean.map((r) => r.source.trim())
    const dup = sources.find((s, i) => sources.indexOf(s) !== i)
    if (dup) return toast.error(`Duplicate source: ${dup}`)

    startTransition(async () => {
      try {
        await saveAction(clean.map((r) => ({ source: r.source.trim(), destination: r.destination.trim(), permanent: r.permanent !== false })))
        toast.success('Redirects saved')
        setDirty(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <div className="space-y-4 pb-24 max-w-4xl">
        <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
          301/302 redirects applied by Vercel on deploy. <strong>Source</strong> is the old
          path (must start with <span className="font-mono">/</span>); <strong>Destination</strong>
          is where it goes. Toggle <strong>301</strong> off for a temporary (302) redirect.
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by source or destination…" className="pl-9" />
          </div>
          <Button type="button" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
            Add redirect
          </Button>
        </div>

        <div className="rounded-lg border bg-card divide-y">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Source (old)</span>
            <span>Destination (new)</span>
            <span className="w-12 text-center">301</span>
            <span className="w-8"></span>
          </div>
          {view.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {rows.length === 0 ? 'No redirects yet — add one above.' : 'No redirects match the filter.'}
            </p>
          )}
          {view.map(({ r, i }) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-3 px-4 py-2.5 items-center">
              <Input value={r.source} onChange={(e) => update(i, { source: e.target.value })} placeholder="/old-path" className="font-mono text-xs h-8" />
              <Input value={r.destination} onChange={(e) => update(i, { destination: e.target.value })} placeholder="/new-path/" className="font-mono text-xs h-8" />
              <label className="flex items-center justify-center gap-1.5 sm:w-12 cursor-pointer" title="301 permanent (off = 302 temporary)">
                <input type="checkbox" checked={r.permanent !== false} onChange={(e) => update(i, { permanent: e.target.checked })} className="h-4 w-4 rounded border-input" />
                <span className="sm:hidden text-xs text-muted-foreground">301 permanent</span>
              </label>
              <button type="button" onClick={() => remove(i)} className="justify-self-end text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            {rows.length} redirect{rows.length === 1 ? '' : 's'} · <span className="font-mono text-navy-700">{filePath}</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : 'Save redirects'}
          </Button>
        </div>
      </div>
    </>
  )
}

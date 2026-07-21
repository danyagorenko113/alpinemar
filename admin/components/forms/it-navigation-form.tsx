'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StringList } from '@/components/shared/string-list'
import { HelpTip } from '@/components/shared/help-tip'
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { saveServiceMenu, type ServiceLine } from '@/lib/actions/it/navigation'

interface Props {
  initial: ServiceLine[]
  /** Existing service slugs, for validation hints. */
  serviceSlugs: string[]
}

export function ITNavigationForm({ initial, serviceSlugs }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [lines, setLines] = useState<ServiceLine[]>(initial)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty)

  const known = new Set(serviceSlugs)

  function update(idx: number, patch: Partial<ServiceLine>) {
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
    setDirty(true)
  }
  function move(idx: number, dir: -1 | 1) {
    setLines((p) => {
      const next = [...p]
      const j = idx + dir
      if (j < 0 || j >= next.length) return p
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
    setDirty(true)
  }
  function remove(idx: number) {
    setLines((p) => p.filter((_, i) => i !== idx))
    setDirty(true)
  }
  function add() {
    setLines((p) => [...p, { line: '', children: [] }])
    setDirty(true)
  }

  function handleSave() {
    for (const l of lines) {
      if (!l.line.trim()) return toast.error('Every line needs a service slug')
    }
    const unknown = lines
      .flatMap((l) => [l.line, ...l.children])
      .filter((s) => s.trim() && !known.has(s.trim()))
    if (unknown.length) {
      const ok = window.confirm(`These slugs don't match an existing service and won't render:\n${unknown.join(', ')}\n\nSave anyway?`)
      if (!ok) return
    }
    startTransition(async () => {
      try {
        await saveServiceMenu(lines)
        toast.success('Menu saved')
        setDirty(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <div className="space-y-4 pb-24 max-w-2xl">
        <div className="rounded-md border border-scooter/40 bg-scooter/5 px-4 py-2.5 text-xs text-navy-700">
          The IT <strong>Services</strong> mega-menu. Each row is a primary tab (a service
          <span className="font-mono"> slug</span>) with the sub-service slugs shown under it.
          Slugs must match a service page (e.g. <span className="font-mono">cybersecurity</span>).
          Reorder tabs with the arrows.
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4" />
            Add tab
          </Button>
        </div>

        {lines.map((l, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>
                  Primary tab (service slug)
                  {l.line.trim() && !known.has(l.line.trim()) && (
                    <span className="ml-2 text-[11px] text-amber-600">unknown slug</span>
                  )}
                </Label>
                <Input value={l.line} onChange={(e) => update(i, { line: e.target.value })} placeholder="remote-it-support" className="font-mono text-sm" />
              </div>
              <div className="flex items-center gap-1 pt-6">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === lines.length - 1} className="p-1.5 text-muted-foreground hover:text-navy-900 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(i)} className="p-1.5 text-muted-foreground hover:text-destructive" title="Remove tab"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Sub-service slugs
                <HelpTip title="Children">Leave empty for a tab with no sub-services (e.g. Incident Response).</HelpTip>
              </Label>
              <StringList
                value={l.children}
                onChange={(children) => update(i, { children })}
                placeholder="e.g. it-compliance"
                addLabel="Add sub-service"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:pl-60">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="text-xs text-muted-foreground">
            Editing <span className="font-mono text-navy-700">it-site/src/data/site.ts</span>
            {dirty && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? 'Saving…' : 'Save menu'}
          </Button>
        </div>
      </div>
    </>
  )
}

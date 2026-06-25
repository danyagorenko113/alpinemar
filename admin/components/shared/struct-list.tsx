'use client'

import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface FieldDef<T> {
  key: keyof T & string
  label: string
  textarea?: boolean
  placeholder?: string
}

interface StructListProps<T extends Record<string, string>> {
  value: T[]
  onChange: (next: T[]) => void
  fields: FieldDef<T>[]
  defaultItem: T
  addLabel?: string
}

export function StructList<T extends Record<string, string>>({
  value,
  onChange,
  fields,
  defaultItem,
  addLabel = 'Add item',
}: StructListProps<T>) {
  function setAt(i: number, key: keyof T, v: string) {
    const next = [...value]
    next[i] = { ...next[i], [key]: v }
    onChange(next)
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-xs text-muted-foreground italic">No items yet.</p>}
      {value.map((item, i) => (
        <div key={i} className="rounded-md border bg-navy-50/40 p-3 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Item {i + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-xs text-navy-400 hover:text-navy-700 disabled:opacity-30 px-1.5"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                className="text-xs text-navy-400 hover:text-navy-700 disabled:opacity-30 px-1.5"
                title="Move down"
              >
                ↓
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeAt(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {fields.map((f) =>
            f.textarea ? (
              <Textarea
                key={f.key}
                value={item[f.key] ?? ''}
                onChange={(e) => setAt(i, f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
                rows={3}
              />
            ) : (
              <Input
                key={f.key}
                value={item[f.key] ?? ''}
                onChange={(e) => setAt(i, f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
              />
            ),
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...defaultItem }])}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface StringListProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
  /** Render each row as a multi-line textarea instead of a single-line input. */
  multiline?: boolean
}

export function StringList({ value, onChange, placeholder, addLabel = 'Add item', multiline = false }: StringListProps) {
  // Stable React keys per row so editing/removing/reordering doesn't remount the
  // wrong input (which would steal focus / edit a different row). Keys are kept
  // in lockstep with `value` mutations and resynced if `value` changes length
  // from outside the component.
  const nextId = useRef(0)
  const [keys, setKeys] = useState<number[]>(() => value.map(() => nextId.current++))
  if (keys.length !== value.length) {
    // External length change (e.g. loaded a different entry) — resync keys.
    setKeys(value.map((_, i) => keys[i] ?? nextId.current++))
  }

  function setAt(i: number, v: string) {
    const next = [...value]
    next[i] = v
    onChange(next)
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
    setKeys(keys.filter((_, idx) => idx !== i))
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    const nk = [...keys]
    ;[nk[i], nk[j]] = [nk[j], nk[i]]
    onChange(next)
    setKeys(nk)
  }
  function add() {
    onChange([...value, ''])
    setKeys([...keys, nextId.current++])
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No items yet.</p>
      )}
      {value.map((item, i) => (
        <div key={keys[i]} className="flex items-center gap-1.5 group">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-navy-300 hover:text-navy-700 disabled:opacity-30"
              title="Move up"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground w-5 pt-2 self-start">{i + 1}.</span>
          {multiline ? (
            <Textarea value={item} onChange={(e) => setAt(i, e.target.value)} placeholder={placeholder} rows={2} className="flex-1" />
          ) : (
            <Input value={item} onChange={(e) => setAt(i, e.target.value)} placeholder={placeholder} />
          )}
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
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}

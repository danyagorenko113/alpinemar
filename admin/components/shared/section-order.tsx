'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionDef<K extends string> {
  key: K
  label: string
  hint?: string
}

interface SectionOrderProps<K extends string> {
  /** All sections in the site's default render order. */
  defs: SectionDef<K>[]
  /** Current frontmatter value; undefined = default full layout. */
  value?: K[]
  /**
   * Called with the ordered array of enabled keys, or undefined when the
   * user's arrangement matches the default (all enabled, default order).
   */
  onChange: (next: K[] | undefined) => void
}

interface Row<K extends string> {
  key: K
  enabled: boolean
}

function initRows<K extends string>(defs: SectionDef<K>[], value?: K[]): Row<K>[] {
  if (!value) return defs.map((d) => ({ key: d.key, enabled: true }))
  const rows: Row<K>[] = value
    .filter((k) => defs.some((d) => d.key === k))
    .map((k) => ({ key: k, enabled: true }))
  for (const d of defs) {
    if (!rows.some((r) => r.key === d.key)) rows.push({ key: d.key, enabled: false })
  }
  return rows
}

/**
 * Checkbox + up/down ordering control over a fixed set of page sections.
 * Emits `undefined` while the arrangement matches the default so the
 * frontmatter key stays omitted until the user actually customizes.
 */
export function SectionOrder<K extends string>({ defs, value, onChange }: SectionOrderProps<K>) {
  const [rows, setRows] = useState<Row<K>[]>(() => initRows(defs, value))

  function emit(next: Row<K>[]) {
    setRows(next)
    const enabled = next.filter((r) => r.enabled).map((r) => r.key)
    const isDefault =
      enabled.length === defs.length && enabled.every((k, i) => k === defs[i].key)
    onChange(isDefault ? undefined : enabled)
  }

  function toggle(key: K) {
    emit(rows.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r)))
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[index], next[j]] = [next[j], next[index]]
    emit(next)
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const def = defs.find((d) => d.key === row.key)!
        return (
          <div
            key={row.key}
            className={cn(
              'flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-background',
              !row.enabled && 'opacity-60',
            )}
          >
            <input
              type="checkbox"
              id={`section-${row.key}`}
              checked={row.enabled}
              onChange={() => toggle(row.key)}
              className="h-3.5 w-3.5 accent-[var(--color-scooter,#2ab7ca)]"
            />
            <label htmlFor={`section-${row.key}`} className="flex-1 text-xs font-medium cursor-pointer select-none">
              {def.label}
              {def.hint && <span className="ml-1.5 font-normal text-muted-foreground">{def.hint}</span>}
            </label>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-navy-400 hover:text-navy-700 disabled:opacity-30 p-0.5"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
              className="text-navy-400 hover:text-navy-700 disabled:opacity-30 p-0.5"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronRight, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SectionCopy } from '@/lib/actions/services'

export interface HeadingField {
  key: keyof SectionCopy
  label: string
  /** The built-in default, shown as the placeholder = what renders if left blank. */
  placeholder: string
  textarea?: boolean
}

interface Props {
  /** Current overrides for this one section (a slice of sectionCopy). */
  value?: SectionCopy
  fields: HeadingField[]
  onChange: (next: SectionCopy | undefined) => void
}

/**
 * Inline editor for ONE section's on-page heading text — the small eyebrow
 * label, the big heading, and the intro sentence that sit above the section on
 * the live page. Lives inside that section's card so it's obvious these are
 * editable and which section they belong to. Blank fields fall back to the
 * site default (shown as the greyed placeholder), so the file only stores what
 * you actually change.
 */
export function SectionHeadingFields({ value, fields, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const customCount = fields.filter((f) => (value?.[f.key] ?? '').trim()).length

  function set(key: keyof SectionCopy, v: string) {
    const next: SectionCopy = { ...(value ?? {}) }
    if (v.trim()) next[key] = v
    else delete next[key]
    onChange(Object.keys(next).length ? next : undefined)
  }

  return (
    <div className="rounded-md border bg-navy-50/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-navy-700"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 text-navy-400 transition-transform', open && 'rotate-90')} />
        <Pencil className="h-3.5 w-3.5 text-navy-400" />
        <span className="flex-1">Heading &amp; intro text shown above this section</span>
        {customCount > 0 && (
          <span className="rounded-full bg-scooter/15 px-2 py-0.5 text-[10px] font-medium text-scooter-dark">
            {customCount} edited
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t px-3 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            The label, heading, and intro sentence that appear at the top of this section on the
            live page. The greyed text is the current default — type to replace it, or leave
            blank to keep the default.
          </p>
          {fields.map((f) => (
            <div key={String(f.key)} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.textarea ? (
                <Textarea
                  value={value?.[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                  className="text-sm"
                />
              ) : (
                <Input
                  value={value?.[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

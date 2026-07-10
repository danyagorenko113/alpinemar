'use client'

import { ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { SectionCopy, ServiceCopyKey, ServiceSectionCopy } from '@/lib/actions/services'

export interface CopyFieldDef {
  key: keyof SectionCopy
  label: string
  /** The built-in default shown as placeholder — what renders when left blank. */
  placeholder: string
  textarea?: boolean
}

export interface CopySectionDef {
  key: ServiceCopyKey
  label: string
  fields: CopyFieldDef[]
}

interface SectionCopyEditorProps {
  defs: CopySectionDef[]
  value?: ServiceSectionCopy
  onChange: (next: ServiceSectionCopy | undefined) => void
}

/**
 * Per-section heading/eyebrow/intro overrides. Each field's placeholder shows
 * the built-in default; blank fields fall back to it, so the frontmatter only
 * carries what the editor actually customized.
 */
export function SectionCopyEditor({ defs, value, onChange }: SectionCopyEditorProps) {
  function updateField(section: ServiceCopyKey, field: keyof SectionCopy, v: string) {
    const entry: SectionCopy = { ...(value?.[section] ?? {}) }
    if (v.trim()) entry[field] = v
    else delete entry[field]

    const next: ServiceSectionCopy = { ...(value ?? {}) }
    if (Object.keys(entry).length) next[section] = entry
    else delete next[section]

    onChange(Object.keys(next).length ? next : undefined)
  }

  return (
    <div className="space-y-1.5">
      {defs.map((def) => {
        const overridden = Object.values(value?.[def.key] ?? {}).filter(Boolean).length
        return (
          <details key={def.key} className="group rounded-md border bg-background">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-xs font-medium [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-3.5 w-3.5 text-navy-400 transition-transform group-open:rotate-90" />
              <span className="flex-1">{def.label}</span>
              {overridden > 0 && (
                <span className="rounded-full bg-scooter/15 px-2 py-0.5 text-[10px] font-medium text-scooter-dark">
                  {overridden} custom
                </span>
              )}
            </summary>
            <div className="space-y-3 border-t px-3 py-3">
              {def.fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  {f.textarea ? (
                    <Textarea
                      value={value?.[def.key]?.[f.key] ?? ''}
                      onChange={(e) => updateField(def.key, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={2}
                      className="text-sm"
                    />
                  ) : (
                    <Input
                      value={value?.[def.key]?.[f.key] ?? ''}
                      onChange={(e) => updateField(def.key, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}

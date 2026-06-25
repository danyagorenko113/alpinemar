'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  suggestions?: string[]
  className?: string
}

export function TagInput({ value, onChange, placeholder, suggestions, className }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const t = raw.trim()
    if (!t) return
    if (value.includes(t)) return
    onChange([...value, t])
    setDraft('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const filteredSuggestions =
    suggestions?.filter((s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase())).slice(0, 6) ?? []

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        {value.map((t) => (
          <Badge key={t} variant="muted" className="gap-1 pl-2 pr-1 py-0.5">
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== t))}
              className="rounded-full hover:bg-navy-200 p-0.5"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => draft && addTag(draft)}
          placeholder={value.length === 0 ? (placeholder ?? 'Type and press Enter…') : ''}
          className="h-7 flex-1 min-w-[120px] border-0 px-1 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {draft && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs rounded-full border border-dashed border-navy-200 px-2.5 py-0.5 text-navy-600 hover:border-scooter hover:text-scooter-dark"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * One-time popup shown on admin sections that are structurally coupled or
 * code-driven, where changes are safer made with an AI assistant (Claude Code)
 * than by hand. Dismissed permanently (per browser) with "I understand".
 */
const NOTICES = {
  navigation: {
    title: 'Editing the menu? Prefer your AI assistant',
    body: "The menu structure is linked to page URLs and cross-links across the whole site. Adding, removing, or reordering items — especially top-level service lines — is safer done with your AI assistant (Claude Code), which updates every linked file at once so nothing breaks silently. Simple label or URL tweaks here are fine.",
  },
  redirects: {
    title: 'Renaming a URL? Prefer your AI assistant',
    body: "Adding a single redirect here is fine. But renaming a page's URL needs the redirect plus the page file, the menu, the footer, and every cross-link changed together. Ask your AI assistant (Claude Code) to do a rename so nothing is left pointing at the old address.",
  },
  homepage: {
    title: 'The homepage is built in code',
    body: 'The homepage tiles and layout are assembled in code, not from these fields, so edits here may not appear on the live homepage. To change the homepage, ask your AI assistant (Claude Code).',
  },
  schema: {
    title: 'Structured data is advanced',
    body: "JSON-LD schema has to be valid, escaped JSON — it's easy to break by hand and hard to notice when it's wrong. Ask your AI assistant (Claude Code) to add or edit schema for you.",
  },
} as const

export type StructuralNoticePage = keyof typeof NOTICES

export function StructuralNotice({ page }: { page: StructuralNoticePage }) {
  const notice = NOTICES[page]
  const storageKey = `am-structural-notice:${page}`
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true)
    } catch {
      /* localStorage unavailable — just don't show */
    }
  }, [storageKey])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss() }}>
      <DialogContent className="max-w-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <DialogTitle>{notice.title}</DialogTitle>
            <DialogDescription className="mt-2 leading-relaxed">
              {notice.body}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={dismiss}>I understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

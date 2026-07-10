'use client'

import * as Popover from '@radix-ui/react-popover'
import { HelpCircle } from 'lucide-react'

interface HelpTipProps {
  /** Short bold lead-in, e.g. "How this works". */
  title?: string
  children: React.ReactNode
}

/**
 * Inline "?" next to a field label. Click (or keyboard-focus + Enter) opens a
 * small popover explaining how the feature works and where it shows up on the
 * live site. Popover, not hover-tooltip, so it works on touch devices and can
 * hold a couple of sentences.
 */
export function HelpTip({ title, children }: HelpTipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={title ? `Help: ${title}` : 'Help'}
          className="ml-1 inline-flex size-4 items-center justify-center rounded-full align-middle text-navy-400 transition-colors hover:text-scooter-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-scooter"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-72 rounded-md border bg-white p-3 text-xs leading-relaxed text-navy-700 shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {title && <p className="mb-1 font-semibold text-navy-900">{title}</p>}
          {children}
          <Popover.Arrow className="fill-white drop-shadow-[0_1px_0_rgba(0,0,0,0.08)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

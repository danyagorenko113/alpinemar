import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, backHref, backLabel, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8', className)}>
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="font-display inline-flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-scooter-dark mb-3"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="am-h1-display am-gradient-ink">{title}</h1>
        {description && <p className="font-display text-sm text-navy-500 mt-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

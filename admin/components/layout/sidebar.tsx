'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  BookOpen,
  FileText,
  Briefcase,
  Building2,
  Users,
  PenLine,
  ImageIcon,
  LayoutTemplate,
  Star,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  title: string
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home, title: 'Content overview' },
      { href: '/guide', label: 'Guide', icon: BookOpen, title: 'What you can edit & where' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/blog', label: 'Blog', icon: FileText, title: 'Articles & insights' },
      { href: '/services', label: 'Services', icon: Briefcase, title: 'Service pages' },
      { href: '/industries', label: 'Industries', icon: Building2, title: 'Industry pages' },
      { href: '/team', label: 'Team', icon: Users, title: 'Team members' },
      { href: '/authors', label: 'Authors', icon: PenLine, title: 'Blog authors & bios' },
    ],
  },
  {
    label: 'Site',
    items: [
      { href: '/homepage', label: 'Homepage', icon: LayoutTemplate, title: 'Pinned cards, logos, value props' },
      { href: '/reviews', label: 'Reviews', icon: Star, title: 'Google review testimonials' },
      { href: '/settings', label: 'Settings', icon: Settings, title: 'Contact info, socials, nav' },
    ],
  },
  {
    label: 'Library',
    items: [{ href: '/media', label: 'Media', icon: ImageIcon, title: 'Images & assets' }],
  },
]

// IT-site nav — grows per implementation phase. Phase 1: Blog + Team.
const itNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/it/dashboard', label: 'Dashboard', icon: Home, title: 'IT content overview' },
    ],
  },
  {
    label: 'IT Content',
    items: [
      { href: '/it/blog', label: 'Blog', icon: FileText, title: 'IT articles & insights' },
      { href: '/it/team', label: 'Team', icon: Users, title: 'IT team members' },
    ],
  },
]

/** Two-tab switcher between the main-site admin and the IT-site admin. */
function SiteSwitcher({ isIt, onNavigate }: { isIt: boolean; onNavigate?: () => void }) {
  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex-1 rounded-md px-2.5 py-1.5 text-center text-xs font-medium transition-colors',
        active ? 'bg-scooter text-navy-900' : 'text-white/70 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      {label}
    </Link>
  )
  return (
    <div className="mb-4 flex gap-1 rounded-lg bg-white/[0.04] p-1">
      {tab('/dashboard', 'Main Site', !isIt)}
      {tab('/it/dashboard', 'IT Site', isIt)}
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isIt = pathname === '/it' || pathname.startsWith('/it/')
  const groups = isIt ? itNavGroups : navGroups
  return (
    <>
      <SiteSwitcher isIt={isIt} onNavigate={onNavigate} />
      {groups.map((group, idx) => (
        <div key={group.label ?? `g-${idx}`} className={idx > 0 ? 'mt-6' : ''}>
          {group.label && (
            <div className="flex items-center gap-2 px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-scooter">
              <span className="block size-1.5 bg-scooter" />
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.title}
                className={cn(
                  'font-display flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-scooter')} />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}

function FooterLinks() {
  const router = useRouter()
  const pathname = usePathname()
  const isIt = pathname === '/it' || pathname.startsWith('/it/')
  const siteUrl = isIt
    ? (process.env.NEXT_PUBLIC_IT_SITE_URL ?? 'https://it.alpinemar.com')
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpinemar.vercel.app')
  async function handleSignOut() {
    await logout()
    router.push('/login')
    router.refresh()
  }
  return (
    <div className="space-y-1">
      <a
        href={siteUrl}
        target="_blank"
        rel="noopener"
        className="font-display flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        {isIt ? 'View IT site' : 'View site'}
      </a>
      <button
        type="button"
        onClick={handleSignOut}
        className="font-display flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center bg-white text-navy-900 text-[11px] font-semibold tracking-tight">
        AM
      </span>
      <span className="font-display text-sm font-medium tracking-tight text-white">Alpine Mar</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-60 flex-col bg-[#12122d] am-grid-pattern sticky top-0 relative">
      <div className="flex h-14 items-center px-4 relative z-10">
        <Brand />
      </div>
      <div className="h-px bg-white/10 relative z-10" />
      <nav className="flex-1 overflow-y-auto p-2.5 relative z-10">
        <NavLinks />
      </nav>
      <div className="h-px bg-white/10 relative z-10" />
      <div className="p-2.5 relative z-10">
        <FooterLinks />
      </div>
    </aside>
  )
}

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="flex md:hidden h-14 items-center gap-3 border-b px-4 bg-[#12122d] sticky top-0 z-30">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-[#12122d] am-grid-pattern border-r-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center px-4 relative z-10">
            <Brand />
          </div>
          <div className="h-px bg-white/10 relative z-10" />
          <nav className="flex-1 overflow-y-auto p-2.5 relative z-10">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <div className="h-px bg-white/10 relative z-10" />
          <div className="p-2.5 relative z-10">
            <FooterLinks />
          </div>
        </SheetContent>
      </Sheet>
      <Brand />
    </header>
  )
}

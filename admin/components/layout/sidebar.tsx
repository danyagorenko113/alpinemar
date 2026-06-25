'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  FileText,
  Briefcase,
  Building2,
  Users,
  ImageIcon,
  LogOut,
  Menu,
  ExternalLink,
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    items: [{ href: '/dashboard', label: 'Dashboard', icon: Home, title: 'Content overview' }],
  },
  {
    label: 'Content',
    items: [
      { href: '/blog', label: 'Blog', icon: FileText, title: 'Articles & insights' },
      { href: '/services', label: 'Services', icon: Briefcase, title: 'Service pages' },
      { href: '/industries', label: 'Industries', icon: Building2, title: 'Industry pages' },
      { href: '/team', label: 'Team', icon: Users, title: 'Team members' },
    ],
  },
  {
    label: 'Library',
    items: [{ href: '/media', label: 'Media', icon: ImageIcon, title: 'Images & assets' }],
  },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {navGroups.map((group, idx) => (
        <div key={group.label ?? `g-${idx}`} className={idx > 0 ? 'mt-5' : ''}>
          {group.label && (
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-navy-900 text-white'
                    : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
                )}
              >
                <Icon className="h-4 w-4" />
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
  async function handleSignOut() {
    await logout()
    router.push('/login')
    router.refresh()
  }
  return (
    <div className="space-y-1">
      <a
        href="https://alpinemar.com"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-navy-500 hover:bg-navy-50 hover:text-navy-900 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        View site
      </a>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-navy-500 hover:text-navy-900"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  )
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-900 text-white text-[11px] font-semibold tracking-tight">
        AM
      </span>
      <span className="text-sm font-semibold tracking-tight text-navy-900">Alpine Mar</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r bg-sidebar sticky top-0">
      <div className="flex h-14 items-center px-4">
        <Brand />
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto p-2.5">
        <NavLinks />
      </nav>
      <Separator />
      <div className="p-2.5">
        <FooterLinks />
      </div>
    </aside>
  )
}

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="flex md:hidden h-14 items-center gap-3 border-b px-4 bg-sidebar sticky top-0 z-30">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center px-4">
            <Brand />
          </div>
          <Separator />
          <nav className="flex-1 overflow-y-auto p-2.5">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <Separator />
          <div className="p-2.5">
            <FooterLinks />
          </div>
        </SheetContent>
      </Sheet>
      <Brand />
    </header>
  )
}

'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  // Only allow same-origin relative paths (guard against open redirect).
  const rawNext = params.get('next') || '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(password)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#12122d] px-4 py-16 text-white">
      {/* Grid pattern — mirrors the site's dark hero sections */}
      <div className="pointer-events-none absolute inset-0 am-grid-pattern" />
      {/* Soft radial glow around the card */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(51,187,220,0.12),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-white text-navy-900 text-xs font-semibold tracking-tight">
            AM
          </div>
          <div className="am-eyebrow text-white/80">Content Management</div>
          <h1 className="am-h1-display am-gradient-ink-light text-center">
            Alpine Mar<br />Admin
          </h1>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-[10px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm shadow-[0_24px_80px_-40px_rgba(0,0,0,0.6)]"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-display text-xs uppercase tracking-[0.12em] text-scooter">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="h-11 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-scooter focus:bg-white/10 focus-visible:ring-scooter/30"
              />
            </div>
            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-scooter text-navy-900 hover:bg-white font-display"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center font-display text-xs text-white/50">
          Internal tool · not indexed
        </p>
      </div>
    </div>
  )
}

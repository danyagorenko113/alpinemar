'use server'

import { cookies, headers } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'
import { SESSION_COOKIE, SESSION_MAX_AGE, issueSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_SECONDS = 15 * 60 // 15 min

/**
 * Constant-time string comparison with no length side-channel: hash both
 * inputs to a fixed-length digest first, then compare the digests. This way
 * neither the timing nor the compared-buffer length reveals anything about
 * the stored password's length.
 */
function safeEqual(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a, 'utf8').digest()
  const digestB = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(digestA, digestB)
}

async function clientKey(): Promise<string> {
  const h = await headers()
  // Trust the infrastructure-added IP, not the client-supplied left-most XFF
  // entry (which an attacker rotates to bypass the rate limit). Vercel sets
  // x-real-ip to the verified client IP and appends the real IP to the RIGHT
  // of x-forwarded-for.
  const realIp = h.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const xff = h.get('x-forwarded-for')
  const last = xff?.split(',').map((s) => s.trim()).filter(Boolean).at(-1)
  return last || 'unknown'
}

export async function login(password: string): Promise<{ error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.SESSION_SECRET
  if (!adminPassword) return { error: 'ADMIN_PASSWORD not configured on server' }
  if (!secret) return { error: 'SESSION_SECRET not configured on server' }

  const key = await clientKey()
  const rl = checkRateLimit(`login:${key}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS)
  if (!rl.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.` }
  }

  if (!safeEqual(password, adminPassword)) return { error: 'Wrong password' }

  const token = await issueSession(secret)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return {}
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

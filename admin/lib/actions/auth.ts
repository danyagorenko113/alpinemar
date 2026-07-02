'use server'

import { cookies, headers } from 'next/headers'
import { timingSafeEqual } from 'crypto'
import { SESSION_COOKIE, SESSION_MAX_AGE, issueSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_SECONDS = 15 * 60 // 15 min

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    // still consume timingSafeEqual on padded buffers to avoid length leak
    const padded = Buffer.alloc(bufA.length, 0)
    timingSafeEqual(bufA, padded)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

async function clientKey(): Promise<string> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return xff || h.get('x-real-ip') || 'unknown'
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

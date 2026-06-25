'use server'

import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const SESSION_COOKIE = 'alpine_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET ?? ''
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export async function login(password: string): Promise<{ error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return { error: 'ADMIN_PASSWORD not configured on server' }
  if (!process.env.SESSION_SECRET) return { error: 'SESSION_SECRET not configured on server' }
  if (password !== adminPassword) return { error: 'Wrong password' }

  const token = sign(`v1:${Date.now()}`)
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

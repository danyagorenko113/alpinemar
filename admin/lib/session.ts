/**
 * Session cookie signing — Web Crypto API so it works in both
 * Edge (middleware) and Node (server actions) runtimes.
 *
 * Cookie value layout:  `<payload>.<hexSignature>`
 * where payload = `v1:<issuedAtMs>`  (opaque, but re-signed on rotation)
 */

const COOKIE_NAME = 'alpine_admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

async function keyFromSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): ArrayBuffer {
  const buf = new ArrayBuffer(hex.length / 2)
  const view = new Uint8Array(buf)
  for (let i = 0; i < view.length; i++) view[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return buf
}

export async function signSession(payload: string, secret: string): Promise<string> {
  const key = await keyFromSecret(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `${payload}.${toHex(sig)}`
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const payload = token.slice(0, dot)
  const sigHex = token.slice(dot + 1)
  if (!/^[0-9a-f]+$/i.test(sigHex)) return false

  const key = await keyFromSecret(secret)
  try {
    return await crypto.subtle.verify(
      'HMAC',
      key,
      fromHex(sigHex),
      new TextEncoder().encode(payload),
    )
  } catch {
    return false
  }
}

export async function issueSession(secret: string): Promise<string> {
  return signSession(`v1:${Date.now()}`, secret)
}

export const SESSION_COOKIE = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE_SECONDS

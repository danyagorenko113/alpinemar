/**
 * Tiny in-memory TTL cache for expensive server-side reads (GitHub API
 * list/read fanouts). Per-serverless-instance; not a shared cache.
 *
 * Usage:
 *   const posts = await cached('blog:list', 60_000, () => listBlogPostsRaw())
 *   invalidate('blog:list')            // on save/delete
 *   invalidatePrefix('blog:')          // when many keys share a namespace
 */

interface Entry {
  data: unknown
  expiresAt: number
}

const store = new Map<string, Entry>()
// Coalesce concurrent misses so we don't fan out N identical GitHub-tree
// fetches when the cache is cold and multiple requests race.
const inflight = new Map<string, Promise<unknown>>()

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) return hit.data as T

  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const p = (async () => {
    try {
      const data = await fn()
      store.set(key, { data, expiresAt: Date.now() + ttlMs })
      return data
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, p)
  return p
}

export function invalidate(key: string): void {
  store.delete(key)
}

export function invalidatePrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

export function clearAllCaches(): void {
  store.clear()
}

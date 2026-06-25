'use server'

/**
 * Optional: ping the Vercel deploy hook so the Astro site rebuilds immediately
 * after a content change. Without this, Vercel still rebuilds on the GitHub
 * commit push — this is just a belt-and-suspenders path for `fs` mode (local).
 */
export async function triggerRedeploy(): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) return { ok: false, error: 'VERCEL_DEPLOY_HOOK_URL not configured' }
  try {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) return { ok: false, error: `Deploy hook returned ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

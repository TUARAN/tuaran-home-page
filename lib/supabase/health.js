export function getSupabaseConfig(env = {}) {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '')
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!url || !publishableKey) return null
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('SUPABASE_URL must be an HTTPS project origin')
  }
  return { url: parsed.origin, publishableKey }
}

export async function checkSupabaseHealth(env, fetcher = fetch) {
  let config
  try {
    config = getSupabaseConfig(env)
  } catch {
    return { status: 'invalid_config' }
  }
  if (!config) return { status: 'unconfigured' }

  try {
    const response = await fetcher(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.publishableKey },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    return { status: response.ok ? 'healthy' : 'error', httpStatus: response.status }
  } catch {
    return { status: 'unreachable' }
  }
}

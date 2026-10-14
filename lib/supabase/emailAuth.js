import { getSupabaseConfig } from './health.js'

export function isSupabaseEmailAuthEnabled(env) {
  if (env?.SUPABASE_EMAIL_AUTH_ENABLED !== 'true') return false
  try {
    return Boolean(getSupabaseConfig(env))
  } catch {
    return false
  }
}

function emailValue(value) {
  const email = String(value || '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : ''
}

async function authRequest(env, path, body, fetcher) {
  const config = getSupabaseConfig(env)
  if (!config) return { ok: false, error: 'SUPABASE_AUTH_UNAVAILABLE', status: 503 }
  let response
  try {
    response = await fetcher(`${config.url}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: config.publishableKey, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, error: 'SUPABASE_AUTH_UNAVAILABLE', status: 503 }
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const code = String(data?.code || data?.error_code || '')
    if (response.status === 429) return { ok: false, error: 'RATE_LIMITED', status: 429 }
    if (code === 'email_not_confirmed') return { ok: false, error: 'EMAIL_NOT_CONFIRMED', status: 403 }
    return { ok: false, error: path.startsWith('signup') ? 'REGISTER_FAILED' : 'INVALID_CREDENTIALS', status: response.status === 503 ? 503 : 401 }
  }
  return { ok: true, data }
}

export async function signUpSupabaseEmail(env, { email: rawEmail, password, name }, fetcher = fetch) {
  const email = emailValue(rawEmail)
  if (!email) return { ok: false, error: 'INVALID_EMAIL', status: 400 }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { ok: false, error: 'INVALID_PASSWORD', status: 400 }
  }
  const displayName = String(name || '').trim().slice(0, 50)
  if (!displayName) return { ok: false, error: 'INVALID_NAME', status: 400 }
  const siteOrigin = String(env?.NEXTAUTH_URL || '').replace(/\/$/, '')
  if (!siteOrigin.startsWith('https://') && !siteOrigin.startsWith('http://localhost:')) {
    return { ok: false, error: 'SUPABASE_REDIRECT_UNAVAILABLE', status: 503 }
  }
  const redirectTo = `${siteOrigin}/login?emailConfirmed=1`
  const result = await authRequest(env, `signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    email, password, data: { display_name: displayName },
  }, fetcher)
  if (!result.ok) return result
  if (!result.data?.id) return { ok: false, error: 'SUPABASE_AUTH_INVALID_RESPONSE', status: 502 }
  return { ok: true, pendingConfirmation: true }
}

export async function signInSupabaseEmail(env, rawEmail, password, fetcher = fetch) {
  const email = emailValue(rawEmail)
  if (!email || typeof password !== 'string' || !password) {
    return { ok: false, error: 'INVALID_CREDENTIALS', status: 401 }
  }
  const result = await authRequest(env, 'token?grant_type=password', { email, password }, fetcher)
  if (!result.ok) return result
  const authUser = result.data?.user
  if (!result.data?.access_token || !authUser?.id || authUser.email?.toLowerCase() !== email) {
    return { ok: false, error: 'SUPABASE_AUTH_INVALID_RESPONSE', status: 502 }
  }
  if (!authUser.email_confirmed_at && !authUser.confirmed_at) {
    return { ok: false, error: 'EMAIL_NOT_CONFIRMED', status: 403 }
  }
  return {
    ok: true,
    providerAccountId: String(authUser.id),
    profile: {
      provider: 'supabase',
      login: email,
      email,
      name: String(authUser.user_metadata?.display_name || email.split('@')[0]).slice(0, 50),
      image: null,
    },
  }
}

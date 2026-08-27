// Only the canonical main site verifies/signs sessions. Never accept an identity
// from browser headers, a decoded token, or a caller-supplied upstream URL.
const SESSION_ENDPOINT = 'https://2aran.com/api/workbuddy/session'
const COOKIE_NAMES = new Set(['tuaran_session', 'tuaran_guest'])
const UNAVAILABLE = { error: 'AUTH_UNAVAILABLE', status: 503 }

function forwardedCookies(request) {
  return (request.headers.get('cookie') || '').split(';').map((part) => part.trim())
    .filter((part) => COOKIE_NAMES.has(part.split('=')[0])).join('; ')
}

function guestCookie(response, request) {
  const raw = response.headers.get('set-cookie')
  if (!raw) return null
  // Next middleware can add a site-lang cookie, including an Expires comma.
  // Select only the guest cookie and never relay unrelated main-site cookies.
  const match = /(?:^|,\s*)tuaran_guest=([A-Za-z0-9_.%~-]+);/i.exec(raw)
  if (!match) return null
  if (match[1].length > 4096) throw new Error('Invalid guest cookie')
  const url = new URL(request.url)
  const parts = [`tuaran_guest=${match[1]}`, 'Max-Age=15552000', 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (url.protocol === 'https:') parts.push('Secure')
  if (url.hostname === '2aran.com' || url.hostname.endsWith('.2aran.com')) parts.push('Domain=.2aran.com')
  return parts.join('; ')
}

export async function resolveActor(request) {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: { cookie: forwardedCookies(request), accept: 'application/json' },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 403) return { error: 'USER_BLOCKED', status: 403 }
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return { ...UNAVAILABLE }
    const data = await response.json()
    if (data.version !== 1 || typeof data.userId !== 'string' || !data.userId || data.userId.length > 256
      || typeof data.isGuest !== 'boolean' || data.isGuest !== data.userId.startsWith('guest:')
      || typeof data.name !== 'string') return { ...UNAVAILABLE }
    return { userId: data.userId, isGuest: data.isGuest, name: data.name.slice(0, 100), setCookie: guestCookie(response, request) }
  } catch {
    // A main-site outage must not create a new identity or grant file access.
    return { ...UNAVAILABLE }
  }
}

import { isAccountOrigin } from './subsiteOrigins.js'

function trustedRequest(request, requireOrigin = false) {
  const origin = request.headers.get('origin')
  if (origin !== null) return isAccountOrigin(origin)
  // Server-to-server session lookup is allowed, but browser writes must carry
  // an explicit Origin. CORS is not used as a substitute for session validation.
  return !requireOrigin && request.headers.get('sec-fetch-site') !== 'cross-site'
}

function responseHeaders(request) {
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    Vary: 'Origin, Cookie',
    'X-Content-Type-Options': 'nosniff',
  })
  const origin = request.headers.get('origin')
  if (isAccountOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return headers
}

function json(request, data, status = 200, setCookie = null) {
  const headers = responseHeaders(request)
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return Response.json(data, { status, headers })
}

export function subsitePreflight(request, method) {
  const requestedHeaders = (request.headers.get('access-control-request-headers') || '')
    .split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
  if (request.method !== 'OPTIONS' || !trustedRequest(request, true)
    || request.headers.get('access-control-request-method') !== method
    || requestedHeaders.some((name) => name !== 'content-type')) {
    return json(request, { error: 'ORIGIN_OR_METHOD_NOT_ALLOWED' }, 403)
  }
  const headers = responseHeaders(request)
  headers.set('Access-Control-Allow-Methods', `${method}, OPTIONS`)
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Vary', 'Origin, Cookie, Access-Control-Request-Method, Access-Control-Request-Headers')
  return new Response(null, { status: 204, headers })
}

// Framework-independent request logic; route adapters supply the canonical
// auth and points services. No new identity store, signing key or wallet.
export async function handleSubsiteSession(request, services) {
  if (!trustedRequest(request)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  if (request.method !== 'GET') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)
  try {
    if (!services.getSecrets().sessionSecret) throw new Error('Auth unavailable')
    const db = services.getD1()
    if (!db) throw new Error('DB unavailable')
    const user = await services.getUserFromRequest(request)
    let userId
    let setCookie = null
    if (user?.id) {
      userId = String(user.id)
      if (await services.getUserRole(db, userId) === 'blocked') {
        return json(request, { error: 'USER_BLOCKED' }, 403)
      }
    } else {
      const guest = await services.getOrIssueGuest(request)
      if (!guest?.gid) throw new Error('Guest unavailable')
      userId = `guest:${guest.gid}`
      setCookie = guest.setCookie
      await services.awardGuestSeed(db, userId)
    }
    const [balance, checkedInToday] = await Promise.all([
      services.getBalance(db, userId),
      user?.id ? services.hasCheckedInToday(db, userId) : false,
    ])
    if (!Number.isSafeInteger(balance)) throw new Error('Balance unavailable')
    return json(request, {
      version: 1,
      user: user?.id ? { id: userId, name: String(user.name || user.login || '用户').slice(0, 100) } : null,
      isGuest: !user?.id,
      balance,
      checkedInToday,
    }, 200, setCookie)
  } catch {
    // Do not expose database errors or disguise outages as anonymous success.
    return json(request, { error: 'ACCOUNT_UNAVAILABLE' }, 503)
  }
}

export async function handleSubsiteCheckin(request, services) {
  if (!trustedRequest(request, true)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)
  try {
    // Reuse the main handler, including blocked accounts, pending email limits,
    // rate limits and daily idempotency. The caller cannot supply an award size.
    const response = await services.checkin(request)
    const headers = new Headers(response.headers)
    for (const [key, value] of responseHeaders(request)) headers.set(key, value)
    return new Response(response.body, { status: response.status, headers })
  } catch {
    return json(request, { error: 'ACCOUNT_UNAVAILABLE' }, 503)
  }
}

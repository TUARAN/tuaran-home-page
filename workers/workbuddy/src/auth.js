const SESSION_COOKIE = 'tuaran_session'
const GUEST_COOKIE = 'tuaran_guest'
const GUEST_MAX_AGE = 180 * 24 * 60 * 60

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmac(message, secret, usage) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
  return { key, data: new TextEncoder().encode(message) }
}

export function parseCookies(request) {
  const result = {}
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (!name) continue
    try {
      result[name] = decodeURIComponent(rest.join('='))
    } catch {
      result[name] = rest.join('=')
    }
  }
  return result
}

export async function verifyToken(token, secret) {
  try {
    if (!token || !secret) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerPart, payloadPart, signaturePart] = parts
    const header = JSON.parse(decodeBase64Url(headerPart))
    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') return null
    const { key, data } = await hmac(`${headerPart}.${payloadPart}`, secret, 'verify')
    const signature = Uint8Array.from(
      atob(signaturePart.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((signaturePart.length + 3) % 4)),
      (char) => char.charCodeAt(0),
    )
    if (!(await crypto.subtle.verify('HMAC', key, signature, data))) return null
    const payload = JSON.parse(decodeBase64Url(payloadPart))
    if (payload?.exp && Date.now() / 1000 > Number(payload.exp)) return null
    return payload
  } catch {
    return null
  }
}

export async function signToken(payload, secret) {
  const header = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const input = `${header}.${body}`
  const { key, data } = await hmac(input, secret, 'sign')
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return `${input}.${encodeBase64Url(signature)}`
}

function serializeGuestCookie(token, env, request) {
  const hostname = new URL(request.url).hostname
  const local = hostname === 'localhost' || hostname === '127.0.0.1'
  const parts = [
    `${GUEST_COOKIE}=${encodeURIComponent(token)}`,
    `Max-Age=${GUEST_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (!local) parts.push('Secure')
  const domain = String(env.COOKIE_DOMAIN || '').replace(/^\./, '')
  if (!local && domain && (hostname === domain || hostname.endsWith(`.${domain}`))) {
    parts.push(`Domain=${env.COOKIE_DOMAIN}`)
  }
  return parts.join('; ')
}

export async function resolveActor(request, env) {
  const secret = env.NEXTAUTH_SECRET
  if (!secret) return { error: 'AUTH_NOT_CONFIGURED', status: 503 }
  const cookies = parseCookies(request)
  const session = await verifyToken(cookies[SESSION_COOKIE], secret)
  if (session?.user?.id) {
    let userId = String(session.user.id)
    // Resolve legacy sessions using the same identity mapping as the main site.
    if (!userId.startsWith('acct_')) {
      const provider = String(session.user.provider || userId.split(':')[0]).toLowerCase()
      const subject = userId.slice(userId.indexOf(':') + 1)
      let identity = await env.DB.prepare(
        'SELECT user_id FROM account_identities WHERE provider = ?1 AND provider_account_id = ?2',
      ).bind(provider, subject).first()
      const login = String(session.user.email || session.user.login || '').toLowerCase()
      if (!identity && provider === 'email' && login) {
        identity = await env.DB.prepare(
          "SELECT user_id FROM account_identities WHERE provider = 'email' AND (provider_account_id = ?1 OR provider_login = ?1) LIMIT 1",
        ).bind(login).first()
      }
      if (identity?.user_id) userId = identity.user_id
    }
    const directory = await env.DB.prepare(
      'SELECT role FROM site_users WHERE platform_id = ?1 OR id = ?1 LIMIT 1',
    ).bind(userId).first()
    if (directory?.role === 'blocked') return { error: 'USER_BLOCKED', status: 403 }
    return {
      userId,
      isGuest: false,
      name: String(session.user.name || session.user.login || '已登录用户'),
      setCookie: null,
    }
  }

  const existingGuest = await verifyToken(cookies[GUEST_COOKIE], secret)
  let gid = typeof existingGuest?.gid === 'string' ? existingGuest.gid : ''
  let setCookie = null
  if (!gid) {
    gid = crypto.randomUUID()
    const token = await signToken({ gid, iat: Math.floor(Date.now() / 1000) }, secret)
    setCookie = serializeGuestCookie(token, env, request)
  }
  return { userId: `guest:${gid}`, isGuest: true, name: '游客', setCookie }
}

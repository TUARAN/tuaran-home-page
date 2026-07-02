import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

const SESSION_COOKIE = 'tuaran_session'
const OAUTH_STATE_COOKIE = 'tuaran_oauth_state'
const RETURN_TO_COOKIE = 'tuaran_return_to'
const GUEST_COOKIE = 'tuaran_guest'
const ADMIN_HOST = 'admin.2aran.com'
const CANONICAL_ME_URL = 'https://2aran.com/api/me'

function base64UrlEncode(bytes) {
  let str = ''
  for (let i = 0; i < bytes.length; i += 1) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlEncodeJson(obj) {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  return base64UrlEncode(bytes)
}

function base64UrlDecodeToJson(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

async function hmacSha256(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return new Uint8Array(sig)
}

function safeEqualString(a, b) {
  const left = String(a || '')
  const right = String(b || '')
  if (left.length !== right.length) return false
  let out = 0
  for (let i = 0; i < left.length; i += 1) {
    out |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return out === 0
}

export function parseCookies(req) {
  const header = req.headers.get('cookie') || ''
  const out = {}
  header.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=')
    if (!k) return
    out[k] = decodeURIComponent(rest.join('='))
  })
  return out
}

export function serializeCookie(name, value, options = {}) {
  const opts = {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    ...cookieScopeConfig(),
    ...options,
  }

  let str = `${name}=${encodeURIComponent(value)}`
  if (opts.maxAge != null) str += `; Max-Age=${opts.maxAge}`
  if (opts.expires) str += `; Expires=${opts.expires.toUTCString()}`
  if (opts.path) str += `; Path=${opts.path}`
  if (opts.domain) str += `; Domain=${opts.domain}`
  if (opts.sameSite) str += `; SameSite=${opts.sameSite}`
  if (opts.secure) str += '; Secure'
  if (opts.httpOnly) str += '; HttpOnly'
  return str
}

export function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return base64UrlEncode(bytes)
}

export async function signSession(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncodeJson(header)
  const encodedPayload = base64UrlEncodeJson(payload)
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const sigBytes = await hmacSha256(signingInput, secret)
  const signature = base64UrlEncode(sigBytes)
  return `${signingInput}.${signature}`
}

export async function verifySession(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [encodedHeader, encodedPayload, signature] = parts
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const expectedSigBytes = await hmacSha256(signingInput, secret)
    const expectedSig = base64UrlEncode(expectedSigBytes)
    if (!safeEqualString(expectedSig, signature)) return null
    const header = base64UrlDecodeToJson(encodedHeader)
    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') return null
    const payload = base64UrlDecodeToJson(encodedPayload)
    if (payload?.exp && Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export async function getUserFromRequest(req) {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) {
    const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
    return getUserFromCanonicalSession(req.headers.get('cookie'), host)
  }
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.session]
  const payload = await verifySession(token, sessionSecret)
  return payload?.user || null
}

export async function getUserFromCanonicalSession(cookieHeader, host) {
  if ((host || '').split(':')[0].toLowerCase() !== ADMIN_HOST) return null
  if (!cookieHeader) return null

  try {
    const response = await fetch(CANONICAL_ME_URL, {
      headers: {
        accept: 'application/json',
        cookie: cookieHeader,
      },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = await response.json()
    return data?.user || null
  } catch {
    return null
  }
}

export function getSecrets() {
  const ctx = getOptionalRequestContext()
  const env = ctx?.env || {}
  return {
    githubId: env.GITHUB_ID || process.env.GITHUB_ID,
    githubSecret: env.GITHUB_SECRET || process.env.GITHUB_SECRET,
    googleId: env.GOOGLE_ID || process.env.GOOGLE_ID,
    googleSecret: env.GOOGLE_SECRET || process.env.GOOGLE_SECRET,
    appUrl: env.NEXTAUTH_URL || process.env.NEXTAUTH_URL,
    sessionSecret: env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
    emailCodeSecret: env.EMAIL_CODE_SECRET || process.env.EMAIL_CODE_SECRET,
    resendApiKey: env.RESEND_API_KEY || process.env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM || process.env.EMAIL_FROM,
  }
}

export function cookiesConfig() {
  // On localhost, Secure cookies will be ignored; keep Secure default true for production.
  const appUrl = getSecrets().appUrl || ''
  const isLocal = appUrl.startsWith('http://localhost') || appUrl.startsWith('http://127.0.0.1')
  return {
    secure: !isLocal,
    ...cookieScopeConfig(),
  }
}

function cookieScopeConfig() {
  const appUrl = getSecrets().appUrl || ''
  try {
    const host = new URL(appUrl).hostname
    if (host === '2aran.com' || host.endsWith('.2aran.com')) {
      return { domain: '.2aran.com' }
    }
  } catch {
    // Ignore malformed local env values; host-only cookies are the safe fallback.
  }
  return {}
}

export const cookieNames = {
  session: SESSION_COOKIE,
  oauthState: OAUTH_STATE_COOKIE,
  returnTo: RETURN_TO_COOKIE,
  guest: GUEST_COOKIE,
}

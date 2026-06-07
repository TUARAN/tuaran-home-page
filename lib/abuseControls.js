const RATE_LIMIT_RETENTION_MS = 2 * 24 * 60 * 60 * 1000

const BLOCKED_HOSTS = new Set(['localhost', 'local'])

function stripIpv6Brackets(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '')
}

function parseIpv4(hostname) {
  const parts = String(hostname || '').split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return NaN
    return Number(part)
  })
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums
}

function isPrivateOrReservedIpv4(hostname) {
  const ip = parseIpv4(hostname)
  if (!ip) return false
  const [a, b, c] = ip
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && (b === 0 || b === 168)) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a === 192 && b === 0 && c === 2) return true
  if (a === 198 && b === 51 && c === 100) return true
  if (a === 203 && b === 0 && c === 113) return true
  if (a === 224 || a >= 240) return true
  return false
}

function isPrivateOrReservedIpv6(hostname) {
  const host = stripIpv6Brackets(hostname)
  if (!host.includes(':')) return false
  if (host === '::' || host === '::1') return true
  if (host.startsWith('fc') || host.startsWith('fd')) return true
  if (host.startsWith('fe80:')) return true
  if (host.startsWith('2001:db8:')) return true
  if (host.startsWith('::ffff:') && isPrivateOrReservedIpv4(host.slice(7))) return true
  return false
}

function isBlockedHostname(hostname) {
  const host = stripIpv6Brackets(hostname)
  if (!host) return true
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (isPrivateOrReservedIpv4(host) || isPrivateOrReservedIpv6(host)) return true
  return false
}

export function validatePublicHttpUrl(raw, { maxLength = 2000 } = {}) {
  if (typeof raw !== 'string') return { ok: false, error: 'INVALID_URL' }
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > maxLength) return { ok: false, error: 'INVALID_URL' }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'INVALID_URL_PROTOCOL' }
    }
    if (url.username || url.password) {
      return { ok: false, error: 'URL_CREDENTIALS_NOT_ALLOWED' }
    }
    if (isBlockedHostname(url.hostname)) {
      return { ok: false, error: 'URL_HOST_NOT_ALLOWED' }
    }
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false, error: 'INVALID_URL' }
  }
}

export function getClientIp(req) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
}

async function sha256(input) {
  const data = new TextEncoder().encode(String(input || ''))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function checkRateLimit(db, { scope, subject, limit, windowMs, now = Date.now() }) {
  if (!db || !scope || !subject || !Number.isFinite(limit) || !Number.isFinite(windowMs)) {
    return { ok: true, skipped: true }
  }

  const windowStart = Math.floor(now / windowMs) * windowMs
  const subjectHash = await sha256(`${scope}:${subject}`)
  const row = await db
    .prepare(
      `INSERT INTO api_rate_limits (scope, window_start, subject_hash, count, updated_at)
       VALUES (?1, ?2, ?3, 1, ?4)
       ON CONFLICT(scope, window_start, subject_hash)
       DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
       RETURNING count`
    )
    .bind(scope, windowStart, subjectHash, now)
    .first()

  const count = Math.max(0, Number(row?.count) || 0)
  const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000))
  return {
    ok: count <= limit,
    scope,
    count,
    limit,
    retryAfter,
  }
}

export async function enforceRateLimits(db, checks) {
  for (const check of checks) {
    if (!check?.subject) continue
    const result = await checkRateLimit(db, check)
    if (!result.ok) return result
  }
  return { ok: true }
}

export async function cleanupRateLimits(db, now = Date.now()) {
  if (!db) return
  await db
    .prepare('DELETE FROM api_rate_limits WHERE updated_at < ?1')
    .bind(now - RATE_LIMIT_RETENTION_MS)
    .run()
}

export function rateLimitResponse(result) {
  return Response.json(
    {
      error: 'RATE_LIMITED',
      scope: result?.scope,
      limit: result?.limit,
      retryAfter: result?.retryAfter,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(result?.retryAfter || 60) },
    }
  )
}

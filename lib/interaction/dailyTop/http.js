import { isIsoDate, resolveSelectedDate, shanghaiDateKey } from './model.js'
import {
  DAILY_TOP_INGEST_HEADER,
  DAILY_TOP_INGEST_SECRET_ENV,
  loadCombinedDailyTopDays,
  toPublicDailyTopDay,
  writeDailyTopDay,
} from './store.js'

const SITE_ORIGINS = new Set([
  'https://2aran.com',
  'https://www.2aran.com',
])
const EXTENSION_ORIGIN = /^(chrome-extension|safari-web-extension|moz-extension):\/\/[A-Za-z0-9@._-]{1,128}$/i
const MAX_BODY_BYTES = 64 * 1024
const MAX_SECRET_LENGTH = 256

export function dailyTopCorsHeaders(request) {
  const origin = request?.headers?.get('origin') || ''
  const allowOrigin = SITE_ORIGINS.has(origin) || EXTENSION_ORIGIN.test(origin) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': `Authorization, Content-Type, ${DAILY_TOP_INGEST_HEADER}`,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(request, body, status) {
  return Response.json(body, {
    status,
    headers: {
      ...dailyTopCorsHeaders(request),
      'Cache-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function secretsMatch(left, right) {
  const encoder = new TextEncoder()
  const a = encoder.encode(String(left ?? ''))
  const b = encoder.encode(String(right ?? ''))
  const length = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] || 0) ^ (b[index] || 0)
  }
  return diff === 0
}

function suppliedSecret(request) {
  const custom = request.headers.get(DAILY_TOP_INGEST_HEADER) || ''
  const authorization = request.headers.get('authorization') || ''
  const bearer = /^Bearer\s+(\S+)\s*$/i.exec(authorization)?.[1] || ''
  const value = custom.trim() || bearer
  return value.length > MAX_SECRET_LENGTH ? '' : value
}

function contentFeed(env) {
  return env?.CONTENT_FEED || null
}

function configuredSecret(env) {
  return String(env?.[DAILY_TOP_INGEST_SECRET_ENV] || '').trim()
}

export function resolveDailyTopRead(days, dateParam, today) {
  const dates = days.map((day) => day.date)
  if (dateParam == null || dateParam === '') {
    const date = resolveSelectedDate(null, today, dates)
    return { date, found: dates.includes(date) }
  }
  if (!isIsoDate(dateParam)) return { date: null, invalid: true, found: false }
  return { date: dateParam, found: dates.includes(dateParam) }
}

export function handleDailyTopOptions(request) {
  return new Response(null, { status: 204, headers: dailyTopCorsHeaders(request) })
}

export async function handleDailyTopGet(request, env = {}, now = new Date()) {
  const url = new URL(request.url)
  const days = await loadCombinedDailyTopDays(contentFeed(env))
  const resolved = resolveDailyTopRead(days, url.searchParams.get('date'), shanghaiDateKey(now))
  if (!resolved.found) {
    const body = resolved.date ? { error: 'NOT_FOUND', date: resolved.date } : { error: 'NOT_FOUND' }
    return jsonResponse(request, body, 404)
  }
  const day = days.find((entry) => entry.date === resolved.date)
  return jsonResponse(request, toPublicDailyTopDay(day), 200)
}

function requestDay(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body
  if (body.schemaVersion != null) return body
  if (body.day && typeof body.day === 'object' && !Array.isArray(body.day)) return body.day
  return body
}

export async function handleDailyTopPost(request, env = {}) {
  const secret = configuredSecret(env)
  if (!secret) {
    return jsonResponse(request, { error: 'DAILY_TOP_INGEST_SECRET_UNCONFIGURED' }, 503)
  }
  if (!secretsMatch(suppliedSecret(request), secret)) {
    return jsonResponse(request, { error: 'UNAUTHORIZED' }, 401)
  }
  const bucket = contentFeed(env)
  if (!bucket) {
    return jsonResponse(request, { error: 'CONTENT_FEED_UNAVAILABLE' }, 503)
  }

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return jsonResponse(request, { error: 'PAYLOAD_TOO_LARGE' }, 413)
  }
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return jsonResponse(request, { error: 'INVALID_JSON' }, 400)
  }

  try {
    const day = await writeDailyTopDay(bucket, requestDay(body))
    return jsonResponse(request, { ok: true, day: toPublicDailyTopDay(day) }, 200)
  } catch (error) {
    if (error?.code === 'CONTENT_FEED_WRITE_FAILED') {
      return jsonResponse(request, { error: 'CONTENT_FEED_UNAVAILABLE' }, 503)
    }
    return jsonResponse(request, { error: 'INVALID_DAY', detail: error.message }, 400)
  }
}

import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/abuseControls'
import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return ''
  return email
}

function normalizeSource(value) {
  return String(value || '').trim().replace(/\s+/g, '-').slice(0, 80) || 'site'
}

async function ensureNewsletterTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        email TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'active',
        source TEXT NOT NULL DEFAULT '',
        provider TEXT NOT NULL DEFAULT 'local',
        provider_id TEXT,
        provider_status TEXT,
        user_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        unsubscribed_at INTEGER
      )`,
    )
    .run()
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status_created
       ON newsletter_subscribers(status, created_at DESC)`,
    )
    .run()
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_updated
       ON newsletter_subscribers(updated_at DESC)`,
    )
    .run()
}

async function syncButtondown(email, source) {
  const apiKey = process.env.BUTTONDOWN_API_KEY || process.env.NEWSLETTER_BUTTONDOWN_API_KEY
  if (!apiKey) return { provider: 'local', providerStatus: 'local-only', providerId: null }

  const endpoint = process.env.BUTTONDOWN_API_URL || 'https://api.buttondown.email/v1/subscribers'
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        metadata: {
          source,
          site: '2aran.com',
        },
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        provider: 'buttondown',
        providerStatus: `failed:${res.status}`,
        providerId: data?.id ? String(data.id) : null,
      }
    }
    return {
      provider: 'buttondown',
      providerStatus: 'synced',
      providerId: data?.id ? String(data.id) : null,
    }
  } catch {
    return { provider: 'buttondown', providerStatus: 'failed:network', providerId: null }
  }
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const email = normalizeEmail(body?.email)
  if (!email) return Response.json({ error: 'INVALID_EMAIL' }, { status: 400 })

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  const ip = getClientIp(req)
  const source = normalizeSource(body?.source)
  const user = await getUserFromRequest(req).catch(() => null)
  const userId = user?.id ? String(user.id) : null

  await ensureNewsletterTable(db)

  const limit = await enforceRateLimits(db, [
    { scope: 'newsletter:subscribe:ip:5m', subject: ip, limit: 3, windowMs: FIVE_MINUTES_MS },
    { scope: 'newsletter:subscribe:ip:day', subject: ip, limit: 12, windowMs: DAY_MS },
    { scope: 'newsletter:subscribe:email:day', subject: email, limit: 4, windowMs: DAY_MS },
  ])
  if (!limit.ok) return rateLimitResponse(limit)

  const now = Date.now()
  const sync = await syncButtondown(email, source)

  await db
    .prepare(
      `INSERT INTO newsletter_subscribers
         (email, status, source, provider, provider_id, provider_status, user_id, created_at, updated_at, unsubscribed_at)
       VALUES (?1, 'active', ?2, ?3, ?4, ?5, ?6, ?7, ?7, NULL)
       ON CONFLICT(email) DO UPDATE SET
         status = 'active',
         source = excluded.source,
         provider = excluded.provider,
         provider_id = COALESCE(excluded.provider_id, newsletter_subscribers.provider_id),
         provider_status = excluded.provider_status,
         user_id = COALESCE(excluded.user_id, newsletter_subscribers.user_id),
         updated_at = excluded.updated_at,
         unsubscribed_at = NULL`,
    )
    .bind(email, source, sync.provider, sync.providerId, sync.providerStatus, userId, now)
    .run()

  await cleanupRateLimits(db).catch(() => {})

  return Response.json({
    ok: true,
    email,
    provider: sync.provider,
    providerStatus: sync.providerStatus,
  })
}

import { getD1 } from '../../../lib/d1'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
  validatePublicHttpUrl,
} from '../../../lib/abuseControls'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { isOwnerUser } from '../../../lib/ownerAuth'
import {
  createOrReuseShortLink,
  getShortLinkByOriginal,
  getShortLinkStats,
  isSameSiteUrl,
  listShortLinks,
  normalizeUrl,
  sanitizeText,
} from '../../../lib/shortLinks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const LIST_LIMIT = 100
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '短链工具需要部署环境（Cloudflare D1）与登录后使用。' },
    { status: 503 }
  )
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !isOwnerUser(user)) {
      return Response.json({ error: 'NOT_OWNER' }, { status: user ? 403 : 401 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const { searchParams } = new URL(req.url)
    const items = await listShortLinks(db, { q: searchParams.get('q') || '', limit: LIST_LIMIT })
    const stats = await getShortLinkStats(db)

    return Response.json({ items, stats })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const requestedMode = body?.mode === 'manual' ? 'manual' : 'share'
    const rawUrl = body?.url ?? body?.original
    const urlResult = normalizeUrl(rawUrl)
    if (!urlResult.ok) {
      return Response.json({ error: urlResult.error }, { status: 400 })
    }
    const sameSite = isSameSiteUrl(req, urlResult.parsed)
    const isOwner = user ? isOwnerUser(user) : false

    if (!sameSite) {
      const publicUrlResult = validatePublicHttpUrl(rawUrl)
      if (!publicUrlResult.ok) {
        return Response.json({ error: publicUrlResult.error }, { status: 400 })
      }
      if (!isOwner) {
        return Response.json({ error: 'EXTERNAL_URL_REQUIRES_OWNER' }, { status: 403 })
      }
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const existing = await getShortLinkByOriginal(db, urlResult.url)
    if (existing?.id) {
      return Response.json({ item: existing, reused: true })
    }

    const ip = getClientIp(req)
    const actorId = user?.id ? String(user.id) : `anon:${ip || 'unknown'}`
    const userId = user?.id ? String(user.id) : 'site-share'
    const limit = await enforceRateLimits(db, [
      { scope: 'short:create:user:hour', subject: actorId, limit: isOwner ? 60 : 20, windowMs: HOUR_MS },
      { scope: 'short:create:user:day', subject: actorId, limit: isOwner ? 240 : 80, windowMs: DAY_MS },
      { scope: 'short:create:ip:hour', subject: ip, limit: 60, windowMs: HOUR_MS },
      { scope: 'short:create:ip:day', subject: ip, limit: 160, windowMs: DAY_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const result = await createOrReuseShortLink(db, req, {
      original: urlResult.url,
      title: sanitizeText(body?.title, 160),
      source: requestedMode === 'manual' ? 'manual' : 'share',
      userId,
    })

    if (result.error) return Response.json({ error: result.error }, { status: 500 })

    await cleanupRateLimits(db).catch(() => {})

    return Response.json({ item: result.item, reused: result.reused }, { status: result.reused ? 200 : 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !isOwnerUser(user)) {
      return Response.json({ error: 'NOT_OWNER' }, { status: user ? 403 : 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(`DELETE FROM short_links WHERE id = ?1`)
      .bind(id)
      .run()

    return Response.json({ ok: true, id })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

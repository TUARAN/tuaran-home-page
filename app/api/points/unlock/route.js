import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { getUserRole } from '../../../../lib/userDirectory'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../../lib/abuseControls'
import { getResourceStatus, unlockResource } from '../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000

function normalizeKey(value) {
  const key = typeof value === 'string' ? value.trim() : ''
  if (!key || key.length > 180) return ''
  return key
}

/** 查询某资源的解锁状态（前端燃币墙据此展示）：游客 authed:false。 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const resourceKey = normalizeKey(searchParams.get('resourceKey'))
    if (!resourceKey) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })

    const db = getD1()
    const user = await getUserFromRequest(req)
    const status = await getResourceStatus(db, user ? String(user.id) : '', resourceKey)
    return Response.json({ authed: !!user, ...status })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

/** 用燃币解锁资源：游客 401；已解锁直接放行；余额不足 402。 */
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED', message: '登录后用燃币解锁' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }
    const resourceKey = normalizeKey(body?.resourceKey)
    if (!resourceKey) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })

    const userId = String(user.id)
    if ((await getUserRole(userId)) === 'blocked') {
      return Response.json({ error: 'USER_BLOCKED' }, { status: 403 })
    }

    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'points:unlock:user:5m', subject: userId, limit: 30, windowMs: FIVE_MINUTES_MS },
      { scope: 'points:unlock:ip:5m', subject: ip, limit: 60, windowMs: FIVE_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const result = await unlockResource(db, userId, resourceKey)
    await cleanupRateLimits(db).catch(() => {})

    if (!result.ok) {
      return Response.json(result, { status: result.status || 400 })
    }
    return Response.json(result)
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

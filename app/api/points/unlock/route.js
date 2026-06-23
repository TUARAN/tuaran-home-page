import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest } from '../../../../lib/guestSession'
import { getUserRole } from '../../../../lib/userDirectory'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../../lib/abuseControls'
import { awardGuestSeed, getResourceStatus, unlockResource } from '../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000

function normalizeKey(value) {
  const key = typeof value === 'string' ? value.trim() : ''
  if (!key || key.length > 180) return ''
  return key
}

/**
 * 查询某资源的解锁状态（前端燃币墙据此展示）。
 * 游客也参与：按 guest:<gid> 播种 50 燃币后返回其余额（authed:false, isGuest:true）。
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const resourceKey = normalizeKey(searchParams.get('resourceKey'))
    if (!resourceKey) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })

    const db = getD1()
    const user = await getUserFromRequest(req)

    if (user) {
      const status = await getResourceStatus(db, String(user.id), resourceKey)
      return Response.json({ authed: true, isGuest: false, ...status })
    }

    // 游客：播种 50 燃币，按 guest:<gid> 计余额
    const guest = await getOrIssueGuest(req)
    if (!guest) {
      const status = await getResourceStatus(db, '', resourceKey)
      return Response.json({ authed: false, isGuest: true, ...status })
    }
    const guestId = `${GUEST_USER_PREFIX}${guest.gid}`
    await awardGuestSeed(db, guestId)
    const status = await getResourceStatus(db, guestId, resourceKey)
    const headers = guest.setCookie ? { 'Set-Cookie': guest.setCookie } : undefined
    return Response.json({ authed: false, isGuest: true, ...status }, { headers })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

/** 用燃币解锁资源：游客也可解锁（用其 guest 余额）；已解锁直接放行；余额不足 402。 */
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }
    const resourceKey = normalizeKey(body?.resourceKey)
    if (!resourceKey) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })

    const db = getD1()
    const ip = getClientIp(req)

    // 解析消费身份：登录用 user.id；游客用 guest:<gid>（无则签发）
    let spendId
    let guestSetCookie = null
    if (user) {
      spendId = String(user.id)
      if ((await getUserRole(spendId)) === 'blocked') {
        return Response.json({ error: 'USER_BLOCKED' }, { status: 403 })
      }
    } else {
      const guest = await getOrIssueGuest(req)
      if (!guest) {
        return Response.json({ error: 'GUEST_UNAVAILABLE' }, { status: 400 })
      }
      spendId = `${GUEST_USER_PREFIX}${guest.gid}`
      guestSetCookie = guest.setCookie
      await awardGuestSeed(db, spendId) // 确保游客先有 50 燃币底子
    }

    const limit = await enforceRateLimits(db, [
      { scope: 'points:unlock:user:5m', subject: spendId, limit: 30, windowMs: FIVE_MINUTES_MS },
      { scope: 'points:unlock:ip:5m', subject: ip, limit: 60, windowMs: FIVE_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const result = await unlockResource(db, spendId, resourceKey)
    await cleanupRateLimits(db).catch(() => {})

    const headers = guestSetCookie ? { 'Set-Cookie': guestSetCookie } : undefined
    if (!result.ok) {
      return Response.json(result, { status: result.status || 400, headers })
    }
    return Response.json(result, { headers })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

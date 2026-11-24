import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest } from '../../../../lib/auth/guestSession'
import { getClientIp, enforceRateLimits, cleanupRateLimits } from '../../../../lib/auth/abuseControls'
import { createPaidOrder } from '../../../../lib/pay/orders'
import { readGatewayConfig } from '../../../../lib/pay/gateways/xunhupay'
import { workerEnv } from '../../../../lib/pay/runtimeEnv'
import { isGuestPayResource, normalizeReturnPath } from '../../../../lib/pay/contact.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

const ERROR_STATUS = {
  UNAUTHORIZED: 401,
  INVALID_RESOURCE: 400,
  GATEWAY_NOT_CONFIGURED: 503,
  PRICE_NOT_SET: 404,
  ALREADY_UNLOCKED: 409,
  GATEWAY_REQUEST_FAILED: 502,
  GATEWAY_REJECTED: 502,
  GATEWAY_NO_PAYLOAD: 502,
  GATEWAY_FAILED: 502,
}

function normalizeKey(value) {
  const key = typeof value === 'string' ? value.trim() : ''
  return !key || key.length > 180 ? '' : key
}

function reply(body, status = 200, setCookie = null, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...extraHeaders,
      // 通过 init.headers 设置，避免不同运行时对既有 Response 的 header guard 差异
      ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
    },
  })
}

/**
 * 创建现金支付订单。
 * - 付费文章等资源仍只认登录账号：权益挂在账号上，游客付完丢设备等于丢单。
 * - 圈子方案（community:*）允许游客下单：复用游客评论的签名 guest cookie，
 *   订单归属该 gid，支付成功后由 /api/pay/contact 收集联系邮箱。
 */
export async function POST(req) {
  try {
    let body = null
    try {
      body = await req.json()
    } catch {
      return reply({ error: 'INVALID_JSON' }, 400)
    }
    const resourceKey = normalizeKey(body?.resourceKey)
    if (!resourceKey) return reply({ error: 'INVALID_RESOURCE' }, 400)

    const user = await getUserFromRequest(req)
    let userId = user?.id ? String(user.id) : ''
    let setCookie = null
    let isGuest = false
    if (!userId) {
      if (!isGuestPayResource(resourceKey)) return reply({ error: 'UNAUTHORIZED' }, 401)
      const guest = await getOrIssueGuest(req).catch(() => null)
      if (!guest?.gid) return reply({ error: 'GUEST_UNAVAILABLE' }, 503)
      userId = `${GUEST_USER_PREFIX}${guest.gid}`
      setCookie = guest.setCookie
      isGuest = true
    }

    const db = getD1()
    const ip = getClientIp(req)
    // 游客清 cookie 即可换 gid，按 IP 主导收紧下单频率
    const limit = await enforceRateLimits(
      db,
      isGuest
        ? [
            { scope: 'pay:create:guest:15m', subject: userId, limit: 8, windowMs: FIFTEEN_MINUTES_MS },
            { scope: 'pay:create:guestip:15m', subject: ip, limit: 12, windowMs: FIFTEEN_MINUTES_MS },
          ]
        : [
            { scope: 'pay:create:user:15m', subject: userId, limit: 20, windowMs: FIFTEEN_MINUTES_MS },
            { scope: 'pay:create:ip:15m', subject: ip, limit: 40, windowMs: FIFTEEN_MINUTES_MS },
          ]
    )
    if (!limit.ok) {
      return reply(
        { error: 'RATE_LIMITED', scope: limit.scope, limit: limit.limit, retryAfter: limit.retryAfter },
        429,
        setCookie,
        { 'Retry-After': String(limit.retryAfter || 60) }
      )
    }

    const result = await createPaidOrder(db, {
      userId,
      resourceKey,
      title: typeof body?.title === 'string' ? body.title : '',
      clientIp: ip,
      returnTo: normalizeReturnPath(body?.returnTo),
      config: readGatewayConfig(workerEnv()),
    })
    await cleanupRateLimits(db).catch(() => {})

    return reply(result, result.ok ? 200 : ERROR_STATUS[result.error] || 400, setCookie)
  } catch {
    return reply({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
}

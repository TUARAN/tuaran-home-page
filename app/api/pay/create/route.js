import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getClientIp, enforceRateLimits, rateLimitResponse, cleanupRateLimits } from '../../../../lib/auth/abuseControls'
import { createPaidOrder } from '../../../../lib/pay/orders'
import { readGatewayConfig } from '../../../../lib/pay/gateways/xunhupay'
import { workerEnv } from '../../../../lib/pay/runtimeEnv'

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

/**
 * 创建现金支付订单。
 * 只允许已登录用户下单：权益挂在账号上，游客付完丢设备等于丢单。
 */
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    let body = null
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }
    const resourceKey = normalizeKey(body?.resourceKey)
    if (!resourceKey) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })

    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'pay:create:user:15m', subject: String(user.id), limit: 20, windowMs: FIFTEEN_MINUTES_MS },
      { scope: 'pay:create:ip:15m', subject: ip, limit: 40, windowMs: FIFTEEN_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const result = await createPaidOrder(db, {
      userId: String(user.id),
      resourceKey,
      title: typeof body?.title === 'string' ? body.title : '',
      clientIp: ip,
      config: readGatewayConfig(workerEnv()),
    })
    await cleanupRateLimits(db).catch(() => {})

    if (!result.ok) {
      const status = ERROR_STATUS[result.error] || 400
      return Response.json(result, { status })
    }
    return Response.json(result)
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

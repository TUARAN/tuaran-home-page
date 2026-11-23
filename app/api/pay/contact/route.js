import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getGuestId } from '../../../../lib/auth/guestSession'
import { getClientIp, enforceRateLimits, rateLimitResponse, cleanupRateLimits } from '../../../../lib/auth/abuseControls'
import { getPaidOrderForUser, setOrderContactEmail } from '../../../../lib/pay/orders'
import { normalizeEmail } from '../../../../lib/pay/contact.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

/**
 * 支付成功后留联系邮箱。
 * 只能给自己的已支付订单写：登录账号用会话，游客用下单时签发的 guest cookie。
 * 订单号不可枚举、邮箱不回显给他人，未支付订单不允许留联系方式。
 */
export async function POST(req) {
  try {
    let body = null
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const orderNo = String(body?.orderNo || '').trim()
    const email = normalizeEmail(body?.email)
    if (!orderNo || orderNo.length > 64 || !/^[A-Za-z0-9-]+$/.test(orderNo)) {
      return Response.json({ error: 'INVALID_ORDER' }, { status: 400 })
    }
    if (!email) return Response.json({ error: 'INVALID_EMAIL' }, { status: 400 })

    const user = await getUserFromRequest(req)
    let userId = user?.id ? String(user.id) : ''
    if (!userId) {
      const gid = await getGuestId(req)
      if (gid) userId = `${GUEST_USER_PREFIX}${gid}`
    }
    if (!userId) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'pay:contact:user:15m', subject: userId, limit: 20, windowMs: FIFTEEN_MINUTES_MS },
      { scope: 'pay:contact:ip:15m', subject: ip, limit: 30, windowMs: FIFTEEN_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const order = await getPaidOrderForUser(db, orderNo, userId)
    if (!order) return Response.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })
    if (order.status !== 'paid') return Response.json({ error: 'ORDER_NOT_PAID' }, { status: 409 })

    const saved = await setOrderContactEmail(db, orderNo, email)
    if (!saved.ok) return Response.json({ error: 'CONTACT_UNAVAILABLE' }, { status: 503 })
    await cleanupRateLimits(db).catch(() => {})

    return Response.json(
      { ok: true, orderNo, email },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

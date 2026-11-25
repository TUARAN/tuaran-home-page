import { getD1 } from '../../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getGuestId } from '../../../../../lib/auth/guestSession'
import { getPaidOrderForUser, setOrderContactEmail } from '../../../../../lib/pay/orders'
import { normalizeEmail } from '../../../../../lib/pay/contact.mjs'
import { getBookOrderForUser, normalizeRecipient, setBookOrderAddress } from '../../../../../lib/pay/bookOrders.mjs'
import { getClientIp, enforceRateLimits, cleanupRateLimits } from '../../../../../lib/auth/abuseControls'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

/**
 * 签名版收货信息提交：支付成功后填写（游客用下单时签发的 guest cookie 归属校验，
 * 与 /api/pay/status 同一套规则——订单只对本人生效，订单号被枚举也填不进别人的地址）。
 * 状态要求 awaiting_address / to_ship；已发货（shipped）后不可再改。
 */
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    let userId = user?.id ? String(user.id) : ''
    if (!userId) {
      const gid = await getGuestId(req)
      if (gid) userId = `${GUEST_USER_PREFIX}${gid}`
    }
    if (!userId) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    let body = null
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }
    const orderNo = String(body?.orderNo || '').trim()
    if (!orderNo) return Response.json({ error: 'INVALID_ORDER' }, { status: 400 })

    const db = (() => {
      try {
        return getD1()
      } catch {
        return null
      }
    })()
    if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'book:ship:15m', subject: userId, limit: 10, windowMs: FIFTEEN_MINUTES_MS },
      { scope: 'book:shipip:15m', subject: ip, limit: 20, windowMs: FIFTEEN_MINUTES_MS },
    ])
    if (!limit.ok) {
      return Response.json(
        { error: 'RATE_LIMITED', retryAfter: limit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter || 60) } }
      )
    }

    // 归属校验：订单必须属于当前登录用户 / 游客，且是签名版订单
    const paid = await getPaidOrderForUser(db, orderNo, userId)
    if (!paid || !String(paid.resourceKey || '').startsWith('signature:')) {
      return Response.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })
    }

    const result = await setBookOrderAddress(db, orderNo, {
      name: body?.name,
      phone: body?.phone,
      address: body?.address,
    })
    if (!result.ok) {
      await cleanupRateLimits(db).catch(() => {})
      const statusMap = {
        INVALID_NAME: 400,
        INVALID_PHONE: 400,
        INVALID_ADDRESS: 400,
        ORDER_NOT_EDITABLE: 409,
      }
      return Response.json({ error: result.error }, { status: statusMap[result.error] || 400 })
    }

    // 可选联系邮箱：换设备 / 清 cookie 后站长凭邮箱联系买家补寄或核单
    const email = normalizeEmail(body?.email)
    if (email) await setOrderContactEmail(db, orderNo, email).catch(() => {})

    const order = await getBookOrderForUser(db, orderNo, userId)
    await cleanupRateLimits(db).catch(() => {})
    return Response.json({ ok: true, order }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

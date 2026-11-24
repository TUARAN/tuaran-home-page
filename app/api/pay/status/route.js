import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getGuestId } from '../../../../lib/auth/guestSession'
import { getPaidOrderForUser } from '../../../../lib/pay/orders'
import { settleFromGateway } from '../../../../lib/pay/settle'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 支付状态轮询：只查本人订单，避免订单号被枚举。
 * 登录用户用会话身份；圈子方案的游客用下单时签发的 guest cookie 身份。
 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    let userId = user?.id ? String(user.id) : ''
    if (!userId) {
      const gid = await getGuestId(req)
      if (gid) userId = `${GUEST_USER_PREFIX}${gid}`
    }
    if (!userId) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orderNo = String(searchParams.get('orderNo') || '').trim()
    if (!orderNo) return Response.json({ error: 'INVALID_ORDER' }, { status: 400 })

    const db = getD1()
    let order = await getPaidOrderForUser(db, orderNo, userId)
    if (!order) return Response.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })

    // 回调可能丢失（网关重试失败、验签被拒）：还没解锁的订单主动向网关查一次，
    // 查到已支付则落库并写权益，与回调同一套幂等逻辑
    if (!order.unlocked) {
      const settled = await settleFromGateway(db, orderNo)
      if (settled?.paid) {
        order = (await getPaidOrderForUser(db, orderNo, userId)) || order
      }
    }

    return Response.json({ ok: true, ...order }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

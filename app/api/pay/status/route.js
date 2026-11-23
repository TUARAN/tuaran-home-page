import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getPaidOrderForUser } from '../../../../lib/pay/orders'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/** 支付状态轮询：只查本人订单，避免订单号被枚举 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const orderNo = String(searchParams.get('orderNo') || '').trim()
    if (!orderNo) return Response.json({ error: 'INVALID_ORDER' }, { status: 400 })

    const db = getD1()
    const order = await getPaidOrderForUser(db, orderNo, String(user.id))
    if (!order) return Response.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })

    return Response.json({ ok: true, ...order }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

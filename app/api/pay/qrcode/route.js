import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getGuestId } from '../../../../lib/auth/guestSession'
import { getPaidOrderForUser } from '../../../../lib/pay/orders'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * H5 截图扫码：代理下载本人 pending 订单的付款图（虎皮椒 url_qrcode），避免外链 CORS。
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
    const order = await getPaidOrderForUser(db, orderNo, userId)
    if (!order) return Response.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 })
    if (order.status === 'paid' || order.unlocked) {
      return Response.json({ error: 'ORDER_ALREADY_PAID' }, { status: 409 })
    }

    const imageUrl = String(order.qrCode || '').trim()
    if (!imageUrl) return Response.json({ error: 'QR_NOT_AVAILABLE' }, { status: 404 })

    const upstream = await fetch(imageUrl, {
      headers: {
        Accept: 'image/*,*/*',
        Referer: 'https://2aran.com/',
      },
    })
    if (!upstream.ok) {
      return Response.json({ error: 'UPSTREAM_IMAGE_FAILED' }, { status: 502 })
    }
    const bytes = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'image/png'
    const safeName = orderNo.replace(/[^A-Za-z0-9_-]/g, '')
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="2aran-pay-${safeName || 'order'}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { grantPaidOrder, listPaidOrders, readPriceFen } from '../../../../../lib/pay/orders'
import { summarizePaidOrders } from '../../../../../lib/pay/summary.mjs'
import { getPointRules, upsertResource } from '../../../../../lib/ledger/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 后台：订单列表（含待补单） */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const url = new URL(req.url)
  const status = String(url.searchParams.get('status') || '').trim()
  const limit = Number(url.searchParams.get('limit') || 100)
  const [orders, summary] = await Promise.all([
    listPaidOrders(db, { status, limit }),
    summarizePaidOrders(db),
  ])
  return Response.json({ ok: true, orders, summary })
}

/**
 * 后台补单：回调丢了、到账延迟、网关抽风时用。
 * action=grant 补权益；action=price 配置某资源的现金价（分）。
 */
export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const action = String(body?.action || 'grant')

  if (action === 'grant') {
    const outTradeNo = String(body?.outTradeNo || '').trim()
    if (!outTradeNo) return Response.json({ error: 'INVALID_ORDER' }, { status: 400 })
    const result = await grantPaidOrder(db, outTradeNo, { note: 'manual:owner' })
    return Response.json(result, { status: result.ok ? 200 : 404 })
  }

  if (action === 'price') {
    const resourceKey = String(body?.resourceKey || '').trim()
    const priceFen = Math.max(0, Math.trunc(Number(body?.priceFen || 0)))
    if (!resourceKey || resourceKey.length > 180) return Response.json({ error: 'INVALID_RESOURCE' }, { status: 400 })
    const current = await readPriceFen(db, resourceKey)
    // 走 upsertResource 而不是裸 UPDATE：它负责让资源配置缓存失效，改价立即生效
    const existing = await db
      .prepare('SELECT cost_points FROM gated_resources WHERE resource_key = ?1')
      .bind(resourceKey)
      .first()
    const fallbackCost = (await getPointRules(db)).researchDefaultCost
    const result = await upsertResource(db, {
      resourceKey,
      costPoints: existing ? Number(existing.cost_points || 0) : Number(fallbackCost || 0),
      priceFen,
    })
    if (!result.ok) return Response.json(result, { status: result.status || 400 })
    return Response.json({ ok: true, resourceKey, priceFen, previous: current })
  }

  return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
}

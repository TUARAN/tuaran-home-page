import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { readPriceFen } from '../../../../lib/pay/orders'
import { upsertResource } from '../../../../lib/ledger/points'
import {
  SIGNATURE_BOOKS,
  isKnownSignatureSlug,
  listBookOrdersWithPayment,
  listSignatureEditions,
  readSignatureEdition,
  salePriceFor,
  shipBookOrder,
} from '../../../../lib/pay/bookOrders.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

const SIGNATURE_TITLES = new Map(SIGNATURE_BOOKS.map((b) => [b.slug, b.title]))

/** 后台：签名版订单列表 + 定价配置 */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const url = new URL(req.url)
  const status = String(url.searchParams.get('status') || '').trim()
  const limit = Number(url.searchParams.get('limit') || 200)

  const [orders, editions] = await Promise.all([
    listBookOrdersWithPayment(db, { status, limit }),
    listSignatureEditions(db),
  ])

  // 定价配置联上当前实收价（gated_resources.price_fen），后台一眼核对「原价×0.88 = 实收」
  const pricedEditions = await Promise.all(
    SIGNATURE_BOOKS.map(async (book) => {
      const row = editions.find((e) => e.book_slug === book.slug) || null
      const basePriceFen = Math.max(0, Math.trunc(Number(row?.base_price_fen || 0)))
      const active = row ? Number(row.active) !== 0 : false
      const salePriceFen = await readPriceFen(db, `signature:${book.slug}`)
      return {
        slug: book.slug,
        title: book.title,
        basePriceFen,
        active,
        salePriceFen: Number(salePriceFen || 0),
        expectedSaleFen: salePriceFor(basePriceFen),
      }
    })
  )

  return Response.json({ ok: true, orders, editions: pricedEditions })
}

/**
 * 后台操作：
 *  - action=price  配置某本书签名版划线原价（分）与上架开关；早鸟价 = round(原价*0.88)
 *                  自动同步进 gated_resources.price_fen 作为实收金额。
 *  - action=ship   填快递单号并标记发货（to_ship → shipped）。
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

  const action = String(body?.action || '')

  if (action === 'price') {
    const slug = String(body?.slug || '').trim()
    if (!isKnownSignatureSlug(slug)) return Response.json({ error: 'INVALID_SLUG' }, { status: 400 })
    const basePriceFen = Math.trunc(Number(body?.basePriceFen || 0))
    if (!Number.isFinite(basePriceFen) || basePriceFen < 0 || basePriceFen > 100000000) {
      return Response.json({ error: 'INVALID_PRICE' }, { status: 400 })
    }
    const active = body?.active === undefined ? Boolean((await readSignatureEdition(db, slug))?.active ?? false) : Boolean(body?.active)
    const now = Date.now()
    await db
      .prepare(
        `INSERT INTO book_signature_editions (book_slug, base_price_fen, active, updated_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(book_slug) DO UPDATE SET
           base_price_fen = excluded.base_price_fen,
           active = excluded.active,
           updated_at = excluded.updated_at`
      )
      .bind(slug, basePriceFen, active ? 1 : 0, now)
      .run()

    // 早鸟价同步进 gated_resources（实收金额）；下架或未配价时清 0 关闭购买
    const salePriceFen = active ? salePriceFor(basePriceFen) : 0
    const existing = await db
      .prepare('SELECT cost_points FROM gated_resources WHERE resource_key = ?1')
      .bind(`signature:${slug}`)
      .first()
    const result = await upsertResource(db, {
      resourceKey: `signature:${slug}`,
      costPoints: existing ? Number(existing.cost_points || 0) : 0,
      priceFen: salePriceFen,
    })
    if (!result.ok) return Response.json(result, { status: result.status || 400 })

    return Response.json({
      ok: true,
      slug,
      basePriceFen,
      active,
      salePriceFen,
      title: SIGNATURE_TITLES.get(slug) || slug,
    })
  }

  if (action === 'ship') {
    const result = await shipBookOrder(db, String(body?.orderNo || '').trim(), String(body?.trackingNo || '').trim())
    return Response.json(result, { status: result.ok ? 200 : result.error === 'INVALID_TRACKING' ? 400 : 409 })
  }

  return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
}

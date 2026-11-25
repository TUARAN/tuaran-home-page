import { getD1 } from '../../../../../lib/db/d1'
import {
  SIGNATURE_BOOKS,
  isKnownSignatureSlug,
  listSignatureEditions,
  salePriceFor,
} from '../../../../../lib/pay/bookOrders.mjs'
import { readPriceFen } from '../../../../../lib/pay/orders'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 签名版公开定价：书页的签名版卡片用（页面本身 force-static，价格走客户端轻量拉取）。
 * 只返回已上架（active）且早鸟价 > 0 的书；未配置的书不返回，卡片自动隐藏。
 */
export async function GET(req) {
  const db = (() => {
    try {
      return getD1()
    } catch {
      return null
    }
  })()
  if (!db) return Response.json({ ok: true, editions: [] }, { headers: { 'Cache-Control': 'no-store' } })

  const { searchParams } = new URL(req.url)
  const slugsParam = String(searchParams.get('slugs') || '').trim()

  let editions = []
  try {
    const rows = await listSignatureEditions(db)
    const wanted = slugsParam
      ? slugsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : SIGNATURE_BOOKS.map((b) => b.slug)
    for (const slug of wanted) {
      if (!isKnownSignatureSlug(slug)) continue
      const row = rows.find((r) => r.book_slug === slug)
      if (!row || !Number(row.active)) continue
      const basePriceFen = Math.max(0, Math.trunc(Number(row.base_price_fen || 0)))
      const salePriceFen = await readPriceFen(db, `signature:${slug}`)
      if (basePriceFen <= 0 || salePriceFen <= 0) continue
      // 收款价必须与原价×折扣一致；不一致（后台被单独改过价）时以显示原价与折扣为准，隐藏卡片避免误导
      if (salePriceFen !== salePriceFor(basePriceFen)) continue
      editions.push({ slug, basePriceFen, salePriceFen, discount: 0.88 })
    }
  } catch {
    editions = []
  }

  return Response.json(
    { ok: true, editions },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

import { buildBasketIndex } from '../../../../lib/usStockBasket.js'
import { latestSnapshot } from '../../../../lib/usStockLedger.js'
import { applyPositionWeights } from '../../../../lib/usStockPosition.js'
import { fetchUsStockBasket } from '../../../../lib/usStockQuotes.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const quotes = applyPositionWeights(await fetchUsStockBasket(), latestSnapshot())
  if (!quotes.some((quote) => quote.bars.length)) {
    return Response.json({ error: '行情暂时不可用' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
  return Response.json({
    source: 'Nasdaq',
    currency: 'USD',
    quotes,
    index: buildBasketIndex(quotes),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

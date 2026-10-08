import { getD1 } from '../../../../lib/d1'
import { loadRanbiPublicLedger } from '../../../../lib/ranbiPublicLedger'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(request) {
  const db = dbOrNull()
  const url = new URL(request.url)
  const ledger = await loadRanbiPublicLedger(db, {
    before: url.searchParams.get('before'),
    limit: url.searchParams.get('limit'),
    scope: url.searchParams.get('scope') === 'all' ? 'all' : 'page',
  })
  if (!ledger) {
    return Response.json({ error: 'LEDGER_UNAVAILABLE' }, { status: 503 })
  }
  return Response.json(ledger, {
    headers: { 'cache-control': 'no-store' },
  })
}

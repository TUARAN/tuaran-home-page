import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let db
  try { db = getD1() } catch { return Response.json({ detail: 'D1 不可用或迁移 0081 尚未部署。' }, { status: 503 }) }
  const url = new URL(req.url)
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0)
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20))
  try {
    const [rows, count] = await Promise.all([
      db.prepare('SELECT * FROM crypto_run_log ORDER BY ran_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all(),
      db.prepare('SELECT COUNT(*) AS total FROM crypto_run_log').first(),
    ])
    return Response.json({
      offset, limit, total: Number(count?.total) || 0,
      logs: (rows?.results || []).map((row) => ({ id: row.id, ranAt: row.ran_at, action: row.action, coinId: row.coin_id, symbol: row.symbol, coinName: row.coin_name, draftId: row.draft_id, taskId: row.deepseek_task_id, status: row.status, error: row.error, durationMs: row.duration_ms })),
    })
  } catch (error) {
    return Response.json({ error: 'CRYPTO_RESEARCH_LOGS_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { cryptoAutoPublishAt } from '../../../../lib/cryptoPublishCore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FILTERS = new Set(['generating', 'failed', 'pending', 'reviewed', 'published', 'rejected'])
const MUTABLE = new Set(['pending', 'reviewed', 'rejected'])

function unavailable() {
  return Response.json({ status: 'unavailable', detail: 'D1 不可用或迁移 0081 尚未部署。' }, { status: 503 })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let db
  try { db = getD1() } catch { return unavailable() }
  try {
    const requested = new URL(req.url).searchParams.get('status') || ''
    const status = FILTERS.has(requested) ? requested : ''
    const draftsQuery = status ? db.prepare('SELECT * FROM crypto_drafts WHERE status = ? ORDER BY created_at DESC LIMIT 30').bind(status) : db.prepare('SELECT * FROM crypto_drafts ORDER BY created_at DESC LIMIT 30')
    const [pool, pending, drafts, stats] = await Promise.all([
      db.prepare('SELECT * FROM crypto_pool_snapshot WHERE id = 1').first(),
      db.prepare("SELECT * FROM crypto_selections WHERE status = 'selected' ORDER BY selected_at ASC LIMIT 1").first(),
      draftsQuery.all(),
      db.prepare('SELECT status, COUNT(*) AS count FROM crypto_drafts GROUP BY status').all(),
    ])
    const countByStatus = Object.fromEntries((stats?.results || []).map((row) => [row.status, Number(row.count)]))
    return Response.json({
      status: 'ok',
      pool: pool ? { snapshotDate: pool.snapshot_date, count: Number(pool.count), generatedAt: Number(pool.generated_at) } : null,
      pending: pending ? { coinId: pending.coin_id, symbol: pending.symbol, name: pending.name, marketCapRank: pending.market_cap_rank } : null,
      draftStats: Object.fromEntries([...FILTERS].map((key) => [key, countByStatus[key] || 0])),
      drafts: (drafts?.results || []).map((row) => ({
        id: row.id, coinId: row.coin_id, symbol: row.symbol, name: row.name, marketCapRank: row.market_cap_rank,
        title: row.title, draftDate: row.draft_date, content: row.content, templateVersion: row.template_version,
        taskId: row.deepseek_task_id, attemptCount: Number(row.attempt_count) || 0, generationError: row.generation_error || '',
        status: row.status, publishCommit: row.publish_commit || '', publishAt: row.publish_at || null,
        autoPublishAt: row.status === 'pending' ? cryptoAutoPublishAt(row) : null, createdAt: row.created_at, updatedAt: row.updated_at,
      })),
    })
  } catch (error) {
    if (String(error?.message || error).includes('no such table')) return unavailable()
    return Response.json({ error: 'CRYPTO_RESEARCH_FETCH_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  const status = String(body?.status || '').trim()
  if (!id || !MUTABLE.has(status)) return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  let db
  try { db = getD1() } catch { return unavailable() }
  const result = await db.prepare('UPDATE crypto_drafts SET status = ?, updated_at = ? WHERE id = ?').bind(status, Date.now(), id).run()
  if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  return Response.json({ ok: true, id, status })
}

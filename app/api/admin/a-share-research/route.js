import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { autoPublishAt } from '../../../../lib/aSharePublishCore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DRAFT_STATUSES = new Set(['pending', 'reviewed', 'rejected'])

function unavailable() {
  return Response.json(
    {
      status: 'unavailable',
      detail: 'D1 不可用或迁移 0060 尚未部署，无法读取 A 股研究数据。',
    },
    { status: 503 },
  )
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }

  try {
    const [snapshot, pending, drafts, logs, draftStats] = await Promise.all([
      db.prepare('SELECT * FROM a_share_pool_snapshot WHERE id = 1').first(),
      db.prepare("SELECT * FROM a_share_selections WHERE status = 'selected' LIMIT 1").first(),
      db.prepare('SELECT * FROM a_share_drafts ORDER BY created_at DESC LIMIT 30').all(),
      db.prepare('SELECT * FROM a_share_run_log ORDER BY ran_at DESC LIMIT 20').all(),
      db
        .prepare(
          `SELECT status, COUNT(*) AS count FROM a_share_drafts GROUP BY status`,
        )
        .all(),
    ])
    const countByStatus = Object.fromEntries((draftStats?.results || []).map((row) => [row.status, Number(row.count)]))
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      pool: snapshot
        ? { snapshotDate: snapshot.snapshot_date, count: Number(snapshot.count), generatedAt: Number(snapshot.generated_at) }
        : null,
      pending: pending ? { code: pending.code, name: pending.name, selectedAt: pending.selected_at, selectionDate: pending.selection_date } : null,
      draftStats: {
        pending: countByStatus.pending || 0,
        reviewed: countByStatus.reviewed || 0,
        rejected: countByStatus.rejected || 0,
      },
      drafts: (drafts?.results || []).map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        title: row.title,
        draftDate: row.draft_date,
        content: row.content,
        templateVersion: row.template_version,
        styleId: row.style_id,
        deepseekTaskId: row.deepseek_task_id,
        attemptCount: Number(row.attempt_count) || 0,
        status: row.status,
        publishCommit: row.publish_commit || '',
        publishAt: row.publish_at || null,
        autoPublishAt: row.status === 'pending' ? autoPublishAt(row) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      logs: (logs?.results || []).map((row) => ({
        id: row.id,
        ranAt: row.ran_at,
        action: row.action,
        code: row.code,
        companyName: row.company_name,
        draftId: row.draft_id,
        deepseekTaskId: row.deepseek_task_id,
        status: row.status,
        error: row.error,
        durationMs: row.duration_ms,
      })),
    })
  } catch (error) {
    const detail = String(error?.message || error)
    if (detail.includes('no such table')) return unavailable()
    return Response.json({ error: 'A_SHARE_FETCH_FAILED', detail }, { status: 500 })
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  const status = String(body?.status || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  if (!DRAFT_STATUSES.has(status)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })

  let db
  try {
    db = getD1()
  } catch {
    return unavailable()
  }
  try {
    const result = await db
      .prepare('UPDATE a_share_drafts SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, Date.now(), id)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, status })
  } catch (error) {
    return Response.json({ error: 'A_SHARE_UPDATE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

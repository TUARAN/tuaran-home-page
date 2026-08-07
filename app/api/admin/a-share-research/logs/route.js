import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/** 运行日志分页读取：?offset=0&limit=20（默认 20，最大 100）。 */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return Response.json(
      {
        status: 'unavailable',
        detail: 'D1 不可用或迁移 0060 尚未部署，无法读取 A 股研究运行日志。',
      },
      { status: 503 },
    )
  }

  const url = new URL(req.url)
  const parsedOffset = Number.parseInt(url.searchParams.get('offset') || '0', 10)
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10)
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(MAX_LIMIT, parsedLimit)
    : DEFAULT_LIMIT

  try {
    const [rowsResult, countRow] = await Promise.all([
      db
        .prepare('SELECT * FROM a_share_run_log ORDER BY ran_at DESC LIMIT ?1 OFFSET ?2')
        .bind(limit, offset)
        .all(),
      db.prepare('SELECT COUNT(*) AS total FROM a_share_run_log').first(),
    ])
    return Response.json({
      status: 'ok',
      offset,
      limit,
      total: Number(countRow?.total) || 0,
      logs: (rowsResult?.results || []).map((row) => ({
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
    return Response.json(
      { error: 'A_SHARE_LOGS_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const EXECUTION_STATUSES = new Set(['running', 'succeeded', 'failed'])
const MANAGEMENT_STATUSES = new Set(['pending', 'reviewing', 'approved', 'archived'])
const PRIORITIES = new Set(['low', 'normal', 'high'])
const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000

function startOfChinaToday(now = Date.now()) {
  return Math.floor((now + CHINA_OFFSET_MS) / DAY_MS) * DAY_MS - CHINA_OFFSET_MS
}

function rowToTask(row) {
  let metadata = {}
  try {
    metadata = JSON.parse(row.metadata_json || '{}')
  } catch {
    metadata = {}
  }
  return {
    id: row.id,
    source: row.source,
    taskType: row.task_type,
    title: row.title,
    executionStatus: row.execution_status,
    managementStatus: row.management_status,
    priority: row.priority,
    actorId: row.actor_id,
    actorName: row.actor_name,
    model: row.model,
    inputSummary: row.input_summary,
    resultSummary: row.result_summary,
    metadata,
    promptTokens: Number(row.prompt_tokens) || 0,
    completionTokens: Number(row.completion_tokens) || 0,
    totalTokens: Number(row.total_tokens) || 0,
    durationMs: Number(row.duration_ms) || 0,
    errorCode: row.error_code,
    errorDetail: row.error_detail,
    managementNote: row.management_note,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function unavailableResponse() {
  return Response.json({
    status: 'unavailable',
    generatedAt: Date.now(),
    stats: { total: 0, today: 0, succeeded: 0, failed: 0, running: 0, totalTokens: 0 },
    sources: [],
    tasks: [],
  })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return unavailableResponse()
  }

  const params = new URL(req.url).searchParams
  const execution = params.get('execution') || ''
  const management = params.get('management') || ''
  const source = String(params.get('source') || '').trim().slice(0, 100)
  const limit = Math.min(Math.max(Number(params.get('limit')) || 100, 1), 200)
  if (execution && !EXECUTION_STATUSES.has(execution)) {
    return Response.json({ error: 'INVALID_EXECUTION_STATUS' }, { status: 400 })
  }
  if (management && !MANAGEMENT_STATUSES.has(management)) {
    return Response.json({ error: 'INVALID_MANAGEMENT_STATUS' }, { status: 400 })
  }

  const clauses = []
  const binds = []
  if (execution) {
    clauses.push('execution_status = ?')
    binds.push(execution)
  }
  if (management) {
    clauses.push('management_status = ?')
    binds.push(management)
  }
  if (source) {
    clauses.push('source = ?')
    binds.push(source)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  try {
    const [taskResult, stats, sourceResult] = await Promise.all([
      db
        .prepare(`SELECT * FROM deepseek_tasks ${where} ORDER BY created_at DESC LIMIT ?`)
        .bind(...binds, limit)
        .all(),
      db
        .prepare(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS today,
             SUM(CASE WHEN execution_status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
             SUM(CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END) AS failed,
             SUM(CASE WHEN execution_status = 'running' THEN 1 ELSE 0 END) AS running,
             COALESCE(SUM(total_tokens), 0) AS total_tokens
           FROM deepseek_tasks`,
        )
        .bind(startOfChinaToday())
        .first(),
      db.prepare('SELECT DISTINCT source FROM deepseek_tasks WHERE source != ? ORDER BY source').bind('').all(),
    ])

    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      stats: {
        total: Number(stats?.total) || 0,
        today: Number(stats?.today) || 0,
        succeeded: Number(stats?.succeeded) || 0,
        failed: Number(stats?.failed) || 0,
        running: Number(stats?.running) || 0,
        totalTokens: Number(stats?.total_tokens) || 0,
      },
      sources: (sourceResult?.results || []).map((row) => row.source),
      tasks: (taskResult?.results || []).map(rowToTask),
    })
  } catch (error) {
    const detail = String(error?.message || error)
    if (detail.includes('no such table')) return unavailableResponse()
    return Response.json({ error: 'DEEPSEEK_TASKS_FETCH_FAILED', detail }, { status: 500 })
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  const managementStatus = body?.managementStatus
  const priority = body?.priority
  const managementNote = body?.managementNote
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  if (managementStatus != null && !MANAGEMENT_STATUSES.has(managementStatus)) {
    return Response.json({ error: 'INVALID_MANAGEMENT_STATUS' }, { status: 400 })
  }
  if (priority != null && !PRIORITIES.has(priority)) {
    return Response.json({ error: 'INVALID_PRIORITY' }, { status: 400 })
  }
  if (managementNote != null && (typeof managementNote !== 'string' || managementNote.length > 2000)) {
    return Response.json({ error: 'INVALID_MANAGEMENT_NOTE' }, { status: 400 })
  }
  if (managementStatus == null && priority == null && managementNote == null) {
    return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  const sets = ['updated_at = ?']
  const binds = [Date.now()]
  if (managementStatus != null) {
    sets.push('management_status = ?')
    binds.push(managementStatus)
  }
  if (priority != null) {
    sets.push('priority = ?')
    binds.push(priority)
  }
  if (managementNote != null) {
    sets.push('management_note = ?')
    binds.push(managementNote.trim())
  }
  binds.push(id)

  try {
    const result = await db
      .prepare(`UPDATE deepseek_tasks SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id, updatedAt: Date.now() })
  } catch (error) {
    return Response.json(
      { error: 'DEEPSEEK_TASK_UPDATE_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

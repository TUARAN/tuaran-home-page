import { getD1 } from '../../../lib/d1'
import { getVoiceTaskPrincipal } from '../../../lib/voiceTasksAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STATUSES = new Set(['pending', 'done', 'void'])
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent'])

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '语音任务需要部署环境（Cloudflare D1）与授权后使用。' },
    { status: 503 }
  )
}

function normalizeStatus(value, fallback = 'pending') {
  const status = String(value || '').trim().toLowerCase()
  return STATUSES.has(status) ? status : fallback
}

function normalizePriority(value, fallback = 'normal') {
  const priority = String(value || '').trim().toLowerCase()
  return PRIORITIES.has(priority) ? priority : fallback
}

function parseTimestamp(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return Math.floor(n)
  const parsed = Date.parse(String(value))
  if (Number.isNaN(parsed)) return null
  return parsed
}

function serializeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    content: row.content,
    priority: row.priority,
    status: row.status,
    dueAt: row.due_at ?? null,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null,
    voidedAt: row.voided_at ?? null,
  }
}

async function getDb() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const principal = await getVoiceTaskPrincipal(req)
    if (!principal) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const status = statusParam === 'all' ? 'all' : normalizeStatus(statusParam || 'pending')
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 50))

    let query =
      `SELECT id, content, priority, status, due_at, source, created_at, updated_at, completed_at, voided_at
       FROM voice_tasks`
    const binds = []

    if (principal.type === 'owner') {
      query += ' WHERE user_id = ?'
      binds.push(String(principal.user.id))
      if (status !== 'all') {
        query += ' AND status = ?'
        binds.push(status)
      }
    } else if (status !== 'all') {
      query += ' WHERE status = ?'
      binds.push(status)
    }

    query += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, created_at ASC LIMIT ?"
    binds.push(limit)

    const result = await db.prepare(query).bind(...binds).all()
    return Response.json({
      items: (result?.results || []).map(serializeRow),
      status,
      limit,
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const principal = await getVoiceTaskPrincipal(req)
    if (!principal || principal.type !== 'owner') {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const content = String(body?.content || '').trim()
    if (!content) return Response.json({ error: 'EMPTY_CONTENT' }, { status: 400 })
    if (content.length > 2000) return Response.json({ error: 'CONTENT_TOO_LONG' }, { status: 400 })

    const priority = normalizePriority(body?.priority)
    const dueAt = parseTimestamp(body?.dueAt)
    const source = String(body?.source || 'voice').slice(0, 32)
    const now = Date.now()

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const row = await db
      .prepare(
        `INSERT INTO voice_tasks (user_id, content, priority, status, due_at, source, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?6)
         RETURNING id, content, priority, status, due_at, source, created_at, updated_at, completed_at, voided_at`
      )
      .bind(String(principal.user.id), content, priority, dueAt, source, now)
      .first()

    return Response.json({ item: serializeRow(row) }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const principal = await getVoiceTaskPrincipal(req)
    if (!principal) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const id = Number(body?.id)
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    const status = body?.status == null ? null : normalizeStatus(body.status, '')
    const priority = body?.priority == null ? null : normalizePriority(body.priority, '')
    const dueAt = Object.prototype.hasOwnProperty.call(body || {}, 'dueAt') ? parseTimestamp(body?.dueAt) : undefined
    const content = body?.content == null ? null : String(body.content).trim()

    if (status === '') return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
    if (priority === '') return Response.json({ error: 'INVALID_PRIORITY' }, { status: 400 })
    if (content != null && (!content || content.length > 2000)) {
      return Response.json({ error: 'INVALID_CONTENT' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const current = await db
      .prepare('SELECT id, user_id FROM voice_tasks WHERE id = ?1')
      .bind(id)
      .first()

    if (!current) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (principal.type === 'owner' && String(current.user_id) !== String(principal.user.id)) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const now = Date.now()
    const updates = ['updated_at = ?']
    const binds = [now]

    if (status) {
      updates.push('status = ?')
      binds.push(status)
      if (status === 'done') {
        updates.push('completed_at = ?')
        binds.push(now)
      } else {
        updates.push('completed_at = NULL')
      }
      if (status === 'void') {
        updates.push('voided_at = ?')
        binds.push(now)
      } else {
        updates.push('voided_at = NULL')
      }
    }
    if (priority) {
      updates.push('priority = ?')
      binds.push(priority)
    }
    if (dueAt !== undefined) {
      updates.push('due_at = ?')
      binds.push(dueAt)
    }
    if (content != null) {
      updates.push('content = ?')
      binds.push(content)
    }

    binds.push(id)
    const row = await db
      .prepare(
        `UPDATE voice_tasks SET ${updates.join(', ')}
         WHERE id = ?
         RETURNING id, content, priority, status, due_at, source, created_at, updated_at, completed_at, voided_at`
      )
      .bind(...binds)
      .first()

    return Response.json({ item: serializeRow(row) })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

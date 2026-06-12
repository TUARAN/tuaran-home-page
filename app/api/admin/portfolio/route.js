import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { VALID_BIZ_STATUSES } from '../../../../lib/portfolioSeed'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToProject(row) {
  let links = []
  try {
    const parsed = JSON.parse(row.links || '[]')
    if (Array.isArray(parsed)) links = parsed
  } catch {
    links = []
  }
  return {
    id: row.id,
    name: row.name,
    pillar: row.pillar,
    action: row.action,
    role: row.role,
    path: row.path,
    next: row.next_step,
    links,
    position: row.pos_x == null || row.pos_y == null ? null : [row.pos_x, row.pos_y],
    revenueMonthly: Number(row.revenue_monthly) || 0,
    hoursMonthly: Number(row.hours_monthly) || 0,
    bizStatus: VALID_BIZ_STATUSES.includes(row.biz_status) ? row.biz_status : 'unset',
    updatedAt: row.updated_at,
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      message: '当前运行环境没有 D1 绑定，管理台将回退到 seed 快照（只读）。',
    })
  }

  try {
    const result = await db
      .prepare('SELECT * FROM portfolio_projects ORDER BY sort_order ASC')
      .all()
    const projects = (result?.results || []).map(rowToProject)
    return Response.json({ status: 'ok', generatedAt: Date.now(), projects })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'PORTFOLIO_READ_FAILED',
        message: '台账读取失败（迁移 0020 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

function parseNonNegativeNumber(value) {
  if (value == null) return null
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return undefined
  return num
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  const sets = []
  const binds = []

  const revenue = parseNonNegativeNumber(body.revenueMonthly)
  if (revenue === undefined) {
    return Response.json({ error: 'INVALID_REVENUE' }, { status: 400 })
  }
  if (revenue !== null) {
    sets.push('revenue_monthly = ?')
    binds.push(revenue)
  }

  const hours = parseNonNegativeNumber(body.hoursMonthly)
  if (hours === undefined) {
    return Response.json({ error: 'INVALID_HOURS' }, { status: 400 })
  }
  if (hours !== null) {
    sets.push('hours_monthly = ?')
    binds.push(hours)
  }

  if (body.bizStatus != null) {
    if (!VALID_BIZ_STATUSES.includes(body.bizStatus)) {
      return Response.json({ error: 'INVALID_BIZ_STATUS' }, { status: 400 })
    }
    sets.push('biz_status = ?')
    binds.push(body.bizStatus)
  }

  if (!sets.length) {
    return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  }

  sets.push('updated_at = ?')
  binds.push(Date.now())
  binds.push(id)

  try {
    const result = await db
      .prepare(`UPDATE portfolio_projects SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
    if (!result?.meta?.changes) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const row = await db
      .prepare('SELECT * FROM portfolio_projects WHERE id = ?')
      .bind(id)
      .first()
    return Response.json({ ok: true, project: row ? rowToProject(row) : null })
  } catch (error) {
    return Response.json(
      {
        error: 'PORTFOLIO_WRITE_FAILED',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

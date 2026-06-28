import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { listSiteUsers } from '../../../../lib/userDirectory'
import { getD1QuickStatus } from '../../../../lib/dbAdmin'
import { RESEARCH_STYLE_TEMPLATES } from '../../../../lib/researchStyleTemplates'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Dashboard 总览聚合：用户数 / PV / D1 状态 / 最近活动。
 * 复用各业务模块的取数函数，不另起一套查询。Ops 健康仍由
 * /api/admin/ops-console 单独提供（dashboard 并行取）。
 */

function startOfTodayMs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function activeStyleSummary() {
  const active = [...RESEARCH_STYLE_TEMPLATES].find((t) => t.status === 'active')
  return active ? { id: active.id, label: active.label, date: active.date } : null
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const style = activeStyleSummary()

  let db = null
  try {
    db = getD1()
  } catch {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      badges: {},
      users: { count: null },
      pv: { total: null, today: null },
      db: { status: 'unavailable', tables: null, name: null },
      recent: { users: [], style },
    })
  }

  try {
    const [users, dbSnap, pvTotalRow, pvTodayRow] = await Promise.all([
      listSiteUsers(db).catch(() => []),
      getD1QuickStatus(db).catch(() => ({ status: 'error', tableCount: null })),
      db.prepare('SELECT COALESCE(SUM(pv), 0) AS total FROM research_pv').first().catch(() => null),
      db
        .prepare('SELECT COUNT(*) AS today FROM research_pv_hits WHERE created_at >= ?1')
        .bind(startOfTodayMs())
        .first()
        .catch(() => null),
    ])

    const recentUsers = users.slice(0, 5).map((u) => ({
      id: u.id,
      name: u.name || u.login || u.id,
      image: u.image || null,
      provider: u.provider || '',
      role: u.role,
      lastSeenAt: u.lastSeenAt,
    }))

    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      badges: { users: users.length },
      users: { count: users.length },
      pv: {
        total: Math.max(0, Number(pvTotalRow?.total) || 0),
        today: Math.max(0, Number(pvTodayRow?.today) || 0),
      },
      db: {
        status: dbSnap?.status || 'unknown',
        tables: dbSnap?.tableCount ?? null,
        name: null,
      },
      recent: { users: recentUsers, style },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'OVERVIEW_FAILED',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

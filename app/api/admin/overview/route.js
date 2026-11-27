import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { readThroughEdgeCache } from '../../../../lib/db/edgeCache.mjs'
import { loadAdminBadges } from '../../../../lib/admin/badgeCounts.mjs'
import { listSiteUsers } from '../../../../lib/auth/userDirectory'
import { getD1QuickStatus } from '../../../../lib/admin/dbAdmin'
import { RESEARCH_STYLE_TEMPLATES } from '../../../../lib/research/researchStyleTemplates'
import { loadOverviewTodayRankings } from '../../../../lib/admin/overviewTodayRankings.mjs'
import { shanghaiDayStartMs } from '../../../../lib/site/analyticsSources.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Dashboard 总览聚合：用户数 / PV / UV / D1 状态 / 最近活动。
 * 复用各业务模块的取数函数，不另起一套查询。Ops 健康仍由
 * /api/admin/ops-console 单独提供（dashboard 并行取）。
 *
 * `?fields=badges` 是侧栏计数专用分支：AdminShell 每次进后台页面都会请求，
 * 只用到用户数。走这个分支时不再执行 research_pv_hits 的三条聚合
 * （表约 1.5 万行，每次切页面白扫一遍），只做一次 site_users 的 COUNT。
 */

function activeStyleSummary() {
  const active = [...RESEARCH_STYLE_TEMPLATES].find((t) => t.status === 'active')
  return active ? { id: active.id, label: active.label, date: active.date } : null
}

const BADGES_TTL_SECONDS = 60

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const wantBadgesOnly = new URL(req.url).searchParams.get('fields') === 'badges'
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
      uv: { total: null, today: null },
      db: { status: 'unavailable', tables: null, name: null },
      recent: { users: [], style },
      today: { topContent: [], topReaders: [] },
    })
  }

  if (wantBadgesOnly) {
    try {
      const payload = await readThroughEdgeCache('admin:overview:badges', BADGES_TTL_SECONDS, async () => ({
        status: 'ok',
        generatedAt: Date.now(),
        badges: await loadAdminBadges(db),
      }))
      return Response.json(payload)
    } catch (error) {
      return Response.json(
        {
          status: 'error',
          generatedAt: Date.now(),
          error: 'OVERVIEW_BADGES_FAILED',
          detail: String(error?.message || error),
        },
        { status: 500 }
      )
    }
  }

  try {
    const payload = await readThroughEdgeCache(
      `admin:overview:${shanghaiDayStartMs()}`,
      60,
      async () => {
        const [users, dbSnap, pvTotalRow, pvTodayRow, uvRow] = await Promise.all([
          listSiteUsers(db).catch(() => []),
          getD1QuickStatus(db).catch(() => ({ status: 'error', tableCount: null })),
          db.prepare("SELECT COUNT(*) AS total FROM research_pv_hits WHERE quality = 'qualified'").first().catch(() => null),
          db
            .prepare("SELECT COUNT(*) AS today FROM research_pv_hits WHERE quality = 'qualified' AND created_at >= ?1")
            .bind(shanghaiDayStartMs())
            .first()
            .catch(() => null),
          db
            .prepare(
              `SELECT
                 COUNT(DISTINCT CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END) AS total,
                 COUNT(DISTINCT CASE
                   WHEN created_at >= ?1
                   THEN CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END
                 END) AS today
               FROM research_pv_hits WHERE quality = 'qualified'`
            )
            .bind(shanghaiDayStartMs())
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

        const todayStart = shanghaiDayStartMs()
        const todayRankings = await loadOverviewTodayRankings(db, todayStart)

        return {
          status: 'ok',
          generatedAt: Date.now(),
          badges: { users: users.length },
          users: { count: users.length },
          pv: {
            total: Math.max(0, Number(pvTotalRow?.total) || 0),
            today: Math.max(0, Number(pvTodayRow?.today) || 0),
          },
          uv: {
            total: Math.max(0, Number(uvRow?.total) || 0),
            today: Math.max(0, Number(uvRow?.today) || 0),
          },
          db: {
            status: dbSnap?.status || 'unknown',
            tables: dbSnap?.tableCount ?? null,
            name: null,
          },
          recent: { users: recentUsers, style },
          today: todayRankings,
        }
      },
    )
    return Response.json(payload)
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

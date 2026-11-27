import { equalComparisonWindow } from './analyticsSources.mjs'

function nonNegative(value) {
  return Math.max(0, Number(value) || 0)
}

/**
 * 公开页脚用的站内口径：research_pv_hits 中 quality = qualified 的有效阅读。
 * 不等于 Umami 全站 pageview；口径见 ANALYTICS_METRIC_DEFINITIONS / #qualified-reads。
 */
export async function fetchInternalTrafficSummary(db, now = Date.now()) {
  if (!db) throw new Error('D1_UNAVAILABLE')

  const weekStart = equalComparisonWindow(7, now).currentStart
  const identityExpr = "CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END"

  const [totalRow, weekPvRow, weekUvRow] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS total FROM research_pv_hits WHERE quality = 'qualified'")
      .first(),
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM research_pv_hits WHERE quality = 'qualified' AND created_at >= ?1",
      )
      .bind(weekStart)
      .first(),
    db
      .prepare(
        `SELECT COUNT(DISTINCT ${identityExpr}) AS total
         FROM research_pv_hits
         WHERE quality = 'qualified' AND created_at >= ?1`,
      )
      .bind(weekStart)
      .first(),
  ])

  return {
    source: 'internal',
    metricKind: 'qualified-reads',
    detailPath: '/traffic#qualified-reads',
    totalPv: nonNegative(totalRow?.total),
    weekPv: nonNegative(weekPvRow?.total),
    weekUv: nonNegative(weekUvRow?.total),
  }
}
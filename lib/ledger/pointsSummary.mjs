/**
 * user_points 的用户侧汇总（人数 / 流通量 / 最近变动时间）。
 *
 * 背景：公开页 /ranbi 的供应量取数原来每次 miss 都要
 * `COUNT(*) + SUM(balance) FROM user_points`（表已 4.8 万行），
 * 爬虫、跨 colo 首次 miss、并发请求都会把它放大成几十万行。
 *
 * 现在读 migration 0136 的 user_points_summary：单行表，由
 * AFTER INSERT / UPDATE OF balance / DELETE 三个触发器维护，
 * 与转账在同一事务内原子更新。表缺失时（代码先于迁移上线）退回全表聚合，
 * 行为与改造前一致。
 *
 * 计数器只是读侧缓存，账本仍是正本：超过一天没做全表核对时重算一次，
 * 兜住「有人绕过触发器直接改数据」造成的漂移。
 */

export const USER_POINTS_SUMMARY_TTL_MS = 24 * 60 * 60 * 1000

/** 全表聚合口径：计数器漂移或表缺失时的正本。 */
export async function scanUserPointsTotals(db) {
  const row = await db
    .prepare(
      'SELECT COUNT(*) AS identities, COALESCE(SUM(balance), 0) AS circulating, COALESCE(MAX(updated_at), 0) AS updated_at FROM user_points'
    )
    .first()
  return {
    identities: Number(row?.identities || 0),
    circulating: Number(row?.circulating || 0),
    updatedAt: Number(row?.updated_at || 0),
  }
}

/** 读计数器单行；表还没建（迁移未执行）时返回 null。 */
async function readCounterRow(db) {
  try {
    const row = await db
      .prepare('SELECT identities, circulating, max_updated_at, synced_at FROM user_points_summary WHERE id = 1')
      .first()
    return row || null
  } catch {
    return null
  }
}

/**
 * 重算并修复物化计数器，返回与修复前的差额。
 * 迁移未执行时只返回全表口径，不报错。
 */
export async function reconcileUserPointsSummary(db, now = Date.now()) {
  if (!db) return { ok: false, error: 'D1_UNAVAILABLE' }
  const totals = await scanUserPointsTotals(db)
  const previous = await readCounterRow(db)
  if (!previous) return { ok: true, materialized: false, ...totals }
  await db
    .prepare(
      `UPDATE user_points_summary
          SET identities = ?1,
              circulating = ?2,
              max_updated_at = ?3,
              synced_at = ?4
        WHERE id = 1`
    )
    .bind(totals.identities, totals.circulating, Math.max(totals.updatedAt, Number(previous.max_updated_at || 0)), now)
    .run()
  return {
    ok: true,
    materialized: true,
    identities: totals.identities,
    circulating: totals.circulating,
    updatedAt: totals.updatedAt,
    drift: {
      identities: Number(previous.identities || 0) - totals.identities,
      circulating: Number(previous.circulating || 0) - totals.circulating,
    },
  }
}

/**
 * 供应量里用的汇总值。
 * @returns {Promise<{identities:number, circulating:number, updatedAt:number, source:'counter'|'recount'|'scan'}>}
 */
export async function readUserPointsTotals(db, now = Date.now()) {
  const counters = await readCounterRow(db)
  if (!counters) return { ...(await scanUserPointsTotals(db)), source: 'scan' }
  if (now - Number(counters.synced_at || 0) > USER_POINTS_SUMMARY_TTL_MS) {
    const reconciled = await reconcileUserPointsSummary(db, now)
    return {
      identities: reconciled.identities,
      circulating: reconciled.circulating,
      updatedAt: reconciled.updatedAt,
      source: 'recount',
    }
  }
  return {
    identities: Number(counters.identities || 0),
    circulating: Number(counters.circulating || 0),
    updatedAt: Number(counters.max_updated_at || 0),
    source: 'counter',
  }
}

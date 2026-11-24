/**
 * 后台侧栏徽标计数。
 *
 * AdminShell 每次进入后台页面都会请求徽标，实际只用到用户数。
 * 这里刻意只做一次 site_users 的 COUNT：完整总览会顺带聚合
 * research_pv_hits（约 1.5 万行），切页面时等于白扫一遍。
 *
 * 读不到表时返回 0，让侧栏不显示徽标，不影响其它功能。
 */
export async function loadAdminBadges(db) {
  if (!db) return { users: 0 }
  const row = await db.prepare('SELECT COUNT(*) AS users FROM site_users').first().catch(() => null)
  return { users: Math.max(0, Number(row?.users) || 0) }
}

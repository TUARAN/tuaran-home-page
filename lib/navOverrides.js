import { getD1 } from './d1'

/**
 * 菜单可见性 override 层
 *
 * 数据流：
 *  - 源码里的 SITE_CHANNELS 是默认配置（每项可带 `audience` 字段）。
 *  - 站长后台（/agent-ops/nav-admin）可针对单个 href 把 audience 改成
 *    'public' | 'authed' | 'owner'，存到 D1 的 nav_overrides 表。
 *  - 渲染 SiteHeader / SiteMap 时调用 getNavOverrides() 拿到 { href: audience }
 *    映射，传给 siteNav.js 的过滤函数。
 *  - 这一层只控制「菜单是否展示」，不替代页面自己的 owner gate；
 *    把一个 owner 页面设成 public 也只是让链接出现在菜单里，
 *    页面本身的 PrivateVaultGate / owner check 不受影响。
 */

export const VALID_AUDIENCES = ['public', 'authed', 'owner']

export function isValidAudience(value) {
  return typeof value === 'string' && VALID_AUDIENCES.includes(value)
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/**
 * @returns {Promise<Record<string, 'public' | 'authed' | 'owner'>>}
 *   href → audience；D1 不可用时返回空对象。
 */
export async function getNavOverrides() {
  const db = dbOrNull()
  if (!db) return {}
  try {
    const result = await db.prepare('SELECT href, audience FROM nav_overrides').all()
    const rows = result?.results || []
    const map = {}
    for (const row of rows) {
      if (row?.href && isValidAudience(row.audience)) {
        map[row.href] = row.audience
      }
    }
    return map
  } catch {
    return {}
  }
}

export async function setNavOverride(href, audience) {
  if (!href || typeof href !== 'string') {
    return { ok: false, status: 400, error: 'INVALID_HREF' }
  }
  if (!isValidAudience(audience)) {
    return { ok: false, status: 400, error: 'INVALID_AUDIENCE' }
  }
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }

  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO nav_overrides (href, audience, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(href) DO UPDATE SET audience = excluded.audience, updated_at = excluded.updated_at`
      )
      .bind(href, audience, now)
      .run()
    return { ok: true, href, audience, updated_at: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

export async function deleteNavOverride(href) {
  if (!href || typeof href !== 'string') {
    return { ok: false, status: 400, error: 'INVALID_HREF' }
  }
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }
  try {
    await db.prepare('DELETE FROM nav_overrides WHERE href = ?1').bind(href).run()
    return { ok: true, href }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_DELETE_FAILED', detail: String(error?.message || error) }
  }
}

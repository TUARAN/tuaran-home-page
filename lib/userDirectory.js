import { getD1 } from './d1'
import { isValidUserRole } from './userRoles'

/**
 * 用户目录（site_users 表，迁移 0021）
 *
 * 数据流：
 *  - 四个登录入口（github/google 回调、邮箱 login/register）在发 session cookie 前
 *    调 recordUserLogin() upsert 一行；失败静默，绝不阻断登录。
 *  - /admin/users 用户管理页通过 /api/admin/users 读写 role 和 note。
 *  - 写操作执行点（如 /api/comments POST）用 getUserRole() 查角色，
 *    blocked 一律拒绝。
 *
 * 角色边界：
 *  - member  默认角色。
 *  - trusted 预留：未来可用于免限流、提前看草稿等。
 *  - blocked 禁止评论等 UGC 写操作；不影响浏览。
 *  - owner 不在本表维护，仍由环境变量判定（lib/ownerAuth.js）。
 *    把站长权限留在 env 是有意的：D1 被写穿不应成为提权面。
 */

export { VALID_USER_ROLES, USER_ROLE_LABELS, isValidUserRole } from './userRoles'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/**
 * 登录成功后登记/刷新用户目录。best-effort：任何失败只打日志，不影响登录。
 * @param {{ id: string, provider?: string, login?: string, name?: string, email?: string, image?: string|null }} user
 */
export async function recordUserLogin(user) {
  const id = String(user?.id || '').trim()
  if (!id) return

  const db = dbOrNull()
  if (!db) return

  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO site_users
           (id, provider, login, name, email, image, role, note, first_seen_at, last_seen_at, login_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'member', '', ?7, ?7, 1)
         ON CONFLICT(id) DO UPDATE SET
           provider = excluded.provider,
           login = excluded.login,
           name = excluded.name,
           email = CASE WHEN excluded.email != '' THEN excluded.email ELSE site_users.email END,
           image = COALESCE(excluded.image, site_users.image),
           last_seen_at = excluded.last_seen_at,
           login_count = site_users.login_count + 1`
      )
      .bind(
        id,
        String(user.provider || ''),
        String(user.login || ''),
        String(user.name || ''),
        String(user.email || ''),
        user.image ? String(user.image) : null,
        now
      )
      .run()
  } catch (error) {
    console.error('recordUserLogin failed', error)
  }
}

/**
 * 查用户角色；目录无记录或 D1 不可用时按 member 处理（开放优先，不误伤）。
 * @returns {Promise<'member' | 'trusted' | 'blocked'>}
 */
export async function getUserRole(userId) {
  const id = String(userId || '').trim()
  if (!id) return 'member'

  const db = dbOrNull()
  if (!db) return 'member'

  try {
    const row = await db.prepare('SELECT role FROM site_users WHERE id = ?').bind(id).first()
    return isValidUserRole(row?.role) ? row.role : 'member'
  } catch {
    return 'member'
  }
}

export async function listSiteUsers(db) {
  const result = await db
    .prepare('SELECT * FROM site_users ORDER BY last_seen_at DESC')
    .all()
  return (result?.results || []).map((row) => ({
    id: row.id,
    provider: row.provider,
    login: row.login,
    name: row.name,
    email: row.email,
    image: row.image,
    role: isValidUserRole(row.role) ? row.role : 'member',
    note: row.note || '',
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    loginCount: row.login_count,
  }))
}

export async function updateSiteUser(db, id, { role, note }) {
  const sets = []
  const binds = []
  if (role != null) {
    if (!isValidUserRole(role)) return { ok: false, status: 400, error: 'INVALID_ROLE' }
    sets.push('role = ?')
    binds.push(role)
  }
  if (note != null) {
    if (typeof note !== 'string' || note.length > 500) {
      return { ok: false, status: 400, error: 'INVALID_NOTE' }
    }
    sets.push('note = ?')
    binds.push(note.trim())
  }
  if (!sets.length) return { ok: false, status: 400, error: 'NO_FIELDS' }

  binds.push(id)
  const result = await db
    .prepare(`UPDATE site_users SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...binds)
    .run()
  if (!result?.meta?.changes) return { ok: false, status: 404, error: 'NOT_FOUND' }
  return { ok: true }
}

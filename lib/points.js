import { getD1 } from './d1'
import { isValidUserRole } from './userRoles'

/**
 * 燃币体系（二期）
 *
 * 正本是「只增不改的流水账本 point_ledger」，user_points 只是它的物化余额。
 * 赚取（earn）幂等靠 (user_id, reason, ref) 唯一索引；消费（spend）= 再插一条负数。
 * 解锁记一条权益 resource_unlocks，解锁一次后永久可读，不重复扣。
 * 游客也有燃币：按 guest:<gid> 自动播种 50 燃币、可花（解锁调研）。
 * 注册/绑定后一次性 100 燃币；调研文章默认每篇解锁价 5 燃币。
 */

export const POINT_RULES = {
  guestSeed: 50, // 游客首次自动获得的燃币（按 guest:<gid> 幂等发放）
  register: 100, // 注册/绑定一次性奖励
  checkin: 5, // 每日签到
  comment: 2, // 有效评论
  commentDailyCap: 20, // 评论每日燃币上限
  researchDefaultCost: 5, // 调研文章默认解锁价（未在 gated_resources 单独配置时）
  resourceDefaultCost: 10, // 资料 / 资源主题页默认解锁价
}

// 资源 key 前缀 → 默认价：调研 research:<cat>:<slug> 收 5；资料/资源 resource:<slug> 收 10
const DEFAULT_COST_BY_PREFIX = [
  { re: /^research:/, cost: () => POINT_RULES.researchDefaultCost },
  { re: /^resource:/, cost: () => POINT_RULES.resourceDefaultCost },
]

/**
 * 取资源门槛配置：优先 gated_resources 里的显式配置；
 * 调研 / 资料类 key 若未显式配置，按前缀回退到默认价，
 * 从而实现「调研默认 5、资料默认 10」，无需逐条登记。
 */
function defaultResourceFor(resourceKey) {
  for (const { re, cost } of DEFAULT_COST_BY_PREFIX) {
    if (re.test(resourceKey)) {
      return {
        resource_key: resourceKey,
        cost_points: cost(),
        min_role: 'guest',
        synthetic: true,
      }
    }
  }
  return null
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 自然日键（UTC，YYYY-MM-DD）；用于签到幂等键，避免时区漂移 */
function dayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10)
}

function startOfDay(now = Date.now()) {
  return Date.parse(`${dayKey(now)}T00:00:00Z`)
}

/** 查物化余额；无记录按 0 */
export async function getBalance(db, userId) {
  const id = String(userId || '').trim()
  if (!db || !id) return 0
  const row = await db.prepare('SELECT balance FROM user_points WHERE user_id = ?').bind(id).first()
  return Number(row?.balance || 0)
}

/** 批量查多个用户的物化余额，返回 { [userId]: balance }（无记录的不在 map 里，按 0 处理） */
export async function getBalancesFor(db, ids) {
  const list = Array.from(new Set((ids || []).map((x) => String(x || '').trim()).filter(Boolean)))
  if (!db || !list.length) return {}
  const placeholders = list.map(() => '?').join(',')
  const r = await db
    .prepare(`SELECT user_id, balance FROM user_points WHERE user_id IN (${placeholders})`)
    .bind(...list)
    .all()
  const map = {}
  for (const row of r?.results || []) map[row.user_id] = Number(row.balance || 0)
  return map
}

/**
 * 记一笔燃币变动（账本为正本，余额物化）。
 * 幂等：依赖 (user_id, reason, ref) 唯一索引，重复调用不重复计。
 * @returns {Promise<{awarded:boolean, balance:number}>}
 */
export async function award(db, userId, { delta, reason, ref = '' }) {
  const id = String(userId || '').trim()
  if (!db || !id || !Number.isFinite(delta) || !reason) {
    return { awarded: false, balance: await getBalance(db, id) }
  }
  const now = Date.now()
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(id, Math.trunc(delta), reason, ref, now)
    .run()

  if (!(Number(inserted?.meta?.changes || 0) > 0)) {
    return { awarded: false, balance: await getBalance(db, id) }
  }

  const row = await db
    .prepare(
      `INSERT INTO user_points (user_id, balance, updated_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = user_points.balance + excluded.balance,
         updated_at = excluded.updated_at
       RETURNING balance`
    )
    .bind(id, Math.trunc(delta), now)
    .first()

  return { awarded: true, balance: Number(row?.balance || 0) }
}

/** 注册奖励：每账号仅一次（ref=register） */
export async function awardRegister(db, userId) {
  return award(db, userId, { delta: POINT_RULES.register, reason: 'register', ref: 'register' })
}

/** 游客播种：每个 guest:<gid> 仅一次（ref=guest_seed），让游客自动拥有 50 燃币 */
export async function awardGuestSeed(db, guestUserId) {
  return award(db, guestUserId, { delta: POINT_RULES.guestSeed, reason: 'guest_seed', ref: 'guest_seed' })
}

/** 登录入口调用的 best-effort 注册奖励：失败只打日志，绝不阻断登录 */
export async function awardRegisterOnLogin(user) {
  try {
    const db = dbOrNull()
    const id = String(user?.id || '').trim()
    if (!db || !id) return
    await awardRegister(db, id)
  } catch (error) {
    console.error('awardRegisterOnLogin failed', error)
  }
}

/** 每日签到：ref=checkin:YYYY-MM-DD，自然日内幂等 */
export async function awardCheckin(db, userId, now = Date.now()) {
  return award(db, userId, {
    delta: POINT_RULES.checkin,
    reason: 'checkin',
    ref: `checkin:${dayKey(now)}`,
  })
}

/** 今日是否已签到 */
export async function hasCheckedInToday(db, userId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id) return false
  const row = await db
    .prepare('SELECT 1 AS x FROM point_ledger WHERE user_id = ?1 AND reason = ?2')
    .bind(id, `checkin:${dayKey(now)}`)
    .first()
  return !!row
}

/**
 * 有效评论奖励：每条评论一笔（ref=comment:<id>），并受每日燃币上限约束。
 * 被判垃圾/删除不计——调用方只在成功落库后调用。
 */
export async function awardComment(db, userId, commentId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id || commentId == null) return { awarded: false }

  const maxRewarded = Math.floor(POINT_RULES.commentDailyCap / POINT_RULES.comment)
  const cnt = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM point_ledger
        WHERE user_id = ?1 AND reason = 'comment' AND created_at >= ?2`
    )
    .bind(id, startOfDay(now))
    .first()
  if (Number(cnt?.c || 0) >= maxRewarded) {
    return { awarded: false, capped: true, balance: await getBalance(db, id) }
  }

  return award(db, id, { delta: POINT_RULES.comment, reason: 'comment', ref: `comment:${commentId}` })
}

/** 站长手动调整（reason=admin，ref 唯一保证每次都记账） */
export async function adminAdjust(db, userId, delta, note = '') {
  const id = String(userId || '').trim()
  const amount = Math.trunc(Number(delta))
  if (!db || !id) return { ok: false, status: 400, error: 'INVALID_USER' }
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false, status: 400, error: 'INVALID_DELTA' }
  }
  const ref = `admin:${Date.now()}:${Math.random().toString(36).slice(2, 8)}${note ? `:${note}`.slice(0, 80) : ''}`
  const result = await award(db, id, { delta: amount, reason: 'admin', ref })
  return { ok: true, ...result }
}

/**
 * 撤销某条流水：账本只增不改，所以「撤销」= 给同一用户补一笔反向变动
 * （ref=reverse:<id>，幂等——同一条只能撤一次）。
 */
export async function reverseLedgerEntry(db, ledgerId, now = Date.now()) {
  const id = Number(ledgerId)
  if (!db || !Number.isInteger(id)) return { ok: false, status: 400, error: 'INVALID_LEDGER_ID' }
  const row = await db.prepare('SELECT id, user_id, delta FROM point_ledger WHERE id = ?').bind(id).first()
  if (!row) return { ok: false, status: 404, error: 'LEDGER_NOT_FOUND' }
  const delta = -Math.trunc(Number(row.delta) || 0)
  if (delta === 0) return { ok: false, status: 400, error: 'NOTHING_TO_REVERSE' }
  const result = await award(db, row.user_id, { delta, reason: 'admin', ref: `reverse:${id}` })
  if (!result.awarded) {
    return { ok: false, status: 409, error: 'ALREADY_REVERSED', balance: result.balance }
  }
  return { ok: true, balance: result.balance, userId: row.user_id, reversed: -delta }
}

// ── 资源门槛 / 解锁 ───────────────────────────────────────────────

export async function getResource(db, resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!db || !key) return null
  return db
    .prepare(
      'SELECT resource_key, cost_points, min_role, created_at FROM gated_resources WHERE resource_key = ?'
    )
    .bind(key)
    .first()
}

export async function listResources(db) {
  const r = await db
    .prepare(
      'SELECT resource_key, cost_points, min_role, created_at FROM gated_resources ORDER BY created_at DESC'
    )
    .all()
  return r?.results || []
}

export async function upsertResource(db, { resourceKey, costPoints, minRole }) {
  const key = String(resourceKey || '').trim()
  if (!key || key.length > 180) return { ok: false, status: 400, error: 'INVALID_RESOURCE_KEY' }
  const cost = Math.max(0, Math.trunc(Number(costPoints) || 0))
  const role = String(minRole || 'member')
  if (!isValidUserRole(role)) return { ok: false, status: 400, error: 'INVALID_ROLE' }

  await db
    .prepare(
      `INSERT INTO gated_resources (resource_key, cost_points, min_role, created_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(resource_key) DO UPDATE SET
         cost_points = excluded.cost_points,
         min_role = excluded.min_role`
    )
    .bind(key, cost, role, Date.now())
    .run()
  return { ok: true, resourceKey: key, costPoints: cost, minRole: role }
}

export async function deleteResource(db, resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!key) return { ok: false, status: 400, error: 'INVALID_RESOURCE_KEY' }
  await db.prepare('DELETE FROM gated_resources WHERE resource_key = ?').bind(key).run()
  return { ok: true }
}

export async function isUnlocked(db, userId, resourceKey) {
  const id = String(userId || '').trim()
  const key = String(resourceKey || '').trim()
  if (!db || !id || !key) return false
  const row = await db
    .prepare('SELECT 1 AS x FROM resource_unlocks WHERE user_id = ?1 AND resource_key = ?2')
    .bind(id, key)
    .first()
  return !!row
}

/** 解锁判定所需的状态汇总（前端燃币墙据此展示） */
export async function getResourceStatus(db, userId, resourceKey) {
  const key = String(resourceKey || '').trim()
  const id = String(userId || '').trim()
  const resource = (await getResource(db, key)) || defaultResourceFor(key)
  if (!resource) {
    return { exists: false, resourceKey: key, cost: 0, minRole: 'member', unlocked: false, balance: 0 }
  }
  const unlocked = id ? await isUnlocked(db, id, key) : false
  const balance = id ? await getBalance(db, id) : 0
  return {
    exists: true,
    resourceKey: key,
    cost: Number(resource.cost_points || 0),
    minRole: resource.min_role || 'member',
    unlocked,
    balance,
  }
}

/**
 * 解锁资源：游客拒绝；已解锁直接放行；余额≥cost 则原子扣分+记权益；不足拒绝。
 * @returns {Promise<{ok:boolean, status?:number, error?:string, ...}>}
 */
export async function unlockResource(db, userId, resourceKey, now = Date.now()) {
  const id = String(userId || '').trim()
  const key = String(resourceKey || '').trim()
  if (!db || !id) return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  if (!key) return { ok: false, status: 400, error: 'INVALID_RESOURCE' }

  const resource = (await getResource(db, key)) || defaultResourceFor(key)
  if (!resource) return { ok: false, status: 404, error: 'RESOURCE_NOT_FOUND' }

  if (await isUnlocked(db, id, key)) {
    return { ok: true, alreadyUnlocked: true, balance: await getBalance(db, id) }
  }

  const cost = Math.max(0, Number(resource.cost_points || 0))
  const balance = await getBalance(db, id)
  if (balance < cost) {
    return { ok: false, status: 402, error: 'INSUFFICIENT_BALANCE', need: cost - balance, cost, balance }
  }

  // 扣分+记权益尽量原子完成（D1 batch）；靠 ledger 唯一约束与 unlocks 主键兜底幂等。
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
         VALUES (?1, ?2, 'unlock', ?3, ?4)`
      )
      .bind(id, -cost, `unlock:${key}`, now),
    db
      .prepare(
        `INSERT INTO user_points (user_id, balance, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id) DO UPDATE SET
           balance = user_points.balance - ?4,
           updated_at = excluded.updated_at`
      )
      .bind(id, -cost, now, cost),
    db
      .prepare(
        `INSERT OR IGNORE INTO resource_unlocks (user_id, resource_key, unlocked_at)
         VALUES (?1, ?2, ?3)`
      )
      .bind(id, key, now),
  ])

  return { ok: true, cost, balance: balance - cost }
}

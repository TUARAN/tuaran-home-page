import { getD1 } from './d1'
import { isValidUserRole } from './userRoles'

/**
 * 燃币体系（二期）
 *
 * 正本是「只增不改的流水账本 point_ledger」，user_points 只是它的物化余额。
 * 赚取（earn）幂等靠 (user_id, reason, ref) 唯一索引；使用燃币 = 再插一条负数。
 * 解锁记一条权益 resource_unlocks，解锁一次后永久可读，不重复扣。
 * 游客也有燃币：按 guest:<gid> 自动播种 50 燃币、可用于体验资源权益。
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

export const POINT_POLICY = {
  reference: {
    label: 'V2EX 铜币体系',
    url: 'https://www.v2ex.com/help/currency',
    note: '借鉴其「获得、使用、余额、明细、反滥用」同页说明结构；本站不做自动充值、提现或真实货币兑换。',
  },
  currency: {
    name: '燃币',
    symbol: '🔥',
    unit: '枚',
    scope: '仅限 2aran.com 站内资源权益、活动参与与友好交流留存',
    cashLike: false,
  },
  principles: [
    '账本只增不改：每次获得或使用都写 point_ledger，余额只是缓存。',
    '解锁永久有效：同一资源解锁一次后反复打开不重复使用燃币。',
    '游客给试用额度，登录账户给长期获取入口。',
    '不开放自动充值或提现；支持本站后可私聊站长补充燃币，理由充分一切好说。',
  ],
  earnMethods: [
    {
      id: 'guest_seed',
      label: '游客试用额度',
      delta: POINT_RULES.guestSeed,
      frequency: '一次性',
      cap: POINT_RULES.guestSeed,
      status: 'live',
      description: '首次访问时按匿名身份自动发放，用来体验少量调研与资料解锁。',
    },
    {
      id: 'register',
      label: '注册 / 绑定登录',
      delta: POINT_RULES.register,
      frequency: '一次性',
      cap: POINT_RULES.register,
      status: 'live',
      description: '使用 GitHub、Google 或邮箱登录后发放，作为正式账户的起步余额。',
    },
    {
      id: 'checkin',
      label: '每日签到',
      delta: POINT_RULES.checkin,
      frequency: '每天一次',
      cap: POINT_RULES.checkin,
      status: 'live',
      description: '登录用户可在余额组件签到，按 UTC 自然日幂等发放。',
    },
    {
      id: 'comment',
      label: '有效评论',
      delta: POINT_RULES.comment,
      frequency: '按条',
      cap: POINT_RULES.commentDailyCap,
      status: 'live',
      description: '评论成功落库后发放；单日奖励封顶，垃圾评论与删除评论不计。',
    },
    {
      id: 'manual_grant',
      label: '站长手动奖励',
      delta: null,
      frequency: '按需',
      cap: null,
      status: 'live',
      description: '用于活动、补偿、问题反馈、支持后补充燃币；所有调整都进入流水。',
    },
    {
      id: 'support_topup',
      label: '支持本站后补充',
      delta: null,
      frequency: '按需',
      cap: null,
      status: 'live',
      description: '支持可用于图床、视频、模型请求、存储和带宽成本；私聊站长说明账号即可调整燃币。',
    },
  ],
  spendScenarios: [
    {
      id: 'research_unlock',
      label: '调研文章权益',
      cost: POINT_RULES.researchDefaultCost,
      unit: '篇',
      status: 'live',
      resourcePattern: 'research:*',
      description: '公司、人物、行业、议题调研默认使用额度；后台可按 resource_key 覆盖。',
    },
    {
      id: 'resource_unlock',
      label: '资料 / 资源权益',
      cost: POINT_RULES.resourceDefaultCost,
      unit: '个',
      status: 'live',
      resourcePattern: 'resource:*',
      description: '专题资料、长文资源、整理页默认使用额度；后台可按 resource_key 覆盖。',
    },
    {
      id: 'content_boost',
      label: '内容 Boost / 推荐',
      cost: '20-200',
      unit: '次',
      status: 'reserved',
      resourcePattern: null,
      description: '预留给未来社区内容推荐、留言置顶或曝光增强，需先接入审核与反滥用；不是广告售卖入口。',
    },
    {
      id: 'invite_code',
      label: '邀请码 / 社群券',
      cost: 100,
      unit: '张',
      status: 'reserved',
      resourcePattern: null,
      description: '预留给邀请注册、社群入场或活动权益；上线前需要独立权益表和人工审核。',
    },
    {
      id: 'admin_debit',
      label: '站长手动修正',
      cost: null,
      unit: '次',
      status: 'live',
      resourcePattern: null,
      description: '用于撤销误发、作弊处理或运营修正；仍通过反向流水完成，不做商业化惩罚。',
    },
  ],
  safeguards: [
    '签到和评论奖励都有幂等键，重复请求不会重复发放。',
    `评论奖励每日最多 +${POINT_RULES.commentDailyCap}，避免刷屏套利。`,
    '资源解锁走 resource_unlocks 兜底，重复打开不重复使用燃币。',
    '游客身份只用于试用额度与历史权益，后台不允许手动给 guest:* 调账。',
    '燃币系统异常时内容页 fail-open，避免数据库故障挡住阅读。',
  ],
}

// 资源 key 前缀 → 默认额度：调研 research:<cat>:<slug> 使用 5；资料/资源 resource:<slug> 使用 10
const DEFAULT_COST_BY_PREFIX = [
  { re: /^research:/, cost: () => POINT_RULES.researchDefaultCost },
  { re: /^resource:/, cost: () => POINT_RULES.resourceDefaultCost },
]

/**
 * 取资源权益配置：优先 gated_resources 里的显式配置；
 * 调研 / 资料类 key 若未显式配置，按前缀回退到默认额度，
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

/** 后台手动调整只认这些登录前缀；其余（裸码 / 手滑粘进的短 id）一律拒绝，避免凭空建号 */
const ADJUSTABLE_ID_PREFIXES = ['github:', 'google:', 'email:']

/** 站长手动调整（reason=admin，ref 唯一保证每次都记账） */
export async function adminAdjust(db, userId, delta, note = '') {
  const id = String(userId || '').trim()
  const amount = Math.trunc(Number(delta))
  if (!db || !id) return { ok: false, status: 400, error: 'INVALID_USER' }
  if (id.startsWith('guest:')) return { ok: false, status: 400, error: 'GUEST_POINTS_UNSUPPORTED' }
  // 必须是已知登录账户前缀。adminAdjust 走 upsert，乱填一个不存在的 id 会凭空建出幽灵账户
  // （历史上出现过把表格里的 6 位短码当 user_id 填进来的事故）。
  if (!ADJUSTABLE_ID_PREFIXES.some((p) => id.startsWith(p))) {
    return { ok: false, status: 400, error: 'INVALID_USER_ID_FORMAT' }
  }
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

// ── 资源权益 / 解锁 ───────────────────────────────────────────────

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
 * 解锁资源：已解锁直接放行；余额≥cost 则原子扣分+记权益；不足拒绝。
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

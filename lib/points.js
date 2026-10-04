import { getD1 } from './d1'
import { getResourceCatalogItem } from './resourceCatalog'
import {
  buildCheckinWeek,
  calculateCheckinStreak,
  checkinDayKey,
  nextCheckinMilestone,
  rewardForStreak,
} from './checkinRewards'

/**
 * 燃币体系（固定总量版）
 *
 * 新正本是「只增不改的双边转账 ranbi_transfers」，point_ledger 保留用户侧兼容流水，
 * user_points 只是物化余额。每次奖励从储备池转出，每次使用进入 system:burn。
 * 解锁记一条权益 resource_unlocks，解锁一次后永久可读，不重复扣。
 * 游客首次尝试受保护资源时按 guest:<gid> 领取 5 燃币试用额度。
 * 注册/绑定后一次性 100 燃币；所有文字内容默认每篇解锁价 5 燃币。
 */

export const POINT_RULES = {
  guestSeed: 5, // 游客首次尝试资源时获得的试用额度（按 guest:<gid> 幂等发放）
  register: 100, // 注册/绑定一次性奖励
  checkin: 5, // 每日签到
  pendingCheckinLimit: 3, // 邮箱未激活前最多签到次数
  comment: 5, // 有效评论
  commentDailyCap: 50, // 评论每日燃币上限（10 条封顶）
  researchDefaultCost: 5, // 调研文章默认解锁价（未在 gated_resources 单独配置时）
  resourceDefaultCost: 5, // 资料 / 资源主题页默认解锁价（文字内容统一价格）
  toolDefaultCost: 10, // 可领取工具包 / 安装包默认价
  imageHostingUpload: 5, // 图床上传：1 张图
}

export const RANBI_TOTAL_SUPPLY = 21_000_000
export const RANBI_ACCOUNTS = {
  community: 'pool:community',
  owner: 'pool:owner',
  contributors: 'pool:contributors',
  ecosystem: 'pool:ecosystem',
  reserve: 'pool:reserve',
  burn: 'system:burn',
}

export const RANBI_POOL_ALLOCATIONS = [
  { accountId: RANBI_ACCOUNTS.community, label: '社区参与池', ratio: 30, allocation: 6_300_000 },
  { accountId: RANBI_ACCOUNTS.owner, label: '站长与长期维护池', ratio: 30, allocation: 6_300_000 },
  { accountId: RANBI_ACCOUNTS.contributors, label: '内容与资源贡献池', ratio: 20, allocation: 4_200_000 },
  { accountId: RANBI_ACCOUNTS.ecosystem, label: '生态活动池', ratio: 10, allocation: 2_100_000 },
  { accountId: RANBI_ACCOUNTS.reserve, label: '长期储备池', ratio: 10, allocation: 2_100_000 },
]

const POINT_RULE_PREFIX = 'ranbi.'
const POINT_RULE_KEYS = Object.keys(POINT_RULES)
const POINT_RULE_CACHE_TTL_MS = 45_000
const RESOURCE_CACHE_TTL_MS = 60_000

// Cloudflare Edge isolate 内的短缓存：D1 仍是唯一真相源。
// 每个 isolate 独立缓存，跨实例最多在 TTL 内使用旧运营规则。
let pointRulesCache = null
let pointRulesLoading = null
let pointRulesCacheVersion = 0
const resourceCache = new Map()
const resourceCacheVersions = new Map()

function normalizeRuleValue(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100000, Math.trunc(n)))
}

/** 读取当前生效规则。代码常量仅作首次部署、D1 不可用时的安全兜底。 */
export async function getPointRules(db) {
  if (!db) return { ...POINT_RULES }
  const now = Date.now()
  if (pointRulesCache && pointRulesCache.expiresAt > now) return { ...pointRulesCache.rules }
  if (pointRulesLoading) return pointRulesLoading

  const cacheVersion = pointRulesCacheVersion
  pointRulesLoading = (async () => {
    try {
    const keys = POINT_RULE_KEYS.map((key) => `${POINT_RULE_PREFIX}${key}`)
    const result = await db
      .prepare(`SELECT key, value FROM site_settings WHERE key IN (${keys.map(() => '?').join(',')})`)
      .bind(...keys)
      .all()
    const values = Object.fromEntries((result?.results || []).map((row) => [row.key, row.value]))
    const rules = Object.fromEntries(
      POINT_RULE_KEYS.map((key) => [
        key,
        normalizeRuleValue(values[`${POINT_RULE_PREFIX}${key}`], POINT_RULES[key]),
      ])
    )
    if (cacheVersion === pointRulesCacheVersion) {
      pointRulesCache = { rules, expiresAt: Date.now() + POINT_RULE_CACHE_TTL_MS }
    }
    return { ...rules }
    } catch {
      return { ...POINT_RULES }
    } finally {
      pointRulesLoading = null
    }
  })()
  return pointRulesLoading
}

export function invalidatePointRulesCache() {
  pointRulesCache = null
  pointRulesCacheVersion += 1
}

function invalidateResourceCache(resourceKey = '') {
  const key = String(resourceKey || '').trim()
  if (key) {
    resourceCache.delete(key)
    resourceCacheVersions.set(key, (resourceCacheVersions.get(key) || 0) + 1)
  } else {
    resourceCache.clear()
    resourceCacheVersions.clear()
  }
}

/** 站长保存整套燃币默认规则；单个资源价格仍由 gated_resources 单独覆盖。 */
export async function updatePointRules(db, input, user) {
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }
  const next = {}
  for (const key of POINT_RULE_KEYS) {
    if (input?.[key] == null || String(input[key]).trim?.() === '') {
      return { ok: false, status: 400, error: `MISSING_RULE_${key}` }
    }
    const n = Number(input[key])
    if (!Number.isFinite(n) || n < 0 || n > 100000 || !Number.isInteger(n)) {
      return { ok: false, status: 400, error: `INVALID_RULE_${key}` }
    }
    next[key] = Math.trunc(n)
  }
  if (next.comment > 0 && next.commentDailyCap < next.comment) {
    return { ok: false, status: 400, error: 'COMMENT_CAP_BELOW_REWARD' }
  }

  const now = Date.now()
  const updatedBy = String(user?.login || user?.email || user?.name || user?.id || '')
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          updated_by TEXT NOT NULL DEFAULT ''
        )`
      )
      .run()
    await db.batch(
      POINT_RULE_KEYS.map((key) =>
        db
          .prepare(
            `INSERT INTO site_settings (key, value, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(key) DO UPDATE SET
               value = excluded.value,
               updated_at = excluded.updated_at,
               updated_by = excluded.updated_by`
          )
          .bind(`${POINT_RULE_PREFIX}${key}`, String(next[key]), now, updatedBy)
      )
    )
    invalidatePointRulesCache()
    return { ok: true, rules: next, updatedAt: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'RULES_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

export function getPointPolicy(rules = POINT_RULES) {
  return {
  reference: {
    label: 'V2EX 铜币体系',
    url: 'https://www.v2ex.com/help/currency',
    note: '借鉴其「获得、使用、余额、明细、反滥用」同页说明结构；燃币不支持充值、提现或真实货币兑换。',
  },
  currency: {
    name: '燃币',
    symbol: '🔥',
    unit: '枚',
    scope: '仅限 2aran.com 站内资源权益、活动参与、礼物兑换与友好交流留存',
    cashLike: false,
  },
  principles: [
    '总量固定为 21,000,000 枚；每次获得都从公开储备池转出，任何入口都不能追加总量。',
    '账本只增不改：每次获得或使用都写双边转账记录，余额只是缓存。',
    '解锁永久有效：同一资源解锁一次后反复打开不重复使用燃币。',
    '游客首次尝试受保护资源时获得试用额度，登录账户有长期获取入口。',
    '使用的燃币进入 system:burn 黑洞账户，永久退出流通。',
    '燃币不支持充值、提现或真实货币兑换；通过点击领取、活动、游戏等免费方式获得，也可联系站长补充。',
    '捐助或赞助是自愿支持，与燃币领取和补充分开，不是获取燃币或使用资源的前提。',
  ],
  earnMethods: [
    {
      id: 'guest_seed',
      label: '游客试用额度',
      delta: rules.guestSeed,
      frequency: '一次性',
      cap: rules.guestSeed,
      status: 'live',
      description: '首次尝试受保护资源时按匿名身份发放，可体验一项文字内容；普通访问不会创建身份或发币。',
    },
    {
      id: 'register',
      label: '注册 / 绑定登录',
      delta: rules.register,
      frequency: '一次性',
      cap: rules.register,
      status: 'live',
      description: '使用 GitHub、Google 或邮箱登录后发放；邮箱未激活也先给，用来减少首次输入后的阻碍。',
    },
    {
      id: 'checkin',
      label: '每日签到',
      delta: rules.checkin,
      frequency: '每天一次',
      cap: rules.checkin,
      status: 'live',
      description: `登录用户可在签到主题页免费领取，按北京时间自然日幂等发放；连续第 3 天额外 +5、第 7 天额外 +15，每七天开启新一轮。邮箱未激活前最多先签到 ${rules.pendingCheckinLimit} 次。`,
    },
    {
      id: 'comment',
      label: '有效评论',
      delta: rules.comment,
      frequency: '按条',
      cap: rules.commentDailyCap,
      status: 'live',
      description: '评论成功落库后发放；单日奖励封顶，垃圾评论与删除评论不计。',
    },
    {
      id: 'manual_grant',
      label: '活动、游戏与站长补充',
      delta: null,
      frequency: '按需',
      cap: null,
      status: 'live',
      description: '参与已开放的活动或游戏，按对应规则由站长核实发放；余额不足也可联系站长说明账号和用途，申请免费补充。所有调整都进入流水，无需捐助或赞助。',
    },
  ],
  spendScenarios: [
    {
      id: 'research_unlock',
      label: '内容阅读权益',
      cost: rules.researchDefaultCost,
      unit: '篇',
      status: 'live',
      resourcePattern: 'research:*',
      description: '调研文章默认使用额度；后台可按 resource_key 覆盖。',
    },
    {
      id: 'resource_unlock',
      label: '资料与资源内容',
      cost: rules.resourceDefaultCost,
      unit: '个',
      status: 'live',
      resourcePattern: 'resource:*',
      description: '专题资料、长文资源、整理页与调研统一按内容阅读计价；后台可按 resource_key 覆盖。',
    },
    {
      id: 'tool_claim',
      label: '工具包 / 安装包领取',
      cost: rules.toolDefaultCost,
      unit: '项',
      status: 'live',
      resourcePattern: 'tool:* / 显式 resource:*',
      description: '仅在点击领取文件时使用燃币；已领取后可重复下载。',
    },
    {
      id: 'image_hosting_upload',
      label: '图床上传',
      cost: rules.imageHostingUpload,
      unit: '张',
      status: 'live',
      resourcePattern: null,
      description: '登录用户上传图片到站内 R2 图床，每张图片按当前规则消耗燃币。',
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
      id: 'reward_redeem',
      label: '签到礼物铺',
      cost: '按礼物',
      unit: '件',
      status: 'live',
      resourcePattern: null,
      description: '使用燃币兑换站长上架的数字权益或实物礼物；数量、每人限额和履约状态以签到页为准。',
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
    '固定总量、各储备池、当前流通和累计销毁实时公开，系统账户合计必须等于 21,000,000。',
    '签到和评论奖励都有幂等键，重复请求不会重复发放。',
    `评论奖励每日最多 +${rules.commentDailyCap}，避免刷屏套利。`,
    '资源解锁走 resource_unlocks 兜底，重复打开不重复使用燃币。',
    '游客试用只在首次尝试资源时触发，后台不允许手动给 guest:* 调账。',
    '燃币系统异常时内容页 fail-open，避免数据库故障挡住阅读。',
  ],
  }
}

export const POINT_POLICY = getPointPolicy()

// 资源 key 前缀 → 当前全站默认额度；具体数值由 D1 的 ranbi.* 规则决定。
const DEFAULT_COST_BY_PREFIX = [
  { re: /^research:/, key: 'researchDefaultCost' },
  { re: /^resource:/, key: 'resourceDefaultCost' },
  { re: /^tool:/, key: 'toolDefaultCost' },
]

/**
 * 取资源权益配置：优先 gated_resources 里的显式配置；
 * 调研 / 资料类 key 若未显式配置，按前缀回退到默认额度，
 * 从而让文字内容和工具包分别回退到各自的全站默认价，无需逐条登记。
 */
function defaultResourceFor(resourceKey, rules = POINT_RULES) {
  const catalog = getResourceCatalogItem(resourceKey)
  if (catalog?.kind === 'tool') {
    return {
      resource_key: resourceKey,
      cost_points: rules.toolDefaultCost,
      min_role: 'guest',
      synthetic: true,
    }
  }
  for (const { re, key } of DEFAULT_COST_BY_PREFIX) {
    if (re.test(resourceKey)) {
      return {
        resource_key: resourceKey,
        cost_points: rules[key],
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

/** 签到按北京时间自然日计算，页面与账本使用同一个 YYYY-MM-DD 键。 */
function dayKey(now = Date.now()) {
  return checkinDayKey(now)
}

function startOfDay(now = Date.now()) {
  return Date.parse(`${dayKey(now)}T00:00:00+08:00`)
}

/** 查物化余额；无记录按 0 */
export async function getBalance(db, userId) {
  const id = String(userId || '').trim()
  if (!db || !id) return 0
  const row = await db.prepare('SELECT balance FROM user_points WHERE user_id = ?').bind(id).first()
  return Number(row?.balance || 0)
}

/** 用账本重算物化余额；用于修复历史错位或补偿部分失败的写入。 */
export async function repairBalanceFromLedger(db, userId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id) return 0
  const row = await db
    .prepare('SELECT COALESCE(SUM(delta), 0) AS balance FROM point_ledger WHERE user_id = ?1')
    .bind(id)
    .first()
  const balance = Number(row?.balance || 0)
  await db
    .prepare(
      `INSERT INTO user_points (user_id, balance, updated_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         updated_at = excluded.updated_at`
    )
    .bind(id, balance, now)
    .run()
  return balance
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

function ranbiTransferError(error) {
  const detail = String(error?.message || error || '')
  if (detail.includes('RANBI_INSUFFICIENT_BALANCE')) return { status: 402, error: 'INSUFFICIENT_BALANCE' }
  if (detail.includes('RANBI_POOL_EXHAUSTED')) return { status: 409, error: 'RANBI_POOL_EXHAUSTED' }
  if (detail.includes('RANBI_BURN_LOCKED')) return { status: 409, error: 'RANBI_BURN_LOCKED' }
  if (detail.includes('no such table: ranbi_transfers')) return { status: 503, error: 'RANBI_SUPPLY_NOT_READY' }
  return { status: 500, error: 'RANBI_TRANSFER_FAILED', detail }
}

/** 固定总量下的唯一记账入口。余额由 migration 0100 的触发器原子更新。 */
export async function transferRanbi(db, { fromAccount, toAccount, amount, reason, ref, now = Date.now() }) {
  const from = String(fromAccount || '').trim()
  const to = String(toAccount || '').trim()
  const value = Math.max(0, Math.trunc(Number(amount) || 0))
  const transferReason = String(reason || '').trim()
  const transferRef = String(ref || '').trim()
  if (!db || !from || !to || from === to || !value || !transferReason || !transferRef) {
    return { ok: false, status: 400, error: 'INVALID_RANBI_TRANSFER' }
  }
  try {
    const inserted = await db
      .prepare(
        `INSERT OR IGNORE INTO ranbi_transfers
          (from_account, to_account, amount, reason, ref, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(from, to, value, transferReason, transferRef, now)
      .run()
    return {
      ok: true,
      transferred: Number(inserted?.meta?.changes || 0) > 0,
      amount: value,
      balance: to.startsWith('pool:') || to.startsWith('system:') ? undefined : await getBalance(db, to),
    }
  } catch (error) {
    return { ok: false, ...ranbiTransferError(error) }
  }
}

/** 公开供应量：系统池 + 用户余额始终应严格等于 21,000,000。 */
export async function getRanbiSupplySummary(db) {
  if (!db) return null
  try {
    const [supply, poolsResult, users] = await Promise.all([
      db.prepare('SELECT total_supply, public_version, launched_at, upgraded_at FROM ranbi_supply WHERE id = 1').first(),
      db.prepare(
        `SELECT account_id, label, account_type, allocation, balance, spendable, sort_order, updated_at
           FROM ranbi_system_accounts ORDER BY sort_order ASC`
      ).all(),
      db.prepare('SELECT COUNT(*) AS identities, COALESCE(SUM(balance), 0) AS circulating, COALESCE(MAX(updated_at), 0) AS updated_at FROM user_points').first(),
    ])
    if (!supply) return null
    const accounts = (poolsResult?.results || []).map((row) => ({
      accountId: row.account_id,
      label: row.label,
      type: row.account_type,
      allocation: Number(row.allocation || 0),
      balance: Number(row.balance || 0),
      spendable: Boolean(row.spendable),
      updatedAt: Number(row.updated_at || 0),
    }))
    const burn = accounts.find((row) => row.accountId === RANBI_ACCOUNTS.burn)?.balance || 0
    const reserveBalance = accounts
      .filter((row) => row.type === 'pool')
      .reduce((sum, row) => sum + row.balance, 0)
    const circulating = Number(users?.circulating || 0)
    const accounted = reserveBalance + burn + circulating
    return {
      totalSupply: Number(supply.total_supply || RANBI_TOTAL_SUPPLY),
      publicVersion: supply.public_version,
      launchedAt: Number(supply.launched_at || 0),
      upgradedAt: Number(supply.upgraded_at || 0),
      snapshotAt: Math.max(
        Number(supply.upgraded_at || 0),
        Number(users?.updated_at || 0),
        ...accounts.map((row) => row.updatedAt),
      ),
      identities: Number(users?.identities || 0),
      circulating,
      burned: burn,
      reserveBalance,
      released: circulating + burn,
      accounted,
      consistent: accounted === Number(supply.total_supply || RANBI_TOTAL_SUPPLY),
      accounts,
    }
  } catch {
    return null
  }
}

/**
 * 记一笔燃币变动（账本为正本，余额物化）。
 * 幂等：依赖 (user_id, reason, ref) 唯一索引，重复调用不重复计。
 * @returns {Promise<{awarded:boolean, balance:number}>}
 */
export async function award(db, userId, { delta, reason, ref = '', sourceAccount = RANBI_ACCOUNTS.community, destinationAccount = RANBI_ACCOUNTS.burn }) {
  const id = String(userId || '').trim()
  if (!db || !id || !Number.isFinite(delta) || !reason) {
    return { awarded: false, balance: await getBalance(db, id) }
  }
  const value = Math.trunc(delta)
  if (value === 0) return { awarded: false, balance: await getBalance(db, id) }
  const result = await transferRanbi(db, value > 0
    ? { fromAccount: sourceAccount, toAccount: id, amount: value, reason, ref }
    : { fromAccount: id, toAccount: destinationAccount, amount: -value, reason, ref })
  return {
    awarded: Boolean(result.ok && result.transferred),
    balance: await getBalance(db, id),
    ...(result.ok ? {} : { error: result.error, status: result.status }),
  }
}

/** 注册奖励：每账号仅一次（ref=register） */
export async function awardRegister(db, userId) {
  const rules = await getPointRules(db)
  return award(db, userId, { delta: rules.register, reason: 'register', ref: 'register' })
}

/** 游客试用：每个 guest:<gid> 仅一次，只在首次尝试资源时发放。 */
export async function awardGuestSeed(db, guestUserId) {
  const rules = await getPointRules(db)
  return award(db, guestUserId, { delta: rules.guestSeed, reason: 'guest_seed', ref: 'guest_seed' })
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
  const rules = await getPointRules(db)
  const base = await award(db, userId, {
    delta: rules.checkin,
    reason: 'checkin',
    ref: `checkin:${dayKey(now)}`,
  })
  const status = await getCheckinStatus(db, userId, now)
  if (!base.awarded) {
    return { ...base, gained: 0, bonus: 0, ...status }
  }

  const milestone = rewardForStreak(status.streak)
  let bonus = 0
  let balance = base.balance
  if (milestone.bonus > 0) {
    const bonusResult = await award(db, userId, {
      delta: milestone.bonus,
      reason: 'checkin_bonus',
      ref: `checkin_bonus:${dayKey(now)}:${milestone.cycleDay}`,
    })
    if (bonusResult.awarded) bonus = milestone.bonus
    balance = bonusResult.balance
  }
  return { ...base, balance, gained: rules.checkin + bonus, bonus, ...status }
}

/** 今日是否已签到 */
export async function hasCheckedInToday(db, userId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id) return false
  const row = await db
    .prepare('SELECT 1 AS x FROM point_ledger WHERE user_id = ?1 AND reason = ?2 AND ref = ?3')
    .bind(id, 'checkin', `checkin:${dayKey(now)}`)
    .first()
  return !!row
}

export async function countCheckins(db, userId) {
  const id = String(userId || '').trim()
  if (!db || !id) return 0
  const row = await db
    .prepare('SELECT COUNT(*) AS count FROM point_ledger WHERE user_id = ?1 AND reason = ?2')
    .bind(id, 'checkin')
    .first()
  return Number(row?.count || 0)
}

/** 连续签到、近七日和下个奖励节点，供签到主题页与签到接口共用。 */
export async function getCheckinStatus(db, userId, now = Date.now()) {
  const id = String(userId || '').trim()
  const today = dayKey(now)
  if (!db || !id) {
    return {
      today,
      streak: 0,
      week: buildCheckinWeek([], today),
      nextMilestone: nextCheckinMilestone(0),
    }
  }
  const result = await db
    .prepare(
      `SELECT day_key, made_up FROM (
         SELECT substr(ref, 9) AS day_key, created_at, 0 AS made_up FROM point_ledger
          WHERE user_id = ?1 AND reason = 'checkin' AND ref LIKE 'checkin:%'
         UNION ALL
         SELECT checkin_date AS day_key, created_at, 1 AS made_up FROM checkin_makeups WHERE user_id = ?1
       ) ORDER BY created_at DESC LIMIT 90`
    )
    .bind(id)
    .all()
  const dayKeys = (result?.results || []).map((row) => String(row.day_key || ''))
  const makeupDays = new Set((result?.results || []).filter((row) => row.made_up).map((row) => String(row.day_key || '')))
  const streak = calculateCheckinStreak(dayKeys, today)
  return {
    today,
    streak,
    week: buildCheckinWeek(dayKeys, today).map((item) => ({ ...item, madeUp: makeupDays.has(item.day) })),
    nextMilestone: nextCheckinMilestone(streak),
  }
}

/**
 * 有效评论奖励：每条评论一笔（ref=comment:<id>），并受每日燃币上限约束。
 * 被判垃圾/删除不计——调用方只在成功落库后调用。
 */
export async function awardComment(db, userId, commentId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id || commentId == null) return { awarded: false }

  const rules = await getPointRules(db)
  const maxRewarded = rules.comment > 0 ? Math.floor(rules.commentDailyCap / rules.comment) : 0
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

  if (rules.comment <= 0 || maxRewarded <= 0) {
    return { awarded: false, capped: true, balance: await getBalance(db, id) }
  }
  return award(db, id, { delta: rules.comment, reason: 'comment', ref: `comment:${commentId}` })
}

/**
 * 一次性服务消费：只写负流水并更新余额，不写 resource_unlocks。
 * 用于图床这类“每次使用都扣一次”的工具。
 */
export async function spendPoints(db, userId, { cost, reason, ref, now = Date.now() }) {
  const id = String(userId || '').trim()
  const amount = Math.max(0, Math.trunc(Number(cost) || 0))
  const spendReason = String(reason || '').trim()
  const spendRef = String(ref || '').trim()
  if (!db || !id) return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  if (!amount || !spendReason || !spendRef) {
    return { ok: false, status: 400, error: 'INVALID_SPEND' }
  }

  const balance = await getBalance(db, id)
  if (balance < amount) {
    return {
      ok: false,
      status: 402,
      error: 'INSUFFICIENT_BALANCE',
      need: amount - balance,
      cost: amount,
      balance,
    }
  }

  const result = await transferRanbi(db, {
    fromAccount: id,
    toAccount: RANBI_ACCOUNTS.burn,
    amount,
    reason: spendReason,
    ref: spendRef,
    now,
  })
  if (!result.ok) return { ...result, need: Math.max(0, amount - balance), cost: amount, balance }
  return {
    ok: true,
    alreadySpent: !result.transferred,
    cost: amount,
    balance: await getBalance(db, id),
  }
}

/** 后台手动调整只认这些登录前缀；其余（裸码 / 手滑粘进的短 id）一律拒绝，避免凭空建号 */
const ADJUSTABLE_ID_PREFIXES = ['github:', 'google:', 'email:']

/** 站长手动调整（reason=admin，ref 唯一保证每次都记账） */
export async function adminAdjust(db, userId, delta, note = '', sourceAccount = RANBI_ACCOUNTS.community) {
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
  const allowedSources = new Set([
    RANBI_ACCOUNTS.community,
    RANBI_ACCOUNTS.owner,
    RANBI_ACCOUNTS.contributors,
    RANBI_ACCOUNTS.ecosystem,
    RANBI_ACCOUNTS.reserve,
  ])
  const source = String(sourceAccount || RANBI_ACCOUNTS.community)
  if (amount > 0 && !allowedSources.has(source)) {
    return { ok: false, status: 400, error: 'INVALID_SOURCE_POOL' }
  }
  const ref = `admin:${Date.now()}:${Math.random().toString(36).slice(2, 8)}${note ? `:${note}`.slice(0, 80) : ''}`
  const result = await award(db, id, { delta: amount, reason: 'admin', ref, sourceAccount: source })
  if (result.error) return { ok: false, status: result.status || 400, error: result.error, balance: result.balance }
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
  const originalDelta = Math.trunc(Number(row.delta) || 0)
  if (originalDelta === 0) return { ok: false, status: 400, error: 'NOTHING_TO_REVERSE' }
  const result = await transferRanbi(db, originalDelta > 0
    ? {
        fromAccount: row.user_id,
        toAccount: RANBI_ACCOUNTS.community,
        amount: originalDelta,
        reason: 'admin',
        ref: `reverse:${id}`,
        now,
      }
    : {
        fromAccount: RANBI_ACCOUNTS.reserve,
        toAccount: row.user_id,
        amount: -originalDelta,
        reason: 'admin',
        ref: `reverse:${id}`,
        now,
      })
  if (!result.ok) return { ok: false, status: result.status || 409, error: result.error, balance: await getBalance(db, row.user_id) }
  if (!result.transferred) {
    return { ok: false, status: 409, error: 'ALREADY_REVERSED', balance: await getBalance(db, row.user_id) }
  }
  return { ok: true, balance: await getBalance(db, row.user_id), userId: row.user_id, reversed: originalDelta }
}

// ── 资源权益 / 解锁 ───────────────────────────────────────────────

export async function getResource(db, resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!db || !key) return null
  const cached = resourceCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value ? { ...cached.value } : null
  const cacheVersion = resourceCacheVersions.get(key) || 0
  const value = await db
    .prepare(
      'SELECT resource_key, cost_points, min_role, created_at FROM gated_resources WHERE resource_key = ?'
    )
    .bind(key)
    .first()
  if (cacheVersion === (resourceCacheVersions.get(key) || 0)) {
    resourceCache.set(key, { value: value || null, expiresAt: Date.now() + RESOURCE_CACHE_TTL_MS })
  }
  return value || null
}

export async function listResources(db) {
  const r = await db
    .prepare(
      'SELECT resource_key, cost_points, min_role, created_at FROM gated_resources ORDER BY created_at DESC'
    )
    .all()
  return r?.results || []
}

export async function getUnlockCountsForUsers(db, userIds) {
  const ids = Array.from(new Set((userIds || []).map((id) => String(id || '').trim()).filter(Boolean)))
  if (!db || !ids.length) return {}
  const placeholders = ids.map(() => '?').join(',')
  const result = await db
    .prepare(
      `SELECT user_id, COUNT(*) AS unlock_count, MAX(unlocked_at) AS last_unlock_at
         FROM resource_unlocks
        WHERE user_id IN (${placeholders})
        GROUP BY user_id`
    )
    .bind(...ids)
    .all()
  const map = {}
  for (const row of result?.results || []) {
    map[row.user_id] = {
      unlockCount: Number(row.unlock_count || 0),
      lastUnlockAt: row.last_unlock_at || null,
    }
  }
  return map
}

async function missingUnlockLedgerRollup(db, userId, rules) {
  const id = String(userId || '').trim()
  if (!db || !id) return { count: 0, amount: 0 }
  const row = await db
    .prepare(
      `WITH unlock_costs AS (
         SELECT
           ru.resource_key,
           CASE
             WHEN ru.cost_points IS NOT NULL THEN ru.cost_points
             WHEN gr.cost_points IS NOT NULL THEN gr.cost_points
             WHEN ru.resource_key LIKE 'research:%' THEN ?2
             WHEN ru.resource_key LIKE 'resource:%' THEN ?3
             ELSE 0
           END AS cost_points
         FROM resource_unlocks ru
         LEFT JOIN gated_resources gr ON gr.resource_key = ru.resource_key
         WHERE ru.user_id = ?1
       )
       SELECT
         COUNT(*) AS count,
         COALESCE(SUM(cost_points), 0) AS amount
       FROM unlock_costs uc
       WHERE uc.cost_points > 0
         AND NOT EXISTS (
           SELECT 1 FROM point_ledger pl
            WHERE pl.user_id = ?1
              AND pl.reason = 'unlock'
              AND pl.ref = 'unlock:' || uc.resource_key
         )`
    )
    .bind(id, rules.researchDefaultCost, rules.resourceDefaultCost)
    .first()
  return {
    count: Number(row?.count || 0),
    amount: Number(row?.amount || 0),
  }
}

/**
 * 给已有 resource_unlocks 补齐缺失的消费转账。每一笔都进入黑洞，不能绕过固定总量。
 */
export async function reconcileUnlockLedgerForUser(db, userId, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id) return { ok: false, status: 400, error: 'INVALID_USER' }
  if (id.startsWith('guest:')) return { ok: false, status: 400, error: 'GUEST_POINTS_UNSUPPORTED' }

  const rules = await getPointRules(db)
  const before = await missingUnlockLedgerRollup(db, id, rules)
  if (before.count > 0) {
    const missingResult = await db
      .prepare(
        `WITH unlock_costs AS (
           SELECT
             ru.resource_key,
             ru.unlocked_at,
             CASE
               WHEN ru.cost_points IS NOT NULL THEN ru.cost_points
               WHEN gr.cost_points IS NOT NULL THEN gr.cost_points
               WHEN ru.resource_key LIKE 'research:%' THEN ?2
               WHEN ru.resource_key LIKE 'resource:%' THEN ?3
               ELSE 0
             END AS cost_points
           FROM resource_unlocks ru
           LEFT JOIN gated_resources gr ON gr.resource_key = ru.resource_key
           WHERE ru.user_id = ?1
         )
         SELECT resource_key, unlocked_at, cost_points
           FROM unlock_costs uc
         WHERE uc.cost_points > 0
           AND NOT EXISTS (
             SELECT 1 FROM point_ledger pl
              WHERE pl.user_id = ?1
                AND pl.reason = 'unlock'
                AND pl.ref = 'unlock:' || uc.resource_key
           )
         ORDER BY unlocked_at ASC`
      )
      .bind(id, rules.researchDefaultCost, rules.resourceDefaultCost)
      .all()
    for (const row of missingResult?.results || []) {
      const result = await transferRanbi(db, {
        fromAccount: id,
        toAccount: RANBI_ACCOUNTS.burn,
        amount: Number(row.cost_points || 0),
        reason: 'unlock',
        ref: `unlock:${row.resource_key}`,
        now: Number(row.unlocked_at || now),
      })
      if (!result.ok) break
    }
  }

  const balance = await getBalance(db, id)
  const after = await missingUnlockLedgerRollup(db, id, rules)
  return {
    ok: true,
    inserted: Math.max(0, before.count - after.count),
    charged: Math.max(0, before.amount - after.amount),
    missing: after.count,
    balance,
  }
}

/**
 * 批量补齐所有登录账号缺失的解锁扣款流水。
 * 管理后台读取前调用一次即可；函数幂等，已补齐的账号不会重复扣。
 */
export async function reconcileUnlockLedgerForAccounts(db, { limit = 500 } = {}, now = Date.now()) {
  const max = Math.max(1, Math.min(1000, Math.trunc(Number(limit) || 500)))
  if (!db) return { ok: false, status: 400, error: 'DB_UNAVAILABLE' }

  const rules = await getPointRules(db)
  const candidates = await db
    .prepare(
      `WITH unlock_costs AS (
         SELECT
           ru.user_id,
           ru.resource_key,
           CASE
             WHEN ru.cost_points IS NOT NULL THEN ru.cost_points
             WHEN gr.cost_points IS NOT NULL THEN gr.cost_points
             WHEN ru.resource_key LIKE 'research:%' THEN ?1
             WHEN ru.resource_key LIKE 'resource:%' THEN ?2
             ELSE 0
           END AS cost_points
         FROM resource_unlocks ru
         LEFT JOIN gated_resources gr ON gr.resource_key = ru.resource_key
         WHERE ru.user_id NOT LIKE 'guest:%'
       )
       SELECT
         uc.user_id,
         COUNT(*) AS missing_count,
         COALESCE(SUM(uc.cost_points), 0) AS missing_amount
       FROM unlock_costs uc
       WHERE uc.cost_points > 0
         AND NOT EXISTS (
           SELECT 1 FROM point_ledger pl
            WHERE pl.user_id = uc.user_id
              AND pl.reason = 'unlock'
              AND pl.ref = 'unlock:' || uc.resource_key
         )
       GROUP BY uc.user_id
       ORDER BY missing_amount DESC, missing_count DESC, uc.user_id ASC
       LIMIT ?3`
    )
    .bind(rules.researchDefaultCost, rules.resourceDefaultCost, max)
    .all()

  const rows = candidates?.results || []
  let inserted = 0
  let charged = 0
  let missing = 0
  const accounts = []

  for (const row of rows) {
    const result = await reconcileUnlockLedgerForUser(db, row.user_id, now)
    if (!result.ok) {
      missing += Number(row.missing_count || 0)
      continue
    }
    inserted += Number(result.inserted || 0)
    charged += Number(result.charged || 0)
    missing += Number(result.missing || 0)
    accounts.push({
      userId: row.user_id,
      inserted: Number(result.inserted || 0),
      charged: Number(result.charged || 0),
      balance: Number(result.balance || 0),
    })
  }

  return {
    ok: true,
    scannedAccounts: rows.length,
    fixedAccounts: accounts.filter((row) => row.inserted > 0).length,
    inserted,
    charged,
    missing,
    limited: rows.length >= max,
    accounts,
  }
}

/** 登录绑定游客时，把游客剩余余额转入正式账号；历史消费继续留在原游客流水。 */
export async function migrateGuestUnlockLedger(db, guestUserId, userId, now = Date.now()) {
  const guestId = String(guestUserId || '').trim()
  const id = String(userId || '').trim()
  if (!db || !guestId.startsWith('guest:') || !id || id.startsWith('guest:')) {
    return { ok: false, status: 400, error: 'INVALID_USER' }
  }

  const guestBalance = await getBalance(db, guestId)
  if (guestBalance <= 0) return { ok: true, balance: await getBalance(db, id), transferred: 0 }
  const result = await transferRanbi(db, {
    fromAccount: guestId,
    toAccount: id,
    amount: guestBalance,
    reason: 'guest_merge',
    ref: `guest_merge:${guestId}`,
    now,
  })
  return {
    ok: result.ok,
    status: result.status,
    error: result.error,
    balance: await getBalance(db, id),
    transferred: result.transferred ? guestBalance : 0,
  }
}

export async function upsertResource(db, { resourceKey, costPoints }) {
  const key = String(resourceKey || '').trim()
  if (!key || key.length > 180) return { ok: false, status: 400, error: 'INVALID_RESOURCE_KEY' }
  const cost = Number(costPoints)
  if (!Number.isInteger(cost) || cost < 0 || cost > 100000) {
    return { ok: false, status: 400, error: 'INVALID_RESOURCE_COST' }
  }

  await db
    .prepare(
      `INSERT INTO gated_resources (resource_key, cost_points, min_role, created_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(resource_key) DO UPDATE SET
         cost_points = excluded.cost_points`
    )
    .bind(key, cost, 'guest', Date.now())
    .run()
  invalidateResourceCache(key)
  return { ok: true, resourceKey: key, costPoints: cost }
}

export async function deleteResource(db, resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!key) return { ok: false, status: 400, error: 'INVALID_RESOURCE_KEY' }
  await db.prepare('DELETE FROM gated_resources WHERE resource_key = ?').bind(key).run()
  invalidateResourceCache(key)
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
  const rules = await getPointRules(db)
  const resource = (await getResource(db, key)) || defaultResourceFor(key, rules)
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

  const rules = await getPointRules(db)
  const resource = (await getResource(db, key)) || defaultResourceFor(key, rules)
  if (!resource) return { ok: false, status: 404, error: 'RESOURCE_NOT_FOUND' }

  if (await isUnlocked(db, id, key)) {
    return { ok: true, alreadyUnlocked: true, balance: await getBalance(db, id) }
  }

  const cost = Math.max(0, Math.trunc(Number(resource.cost_points || 0)))
  const balance = await getBalance(db, id)
  if (balance < cost) {
    return { ok: false, status: 402, error: 'INSUFFICIENT_BALANCE', need: cost - balance, cost, balance }
  }

  if (cost === 0) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO resource_unlocks (user_id, resource_key, unlocked_at, cost_points)
         VALUES (?1, ?2, ?3, ?4)`
      )
      .bind(id, key, now, cost)
      .run()
    return { ok: true, cost, balance }
  }

  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT OR IGNORE INTO ranbi_transfers
            (from_account, to_account, amount, reason, ref, created_at)
           VALUES (?1, ?2, ?3, 'unlock', ?4, ?5)`
        )
        .bind(id, RANBI_ACCOUNTS.burn, cost, `unlock:${key}`, now),
      db
        .prepare(
          `INSERT OR IGNORE INTO resource_unlocks (user_id, resource_key, unlocked_at, cost_points)
           VALUES (?1, ?2, ?3, ?4)`
        )
        .bind(id, key, now, cost),
    ])
    const transferred = Number(results?.[0]?.meta?.changes || 0) > 0
    return {
      ok: true,
      cost,
      alreadyUnlocked: !transferred,
      balance: await getBalance(db, id),
    }
  } catch (error) {
    const mapped = ranbiTransferError(error)
    return {
      ok: false,
      ...mapped,
      need: mapped.error === 'INSUFFICIENT_BALANCE' ? Math.max(0, cost - balance) : undefined,
      cost,
      balance,
    }
  }
}

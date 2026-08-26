export const X_API_PRICING_SOURCE_URL = 'https://docs.x.com/x-api/getting-started/pricing'
export const X_API_PRICING_CHECKED_AT = '2026-08-26'

// 使用微美元保存，避免 $0.015 这类价格在累计时产生浮点误差。
export const X_API_POST_CREATE_COST_MICRO_USD = 15_000
export const X_API_POST_CREATE_WITH_URL_COST_MICRO_USD = 200_000

export function xPostContainsUrl(text) {
  return /(?:https?:\/\/|www\.)\S+/iu.test(String(text || ''))
}

export function xPostCreatePricing(text) {
  const withUrl = xPostContainsUrl(text)
  return {
    key: withUrl ? 'post_create_with_url' : 'post_create',
    label: withUrl ? '发帖（含 URL）' : '发帖（不含 URL）',
    microUsd: withUrl ? X_API_POST_CREATE_WITH_URL_COST_MICRO_USD : X_API_POST_CREATE_COST_MICRO_USD,
  }
}

export function projectedXPostCost({ postsPerDay = 6, days = 30, unitCostMicroUsd = X_API_POST_CREATE_COST_MICRO_USD } = {}) {
  return Math.max(0, Math.trunc(Number(postsPerDay) || 0))
    * Math.max(0, Math.trunc(Number(days) || 0))
    * Math.max(0, Math.trunc(Number(unitCostMicroUsd) || 0))
}

export async function recordXApiPostCost(db, {
  postId,
  slot,
  contentType,
  text,
  createdAt = Date.now(),
} = {}) {
  const normalizedPostId = String(postId || '').trim()
  if (!db || !normalizedPostId) return { recorded: false }
  const pricing = xPostCreatePricing(text)
  const result = await db.prepare(
    `INSERT OR IGNORE INTO x_api_cost_events
       (post_id, automation_id, slot, content_type, pricing_key, unit_cost_micro_usd, created_at)
     VALUES (?1, 'x-daily-greeting', ?2, ?3, ?4, ?5, ?6)`,
  ).bind(
    normalizedPostId,
    String(slot || ''),
    String(contentType || ''),
    pricing.key,
    pricing.microUsd,
    Number(createdAt) || Date.now(),
  ).run()
  return { recorded: Number(result?.meta?.changes) > 0, pricing }
}

function shanghaiPeriodBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (type) => parts.find((part) => part.type === type)?.value || ''
  const year = Number(value('year'))
  const month = Number(value('month'))
  const day = Number(value('day'))
  const offset = '+08:00'
  const pad = (number) => String(number).padStart(2, '0')
  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return {
    dayStart: Date.parse(`${year}-${pad(month)}-${pad(day)}T00:00:00${offset}`),
    dayEnd: Date.parse(`${year}-${pad(month)}-${pad(day)}T00:00:00${offset}`) + 86_400_000,
    monthStart: Date.parse(`${year}-${pad(month)}-01T00:00:00${offset}`),
    monthEnd: Date.parse(`${nextMonthYear}-${pad(nextMonth)}-01T00:00:00${offset}`),
  }
}

export async function getXApiCostSummary(db, { now = new Date(), postsPerDay = 6 } = {}) {
  const bounds = shanghaiPeriodBounds(now)
  const [today, month, first] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS posts, COALESCE(SUM(unit_cost_micro_usd), 0) AS cost
       FROM x_api_cost_events WHERE automation_id = 'x-daily-greeting' AND created_at >= ?1 AND created_at < ?2`,
    ).bind(bounds.dayStart, bounds.dayEnd).first(),
    db.prepare(
      `SELECT COUNT(*) AS posts, COALESCE(SUM(unit_cost_micro_usd), 0) AS cost
       FROM x_api_cost_events WHERE automation_id = 'x-daily-greeting' AND created_at >= ?1 AND created_at < ?2`,
    ).bind(bounds.monthStart, bounds.monthEnd).first(),
    db.prepare(
      `SELECT MIN(created_at) AS at FROM x_api_cost_events WHERE automation_id = 'x-daily-greeting'`,
    ).first(),
  ])
  return {
    available: true,
    currency: 'USD',
    todayPosts: Number(today?.posts) || 0,
    todayMicroUsd: Number(today?.cost) || 0,
    monthPosts: Number(month?.posts) || 0,
    monthMicroUsd: Number(month?.cost) || 0,
    projected30DayPosts: postsPerDay * 30,
    projected30DayMicroUsd: projectedXPostCost({ postsPerDay, days: 30 }),
    trackedSince: Number(first?.at) || null,
  }
}

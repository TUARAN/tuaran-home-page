import { GREETING_PERIODS, shanghaiDateKey } from './dailyGreeting.js'
import { CULTURE_STORY_SLOTS } from './dailyCultureStory.js'
import { X_COMMUNITY_SLOTS } from './xCommunityPosts.js'
import { X_CRYPTO_POST_SLOTS } from './xCryptoPosts.js'
import { X_US_AUDIENCE_SLOTS } from './xUsAudiencePosts.js'
import { X_CONTROVERSY_SLOTS } from './xControversyPosts.js'
import { X_JOKE_SLOTS } from './xJokePosts.js'

export const X_POST_JITTER_MINUTES = 90
export const X_TOPIC_POST_JITTER_MINUTES = 5
export const X_STANDARD_POST_JITTER_MINUTES = 20
export const X_POST_RETRY_MINUTES = 45

function slotsFor(query, definitions, category = query) {
  return Object.entries(definitions).map(([id, slot]) => ({
    id,
    query,
    category,
    label: slot.label,
    time: slot.time || String(slot.hour).padStart(2, '0') + ':00',
  }))
}

export const X_ACTIVE_CONTROVERSY_SLOT_IDS = Object.freeze(
  Object.keys(X_CONTROVERSY_SLOTS).filter((id) => Number(id.slice(-2)) % 2 === 0),
)
export const X_ACTIVE_GREETING_SLOT_IDS = Object.freeze(['morning'])
export const X_ACTIVE_CULTURE_SLOT_IDS = Object.freeze(['culture_afternoon'])
export const X_ACTIVE_COMMUNITY_SLOT_IDS = Object.freeze(['community_friends'])
export const X_ACTIVE_CRYPTO_SLOT_IDS = Object.freeze(['crypto_market'])
export const X_ACTIVE_US_SLOT_IDS = Object.freeze(['us_morning'])
export const X_ACTIVE_JOKE_SLOT_IDS = Object.freeze(Object.keys(X_JOKE_SLOTS))

export const X_ACTIVE_POST_SLOT_IDS = Object.freeze([
  ...X_ACTIVE_CONTROVERSY_SLOT_IDS,
  ...X_ACTIVE_GREETING_SLOT_IDS,
  ...X_ACTIVE_CULTURE_SLOT_IDS,
  ...X_ACTIVE_COMMUNITY_SLOT_IDS,
  ...X_ACTIVE_CRYPTO_SLOT_IDS,
  ...X_ACTIVE_US_SLOT_IDS,
  ...X_ACTIVE_JOKE_SLOT_IDS,
])

export const X_POST_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'controversy', label: '热点话题', dailyPosts: 12, schedule: '每 2 小时 1 条', format: '纯文字 · 强钩子', description: '从公开热点或常青冲突题切入，用明确立场和信息缺口带动讨论。' }),
  Object.freeze({ id: 'joke', label: '生活段子', dailyPosts: 3, schedule: '上午 / 下午 / 晚上', format: '纯文字 · 轻反转', description: '用日常场景、自嘲和轻巧补刀调节内容节奏。' }),
  Object.freeze({ id: 'greeting', label: '日常问候', dailyPosts: 1, schedule: '08:00', format: '短问候 · 当日感', description: '用当天语境开启时间线，不写成模板化鸡汤。' }),
  Object.freeze({ id: 'community', label: '社区互动', dailyPosts: 1, schedule: '09:30', format: '对话引子 · 可回复', description: '认识新朋友，以具体兴趣和低门槛问题开启真实交流。' }),
  Object.freeze({ id: 'culture', label: '文化故事', dailyPosts: 1, schedule: '16:00', format: '短故事 · 有出处', description: '轮换国学、中华故事与外国寓言，讲清情节和可用启示。' }),
  Object.freeze({ id: 'crypto', label: '加密观察', dailyPosts: 1, schedule: '17:00', format: '条件判断 · 风险边界', description: '围绕市场结构、流动性或链上变量给出克制观点。' }),
  Object.freeze({ id: 'us', label: '美区英文', dailyPosts: 1, schedule: '23:00', format: '英文 · Builder 话题', description: '面向开发者、AI 用户与独立创作者提供轻量讨论入口。' }),
])

export function isXPostSlotActive(slot) {
  return X_ACTIVE_POST_SLOT_IDS.includes(slot)
}

const ACTIVE_POST_SLOT_IDS = new Set(X_ACTIVE_POST_SLOT_IDS)

export const X_POST_SLOTS = Object.freeze([
  ...slotsFor('period', GREETING_PERIODS, 'greeting'),
  ...slotsFor('story', CULTURE_STORY_SLOTS, 'culture'),
  ...slotsFor('community', X_COMMUNITY_SLOTS),
  ...slotsFor('crypto', X_CRYPTO_POST_SLOTS),
  ...slotsFor('us', X_US_AUDIENCE_SLOTS),
  ...slotsFor('controversy', X_CONTROVERSY_SLOTS),
  ...slotsFor('joke', X_JOKE_SLOTS),
].filter((slot) => ACTIVE_POST_SLOT_IDS.has(slot.id)).map((slot) => ({
  ...slot,
  jitterMinutes: slot.query === 'controversy'
    ? X_TOPIC_POST_JITTER_MINUTES
    : slot.query === 'joke'
      ? X_POST_JITTER_MINUTES
      : X_STANDARD_POST_JITTER_MINUTES,
})).sort((left, right) => left.time.localeCompare(right.time)))

// Date and slot determine a stable draw; retries keep the same target time.
export async function xPostingSchedule(now = new Date()) {
  const date = shanghaiDateKey(now)
  return Promise.all(X_POST_SLOTS.map(async (slot) => {
    const seed = new TextEncoder().encode(`x-schedule-v1:${date}:${slot.id}`)
    const digest = await crypto.subtle.digest('SHA-256', seed)
    const jitterMinutes = slot.jitterMinutes
    const drawnOffsetMinutes = new DataView(digest).getUint32(0) % (2 * jitterMinutes + 1) - jitterMinutes
    // A negative offset at midnight belongs to the previous Shanghai day and can
    // never pass the scheduled-date guard, so keep that one boundary after 00:00.
    const offsetMinutes = slot.time === '00:00' ? Math.max(0, drawnOffsetMinutes) : drawnOffsetMinutes
    const baselineAt = Date.parse(`${date}T${slot.time}:00+08:00`)
    const scheduledAt = baselineAt + offsetMinutes * 60_000
    return { ...slot, date, baselineAt, scheduledAt, offsetMinutes }
  }))
}

export function isXPostDue(task, now = new Date()) {
  const timestamp = now.getTime()
  return task.date === shanghaiDateKey(now)
    && timestamp >= task.scheduledAt
    && timestamp <= task.scheduledAt + X_POST_RETRY_MINUTES * 60_000
}

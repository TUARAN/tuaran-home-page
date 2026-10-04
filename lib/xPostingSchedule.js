import { GREETING_PERIODS, shanghaiDateKey } from './dailyGreeting.js'
import { CULTURE_STORY_SLOTS } from './dailyCultureStory.js'
import { X_COMMUNITY_SLOTS } from './xCommunityPosts.js'
import { X_CRYPTO_POST_SLOTS } from './xCryptoPosts.js'
import { X_US_AUDIENCE_SLOTS } from './xUsAudiencePosts.js'
import { X_CONTROVERSY_SLOTS } from './xControversyPosts.js'
import { X_JOKE_SLOTS } from './xJokePosts.js'

export const X_POST_JITTER_MINUTES = 0
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

export const X_ACTIVE_JOKE_SLOT_IDS = Object.freeze(Object.keys(X_JOKE_SLOTS))
export const X_ACTIVE_COMMUNITY_SLOT_IDS = Object.freeze(Object.keys(X_COMMUNITY_SLOTS))
export const X_ACTIVE_GREETING_SLOT_IDS = Object.freeze(['morning'])
export const X_ACTIVE_CULTURE_SLOT_IDS = Object.freeze(['culture_afternoon'])
export const X_ACTIVE_CRYPTO_SLOT_IDS = Object.freeze(Object.keys(X_CRYPTO_POST_SLOTS))
export const X_ACTIVE_US_SLOT_IDS = Object.freeze(['us_midday'])
export const X_ACTIVE_CONTROVERSY_SLOT_IDS = Object.freeze([
  'controversy_12',
  'controversy_14',
  'controversy_18',
  'controversy_20',
])

export const X_ACTIVE_POST_SLOT_IDS = Object.freeze([
  ...X_ACTIVE_JOKE_SLOT_IDS,
  ...X_ACTIVE_COMMUNITY_SLOT_IDS,
  ...X_ACTIVE_GREETING_SLOT_IDS,
  ...X_ACTIVE_CULTURE_SLOT_IDS,
  ...X_ACTIVE_CRYPTO_SLOT_IDS,
  ...X_ACTIVE_US_SLOT_IDS,
  ...X_ACTIVE_CONTROVERSY_SLOT_IDS,
])

export const X_POST_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'joke',
    label: '高频短帖',
    active: true,
    dailyPosts: 10,
    schedule: '06:00–09:36 × 4；15:18–18:54 × 3；22:00–次日 01:20 × 3',
    format: '纯文字 · 模型生成 · 逐行短句',
    description: '每次发布前由当前选中的大模型实时创作，开场和句式不使用固定模板，并结合近期记录自动去重。',
  }),
  Object.freeze({ id: 'community', label: '交朋友', active: true, dailyPosts: 3, schedule: '09:30 / 15:00 / 19:00', format: '纯文字 · 交流引子', description: '分别用认识新朋友、蓝 V 交流和互关串门开启真实对话，不写成涨粉任务。' }),
  Object.freeze({ id: 'greeting', label: '日常问候', active: true, dailyPosts: 1, schedule: '08:00', format: '短问候 · 当日感', description: '每天保留一条自然早安，不堆叠三餐式问候。' }),
  Object.freeze({ id: 'culture', label: '文化故事', active: true, dailyPosts: 1, schedule: '16:00', format: '短故事 · 有出处', description: '每天一条有可靠出处的文化短故事。' }),
  Object.freeze({ id: 'crypto', label: '加密观察', active: true, dailyPosts: 3, schedule: '11:00 / 17:00 / 21:00', format: '条件判断 · 风险边界', description: '覆盖基础知识、市场结构和投资纪律，不喊单、不承诺收益。' }),
  Object.freeze({ id: 'us', label: '美区英文', active: true, dailyPosts: 1, schedule: '03:00', format: '英文 · Builder 话题', description: '每天一条面向美区 Builder 的实用观察。' }),
  Object.freeze({ id: 'controversy', label: '理财热点', active: true, dailyPosts: 4, schedule: '12:00 / 14:00 / 18:00 / 20:00', format: '纯文字 · 钱与生活', description: '优先讨论储蓄、投资、住房、保险、消费和家庭财务中的真实分歧。' }),
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
  jitterMinutes: X_POST_JITTER_MINUTES,
})).sort((left, right) => left.time.localeCompare(right.time)))

// Date and slot determine a stable draw; retries keep the same target time.
export async function xPostingSchedule(now = new Date()) {
  const date = shanghaiDateKey(now)
  return Promise.all(X_POST_SLOTS.map(async (slot) => {
    const seed = new TextEncoder().encode(`x-schedule-v1:${date}:${slot.id}`)
    const digest = await crypto.subtle.digest('SHA-256', seed)
    const jitterMinutes = slot.jitterMinutes
    const drawnOffsetMinutes = new DataView(digest).getUint32(0) % (2 * jitterMinutes + 1) - jitterMinutes
    const offsetMinutes = drawnOffsetMinutes
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

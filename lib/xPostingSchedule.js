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

export const X_ACTIVE_POST_SLOT_IDS = Object.freeze([
  ...X_ACTIVE_JOKE_SLOT_IDS,
  ...X_ACTIVE_COMMUNITY_SLOT_IDS,
])

export const X_POST_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'joke',
    label: '高频短帖',
    active: true,
    dailyPosts: 30,
    schedule: '06:00–09:36 × 10；15:12–18:48 × 10；22:00–次日 01:36 × 10',
    format: '纯文字 · 强钩子 · 逐行短句',
    description: '用“暴论”“不懂就问”“✈️”等轮换钩子开场，每行一个短句，以日常反差和轻巧补刀收尾。',
  }),
  Object.freeze({ id: 'community', label: '交朋友', active: true, dailyPosts: 3, schedule: '09:30 / 15:00 / 19:00', format: '纯文字 · 交流引子', description: '分别用认识新朋友、蓝 V 交流和互关串门开启真实对话，不写成涨粉任务。' }),
  Object.freeze({ id: 'greeting', label: '日常问候', active: false, dailyPosts: 0, schedule: '已停发', format: '短问候 · 当日感', description: '保留早安、午安和晚安的历史配置与发布记录。' }),
  Object.freeze({ id: 'culture', label: '文化故事', active: false, dailyPosts: 0, schedule: '已停发', format: '短故事 · 有出处', description: '保留文化短故事的历史配置与发布记录。' }),
  Object.freeze({ id: 'crypto', label: '加密观察', active: false, dailyPosts: 0, schedule: '已停发', format: '条件判断 · 风险边界', description: '保留加密市场观点的历史配置与发布记录。' }),
  Object.freeze({ id: 'us', label: '美区英文', active: false, dailyPosts: 0, schedule: '已停发', format: '英文 · Builder 话题', description: '保留面向美区受众的历史配置与发布记录。' }),
  Object.freeze({ id: 'controversy', label: '热点话题', active: false, dailyPosts: 0, schedule: '已停发', format: '纯文字 · 话题切口', description: '保留热点与争议短帖的历史配置与发布记录。' }),
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

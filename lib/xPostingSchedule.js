import { shanghaiDateKey } from './dailyGreeting.js'
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

export const X_ACTIVE_POST_SLOT_IDS = X_ACTIVE_JOKE_SLOT_IDS

export const X_POST_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'joke',
    label: '高频短帖',
    dailyPosts: 80,
    schedule: '06:00–09:52 × 30；15:00–18:52 × 30；22:00–次日 01:48 × 20',
    format: '纯文字 · 强钩子 · 逐行短句',
    description: '用“暴论”“不懂就问”“✈️”等轮换钩子开场，每行一个短句，以日常反差和轻巧补刀收尾。',
  }),
])

export function isXPostSlotActive(slot) {
  return X_ACTIVE_POST_SLOT_IDS.includes(slot)
}

const ACTIVE_POST_SLOT_IDS = new Set(X_ACTIVE_POST_SLOT_IDS)

export const X_POST_SLOTS = Object.freeze([
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

import { GREETING_PERIODS, shanghaiDateKey } from './dailyGreeting.js'
import { CULTURE_STORY_SLOTS } from './dailyCultureStory.js'
import { X_COMMUNITY_SLOTS } from './xCommunityPosts.js'
import { X_CRYPTO_POST_SLOTS } from './xCryptoPosts.js'
import { X_US_AUDIENCE_SLOTS } from './xUsAudiencePosts.js'

export const X_POST_JITTER_MINUTES = 30
export const X_POST_RETRY_MINUTES = 60

function slotsFor(query, definitions) {
  return Object.entries(definitions).map(([id, slot]) => ({
    id,
    query,
    time: slot.time || String(slot.hour).padStart(2, '0') + ':00',
  }))
}

export const X_ACTIVE_POST_SLOT_IDS = Object.freeze([
  'morning',
  'culture_morning',
  'culture_evening',
  'community_friends',
  'community_learning',
  'crypto_knowledge',
  'crypto_market',
  'us_morning',
  'us_midday',
  'us_evening',
])

const ACTIVE_POST_SLOT_IDS = new Set(X_ACTIVE_POST_SLOT_IDS)

export const X_POST_SLOTS = Object.freeze([
  ...slotsFor('period', GREETING_PERIODS),
  ...slotsFor('story', CULTURE_STORY_SLOTS),
  ...slotsFor('community', X_COMMUNITY_SLOTS),
  ...slotsFor('crypto', X_CRYPTO_POST_SLOTS),
  ...slotsFor('us', X_US_AUDIENCE_SLOTS),
].filter((slot) => ACTIVE_POST_SLOT_IDS.has(slot.id)))

// Date and slot determine a stable draw; retries keep the same target time.
export async function xPostingSchedule(now = new Date()) {
  const date = shanghaiDateKey(now)
  return Promise.all(X_POST_SLOTS.map(async (slot) => {
    const seed = new TextEncoder().encode(`x-schedule-v1:${date}:${slot.id}`)
    const digest = await crypto.subtle.digest('SHA-256', seed)
    const offsetMinutes = new DataView(digest).getUint32(0) % (2 * X_POST_JITTER_MINUTES + 1) - X_POST_JITTER_MINUTES
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

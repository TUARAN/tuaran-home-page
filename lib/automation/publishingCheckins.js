import { checkinDayKey } from './checkinRewards.js'

export const PUBLISHING_PLATFORMS = Object.freeze([
  Object.freeze({ key: 'juejin', label: '掘金', short: '掘', required: true, color: '#1e80ff' }),
  Object.freeze({ key: 'xiaohongshu', label: '小红书', short: '红', required: true, color: '#ff2442' }),
  Object.freeze({ key: 'x', label: 'X', short: 'X', required: true, color: '#181818' }),
  Object.freeze({ key: 'csdn', label: 'CSDN', short: 'C', required: true, color: '#fc5531' }),
  Object.freeze({ key: 'zhihu', label: '知乎', short: '知', required: false, color: '#1772f6' }),
  Object.freeze({ key: 'toutiao', label: '今日头条', short: '头', required: false, color: '#f04142' }),
  Object.freeze({ key: 'wechat', label: '微信公众号', short: '微', required: false, color: '#07c160' }),
  Object.freeze({ key: 'bilibili', label: '哔哩哔哩', short: 'B', required: false, color: '#00aeec' }),
  Object.freeze({ key: 'douyin', label: '抖音', short: '抖', required: false, color: '#252632' }),
])

export const REQUIRED_PUBLISHING_KEYS = Object.freeze(
  PUBLISHING_PLATFORMS.filter((platform) => platform.required).map((platform) => platform.key)
)

export function publishingToday(now = Date.now()) {
  return checkinDayKey(now)
}

export function isPublishingDayKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isPublishingMonthKey(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ''))
}

export function publishingMonthRange(month) {
  if (!isPublishingMonthKey(month)) return null
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

export function groupPublishingRecords(records = []) {
  return records.reduce((days, record) => {
    const day = String(record.checkinDate || record.checkin_date || '')
    const platform = String(record.platform || '')
    if (!day || !platform) return days
    if (!days[day]) days[day] = {}
    days[day][platform] = { platform, postUrl: String(record.postUrl || record.post_url || '') }
    return days
  }, {})
}

export function isPublishingDayComplete(dayRecords = {}) {
  return REQUIRED_PUBLISHING_KEYS.every((key) => Boolean(dayRecords[key]))
}

function shiftDay(day, delta) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function calculatePublishingStreak(records = [], today = publishingToday()) {
  const days = groupPublishingRecords(records)
  let cursor = isPublishingDayComplete(days[today]) ? today : shiftDay(today, -1)
  let streak = 0
  while (isPublishingDayComplete(days[cursor])) {
    streak += 1
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

import { weightedTextLength } from './xDistribution.js'

export const DAILY_GREETING_ID = 'x-daily-greeting'
export const DAILY_GREETING_SETTING_KEY = 'automation.x_morning_greeting'
export const DAILY_GREETING_LAST_RUN_KEY = 'automation.x_morning_greeting.last_run'
export const DAILY_GREETING_MAX_WEIGHT = 280

export const GREETING_PERIODS = Object.freeze({
  morning: { id: 'morning', label: '早安', hour: 8 },
  noon: { id: 'noon', label: '午安', hour: 12 },
  evening: { id: 'evening', label: '晚安', hour: 22 },
})

export const GREETING_CONTENT_KINDS = Object.freeze({
  quote: '名言',
  story: '故事',
  reflection: '随想',
})

export const DAILY_GREETING_TEMPLATES = [
  {
    period: 'morning',
    contentKind: 'quote',
    text: '早安！今天是{date}。\n《论语》说：“工欲善其事，必先利其器。”\n整理好手边的工具，再开始今天的事。',
  },
  {
    period: 'noon',
    contentKind: 'quote',
    text: '午安！今天是{date}。\n苏轼写：“竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。”\n午间歇一歇，再从容出发。',
  },
  {
    period: 'evening',
    contentKind: 'quote',
    text: '晚安！今天是{date}。\n陶渊明写：“采菊东篱下，悠然见南山。”\n愿你收起忙碌，重新看见身边的安静。',
  },
]
export function normalizeGreetingPeriod(value, fallback = 'morning') {
  const period = String(value || '').trim().toLowerCase()
  return GREETING_PERIODS[period] ? period : fallback
}

export function greetingPeriodForDate(now = new Date(), timeZone = 'Asia/Shanghai') {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now))
  if (hour < 11) return 'morning'
  if (hour < 18) return 'noon'
  return 'evening'
}

export function greetingLastRunKey(period) {
  return `${DAILY_GREETING_LAST_RUN_KEY}.${normalizeGreetingPeriod(period)}`
}

export function isAutomationPaused(value) {
  return String(value || '').trim().toLowerCase() === 'paused'
}

export function greetingDateLabel({ now = new Date(), timeZone = 'Asia/Shanghai' } = {}) {
  const parts = new Intl.DateTimeFormat('zh-CN', { timeZone, month: 'numeric', day: 'numeric' }).formatToParts(now)
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${month}月${day}号`
}

export function greetingCalendarLabel({ now = new Date(), timeZone = 'Asia/Shanghai' } = {}) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  }).formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value || ''
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  const weekday = parts.find((part) => part.type === 'weekday')?.value || ''
  return `${year}年${month}月${day}日，${weekday}`
}

export function normalizeGreetingNewlines(text) {
  return String(text || '').replace(/\\n/g, '\n')
}

export function shanghaiDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(Number(timestamp) || Date.now()))
}

export function templatesForPeriod(templates = DAILY_GREETING_TEMPLATES, period = 'morning') {
  const normalized = normalizeGreetingPeriod(period)
  return (Array.isArray(templates) ? templates : DAILY_GREETING_TEMPLATES).filter((item) => {
    if (typeof item === 'string') return normalized === 'morning'
    return normalizeGreetingPeriod(item?.period) === normalized
  })
}

export function pickDailyGreetingTemplate(templates = DAILY_GREETING_TEMPLATES, { now = new Date(), period = 'morning' } = {}) {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  const supplied = Array.isArray(templates) ? templates : DAILY_GREETING_TEMPLATES
  // 发布端从 D1 读取时传入的已经是指定时段的纯文本数组，无需再次按 period 过滤。
  const periodTemplates = supplied.every((item) => typeof item === 'string')
    ? supplied
    : templatesForPeriod(supplied, normalizedPeriod)
  const pool = periodTemplates
    .map((template) => typeof template === 'string' ? template : template?.text)
    .map((template) => String(template || '').trim())
    .filter(Boolean)
  const fallback = pool.length ? pool : templatesForPeriod(DAILY_GREETING_TEMPLATES, normalizedPeriod).map((item) => item.text)
  const key = `${shanghaiDateKey(now)}:${normalizedPeriod}`
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)) >>> 0
  return fallback[hash % fallback.length]
}

export function buildDailyGreeting({ now = new Date(), period = 'morning', template } = {}) {
  const text = template || pickDailyGreetingTemplate(DAILY_GREETING_TEMPLATES, { now, period })
  return normalizeGreetingNewlines(String(text).replaceAll('{date}', greetingDateLabel({ now })))
}

export function greetingWithinLimit(text, limit = DAILY_GREETING_MAX_WEIGHT) {
  return weightedTextLength(text) <= limit
}

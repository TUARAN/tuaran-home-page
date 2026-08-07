import { weightedTextLength } from './xDistribution.js'

export const MORNING_GREETING_ID = 'x-morning-greeting'
export const MORNING_GREETING_SETTING_KEY = 'automation.x_morning_greeting'
export const MORNING_GREETING_LAST_RUN_KEY = 'automation.x_morning_greeting.last_run'
export const MORNING_GREETING_MAX_WEIGHT = 280

export const MORNING_GREETING_TEMPLATE =
  '大家早上好！向各位领导问好！今天是{date}，chovy！\n新一天一起加油～\n冷知识：关注数多只能说明这人努力+实诚，这比玩“先关后取”游戏的人更值得跟随～'

export function isAutomationPaused(value) {
  return String(value || '').trim().toLowerCase() === 'paused'
}

export function greetingDateLabel({ now = new Date(), timeZone = 'Asia/Shanghai' } = {}) {
  const parts = new Intl.DateTimeFormat('zh-CN', { timeZone, month: 'numeric', day: 'numeric' }).formatToParts(now)
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${month}月${day}号`
}

/** 北京时间自然日 key（YYYY-MM-DD），用于“当天已发布则跳过”幂等判断。 */
export function shanghaiDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Number(timestamp) || Date.now()))
}

export function buildMorningGreeting(options = {}) {
  return MORNING_GREETING_TEMPLATE.replace('{date}', greetingDateLabel(options))
}

export function greetingWithinLimit(text, limit = MORNING_GREETING_MAX_WEIGHT) {
  return weightedTextLength(text) <= limit
}

/**
 * 兼容旧引用。每日问候现已抽象到 dailyGreeting.js；旧名称继续导出，避免已有
 * 自动化、测试和运维页面在同一次部署中失效。
 */
export {
  DAILY_GREETING_ID as MORNING_GREETING_ID,
  DAILY_GREETING_SETTING_KEY as MORNING_GREETING_SETTING_KEY,
  DAILY_GREETING_LAST_RUN_KEY as MORNING_GREETING_LAST_RUN_KEY,
  DAILY_GREETING_MAX_WEIGHT as MORNING_GREETING_MAX_WEIGHT,
  DAILY_GREETING_TEMPLATES,
  GREETING_CONTENT_KINDS,
  GREETING_PERIODS,
  buildDailyGreeting,
  greetingCalendarLabel,
  greetingDateLabel,
  greetingLastRunKey,
  greetingPeriodForDate,
  greetingWithinLimit,
  isAutomationPaused,
  normalizeGreetingNewlines,
  normalizeGreetingPeriod,
  pickDailyGreetingTemplate,
  shanghaiDateKey,
  templatesForPeriod,
} from './dailyGreeting.js'

import {
  DAILY_GREETING_TEMPLATES,
  buildDailyGreeting,
  pickDailyGreetingTemplate,
} from './dailyGreeting.js'

export const MORNING_GREETING_TEMPLATES = DAILY_GREETING_TEMPLATES
  .filter((item) => item.period === 'morning')
  .map((item) => item.text)

/** 兼容旧引用：默认模板 = 模板池第一条。 */
export const MORNING_GREETING_TEMPLATE = MORNING_GREETING_TEMPLATES[0]
export const pickMorningGreetingTemplate = (templates = MORNING_GREETING_TEMPLATES, options = {}) =>
  pickDailyGreetingTemplate(templates, { ...options, period: 'morning' })
export const buildMorningGreeting = (options = {}) => buildDailyGreeting({ ...options, period: 'morning' })

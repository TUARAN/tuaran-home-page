import { weightedTextLength } from './xDistribution.js'

export const MORNING_GREETING_ID = 'x-morning-greeting'
export const MORNING_GREETING_SETTING_KEY = 'automation.x_morning_greeting'
export const MORNING_GREETING_LAST_RUN_KEY = 'automation.x_morning_greeting.last_run'
export const MORNING_GREETING_MAX_WEIGHT = 280

/**
 * 早安文案模板池：每天按日期稳定随机选一条。
 * 线上以 D1 morning_greeting_templates 为准（后台可编辑），
 * 这里的数组作为默认种子与 D1 不可用时的兜底。
 */
export const MORNING_GREETING_TEMPLATES = [
  '大家早上好！向各位领导问好！今天是{date}。\n新一天，一起加油～\n冷知识：关注数多只能说明这人努力+实诚，比玩“先关后取”游戏的人更值得跟随～',
  '早上好！今天是{date}。\n先喝一杯水，再打开手机。\n冷知识：早起不是天赋，是昨晚早点放下手机换来的～',
  '早安！今天是{date}。\n开工前，想清楚今天最重要的一件事。\n冷知识：长期稳定输出的人，靠的不是灵感，是固定节奏～',
  '早上好！今天是{date}。\n别急，慢慢来，比较快。\n冷知识：真正重要的事，很少需要等到“完全准备好”才开始～',
  '早安！今天是{date}。\n今天也要保持好奇。\n冷知识：那些看起来毫不费力的人，只是把练习藏在了别人看不到的地方～',
  '早上好！今天是{date}。\n先把最难的那件事做掉，剩下的都是奖励。\n冷知识：焦虑的解药不是想清楚，而是动手做掉一小块～',
  '早安！今天是{date}。\n再忙也记得好好吃饭。\n冷知识：注意力是这个时代最稀缺的资产，别随手送给短视频～',
  '早上好！今天是{date}。\n给自己定一个很小的目标，完成了再说。\n冷知识：真正起作用的不是“坚持 21 天”，而是“今天也做了”的惯性～',
  '早安！今天是{date}。\n今天少刷手机，多做事。\n冷知识：别人晒出来的结果，只是他们愿意给你看的那一部分～',
  '早上好！今天是{date}。\n有空记得抬头看看天。\n冷知识：人每天要做上千个决定，真正影响生活的只有少数几个，别在小事上内耗～',
]

/** 兼容旧引用：默认模板 = 模板池第一条。 */
export const MORNING_GREETING_TEMPLATE = MORNING_GREETING_TEMPLATES[0]

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

/**
 * 按北京时间日期稳定随机选一条模板：同一天重复触发（补跑）会选中同一条。
 * 传入模板池为空时回退默认池。
 */
export function pickMorningGreetingTemplate(templates = MORNING_GREETING_TEMPLATES, { now = new Date() } = {}) {
  const pool = (Array.isArray(templates) ? templates : MORNING_GREETING_TEMPLATES)
    .map((template) => String(template || '').trim())
    .filter(Boolean)
  const fallback = pool.length ? pool : MORNING_GREETING_TEMPLATES
  const key = shanghaiDateKey(now)
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)) >>> 0
  return fallback[hash % fallback.length]
}

export function buildMorningGreeting({ now = new Date(), template } = {}) {
  const text = template || pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now })
  return String(text).replace('{date}', greetingDateLabel({ now }))
}

export function greetingWithinLimit(text, limit = MORNING_GREETING_MAX_WEIGHT) {
  return weightedTextLength(text) <= limit
}

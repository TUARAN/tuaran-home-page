import { GREETING_PERIODS, greetingCalendarLabel, normalizeGreetingPeriod } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'
import { modelSelectionId, parseModelSelection } from './modelSelection.js'

export { modelSelectionId as greetingModelSelectionId, parseModelSelection as parseGreetingModelSelection }

const X_POST_WEIGHT_LIMIT = 280
const X_REWRITE_TARGET_WEIGHT = 240

export const DAILY_GREETING_MODE_KEY = 'automation.x_morning_greeting.generation_mode'
export const DAILY_GREETING_LLM_PROMPT_KEY = 'automation.x_morning_greeting.llm_intent'
export const DAILY_GREETING_OLLAMA_PROVIDER_KEY = 'automation.x_morning_greeting.ollama_provider_id'
export const DAILY_GREETING_MODEL_SELECTIONS_KEY = 'automation.x_morning_greeting.model_selections'
export const DAILY_GREETING_GENERATION_MODES = Object.freeze({
  deepseek: 'deepseek',
  ollama: 'ollama',
})

export const DAILY_GREETING_STYLES = Object.freeze([
  Object.freeze({
    id: 'everyday_scene',
    label: '人间烟火',
    direction: '从一个具体的日常场景、声音、气味或小动作写起，让问候有生活现场；少讲大道理。',
  }),
  Object.freeze({
    id: 'gentle_humor',
    label: '轻松俏皮',
    direction: '像熟人聊天一样轻松，可以有一个温和的小反转或幽默点；不要网络烂梗、油腻段子和硬抖机灵。',
  }),
  Object.freeze({
    id: 'lyrical_pause',
    label: '诗意留白',
    direction: '用简洁的画面和有节奏的短句营造意境，允许留白；不要堆砌形容词，也不要引用名人名句。',
  }),
  Object.freeze({
    id: 'tiny_action',
    label: '微小行动',
    direction: '给出一个符合当前时段、立刻能完成的小动作，让读者感到可执行；语气平等，不命令、不说教。',
  }),
  Object.freeze({
    id: 'curious_connection',
    label: '好奇联想',
    direction: '从普通物件、自然现象或日常细节展开一个新鲜联想，引出轻巧的问候；避免未经核实的知识和具体数据。',
  }),
])

export const DEFAULT_DAILY_GREETING_LLM_INTENT =
  '写一条自然、真诚的中文日常问候，可以结合可靠的中华典故、文学名句或生活随想。每天换一个角度，避免营销腔、说教和空泛鸡汤。'

export function normalizeGreetingGenerationMode(value, fallback = 'deepseek') {
  const mode = String(value || '').trim().toLowerCase()
  if (mode === 'llm') return 'deepseek'
  return DAILY_GREETING_GENERATION_MODES[mode] || fallback
}

export function normalizeGreetingModelSelections(value, {
  fallbackMode = 'deepseek',
  fallbackProviderId = '',
} = {}) {
  let items = value
  if (typeof items === 'string') {
    try { items = JSON.parse(items) } catch { items = [] }
  }
  const normalized = [...new Set((Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter((item) => parseModelSelection(item)))]
    .slice(0, 2)
  if (normalized.length) return normalized
  if (normalizeGreetingGenerationMode(fallbackMode) === 'ollama' && String(fallbackProviderId || '').trim()) {
    return [`ollama:${String(fallbackProviderId).trim()}`]
  }
  return ['deepseek']
}

export function orderGreetingModelSelections(value, seed = '') {
  const selections = normalizeGreetingModelSelections(value)
  if (selections.length < 2) return selections
  const score = [...String(seed || '')].reduce((total, char) => ((total * 31) + char.codePointAt(0)) >>> 0, 0)
  return score % 2 === 0 ? selections : [selections[1], selections[0]]
}


export function normalizeGreetingLlmIntent(value, fallback = DEFAULT_DAILY_GREETING_LLM_INTENT) {
  const intent = String(value || '').replace(/\r\n?/g, '\n').trim()
  return intent || fallback
}

export function pickDailyGreetingStyle({ random = Math.random } = {}) {
  const sampled = Number(typeof random === 'function' ? random() : Math.random())
  const bounded = Number.isFinite(sampled) ? Math.min(Math.max(sampled, 0), 0.999999999999) : 0
  return DAILY_GREETING_STYLES[Math.floor(bounded * DAILY_GREETING_STYLES.length)]
}

export function buildGreetingLlmMessages({ intent, period = 'morning', now = new Date(), style } = {}) {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  const periodLabel = GREETING_PERIODS[normalizedPeriod].label
  const calendarLabel = greetingCalendarLabel({ now })
  const selectedStyle = DAILY_GREETING_STYLES.find((item) => item.id === style?.id) || pickDailyGreetingStyle()
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文问候。',
        '只输出最终文案，不要解释、标题、Markdown、引号包裹或候选版本。',
        '文案必须适合当前时段，中文总长度尽量控制在 90—120 字，并确保 X 加权长度不超过 280。',
        '首句直接给一个有棱角但站得住的观察，删掉礼貌铺垫；可以反驳一种常见偷懒想法，但不要为了冲突故意冒犯。',
        '至少写出一句可以被单独认同或反对的核心句，让不回复的读者也有自然点赞的理由；不要直接索要互动。',
        '正文只展开一个具体场景或动作，结尾留一个低门槛、能让人讲选择或亲历的问题。不要直接索要点赞、转发或关注。',
        '如果文案提到今天的日期或星期，必须严格使用用户消息提供的当前日历信息，不要自行推算或改写。',
        '认真执行本次指定风格；不要把五种风格混写，也不要每次都套用“今天是……愿你……”的固定结构。',
        '不要编造名言、出处、人物经历或新闻事实；没有把握时改写为日常随想。不要使用“不是……而是……”句式。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `当前时段：${periodLabel}\n当前日历：${calendarLabel}\n本次风格：${selectedStyle.label}\n风格要求：${selectedStyle.direction}\n站长意图：\n${normalizeGreetingLlmIntent(intent)}`,
    },
  ]
}

export function normalizeGeneratedGreeting(value) {
  let text = String(value || '').replace(/\r\n?/g, '\n').trim()
  const fenced = text.match(/^```(?:text|markdown)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fenced) text = fenced[1].trim()
  text = text.replace(/^(?:最终文案|推文|文案)\s*[：:]\s*/i, '').trim()
  if (
    text.length >= 2 &&
    ((text.startsWith('“') && text.endsWith('”')) ||
      (text.startsWith('"') && text.endsWith('"')))
  ) {
    text = text.slice(1, -1).trim()
  }
  return text
}

export function buildGreetingLengthRepairMessages({ text, targetWeight = X_REWRITE_TARGET_WEIGHT } = {}) {
  return [
    {
      role: 'system',
      content: [
        '你负责压缩一条准备发布到 X 的中文文案。',
        '只输出压缩后的最终文案，不要解释、标题、Markdown、引号包裹或候选版本。',
        `保留原文的核心事实、故事结局和启示，X 加权长度必须不超过 ${targetWeight}；中文字符按 2 计算，ASCII 字符按 1 计算。`,
        '删去重复修饰和次要细节，使用完整句子，不新增原文没有的事实、引语或出处。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `原文：\n${normalizeGeneratedGreeting(text)}`,
    },
  ]
}

/**
 * 模型二次压缩仍不守限长时的最后一道发布保护。
 * 优先截到预算内最后一个完整句末；单句本身超限时才按字符截断并加省略号。
 */
export function fitGeneratedGreetingToXLimit(value, limit = X_POST_WEIGHT_LIMIT) {
  const text = normalizeGeneratedGreeting(value)
  if (weightedTextLength(text) <= limit) return { text, adjusted: false }

  const ellipsis = '…'
  const ellipsisWeight = weightedTextLength(ellipsis)
  const characters = Array.from(text)
  let weight = 0
  let lastSentenceEnd = -1
  let cutoff = 0

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]
    const nextWeight = weightedTextLength(character)
    if (weight + nextWeight > limit - ellipsisWeight) break
    weight += nextWeight
    cutoff = index + 1
    if ('。！？!?；;'.includes(character)) lastSentenceEnd = cutoff
  }

  const completePrefix = lastSentenceEnd > 0
    ? characters.slice(0, lastSentenceEnd).join('').trim()
    : ''
  const fitted = completePrefix || `${characters.slice(0, cutoff).join('').trimEnd()}${ellipsis}`
  return { text: fitted, adjusted: true }
}

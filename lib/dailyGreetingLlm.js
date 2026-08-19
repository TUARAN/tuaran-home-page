import { GREETING_PERIODS, greetingDateLabel, normalizeGreetingPeriod } from './dailyGreeting.js'

export const DAILY_GREETING_MODE_KEY = 'automation.x_morning_greeting.generation_mode'
export const DAILY_GREETING_LLM_PROMPT_KEY = 'automation.x_morning_greeting.llm_intent'
export const DAILY_GREETING_OLLAMA_PROVIDER_KEY = 'automation.x_morning_greeting.ollama_provider_id'
export const DAILY_GREETING_GENERATION_MODES = Object.freeze({
  deepseek: 'deepseek',
  ollama: 'ollama',
  template: 'template',
})

export const DEFAULT_DAILY_GREETING_LLM_INTENT =
  '写一条自然、真诚的中文日常问候，可以结合可靠的中华典故、文学名句或生活随想。每天换一个角度，避免营销腔、说教和空泛鸡汤。'

export function normalizeGreetingGenerationMode(value, fallback = 'deepseek') {
  const mode = String(value || '').trim().toLowerCase()
  if (mode === 'llm') return 'deepseek'
  return DAILY_GREETING_GENERATION_MODES[mode] || fallback
}

export function normalizeGreetingLlmIntent(value, fallback = DEFAULT_DAILY_GREETING_LLM_INTENT) {
  const intent = String(value || '').replace(/\r\n?/g, '\n').trim()
  return intent || fallback
}

export function buildGreetingLlmMessages({ intent, period = 'morning', now = new Date() } = {}) {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  const periodLabel = GREETING_PERIODS[normalizedPeriod].label
  const dateLabel = greetingDateLabel({ now })
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文问候。',
        '只输出最终文案，不要解释、标题、Markdown、引号包裹或候选版本。',
        '文案必须适合当前时段，中文总长度尽量控制在 120 字以内，并确保 X 加权长度不超过 280。',
        '不要编造名言、出处、人物经历或新闻事实；没有把握时改写为日常随想。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `当前时段：${periodLabel}\n当前日期：${dateLabel}\n站长意图：\n${normalizeGreetingLlmIntent(intent)}`,
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

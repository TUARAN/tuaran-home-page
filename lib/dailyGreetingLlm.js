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
  Object.freeze({"id": "everyday_scene", "label": "刚醒一会儿", "direction": "写刚醒或还没进入状态的一小截，承认人可以慢热，不要布置一天的任务。"}),
  Object.freeze({"id": "gentle_humor", "label": "困困猫", "direction": "带一点困倦或干饭的友善自嘲，像跟熟人发消息，不要卖萌过头。"}),
  Object.freeze({"id": "coffee_chat", "label": "手边一杯", "direction": "从咖啡、茶或白开水聊起，只写自己的口味偏好，不拉人组搭子。"}),
  Object.freeze({"id": "tiny_action", "label": "先做小事", "direction": "从喝水、收拾桌面或短暂休息聊起，不升华成自律方法论。"}),
  Object.freeze({"id": "curious_connection", "label": "一个念头", "direction": "写一个一闪而过的兴趣或问题，像随口嘀咕，不要变成互关邀请函。"}),
  Object.freeze({"id": "timeline_friends", "label": "时间线邻居", "direction": "向时间线里的新老面孔点个头，像路过打招呼，不虚构已经发生的互动。"}),
  Object.freeze({"id": "blue_hello", "label": "蓝 V 也是人", "direction": "如果提到认证，就把它当成一个标记而不是门槛；蓝 V 和非蓝 V 都当普通人聊。"}),
  Object.freeze({"id": "food_chat", "label": "想吃什么", "direction": "围绕当前时段想吃、在吃或还没想好的一口，别写成美食安利。"}),
  Object.freeze({"id": "weather_chat", "label": "光线和风", "direction": "只写自己此刻对光线、风或冷热的感觉，不报气象实况，也不点名城市。"}),
  Object.freeze({"id": "casual_visit", "label": "有空再聊", "direction": "如果这条适合聊天，留一句容易接的话；不适合就自然收住，不许诺回关。"}),
])

export const DAILY_GREETING_VOICES = Object.freeze([
  Object.freeze({
    id: 'seasoned_friend',
    label: '见过世面的朋友',
    direction: '像认识几年的朋友发消息：有判断，有分寸，不宣布人生道理。',
  }),
  Object.freeze({
    id: 'warm_observer',
    label: '温暖观察者',
    direction: '语气温厚，看见小事，但不替别人规定感受，也不把普通日子写成鸡汤。',
  }),
  Object.freeze({
    id: 'wry_realist',
    label: '清醒幽默派',
    direction: '带一点成年人式的自嘲，接受今天不太完美，不使用网络热梗。',
  }),
  Object.freeze({
    id: 'quiet_companion',
    label: '安静同路人',
    direction: '像并肩走路时说的一句话，亲近、克制、留有余地，不假装熟悉读者的处境。',
  }),
  Object.freeze({
    id: 'curious_mind',
    label: '好奇思考者',
    direction: '真的好奇就问一句，问题像随口嘀咕，不像问卷或互动任务。',
  }),
  Object.freeze({
    id: 'phone_thumb',
    label: '拇指打字',
    direction: '句子短一点、口语一点，像用拇指在手机上刚打出来的，允许轻微不整齐。',
  }),
])

export const DAILY_GREETING_FORMATS = Object.freeze([
  Object.freeze({
    id: 'compact_paragraph',
    label: '紧凑单段',
    direction: '写成一个自然段，两三句即可；句子长短可以不齐，最后可以收住，也可以留一句容易接的话，不要每条都提问。',
  }),
  Object.freeze({
    id: 'two_step',
    label: '双段递进',
    direction: '写成两段：第一段说眼前这件事，空一行后再补一句更短的话；不要加标题，第二段不必是问句。',
  }),
  Object.freeze({
    id: 'three_lines',
    label: '三行短章',
    direction: '写三行，像随口说的三句，不要排成标语或日历文案。',
  }),
  Object.freeze({
    id: 'question_first',
    label: '问句开场',
    direction: '用一个自己也在想的小问题开场，随后用一句个人判断接住；不要连续发问，也不要像在做互动任务。',
  }),
  Object.freeze({
    id: 'micro_narrative',
    label: '一件小事',
    direction: '按时间顺序写一件刚发生或正要发生的小事：看见什么、动手做什么、心里闪过什么；禁止写“镜头一、二、三”。',
  }),
  Object.freeze({
    id: 'long_short',
    label: '长短句落差',
    direction: '先用一个有细节的长句铺陈，再用一两句很短的话落地，其中一句可以只有 4—10 个汉字。',
  }),
  Object.freeze({
    id: 'aside',
    label: '轻声旁白',
    direction: '正文中自然放入一处括号旁白或破折号转念，只用一次；它应显得像真实念头，不是故作俏皮。',
  }),
  Object.freeze({
    id: 'mini_list',
    label: '生活小清单',
    direction: '围绕同一件事列出 2—3 个极短的生活动作，用逗号或分号即可，不要用①②③，也不要写成教程。',
  }),
])

export const DEFAULT_DAILY_GREETING_LLM_INTENT =
  `为 TUARAN 的个人 X 账号写一条短帖。账号背后是个具体的人：对工具和做事有兴趣，也认真过吃饭睡觉这些普通日子；有一点判断，不端着，不急着教别人生活。

写得像随手发的，不像早安日历、互关话术或群发问候。优先从此刻能感知的小事切入：手边的杯子、还没开始的工作、午饭想吃什么、光线、困意、一个一闪而过的念头。一次只讲一件事。

允许克制的幽默、轻微的自我怀疑、个人偏爱，或今天状态一般。称呼保持自然，不假装认识所有人。想聊天时可以留一句容易接的话；不想聊天就自然收住，不要每条都求互关。

持续换开头、节奏和收尾。「早安／午安／晚安」可以出现，也可以不出现。emoji 可有可无。避开营销腔、成功学、鸡汤、节日群发感和翻译腔。`

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
    .slice(0, 1)
  if (normalized.length) return normalized
  if (normalizeGreetingGenerationMode(fallbackMode) === 'ollama' && String(fallbackProviderId || '').trim()) {
    return [`ollama:${String(fallbackProviderId).trim()}`]
  }
  return ['deepseek']
}

export function normalizeGreetingLlmIntent(value, fallback = DEFAULT_DAILY_GREETING_LLM_INTENT) {
  const intent = String(value || '').replace(/\r\n?/g, '\n').trim()
  return intent || fallback
}

export function pickDailyGreetingStyle({ random = Math.random } = {}) {
  return pickGreetingOption(DAILY_GREETING_STYLES, random)
}

export function pickDailyGreetingVoice({ random = Math.random } = {}) {
  return pickGreetingOption(DAILY_GREETING_VOICES, random)
}

export function pickDailyGreetingFormat({ random = Math.random } = {}) {
  return pickGreetingOption(DAILY_GREETING_FORMATS, random)
}

function pickGreetingOption(options, random) {
  const sampled = Number(typeof random === 'function' ? random() : Math.random())
  const bounded = Number.isFinite(sampled) ? Math.min(Math.max(sampled, 0), 0.999999999999) : 0
  return options[Math.floor(bounded * options.length)]
}

export function buildGreetingLlmMessages({ intent, period = 'morning', now = new Date(), style, voice, format } = {}) {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  const periodLabel = GREETING_PERIODS[normalizedPeriod].label
  const calendarLabel = greetingCalendarLabel({ now })
  const selectedStyle = DAILY_GREETING_STYLES.find((item) => item.id === style?.id) || pickDailyGreetingStyle()
  const selectedVoice = DAILY_GREETING_VOICES.find((item) => item.id === voice?.id) || pickDailyGreetingVoice()
  const selectedFormat = DAILY_GREETING_FORMATS.find((item) => item.id === format?.id) || pickDailyGreetingFormat()
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号写一条可直接发出去的中文短帖。',
        '只输出最终文案，不要解释、标题、Markdown、引号包裹或候选版本。',
        '这是一个具体的人在说话：对工具和做事有兴趣，也认真过吃饭睡觉这些普通日子；有判断，有分寸，不端着。',
        '写得像随手发的短消息，不像群发问候、早安日历或互关话术。不要使用“问好 + 小场景 + 邀请互关”的三段式。',
        '文案要有当前时段的生活气息，中文大约 40—90 字，X 加权长度不超过 280。',
        '开头服从本次结构，可以从观察、动作、画面、问句或一句短判断进入；删掉礼貌铺垫。',
        '「早安 / 午安 / 晚安」可以嵌进句子，也可以不出现，不要每条都以它加感叹号开头。',
        'emoji 可有可无，最多两个，必须和这句话有关；没有合适的就不用。',
        '正文只展开一个具体场景、动作或念头。想聊天可以留一句容易接的话，不要每条都提问，不要索要点赞、转发或关注。',
        '如果文案提到今天的日期或星期，必须严格使用用户消息提供的当前日历信息，不要自行推算或改写。',
        '内容视角、声线和结构要落到字句上；站长意图用来校正气质，不要再额外套一层互关交友主题。',
        '换行、标点和句子节奏服从本次结构。避开“今天也要……”“愿你……”“新的一天……”“推友们大家好”这类群发句式。',
        '不要写诗文、说教、长篇故事或鸡汤。不承诺秒回关或百分百互关。不要编造名言、出处、城市、天气实况、职业成绩或已经发生的互动。不要使用“不是……而是……”句式。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `当前时段：${periodLabel}\n当前日历：${calendarLabel}\n\n本次内容视角：${selectedStyle.label}\n视角要求：${selectedStyle.direction}\n\n本次人格声线：${selectedVoice.label}\n声线要求：${selectedVoice.direction}\n\n本次文本结构：${selectedFormat.label}\n结构要求：${selectedFormat.direction}\n\n站长意图：\n${normalizeGreetingLlmIntent(intent)}\n\n写得像这个人刚打出来的。不要复用“问好 + 小场景 + 邀请互关”的三段式。`,
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

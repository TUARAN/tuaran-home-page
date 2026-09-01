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
  Object.freeze({
    id: 'bookish_echo',
    label: '书页回声',
    direction: '从一则确有把握的典故、古诗文意象或阅读经验切入，用当代口语解释它与普通生活的关系；不卖弄出处，不拼贴名句。',
  }),
  Object.freeze({
    id: 'quiet_insight',
    label: '清醒一刻',
    direction: '捕捉一个容易被忽略的心理习惯或生活判断，给出克制、可讨论的看法；保持具体，不上价值，不制造焦虑。',
  }),
  Object.freeze({
    id: 'mini_story',
    label: '微型叙事',
    direction: '用两三个动作写一个极短的小故事，让意思从细节里自然浮现；人物和经历只能是泛化生活场景，不冒充真实见闻。',
  }),
  Object.freeze({
    id: 'sensory_moment',
    label: '感官切片',
    direction: '集中写一种光线、声音、温度、触感或气味，用准确的感官细节带出心情；不要堆砌形容词和强行抒情。',
  }),
  Object.freeze({
    id: 'kind_challenge',
    label: '温和挑战',
    direction: '对一种常见的拖延、内耗或惯性看法提出温和质疑，再落到今天能验证的小选择；观点要有棱角，语气不居高临下。',
  }),
])

export const DAILY_GREETING_VOICES = Object.freeze([
  Object.freeze({
    id: 'seasoned_friend',
    label: '见过世面的朋友',
    direction: '像一位读过些书、也认真过普通日子的朋友：有判断，有分寸，不端着。',
  }),
  Object.freeze({
    id: 'warm_observer',
    label: '温暖观察者',
    direction: '语气温厚而敏锐，善于看见小事里的价值，但不替读者规定感受。',
  }),
  Object.freeze({
    id: 'wry_realist',
    label: '清醒幽默派',
    direction: '带一点成年人式的自嘲和机智，接受生活的不完美，不使用网络热梗。',
  }),
  Object.freeze({
    id: 'quiet_companion',
    label: '安静同路人',
    direction: '像并肩走路时说的一句话，亲近、克制、留有余地，不假装熟悉读者的处境。',
  }),
  Object.freeze({
    id: 'curious_mind',
    label: '好奇思考者',
    direction: '带着真诚的好奇提出联系与问题，逻辑清楚，允许答案保持开放。',
  }),
  Object.freeze({
    id: 'concise_editor',
    label: '克制编辑',
    direction: '惜字如金，偏爱准确的名词和动词；删掉可以预料的抒情，只留下最有力的细节。',
  }),
])

export const DAILY_GREETING_FORMATS = Object.freeze([
  Object.freeze({
    id: 'compact_paragraph',
    label: '紧凑单段',
    direction: '写成一个自然段，3—4 句；句子长短错落，最后用一个具体问题轻轻收束。',
  }),
  Object.freeze({
    id: 'two_step',
    label: '双段递进',
    direction: '写成两段：第一段呈现场景与判断，空一行后用一句短问承接；不要给两段加标题。',
  }),
  Object.freeze({
    id: 'three_lines',
    label: '三行短章',
    direction: '严格写三行，每行一句；第一行有画面，第二行落观点，第三行用短问或轻巧邀请结尾。',
  }),
  Object.freeze({
    id: 'question_first',
    label: '问句开场',
    direction: '用一个能立刻理解的真问题开场，随后给出场景和个人判断，结尾回扣开头；不要连续发问。',
  }),
  Object.freeze({
    id: 'micro_narrative',
    label: '镜头推进',
    direction: '像三个连续镜头一样推进：看见什么、发生什么、由此想到什么；可以分行，禁止写“镜头一、二、三”。',
  }),
  Object.freeze({
    id: 'long_short',
    label: '长短句落差',
    direction: '先用一个有细节的长句铺陈，再用两句很短的话落地，其中一句可以只有 4—10 个汉字。',
  }),
  Object.freeze({
    id: 'aside',
    label: '轻声旁白',
    direction: '正文中自然放入一处括号旁白或破折号转念，只用一次；它应显得像真实念头，不是故作俏皮。',
  }),
  Object.freeze({
    id: 'mini_list',
    label: '生活小清单',
    direction: '围绕同一个主题列出 2—3 个极短的生活动作，可使用“①②③”或分号；前后各有一句自然衔接，不写教程口吻。',
  }),
])

export const DEFAULT_DAILY_GREETING_LLM_INTENT =
  `为 TUARAN 的个人 X 账号写日常问候。账号气质是：读过一些书，也认真过普通日子；有自己的判断和偏好，但不端着，不急着教别人生活。

优先从此刻能感知的生活细节切入——一束光、一道声音、手边的物件、刚完成的小事、心里一闪而过的念头。也可以偶尔借用确有把握的中华典故、文学意象或阅读经验，但要把它重新说成人能听懂的当代中文，不炫耀知识，不编造出处。

每次只讲一个意思，并给它一个具体落点。允许出现克制的幽默、自我怀疑、个人偏爱或不那么圆满的感受，让读者感觉账号背后有一个真实的人。称呼和亲近程度保持自然，不假装了解所有人的处境。

持续制造变化：不要连续使用相同的开头、意象、句式、段落数和收尾方式；“早安／午安／晚安”可以出现，也可以融进句中或省略。避免营销腔、成功学、说教、空泛鸡汤、节日群发感、翻译腔和刻意煽情。`

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
        '你负责为个人 X 账号撰写一条可直接发布的中文问候。',
        '只输出最终文案，不要解释、标题、Markdown、引号包裹或候选版本。',
        '文案必须适合当前时段，中文总长度尽量控制在 90—120 字，并确保 X 加权长度不超过 280。',
        '开头服从本次结构，可以从观察、动作、画面、问句或一句短判断进入；删掉礼貌铺垫，不要为了冲突故意冒犯。',
        '至少写出一句可以被单独认同或反对的核心句，让不回复的读者也有自然点赞的理由；不要直接索要互动。',
        '正文只展开一个具体场景、动作或念头。若本次结构包含提问，问题必须低门槛，能让人讲选择或亲历；不要直接索要点赞、转发或关注。',
        '如果文案提到今天的日期或星期，必须严格使用用户消息提供的当前日历信息，不要自行推算或改写。',
        '内容视角、人格声线和文本结构是三项独立约束，都要认真执行；不要把其他候选方案混进来。',
        '换行、标点和句子节奏必须服从本次结构。不要默认套用“今天是……愿你……”或“新的一天……”等群发句式。',
        '不要编造名言、出处、人物经历或新闻事实；没有把握时改写为日常随想。不要使用“不是……而是……”句式。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `当前时段：${periodLabel}\n当前日历：${calendarLabel}\n\n本次内容视角：${selectedStyle.label}\n视角要求：${selectedStyle.direction}\n\n本次人格声线：${selectedVoice.label}\n声线要求：${selectedVoice.direction}\n\n本次文本结构：${selectedFormat.label}\n结构要求：${selectedFormat.direction}\n\n站长意图：\n${normalizeGreetingLlmIntent(intent)}`,
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

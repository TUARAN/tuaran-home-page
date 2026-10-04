import { shanghaiDateKey } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

const HARD_WEIGHT_LIMIT = 220

function clock(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

function jokeWindow(prefix, label, count, startMinutes, intervalMinutes) {
  return Array.from({ length: count }, (_, index) => {
    const id = `joke_${prefix}_${String(index + 1).padStart(2, '0')}`
    return [id, Object.freeze({
      id,
      label: `${label} ${index + 1}/${count}`,
      time: clock(startMinutes + index * intervalMinutes),
    })]
  })
}

export const X_JOKE_SLOTS = Object.freeze(Object.fromEntries([
  ...jokeWindow('morning', '早间短帖', 4, 6 * 60, 72),
  ...jokeWindow('afternoon', '下午短帖', 3, 15 * 60 + 18, 108),
  // 22:00—次日 01:20；00:00—01:20 的节点按其实际自然日去重。
  ...jokeWindow('night', '深夜短帖', 3, 22 * 60, 100),
]))

// 仅用于识别历史短帖，生成链路不再从词库选取或强制添加开场。
const LEGACY_JOKE_HOOKS = Object.freeze([
  '暴论',
  '不懂就问',
  '突然发现',
  '冷知识',
  '划重点',
  '说句扎心的',
  '成年人真相',
  '✈️',
  '5️⃣',
])

const JOKE_ANGLES = Object.freeze([
  '上班、摸鱼、会议、下班和成年人有限的精力',
  '吃饭、睡觉、咖啡、外卖和减肥计划之间的小冲突',
  '手机、AI、软件更新、会员续费和数字生活里的小尴尬',
  '拖延、健忘、社交电量和嘴硬心软的日常瞬间',
  '买东西、攒钱、快递、家务和周末安排里的自我打脸',
  '朋友聊天、群消息、已读不回和临时取消计划的默契',
])

export function normalizeXJokeSlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_JOKE_SLOTS[slot] ? slot : fallback
}

export function xJokeLastRunKey(slot) {
  return `automation.x_joke.last_run.${normalizeXJokeSlot(slot)}`
}

function stableIndex(value, length) {
  let hash = 0
  for (const character of String(value || '')) hash = (hash * 31 + character.codePointAt(0)) >>> 0
  return hash % length
}

export function pickXJokeAngle({ slot = 'joke_morning_01', now = new Date() } = {}) {
  const normalizedSlot = normalizeXJokeSlot(slot, 'joke_morning_01')
  return JOKE_ANGLES[stableIndex(`${shanghaiDateKey(now)}:${normalizedSlot}`, JOKE_ANGLES.length)]
}

export function buildXJokeMessages({ slot = 'joke_morning_01', now = new Date(), recentTexts = [] } = {}) {
  const normalizedSlot = normalizeXJokeSlot(slot, 'joke_morning_01')
  const angle = pickXJokeAngle({ slot: normalizedSlot, now })
  const recent = (Array.isArray(recentTexts) ? recentTexts : [])
    .map((text) => String(text || '').trim())
    .filter(Boolean)
    .slice(0, 24)
    .join('\n---\n') || '无'
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号写一条可以直接发布的中文纯文字段子。',
        '只输出最终文案，不要标题、解释、Markdown、话题标签、链接、引号包裹或候选版本。',
        '写一个日常、具体、能在几秒内看懂的小包袱。可以自嘲，可以观察生活，但不要像段子模板、营销文案、鸡汤或新闻评论。',
        '正文 25—90 个汉字，共 3—6 行，每行只写一个短句并尽量不超过 16 个汉字。',
        '开场和句式由你根据内容自然决定，不套用固定口头禅、编号、emoji 钩子或轮换词库；连续两条不要使用相同结构。',
        '结尾落在反差、误会、自我打脸或一句轻巧的补刀上。不要把多句话挤成一个长段落。',
        '不得编造真实经历、身份、收入、城市、天气、数据或他人的隐私。避免攻击群体、低俗内容、灾难、疾病和未成年人。',
        '不要索要点赞、转发、关注或回复，不要写早安午安晚安，不要使用“不是……而是……”句式。',
        'emoji 只是偶尔点缀：大多数文案不用；需要时最多一个，并且必须与句意相关。',
        `X 加权长度不得超过 ${HARD_WEIGHT_LIMIT}。`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `日期轮换键：${shanghaiDateKey(now)}（正文不要写日期）`,
        `本次时段：${X_JOKE_SLOTS[normalizedSlot].label}`,
        `可参考的素材方向：${angle}。这只是灵感，不合适时可以换成更自然、具体的新场景。`,
        '最近已经发布的段子如下。不要复用相同场景、句法、反转或收尾：',
        recent,
        '写得像本人刚想到就发出来的一句话。',
      ].join('\n'),
    },
  ]
}

function compactLines(value) {
  return String(value || '')
    .split(/\n+/u)
    .flatMap((line) => line.match(/[^。！？!?；;]+[。！？!?；;]?/gu) || [])
    .flatMap((line) => Array.from(line).length > 18 ? (line.match(/[^，,]+[，,]?/gu) || [line]) : [line])
    .map((line) => line.trim())
    .filter(Boolean)
}

export function normalizeXJokeText(value) {
  let text = String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^```(?:text|markdown)?\s*\n?|\n?```$/gi, '')
    .replace(/^(?:最终文案|推文|文案|段子)\s*[：:]\s*/i, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/#[^\s#]+/gu, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if ((text.startsWith('“') && text.endsWith('”')) || (text.startsWith('"') && text.endsWith('"'))) {
    text = text.slice(1, -1).trim()
  }
  text = text.replace(/^[“"]|[”"]$/gu, '').trim()
  text = compactLines(text).join('\n')
  if (weightedTextLength(text) <= HARD_WEIGHT_LIMIT) return text
  let result = ''
  for (const character of Array.from(text)) {
    if (weightedTextLength(`${result}${character}…`) > HARD_WEIGHT_LIMIT) break
    result += character
  }
  return `${result.trimEnd()}…`
}

export function xJokeWithinTarget(value) {
  const text = String(value || '').trim()
  return Boolean(text) && weightedTextLength(text) <= HARD_WEIGHT_LIMIT
}

function comparableJokeText(value) {
  const lines = String(value || '').trim().split(/\n+/u)
  if (lines.length > 1 && LEGACY_JOKE_HOOKS.some((hook) => lines[0].replace(/[：:]$/u, '') === hook.replace(/[：:]$/u, ''))) {
    lines.shift()
  }
  return lines.join('').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')
}

function ngrams(value, size = 2) {
  const characters = Array.from(value)
  if (characters.length < size) return new Set(characters)
  return new Set(Array.from({ length: characters.length - size + 1 }, (_, index) => characters.slice(index, index + size).join('')))
}

export function isXJokeTooSimilar(value, recentTexts = [], threshold = 0.72) {
  const candidate = comparableJokeText(value)
  if (!candidate) return false
  const candidateGrams = ngrams(candidate)
  return (Array.isArray(recentTexts) ? recentTexts : []).some((recentText) => {
    const recent = comparableJokeText(recentText)
    if (!recent) return false
    if (candidate === recent) return true
    const shorterLength = Math.min(Array.from(candidate).length, Array.from(recent).length)
    if (shorterLength >= 12 && (candidate.includes(recent) || recent.includes(candidate))) return true
    const recentGrams = ngrams(recent)
    const intersection = [...candidateGrams].filter((gram) => recentGrams.has(gram)).length
    const union = new Set([...candidateGrams, ...recentGrams]).size
    return union > 0 && intersection / union >= threshold
  })
}

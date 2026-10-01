import { shanghaiDateKey } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

const HARD_WEIGHT_LIMIT = 220

export const X_JOKE_SLOTS = Object.freeze({
  joke_morning: Object.freeze({ id: 'joke_morning', label: '上午随机段子', time: '10:30' }),
  joke_afternoon: Object.freeze({ id: 'joke_afternoon', label: '下午随机段子', time: '15:30' }),
  joke_evening: Object.freeze({ id: 'joke_evening', label: '晚上随机段子', time: '21:00' }),
})

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

export function pickXJokeAngle({ slot = 'joke_morning', now = new Date() } = {}) {
  const normalizedSlot = normalizeXJokeSlot(slot, 'joke_morning')
  return JOKE_ANGLES[stableIndex(`${shanghaiDateKey(now)}:${normalizedSlot}`, JOKE_ANGLES.length)]
}

export function buildXJokeMessages({ slot = 'joke_morning', now = new Date(), recentTexts = [] } = {}) {
  const normalizedSlot = normalizeXJokeSlot(slot, 'joke_morning')
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
        '正文 25—90 个汉字，最多三小段。开头直接进入场景或判断，结尾落在反差、误会、自我打脸或一句轻巧的补刀上。',
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
        `本次素材方向：${angle}`,
        '最近已经发布的段子如下。不要复用相同场景、句法、反转或收尾：',
        recent,
        '写得像本人刚想到就发出来的一句话。',
      ].join('\n'),
    },
  ]
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

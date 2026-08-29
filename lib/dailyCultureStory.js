import { shanghaiDateKey } from './dailyGreeting.js'

export const CULTURE_STORY_SLOTS = Object.freeze({
  culture_morning: { id: 'culture_morning', label: '上午短故事', time: '10:00' },
  culture_afternoon: { id: 'culture_afternoon', label: '下午短故事', time: '16:00' },
  culture_evening: { id: 'culture_evening', label: '晚间短故事', time: '20:00' },
})

const SLOT_IDS = Object.keys(CULTURE_STORY_SLOTS)
const FIFTEEN_POST_CYCLE = Object.freeze([
  'guoxue', 'chinese_story', 'guoxue',
  'chinese_story', 'foreign_fable', 'guoxue',
  'chinese_story', 'chinese_story', 'guoxue',
  'foreign_fable', 'chinese_story', 'guoxue',
  'chinese_story', 'guoxue', 'foreign_fable',
])

const CATEGORY_BRIEFS = Object.freeze({
  guoxue: {
    label: '国学哲思',
    instruction: '选一个可靠的先秦诸子、经史典籍或传统思想观念，用一个具体情境解释其含义和今天仍可使用的判断方法。',
  },
  chinese_story: {
    label: '中华寓言或历史小故事',
    instruction: '选一个出处可靠的中国寓言、成语故事或历史小故事，讲清人物遇到什么问题、做了什么、结果如何，以及故事说明的道理。',
  },
  foreign_fable: {
    label: '国外童话或寓言',
    instruction: '选一个出处可靠、适合中文读者的国外寓言或童话片段，讲清关键情节与启示；注明作品或传统来源，不生造外国名言。',
  },
})

export function normalizeCultureStorySlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return CULTURE_STORY_SLOTS[slot] ? slot : fallback
}

export function cultureStoryLastRunKey(slot) {
  return `automation.x_culture_story.last_run.${normalizeCultureStorySlot(slot)}`
}

function shanghaiDayNumber(now = new Date()) {
  const [year, month, day] = shanghaiDateKey(now).split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function cultureStoryCategory({ slot = 'culture_morning', now = new Date() } = {}) {
  const normalizedSlot = normalizeCultureStorySlot(slot, 'culture_morning')
  const slotIndex = SLOT_IDS.indexOf(normalizedSlot)
  const cycleIndex = (shanghaiDayNumber(now) * SLOT_IDS.length + slotIndex) % FIFTEEN_POST_CYCLE.length
  return FIFTEEN_POST_CYCLE[cycleIndex]
}

export function buildCultureStoryMessages({ slot = 'culture_morning', now = new Date() } = {}) {
  const normalizedSlot = normalizeCultureStorySlot(slot, 'culture_morning')
  const slotInfo = CULTURE_STORY_SLOTS[normalizedSlot]
  const category = cultureStoryCategory({ slot: normalizedSlot, now })
  const brief = CATEGORY_BRIEFS[category]
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文文化短文。',
        '只输出最终文案，不要标题、Markdown、候选版本或写作说明。',
        '首句先下一个鲜明、可辩论的判断或指出故事里最反常识的一刀，随后讲清故事或观念，不从百科背景铺起。',
        '至少留下一句可以脱离上下文被认同或反对的核心判断，让沉默读者也有自然点赞的理由，但不要直接索要互动。',
        '用自然准确的现代汉语写成一个完整小段：用具体情节支撑判断，结尾提出一个读者能结合现实选择或经历回答的问题。',
        '控制在约 105—130 个汉字，X 加权长度必须不超过 280；不要用标签堆砌字数。',
        '史实、人物、典籍、作品名和故事情节必须可靠。无法确认原句时只转述含义，不伪造引文或出处。',
        '语气犀利但不刻薄，有知识含量。不要强行拔高，不要直接索要点赞、转发或关注；避免说教、鸡汤、营销腔和“不是……而是……”句式。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `发布时间：${slotInfo.time}（北京时间）`,
        `本次类别：${brief.label}`,
        `选题要求：${brief.instruction}`,
        `轮换标识：${shanghaiDateKey(now)}-${normalizedSlot}，请避免写成常见百科摘要。`,
        '配比规则由系统按 15 条循环控制：国学哲思 40%、中华寓言或历史小故事 40%、国外童话或寓言 20%。',
      ].join('\n'),
    },
  ]
}

import { greetingCalendarLabel, shanghaiDateKey } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

export const X_COMMUNITY_SLOTS = Object.freeze({
  community_friends: Object.freeze({ id: 'community_friends', label: '认识新朋友', time: '09:30' }),
  community_learning: Object.freeze({ id: 'community_learning', label: '蓝 V 交流', time: '15:00' }),
  community_growth: Object.freeze({ id: 'community_growth', label: '互关串门', time: '19:00' }),
})

export const X_COMMUNITY_VARIANTS = Object.freeze([
  Object.freeze({"id": "open_introduction", "slot": "community_friends", "label": "交个朋友", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "打招呼，欢迎新朋友说说平时爱发什么；可以自然表达想认识互相关注后还会聊天的人。", "question": "你的时间线里，哪类内容最多？"}),
  Object.freeze({"id": "coffee_first_chat", "slot": "community_friends", "label": "咖啡搭子", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "拿咖啡当聊天开场，聊日常喜好，轻松邀请交朋友。", "question": "咖啡党还是茶党？"}),
  Object.freeze({"id": "city_walk", "slot": "community_friends", "label": "同城串门", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "从不同城市的生活节奏开始认识朋友，不编造自己的所在地。", "question": "你那里现在热不热？"}),
  Object.freeze({"id": "global_friends", "slot": "community_friends", "label": "新朋友报到", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "欢迎刚认识的推友，用一个兴趣打开话题，表达互关后常交流的愿望。", "question": "用三个词介绍你的兴趣，会选什么？"}),
  Object.freeze({"id": "knowledge_exchange", "slot": "community_learning", "label": "蓝 V 交流", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "邀请蓝 V 推友交流日常发帖习惯，也欢迎非蓝 V，认证不代表人的价值，不声称自己已经认证。", "question": "你更常发原创还是回评论？"}),
  Object.freeze({"id": "tech_builders", "slot": "community_learning", "label": "时间线同好", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "聊关注列表里喜欢的内容，欢迎蓝 V 和普通推友交换兴趣，避免涨粉营销。", "question": "你最愿意停下来看哪种帖子？"}),
  Object.freeze({"id": "reading_circle", "slot": "community_learning", "label": "小号也有趣", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "以轻松口吻认识认真分享的推友，蓝 V 与非蓝 V 都欢迎，不按粉丝数筛朋友。", "question": "最近发过哪条自己很喜欢的内容？"}),
  Object.freeze({"id": "long_journey", "slot": "community_growth", "label": "互关串门", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "表达希望互关之后偶尔聊天、常来串门，承认回复需要时间，不承诺自动回关。", "question": "今天有什么小事值得开心一下？"}),
  Object.freeze({"id": "indie_creators", "slot": "community_growth", "label": "推友下班啦", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "从收工后的轻松话题交朋友，加入友善自嘲，邀请推友交换日常。", "question": "收工后先吃饭还是先躺一会儿？"}),
  Object.freeze({"id": "creative_garden", "slot": "community_growth", "label": "常来聊聊", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "轻松、口语、带一点猫咪表情包式幽默，像在评论区聊天。", "direction": "聊互关文化里的熟面孔，从一次简单问候发展为真实交流，不搞互动任务。", "question": "你会记住推友的头像还是昵称？"}),
])

const VARIANTS_BY_SLOT = Object.freeze(Object.fromEntries(
  Object.keys(X_COMMUNITY_SLOTS).map((slot) => [slot, X_COMMUNITY_VARIANTS.filter((item) => item.slot === slot)]),
))

export function normalizeXCommunitySlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_COMMUNITY_SLOTS[slot] ? slot : fallback
}

export function xCommunityLastRunKey(slot) {
  return `automation.x_community.last_run.${normalizeXCommunitySlot(slot)}`
}

function shanghaiDayNumber(now = new Date()) {
  const [year, month, day] = shanghaiDateKey(now).split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function pickXCommunityVariant({ slot = 'community_friends', now = new Date() } = {}) {
  const normalizedSlot = normalizeXCommunitySlot(slot, 'community_friends')
  const pool = VARIANTS_BY_SLOT[normalizedSlot]
  return pool[shanghaiDayNumber(now) % pool.length]
}

function resolveVariant(slot, variant) {
  const normalizedSlot = normalizeXCommunitySlot(slot, 'community_friends')
  return X_COMMUNITY_VARIANTS.find((item) => item.id === variant?.id && item.slot === normalizedSlot)
    || VARIANTS_BY_SLOT[normalizedSlot][0]
}

export function normalizeXCommunityText(value, slot = 'community_friends', limit = 280, variant) {
  resolveVariant(slot, variant)
  const rawBody = String(value || '')
    .replace(/#[^\s#]+/gu, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const bodyLimit = Math.max(0, limit)
  let body = ''
  let weight = 0
  for (const character of Array.from(rawBody)) {
    const characterWeight = weightedTextLength(character)
    if (weight + characterWeight > bodyLimit) break
    body += character
    weight += characterWeight
  }
  return body.trim()
}

export function buildXCommunityMessages({ slot = 'community_friends', now = new Date(), variant } = {}) {
  const normalizedSlot = normalizeXCommunitySlot(slot, 'community_friends')
  const slotInfo = X_COMMUNITY_SLOTS[normalizedSlot]
  const selected = resolveVariant(normalizedSlot, variant || pickXCommunityVariant({ slot: normalizedSlot, now }))
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文交友帖。',
        '只输出最终文案，不要标题、Markdown、引号包裹、候选版本或写作说明。',
        '使用第一人称，写出一种真实可感的偏好、态度或交流方式，让账号像一个具体的人；不要编造职业、项目成绩、城市、经历或数据。',
        '每条只围绕一个具体场景。首句直接打招呼或抛出轻松的话题，随后邀请互相关注、交朋友或聊日常。',
        '自然使用 2—4 个 emoji（如 👋 🐱 ☕ 💙），不堆表情，不制造争论。',
        '结尾可以是一个容易回答的生活小问题，也可以是轻松邀请，不要每条都逼人回答。避免“你怎么看”“还有谁”这类空问题。',
        '自然提到愿意互相关注、交朋友或继续交流，但不要只写“互关”“求关注”，不要命令读者点赞、转发或评论。',
        '可以用“推友们”“来交个朋友”等自然开场，不要把日期和星期写进正文。',
        '可以犀利、有取舍，但不能刻薄、攻击群体或制造虚假冲突。不要使用“不是……而是……”这类模板化对比句，不写空泛鸡汤、营销口号或夸张承诺。',
        '控制在约 35—75 个汉字，X 加权长度必须不超过 280。',
        '不要承诺秒回关、百分百回关或收益，不组织点赞转发交换，不假称已经关注或回复某个人；蓝 V 与非蓝 V 都欢迎。',
        '不要使用任何话题标签，让正文和问题承担传播作用。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `当前日历：${greetingCalendarLabel({ now })}（仅用于轮换，正文不要复述）`,
        `发布时间：${slotInfo.time}（北京时间）`,
        `本次人物感：${selected.voice}`,
        `本次交友场景：${selected.label}`,
        `写作方向：${selected.direction}`,
        `建议落点：${selected.question}`,
        '文案围绕本次交友场景，脱离配图也能独立阅读，不要使用“看图”“如图”等指代。首句直接进入个人观察或具体邀请；不要复用上一条的句式。',
      ].join('\n'),
    },
  ]
}

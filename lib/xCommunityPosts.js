import { greetingCalendarLabel, shanghaiDateKey } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

export const X_COMMUNITY_SLOTS = Object.freeze({
  community_friends: Object.freeze({ id: 'community_friends', label: '认识新朋友', time: '09:30' }),
  community_learning: Object.freeze({ id: 'community_learning', label: '蓝 V 交流', time: '15:00' }),
  community_growth: Object.freeze({ id: 'community_growth', label: '互关串门', time: '19:00' }),
})

export const X_COMMUNITY_VARIANTS = Object.freeze([
  Object.freeze({"id": "open_introduction", "slot": "community_friends", "label": "交个朋友", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "随口认识人，像在楼下碰到，不问简历。", "direction": "先说自己最近爱看或爱发的一类内容，再欢迎对得上的人来聊；互关可以提，但不要当整条帖的目的。", "question": "你时间线里刷到最多的，是哪一类？"}),
  Object.freeze({"id": "coffee_first_chat", "slot": "community_friends", "label": "咖啡搭子", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "有口味偏好，但不辩论，也不做饮品安利。", "direction": "从自己今早喝了什么或想喝什么开场，像跟邻座随口一句。", "question": "你现在桌上是咖啡、茶，还是白开水？"}),
  Object.freeze({"id": "city_walk", "slot": "community_friends", "label": "同城串门", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "各地作息不一样，好奇但不打听住址。", "direction": "从不同地方的生活节奏认识人，不编造自己的所在地，不点名城市。", "question": "你那边现在更像刚起步，还是已经过午了？"}),
  Object.freeze({"id": "global_friends", "slot": "community_friends", "label": "新朋友报到", "imagePath": "/images/x-memes/meme.png", "tags": [], "voice": "欢迎刚刷到的人，用一个具体兴趣开场，不像在办见面会。", "direction": "用一个自己的小兴趣打开话题；想继续聊再自然说一声，不要保证互关后天天出现。", "question": "最近让你多看了两眼的兴趣是什么？"}),
  Object.freeze({"id": "knowledge_exchange", "slot": "community_learning", "label": "蓝 V 交流", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "把认证当成标记，不当成人的等级。", "direction": "聊日常发帖习惯，蓝 V 和非蓝 V 都欢迎；不声称自己已经认证，也不按粉丝数筛人。", "question": "你更常发原创，还是更常在评论区说话？"}),
  Object.freeze({"id": "tech_builders", "slot": "community_learning", "label": "时间线同好", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "时间线口味很具体，想找同好，但不搞涨粉任务。", "direction": "说一种自己会停下来看的帖子，邀请口味相近的人冒个头，避免互关营销。", "question": "哪种帖子会让你真的停下来？"}),
  Object.freeze({"id": "reading_circle", "slot": "community_learning", "label": "小号也有趣", "imagePath": "/images/x-memes/blue.png", "tags": [], "voice": "喜欢看人分享自己在意的东西，不按粉丝数筛。", "direction": "认识认真分享的人，蓝 V 与非蓝 V 都欢迎；可以请对方丢一条自己喜欢的旧帖，不要布置作业。", "question": "最近哪条自己发的内容，你还挺喜欢？"}),
  Object.freeze({"id": "long_journey", "slot": "community_growth", "label": "互关串门", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "互关之后偶尔冒头就很好，回复可以慢。", "direction": "承认自己回复需要时间，欢迎偶尔来串门的人；不承诺自动回关，也不把互关写成任务。", "question": "今天有哪件很小的事，让你心情好了一点？"}),
  Object.freeze({"id": "indie_creators", "slot": "community_growth", "label": "推友下班啦", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "收工后的人话，带一点自嘲，不布置互动作业。", "direction": "从收工后想吃饭还是想躺一会儿说起，交换日常即可。", "question": "收工后你是先吃饭，还是先躺一会儿？"}),
  Object.freeze({"id": "creative_garden", "slot": "community_growth", "label": "常来聊聊", "imagePath": "/images/x-memes/evening.png", "tags": [], "voice": "熟面孔靠反复遇见，不靠打卡。", "direction": "聊互关之后慢慢变成眼熟的人，从一次简单问候变成真的会看对方发什么；不搞点赞转发任务。", "question": "你记住推友，是先记住头像，还是先记住说话方式？"}),
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
        '你负责为个人 X 账号写一条可直接发出去的中文交友帖。',
        '只输出最终文案，不要标题、Markdown、引号包裹、候选版本或写作说明。',
        '像在评论区跟人说话，不像在发互关广告。用第一人称，写出一种真实可感的偏好或态度。不要编造职业、项目成绩、城市、经历或数据。',
        '每条只围绕一个具体场景。先说自己的话，再看要不要留一个容易接的口。',
        'emoji 可有可无，最多两个，别堆。不要制造争论。',
        '结尾可以是一句容易接的话，也可以自然收住，不要每条都逼人回答。避免“你怎么看”“还有谁”这类空问题。',
        '可以欢迎交朋友、互相关注或继续聊，但不要把整条写成“来交个朋友 + 求互关”。不要只写“互关”“求关注”，不要命令点赞、转发或评论。',
        '不要用“推友们大家好”“家人们”开场，不要把日期和星期写进正文。',
        '可以犀利、有取舍，但不能刻薄、攻击群体或制造虚假冲突。不要使用“不是……而是……”句式，不写空泛鸡汤、营销口号或夸张承诺。',
        '大约 40—90 个汉字，X 加权长度必须不超过 280。',
        '不要承诺秒回关、百分百回关或收益，不组织点赞转发交换，不假称已经关注或回复某个人；蓝 V 与非蓝 V 都欢迎。',
        '不要使用任何话题标签。',
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
        '文案围绕本次交友场景，脱离配图也能独立阅读，不要使用“看图”“如图”等指代。首句直接进入个人观察；不要复用“来交个朋友，欢迎互关”的句式。',
      ].join('\n'),
    },
  ]
}

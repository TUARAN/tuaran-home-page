import { greetingCalendarLabel, shanghaiDateKey } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

export const X_COMMUNITY_SLOTS = Object.freeze({
  community_friends: Object.freeze({ id: 'community_friends', label: '认识新朋友', time: '09:00' }),
  community_learning: Object.freeze({ id: 'community_learning', label: '寻找同好', time: '15:00' }),
  community_growth: Object.freeze({ id: 'community_growth', label: '结伴成长', time: '19:00' }),
})

export const X_COMMUNITY_VARIANTS = Object.freeze([
  Object.freeze({
    id: 'open_introduction', slot: 'community_friends', label: '开放式自我介绍',
    imagePath: '/images/x-community/make-friends.jpg', tags: ['#交个朋友', '#互相关注'],
    voice: '坦诚、轻松，像在一张新桌子旁主动留出座位。',
    direction: '说清自己更愿意认识认真做事、持续学习、乐于交流的人，邀请对方用一句话介绍正在关注的事情。',
    question: '你最近把时间花在哪件值得继续的事情上？',
  }),
  Object.freeze({
    id: 'coffee_first_chat', slot: 'community_friends', label: '咖啡初聊',
    imagePath: '/images/x-community/coffee-chat.jpg', tags: ['#认识新朋友', '#真诚交流'],
    voice: '安静、真诚、有一点生活感，像第一次线下喝咖啡时慢慢打开话题。',
    direction: '从“比起寒暄，更喜欢聊正在经历的真实问题”切入，寻找愿意认真听、也愿意分享的人。',
    question: '如果坐下来聊半小时，你最想交换哪个话题？',
  }),
  Object.freeze({
    id: 'city_walk', slot: 'community_friends', label: '城市散步搭子',
    imagePath: '/images/x-community/city-walk.jpg', tags: ['#城市漫游', '#交个朋友'],
    voice: '松弛、观察细腻，带一点周末散步的呼吸感。',
    direction: '邀请喜欢边走边聊、观察城市、拍照或记录日常的人认识彼此，不把交友写成任务。',
    question: '你所在的城市，有哪条路适合边走边聊？',
  }),
  Object.freeze({
    id: 'global_friends', slot: 'community_friends', label: '跨地域同路人',
    imagePath: '/images/x-community/global-friends.jpg', tags: ['#认识新朋友', '#同路人'],
    voice: '开放、好奇，尊重不同城市、行业和生活经验。',
    direction: '表达对不同背景与视角的兴趣，邀请对方分享所在城市、所做领域或近期观察。',
    question: '你来自哪里，最近正在观察什么变化？',
  }),
  Object.freeze({
    id: 'knowledge_exchange', slot: 'community_learning', label: '知识交换桌',
    imagePath: '/images/x-community/learn-together.jpg', tags: ['#互相学习', '#交个朋友'],
    voice: '谦逊、具体，像把自己的笔记摊开，也愿意看别人的解法。',
    direction: '邀请大家交换一个刚学会的方法、踩过的坑或值得保存的资料，强调交流可以从一件小事开始。',
    question: '你最近学会的哪件小事，可能正好帮到别人？',
  }),
  Object.freeze({
    id: 'tech_builders', slot: 'community_learning', label: '技术共创伙伴',
    imagePath: '/images/x-community/tech-builders.jpg', tags: ['#技术人交友', '#一起折腾'],
    voice: '有行动感、有技术人的幽默，但不堆术语。',
    direction: '寻找正在写代码、做产品、研究 AI 或打磨小工具的人，邀请交流正在折腾的项目和卡点。',
    question: '你手上那个还没做完的小项目，最有意思的部分是什么？',
  }),
  Object.freeze({
    id: 'reading_circle', slot: 'community_learning', label: '读书讨论搭子',
    imagePath: '/images/x-community/reading-circle.jpg', tags: ['#读书搭子', '#以书会友'],
    voice: '温和、有思考感，不摆书单优越感。',
    direction: '从一本书留下的问题或一个改变看法的观点切入，寻找愿意讨论而非只报书名的朋友。',
    question: '最近哪本书让你停下来想了很久？',
  }),
  Object.freeze({
    id: 'long_journey', slot: 'community_growth', label: '长期同行者',
    imagePath: '/images/x-community/grow-together.jpg', tags: ['#携手成长', '#一路同行'],
    voice: '稳重、克制，重视长期交流，不喊口号。',
    direction: '寻找愿意长期分享实践、互相提醒和见证小进步的人，承认成长有快有慢。',
    question: '未来一年，你最想持续推进哪件事？',
  }),
  Object.freeze({
    id: 'indie_creators', slot: 'community_growth', label: '独立创作者同盟',
    imagePath: '/images/x-community/indie-creators.jpg', tags: ['#独立创作者', '#创作者交友'],
    voice: '有创作现场感，坦率但不卖惨，重视真实反馈。',
    direction: '寻找写作、设计、播客、摄影或独立做产品的人，邀请交换未完成作品背后的判断与困难。',
    question: '你最近在做什么还没公开、但很想完成的作品？',
  }),
  Object.freeze({
    id: 'creative_garden', slot: 'community_growth', label: '慢慢生长的伙伴',
    imagePath: '/images/x-community/creative-garden.jpg', tags: ['#长期主义', '#成长搭子'],
    voice: '温暖、落地，用植物生长的画面感表达耐心，但不写成鸡汤。',
    direction: '邀请重视长期积累、愿意定期交流进展的人，从一个微小而持续的目标开始认识。',
    question: '你正在耐心养大的那个目标是什么？',
  }),
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
  const selected = resolveVariant(slot, variant)
  const suffix = `\n\n${selected.tags.join(' ')}`
  const rawBody = String(value || '')
    .replace(/#[^\s#]+/gu, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const bodyLimit = Math.max(0, limit - weightedTextLength(suffix))
  let body = ''
  let weight = 0
  for (const character of Array.from(rawBody)) {
    const characterWeight = weightedTextLength(character)
    if (weight + characterWeight > bodyLimit) break
    body += character
    weight += characterWeight
  }
  return `${body.trim()}${suffix}`.trim()
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
        '每条只围绕一个具体场景，写清想认识什么样的朋友、可以聊什么，并提出一个容易回答的具体问题。',
        '自然提到愿意互相关注或继续交流，但不要只写“互关”“求关注”，不要命令读者点赞、转发或评论。',
        '不要以“早安”“午安”“晚安”“今天想认识一些朋友”开头，不要把日期和星期写进正文。',
        '不要使用“不是……而是……”这类模板化对比句，不写空泛鸡汤、营销口号或夸张承诺。',
        '控制在约 70—105 个汉字，X 加权长度必须不超过 280。',
        `结尾必须原样保留且只使用这两个标签：${selected.tags.join(' ')}`,
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

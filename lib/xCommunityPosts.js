import { greetingCalendarLabel } from './dailyGreeting.js'
import { weightedTextLength } from './xDistribution.js'

export const X_COMMUNITY_SLOTS = Object.freeze({
  community_friends: Object.freeze({
    id: 'community_friends',
    label: '认识蓝朋友',
    time: '09:00',
    imagePath: '/images/x-community/make-friends.jpg',
    tags: ['#交个朋友', '#互相关注'],
    direction: '邀请不同领域的人简单介绍自己正在做、正在学或最近关注的事；表达愿意从真诚交流开始认识新朋友。',
  }),
  community_learning: Object.freeze({
    id: 'community_learning',
    label: '互相学习',
    time: '15:00',
    imagePath: '/images/x-community/learn-together.jpg',
    tags: ['#互相学习', '#共同进步'],
    direction: '邀请大家分享最近学到的一件小事、一个方法或一次实践；强调交换经验和彼此启发。',
  }),
  community_growth: Object.freeze({
    id: 'community_growth',
    label: '携手成长',
    time: '19:00',
    imagePath: '/images/x-community/grow-together.jpg',
    tags: ['#携手成长', '#一路同行'],
    direction: '寻找愿意长期交流、分享实践和互相鼓励的同行者；表达一起积累小进步、把路走长的期待。',
  }),
})

export function normalizeXCommunitySlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_COMMUNITY_SLOTS[slot] ? slot : fallback
}

export function xCommunityLastRunKey(slot) {
  return `automation.x_community.last_run.${normalizeXCommunitySlot(slot)}`
}

export function normalizeXCommunityText(value, slot = 'community_friends', limit = 280) {
  const normalizedSlot = normalizeXCommunitySlot(slot, 'community_friends')
  const suffix = `\n\n${X_COMMUNITY_SLOTS[normalizedSlot].tags.join(' ')}`
  const rawBody = String(value || '')
    .replace(/(^|\s)#[^\s#]+/gu, '$1')
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

export function buildXCommunityMessages({ slot = 'community_friends', now = new Date() } = {}) {
  const normalizedSlot = normalizeXCommunitySlot(slot, 'community_friends')
  const theme = X_COMMUNITY_SLOTS[normalizedSlot]
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文图文帖。',
        '只输出最终文案，不要标题、Markdown、引号包裹、候选版本或写作说明。',
        '语气真诚、平等、自然，像在主动认识同路的朋友；不要营销腔、口号堆砌、夸张承诺或强迫互动。',
        '正文写清一个具体的交流邀请，并自然提到可以互相关注；不要只写“互关”“求关注”。',
        '控制在约 70—105 个汉字，X 加权长度必须不超过 280。',
        `结尾必须原样保留且只使用这两个标签：${theme.tags.join(' ')}`,
        '不要编造经历、数据、身份、新闻或他人观点。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `当前日历：${greetingCalendarLabel({ now })}`,
        `发布时间：${theme.time}（北京时间）`,
        `本次主题：${theme.label}`,
        `写作方向：${theme.direction}`,
        '文案要与配图的蓝色朋友、知识交流或结伴前行氛围相符，每天更换切入角度。',
      ].join('\n'),
    },
  ]
}

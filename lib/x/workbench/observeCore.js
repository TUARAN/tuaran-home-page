// 公开首页的结论与口径。只根据已经拿到的榜单和日报计算，缺行保持 null。
import { boardWindow } from './radarCore.js'

export const OBSERVED_AGENTS = Object.freeze([
  { name: '矿工阿三', handle: 'tarsixseveneig1' },
  { name: '矿长阿富', handle: 'TuaranX' },
  { name: '矿工小十三', handle: 'tuaran003' },
])

export const MEDIA_LABELS = Object.freeze({ none: '文字', image: '图文', video: '视频' })

export const ACTION_LABELS = Object.freeze([
  ['posts', '发帖'],
  ['comments', '评论'],
  ['likes', '点赞'],
  ['follows', '关注'],
  ['followBacks', '回关'],
  ['unfollows', '取关'],
])

export const METRIC_LABELS = Object.freeze({
  posts: '发帖',
  comments: '评论',
  likes: '点赞',
  follows: '关注',
  followBacks: '回关',
  unfollows: '取关',
  views: '推文曝光',
  interactions: '推文互动',
})

export const TWEET_BOARD_LIMIT = 20

export const TWEET_BOARD_NOTE = '结论按北京时间当天 8:00 起、曝光最高的已收录推文计算，最多 20 条。一条推文有多个已通过话题时，按话题名取第一个。没有话题标签时记为未采集。'

export const ACCOUNT_BOARD_NOTE = '结论按当前这张账号榜的曝光计算。统计日从北京时间每天 8:00 起。榜单只包括已收录推文。'

export const THEORY_POINTS = Object.freeze([
  {
    title: '互动次数',
    text: '次数记录接触机会。机会多，只说明接触多。',
    metrics: ['posts', 'comments', 'likes'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper#quality',
    hrefLabel: '绿皮书 · 互动质量',
  },
  {
    title: '回应',
    text: '一次接触有对方回应，才进入互动。',
    metrics: ['comments', 'followBacks'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper#mechanism',
    hrefLabel: '绿皮书 · 互动怎样形成反馈',
  },
  {
    title: '双向',
    text: '只关注、没有回声，关系停在单向。取关记下不再继续的对象。',
    metrics: ['follows', 'followBacks', 'unfollows'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper/roundtable',
    hrefLabel: '大互动圆桌',
  },
  {
    title: '被看见',
    text: '内容先被看见，后面的评论和转发才有对象。',
    metrics: ['views', 'interactions'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper',
    hrefLabel: '大互动理论绿皮书',
  },
])

export function statReportDate(now = Date.now()) {
  const { from } = boardWindow('today', now)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(from))
}

export function percentShare(part, total) {
  const value = Number(part)
  const sum = Number(total)
  if (!Number.isFinite(value) || !Number.isFinite(sum) || sum <= 0 || value < 0) return null
  return Math.round((value / sum) * 100)
}

export function concentration(entries) {
  const rows = (entries || []).filter((row) => Number(row?.value) > 0)
  const total = rows.reduce((sum, row) => sum + Number(row.value), 0)
  if (total <= 0) return null
  const top = [...rows].sort((a, b) => Number(b.value) - Number(a.value) || String(a.label).localeCompare(String(b.label), 'zh'))[0]
  return { label: top.label, value: Number(top.value), total, share: percentShare(top.value, total) }
}

export function boardDayLabel(win, from, now = Date.now()) {
  if (win === '7d') return '近 7 个统计日'
  const todayFrom = boardWindow('today', now).from
  if (!from || from === todayFrom) return '今日'
  if (win === 'yesterday') return '昨日'
  return new Date(from).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric' })
}

export function tweetBoardConclusion(items, { unavailable = false } = {}) {
  if (unavailable) return '推文收录暂时读不到。'
  const list = Array.isArray(items) ? items : []
  if (!list.length) return '今日还没有收录推文。'
  const views = list.reduce((sum, item) => sum + (Number(item.views) || 0), 0)
  if (views <= 0) return `今日曝光榜收录 ${list.length} 条推文，展示合计为 0。`
  const topicViews = new Map()
  let tagged = 0
  for (const item of list) {
    const topic = String(item.topic || '').trim()
    const view = Number(item.views) || 0
    if (!topic) continue
    tagged += view
    topicViews.set(topic, (topicViews.get(topic) || 0) + view)
  }
  const mediaViews = new Map()
  for (const item of list) {
    const label = MEDIA_LABELS[item.media] || MEDIA_LABELS.none
    mediaViews.set(label, (mediaViews.get(label) || 0) + (Number(item.views) || 0))
  }
  const media = concentration([...mediaViews].map(([label, value]) => ({ label, value })))
  const mediaSentence = media ? `形式集中在${media.label}，占曝光榜 ${media.share}%。` : ''
  if (tagged <= 0) return `话题分类未采集。今日曝光集中在${media.label}，占曝光榜 ${media.share}%。`
  const buckets = [...topicViews].map(([label, value]) => ({ label, value }))
  if (views - tagged > 0) buckets.push({ label: '未标注', value: views - tagged })
  const topic = concentration(buckets)
  if (topic.label === '未标注') {
    return `今日曝光榜里，未标注话题占 ${topic.share}%。${mediaSentence}`
  }
  return `今日曝光集中在${topic.label}，占曝光榜 ${topic.share}%。${mediaSentence}`
}

export function accountBoardConclusion(rows, dayLabel = '今日') {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return `${dayLabel}还没有收录账号。`
  const views = list.reduce((sum, row) => sum + (Number(row.views) || 0), 0)
  if (views <= 0) return `${dayLabel}账号榜收录 ${list.length} 个账号，展示合计为 0。`
  const top = concentration(list.map((row) => ({ label: `@${row.handle}`, value: Number(row.views) || 0 })))
  return `${dayLabel}曝光集中在 ${top.label}，占账号榜 ${top.share}%。`
}

export function presentRadarPerformance(row) {
  if (!row || !Number(row.tweets)) return { views: null, interactions: null, tweets: null }
  const views = Number(row.views)
  const likes = Number(row.likes)
  const reposts = Number(row.reposts)
  const replies = Number(row.replies)
  const parts = [likes, reposts, replies]
  return {
    views: Number.isFinite(views) ? views : null,
    interactions: parts.every(Number.isFinite) ? parts.reduce((sum, value) => sum + value, 0) : null,
    tweets: Number(row.tweets),
  }
}

export function agentFootnote({ reportDate } = {}) {
  const date = reportDate ? `report_date 为北京时间 ${reportDate}` : 'report_date 为动作发生的北京时间自然日'
  return `三个账号同一口径。推文曝光是已收录公开推文的展示，互动是这些推文的点赞、转发与回复之和，统计日从北京时间当天 8:00 算起。发帖、评论、点赞、关注、回关、取关来自插件日报，${date}。日报按自然日汇总，没有按 8:00 切开的明细。关注与回关分列，关注不含回关。没有日报、没有字段或没有收录推文时显示未采集。`
}

export function blankActions() {
  return { posts: null, comments: null, likes: null, follows: null, followBacks: null, unfollows: null }
}

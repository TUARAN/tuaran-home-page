// 公开首页的结论与口径。只根据已经拿到的榜单和日报计算，缺行保持 null。
import { interactionAgentCatalog } from '../../interaction/agentPool.js'
import { boardWindow } from './radarCore.js'

/** 公开首页展示共享账号池里的全部智能体；新增账号只改 `lib/interaction/agentPool.js`。 */
export const OBSERVED_AGENTS = Object.freeze(interactionAgentCatalog())

export const MEDIA_LABELS = Object.freeze({ none: '文字', image: '图文', video: '视频' })

// 公开页的动作分类：与插件日报面板同一套八类，顺序照插件。
// 关注一栏含回关（与插件面板一致，标签就叫关注）；日报仍按 follows / followBacks
// 分开入库，只在展示层合并。社群 / 删帖 / 删评论直接对应 daily report 字段。
export const ACTION_CATEGORIES = Object.freeze([
  { key: 'comments', label: '评论', fields: ['comments'] },
  { key: 'likes', label: '点赞', fields: ['likes'] },
  { key: 'follows', label: '关注', fields: ['follows', 'followBacks'] },
  { key: 'unfollows', label: '取关', fields: ['unfollows'] },
  { key: 'posts', label: '发帖', fields: ['posts'] },
  { key: 'communityShares', label: '社群', fields: ['communityShares'] },
  { key: 'prunes', label: '删帖', fields: ['prunes'] },
  { key: 'replyPrunes', label: '删评论', fields: ['replyPrunes'] },
])

export const ACTION_LABELS = Object.freeze(ACTION_CATEGORIES.map(({ key, label }) => [key, label]))

const ACTION_FIELDS = Object.freeze(Object.fromEntries(ACTION_CATEGORIES.map(({ key, fields }) => [key, fields])))

/** 类别计数：多字段类别（关注 + 回关）累加；全部字段缺失时保持 null。 */
export function actionCount(actions, key) {
  const fields = ACTION_FIELDS[key] || [key]
  let total = null
  for (const field of fields) {
    const value = actions?.[field]
    if (value == null) continue
    total = (total || 0) + (Number(value) || 0)
  }
  return total
}

export const METRIC_LABELS = Object.freeze({
  posts: '发帖',
  comments: '评论',
  likes: '点赞',
  follows: '关注',
  unfollows: '取关',
  communityShares: '社群',
  prunes: '删帖',
  replyPrunes: '删评论',
  views: '推文曝光',
  interactions: '推文互动',
})

export const TWEET_BOARD_LIMIT = 10

export const ACCOUNT_BOARD_LIMIT = 10

export const TWEET_BOARD_NOTE = '结论按北京时间当天 8:00 起、曝光最高的已收录推文计算，最多 10 条。一条推文有多个已通过话题时，按话题名取第一个。没有话题标签时记为未采集。'

export const ACCOUNT_HOME_NOTE = '结论按北京时间当天 8:00 起、曝光最高的已收录账号计算，最多 10 个。榜单只包括已收录推文。'

export const HOT_BOARD_TWEET_NOTE =
  '简中区 X 爆款热榜：按收藏、转发、点赞加权排序，接口兼容开源项目 xiongma0-at/x-bangdan 的 GET /api/tweets。'

export const HOT_BOARD_ACCOUNT_NOTE =
  '涨粉潜力榜：把窗口内上榜推文按作者聚合，指数来自互动总量、稳定输出与收藏密度；接口为 GET /api/creators。'

export const ACCOUNT_BOARD_NOTE = '结论按当前这张账号榜的曝光计算。统计日从北京时间每天 8:00 起。榜单只包括已收录推文。'

export const THEORY_POINTS = Object.freeze([
  {
    title: '互动次数',
    text: '次数记录接触机会。机会多，只说明接触多。',
    metrics: ['posts', 'comments', 'likes'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper#quality',
    hrefLabel: '大互动理论 · 互动质量',
  },
  {
    title: '回应',
    text: '一次接触有对方回应，才进入互动。',
    metrics: ['comments', 'follows'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper#mechanism',
    hrefLabel: '大互动理论 · 互动怎样形成反馈',
  },
  {
    title: '双向',
    text: '只关注、没有回声，关系停在单向。取关记下不再继续的对象。',
    metrics: ['follows', 'unfollows'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper/roundtable',
    hrefLabel: '大互动圆桌',
  },
  {
    title: '被看见',
    text: '内容先被看见，后面的评论和转发才有对象。',
    metrics: ['views', 'interactions'],
    href: 'https://2aran.com/resources/big-interaction-whitepaper',
    hrefLabel: '大互动理论',
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

/** 插件日报上传时刻，北京时间，精确到分（YYYY-MM-DD HH:mm）。 */
export function formatShanghaiMinute(epochMs) {
  const ms = Number(epochMs)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))
  const pick = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}`
}

function agentUpdateLine(lastUploadedAt, { pending = false } = {}) {
  if (pending) return '上次更新：读取中。'
  const formatted = formatShanghaiMinute(lastUploadedAt)
  if (formatted) return `上次更新：${formatted}（北京时间）。`
  return '上次更新：当日尚无日报上传。'
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

export function agentFootnote({ reportDate, lastUploadedAt = null, pendingUpdate = false } = {}) {
  const date = reportDate ? `report_date 为北京时间 ${reportDate}` : 'report_date 为动作发生的北京时间自然日'
  const handles = OBSERVED_AGENTS.map((agent) => `@${agent.handle}`).join('、')
  const scope = `仅统计使用智能体插件的自有账号：${handles}。分类与插件日报面板同一套八类（评论、点赞、关注、取关、发帖、社群、删帖、删评论），来自插件日报，${date}。日报按自然日汇总，关注一栏含回关。没有日报或没有字段时显示未采集。`
  return `${agentUpdateLine(lastUploadedAt, { pending: pendingUpdate })}${scope}`
}

export function hotBoardTweetConclusion(items, { unavailable = false } = {}) {
  if (unavailable) return '热榜暂时读不到。'
  const list = Array.isArray(items) ? items : []
  if (!list.length) return '今日热榜还没有数据。'
  const categories = new Map()
  for (const item of list) {
    const key = String(item.category || item.topic || '').trim() || '未分类'
    const weight = Number(item.score) || Number(item.views) || 1
    categories.set(key, (categories.get(key) || 0) + weight)
  }
  const focus = concentration([...categories].map(([label, value]) => ({ label, value })))
  if (!focus) return `今日热榜收录 ${list.length} 条推文。`
  if (focus.label === '未分类') return `今日热榜 ${list.length} 条推文里，多数尚未标注分类。`
  return `今日热榜集中在「${focus.label}」，约占加权热度 ${focus.share}%。`
}

export function hotBoardAccountConclusion(rows, dayLabel = '今日') {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return `${dayLabel}涨粉榜还没有数据。`
  const ranked = [...list].sort((a, b) => (Number(b.index) || Number(b.views) || 0) - (Number(a.index) || Number(a.views) || 0))
  const top = ranked[0]
  if (Number.isFinite(Number(top?.index))) {
    return `${dayLabel}涨粉潜力最高的是 @${top.handle}，指数 ${top.index}。`
  }
  return accountBoardConclusion(list, dayLabel)
}

export function blankActions() {
  return {
    posts: null, comments: null, likes: null, follows: null, followBacks: null, unfollows: null,
    communityShares: null, prunes: null, replyPrunes: null,
  }
}

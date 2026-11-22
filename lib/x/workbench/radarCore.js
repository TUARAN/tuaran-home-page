// 爆文雷达的纯逻辑：入库清洗、爆发指数、等级、筛选排序、榜单时间窗。
import { accountKey } from './workbenchCore.js'

const HOUR = 3_600_000
const DAY = 24 * HOUR
export const INGEST_MAX = 50
export const WATCH_MAX = 50
export const LEVELS = Object.freeze(['burst', 'fast', 'rising', 'normal'])
export const LEVEL_LABELS = Object.freeze({ burst: '爆发', fast: '高速', rising: '上升', normal: '普通' })

function count(value) {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1e10) : 0
}

function toMs(value) {
  if (typeof value === 'number') return value
  const t = Date.parse(String(value || ''))
  return Number.isFinite(t) ? t : NaN
}

// 清洗一条待入库推文；不合格返回 null。链接由账号与 id 生成，不信任调用方传入的 url。
export function normalizeIngestItem(raw, now = Date.now()) {
  const id = String(raw?.id || '').trim()
  const handle = accountKey(raw?.handle)
  const tweetAt = toMs(raw?.createdAt)
  if (!/^\d{5,25}$/.test(id) || !handle || !Number.isFinite(tweetAt)) return null
  if (tweetAt > now + HOUR || tweetAt < now - 30 * DAY) return null
  return {
    id,
    handle,
    displayName: String(raw?.displayName || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    text: String(raw?.text || '').replace(/\r\n?/g, '\n').trim().slice(0, 1000),
    url: `https://x.com/${handle}/status/${id}`,
    media: raw?.media === 'video' ? 'video' : raw?.media === 'image' ? 'image' : 'none',
    likes: count(raw?.likes),
    reposts: count(raw?.reposts),
    replies: count(raw?.replies),
    views: count(raw?.views),
    tweetAt: Math.floor(tweetAt),
  }
}

// 爆发指数 0–100：加权互动量除以发布时长的 0.8 次方（越新同样互动越“快”），再取对数压缩。
export function signalScore(item, now = Date.now()) {
  const hours = Math.max(1, (now - item.tweetAt) / HOUR)
  const weighted = item.likes + 2 * item.reposts + 1.5 * item.replies + item.views / 100
  const velocity = weighted / Math.pow(hours, 0.8)
  return Math.max(0, Math.min(100, Math.round(25 * Math.log10(1 + velocity))))
}

export function levelOf(score) {
  if (score >= 85) return 'burst'
  if (score >= 70) return 'fast'
  if (score >= 50) return 'rising'
  return 'normal'
}

export function decorate(item, now = Date.now()) {
  const score = signalScore(item, now)
  return { ...item, score, level: levelOf(score) }
}

// query: { level: 'burst'|'fast'（该级及以上）, media, minViews, minLikes, sort: 'time'|'score'|'views', handles: Set|null }
export function filterAndSort(items, query = {}, now = Date.now()) {
  const minRank = LEVELS.indexOf(query.level)
  let list = items.map((item) => decorate(item, now))
  if (minRank >= 0) list = list.filter((i) => LEVELS.indexOf(i.level) <= minRank)
  if (['none', 'image', 'video'].includes(query.media)) list = list.filter((i) => i.media === query.media)
  if (count(query.minViews)) list = list.filter((i) => i.views >= count(query.minViews))
  if (count(query.minLikes)) list = list.filter((i) => i.likes >= count(query.minLikes))
  if (query.handles) list = list.filter((i) => query.handles.has(i.handle))
  const by = {
    time: (a, b) => b.tweetAt - a.tweetAt,
    views: (a, b) => b.views - a.views,
    score: (a, b) => b.score - a.score || b.tweetAt - a.tweetAt,
  }
  return list.sort(by[query.sort] || by.score)
}

// 统计日界线：北京时间每天 08:00 即 UTC 00:00。today 为当前统计日至今，yesterday 为前一统计日，7d 为最近 7 个统计日。
export function boardWindow(key, now = Date.now()) {
  const start = Math.floor(now / DAY) * DAY
  if (key === 'yesterday') return { key, from: start - DAY, to: start }
  if (key === '7d') return { key, from: start - 6 * DAY, to: now + 1 }
  return { key: 'today', from: start, to: now + 1 }
}

export const BOARD_DIMS = Object.freeze({
  posts: { column: 'posts', label: '发帖' },
  replies: { column: 'replies', label: '评论' },
  views: { column: 'views', label: '曝光' },
  likes: { column: 'likes', label: '获赞' },
})

// X Snowflake 的时间部分，避免手动收录把旧帖标成刚发布。
export function parseTweetUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    if (url.protocol !== 'https:' || !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname) || url.username || url.password || url.port) return null
    const match = /^\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})\/?$/.exec(url.pathname)
    if (!match) return null
    const createdAt = Number((BigInt(match[2]) >> 22n) + 1288834974657n)
    return { handle: match[1], id: match[2], createdAt }
  } catch { return null }
}

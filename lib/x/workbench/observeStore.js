import { loadObservedActions } from '../../interaction/dailyTop/ownActivity.js'
import {
  OBSERVED_AGENTS,
  TWEET_BOARD_LIMIT,
  agentFootnote,
  blankActions,
  presentRadarPerformance,
  statReportDate,
  tweetBoardConclusion,
} from './observeCore.js'
import { boardWindow } from './radarCore.js'

function missingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

async function loadTweetBoard(db, from, to) {
  const { results } = await db.prepare(
    `SELECT id, handle, display_name, text, url, media, views, likes, reposts, replies
     FROM x_radar_items
     WHERE tweet_at >= ?1 AND tweet_at < ?2
     ORDER BY views DESC, tweet_at DESC, id ASC
     LIMIT ?3`
  ).bind(from, to, TWEET_BOARD_LIMIT).all()
  return results || []
}

async function loadTopics(db, ids) {
  const map = new Map()
  if (!ids.length) return { map, collision: false }
  const { results } = await db.prepare(
    `SELECT tweet_id, topic FROM x_radar_topic_suggestions
     WHERE status = 'approved' AND tweet_id IN (${ids.map(() => '?').join(', ')})
     ORDER BY topic ASC`
  ).bind(...ids).all()
  let collision = false
  for (const row of results || []) {
    const id = String(row.tweet_id || '')
    if (!id) continue
    if (map.has(id)) collision = true
    else map.set(id, String(row.topic || ''))
  }
  return { map, collision }
}

async function loadAgentRadar(db, from, to, handles) {
  const keys = handles.map((handle) => handle.toLowerCase())
  const { results } = await db.prepare(
    `SELECT lower(handle) AS handle, COUNT(*) AS tweets, SUM(views) AS views,
            SUM(likes) AS likes, SUM(reposts) AS reposts, SUM(replies) AS replies
     FROM x_radar_items
     WHERE tweet_at >= ? AND tweet_at < ? AND lower(handle) IN (${keys.map(() => '?').join(', ')})
     GROUP BY lower(handle)`
  ).bind(from, to, ...keys).all()
  return new Map((results || []).map((row) => [String(row.handle || '').toLowerCase(), row]))
}

export async function observeHome(db, now = Date.now()) {
  const win = boardWindow('today', now)
  const reportDate = statReportDate(now)
  const handles = OBSERVED_AGENTS.map((agent) => agent.handle)
  const gaps = []
  let tweets = []
  let topicMap = new Map()
  let radarUnavailable = false
  let reportsUnavailable = false

  try {
    tweets = await loadTweetBoard(db, win.from, win.to)
  } catch (error) {
    if (!missingTable(error)) throw error
    radarUnavailable = true
    gaps.push('推文收录暂时读不到。')
  }

  if (!radarUnavailable && tweets.length) {
    try {
      const topics = await loadTopics(db, tweets.map((row) => row.id))
      topicMap = topics.map
      if (topics.collision) gaps.push('有推文通过了多个话题，结论按话题名取第一个。')
    } catch (error) {
      if (!missingTable(error)) throw error
      gaps.push('话题分类未采集。')
    }
  }

  let radarByHandle = new Map()
  if (!radarUnavailable) {
    try {
      radarByHandle = await loadAgentRadar(db, win.from, win.to, handles)
    } catch (error) {
      if (!missingTable(error)) throw error
      radarUnavailable = true
      gaps.push('推文收录暂时读不到。')
    }
  }

  let actionsByHandle = new Map()
  try {
    actionsByHandle = await loadObservedActions(db, { handles, reportDate })
  } catch (error) {
    if (!missingTable(error)) throw error
    reportsUnavailable = true
    gaps.push('插件日报暂时读不到，动作次数显示未采集。')
  }

  const items = tweets.map((row) => ({
    id: row.id,
    handle: row.handle,
    displayName: row.display_name || '',
    text: String(row.text || '').slice(0, 180),
    url: row.url,
    media: row.media,
    views: Number(row.views) || 0,
    likes: Number(row.likes) || 0,
    reposts: Number(row.reposts) || 0,
    replies: Number(row.replies) || 0,
    topic: topicMap.get(String(row.id)) || '',
  }))

  return {
    ok: true,
    from: win.from,
    to: win.to,
    reportDate,
    gaps,
    reportsUnavailable,
    radarUnavailable,
    tweetConclusion: tweetBoardConclusion(items, { unavailable: radarUnavailable }),
    tweets: radarUnavailable ? [] : items,
    agents: OBSERVED_AGENTS.map((agent) => {
      const key = agent.handle.toLowerCase()
      const radar = presentRadarPerformance(radarUnavailable ? null : radarByHandle.get(key))
      return {
        name: agent.name,
        handle: agent.handle,
        actions: reportsUnavailable ? blankActions() : (actionsByHandle.get(key) || blankActions()),
        ...radar,
      }
    }),
    footnote: agentFootnote({ reportDate }),
  }
}

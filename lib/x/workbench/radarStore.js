import { WATCH_MAX, INGEST_MAX, BOARD_DIMS, boardWindow, filterAndSort, normalizeIngestItem } from './radarCore.js'
import { accountKey } from './workbenchCore.js'

// 推文按 id 去重；已存在时指标只增不减（采集时刻不同，取较大者）。
export async function ingestItems(db, userId, rawItems, now = Date.now()) {
  const list = Array.isArray(rawItems) ? rawItems.slice(0, INGEST_MAX) : []
  const items = list.map((raw) => normalizeIngestItem(raw, now)).filter(Boolean)
  if (items.length) {
    await db.batch(items.map((i) => db.prepare(
      `INSERT INTO x_radar_items (id, handle, display_name, text, url, media, likes, reposts, replies, views, tweet_at, captured_at, captured_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
       ON CONFLICT(id) DO UPDATE SET
         display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE display_name END,
         likes = MAX(likes, excluded.likes), reposts = MAX(reposts, excluded.reposts),
         replies = MAX(replies, excluded.replies), views = MAX(views, excluded.views),
         media = excluded.media, captured_at = excluded.captured_at`
    ).bind(i.id, i.handle, i.displayName, i.text, i.url, i.media, i.likes, i.reposts, i.replies, i.views, i.tweetAt, now, userId)))
  }
  return { ok: true, accepted: items.length, rejected: list.length - items.length }
}

export async function listWatch(db, userId) {
  const { results } = await db.prepare(
    'SELECT handle, note FROM x_radar_watch WHERE user_id = ?1 ORDER BY created_at'
  ).bind(userId).all()
  return results || []
}

export async function addWatch(db, userId, rawHandle, note = '', now = Date.now()) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  const existing = await db.prepare('SELECT 1 AS ok FROM x_radar_watch WHERE user_id = ?1 AND handle = ?2').bind(userId, handle).first()
  if (!existing) {
    const n = await db.prepare('SELECT COUNT(*) AS n FROM x_radar_watch WHERE user_id = ?1').bind(userId).first()
    if ((n?.n || 0) >= WATCH_MAX) return { ok: false, status: 403, error: 'WATCH_LIMIT' }
  }
  await db.prepare(
    `INSERT INTO x_radar_watch (user_id, handle, note, created_at) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(user_id, handle) DO UPDATE SET note = ?3`
  ).bind(userId, handle, String(note || '').trim().slice(0, 60), now).run()
  return { ok: true, handle }
}

export async function removeWatch(db, userId, rawHandle) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  await db.prepare('DELETE FROM x_radar_watch WHERE user_id = ?1 AND handle = ?2').bind(userId, handle).run()
  return { ok: true }
}

// 取最近 7 天的候选再在内存里打分筛选（打分依赖当前时间，不适合入库）。
export async function listRadar(db, userId, query = {}, now = Date.now()) {
  let watch = []
  if (userId) {
    try { watch = await listWatch(db, userId) } catch { watch = [] }
  }
  const topic = String(query.topic || '').slice(0, 30)
  const since = now - Math.min(168, Math.max(1, Math.floor(Number(query.hours)) || 168)) * 3_600_000
  const sql = topic
    ? `SELECT id, handle, display_name, text, url, media, likes, reposts, replies, views, tweet_at
       FROM x_radar_items WHERE tweet_at >= ?1 AND id IN (SELECT tweet_id FROM x_radar_topic_suggestions WHERE status = 'approved' AND topic = ?2) ORDER BY tweet_at DESC LIMIT 400`
    : `SELECT id, handle, display_name, text, url, media, likes, reposts, replies, views, tweet_at
       FROM x_radar_items WHERE tweet_at >= ?1 ORDER BY tweet_at DESC LIMIT 400`
  const { results } = topic
    ? await db.prepare(sql).bind(since, topic).all()
    : await db.prepare(sql).bind(since).all()
  const items = (results || []).map((r) => ({
    id: r.id, handle: r.handle, displayName: r.display_name, text: r.text, url: r.url, media: r.media,
    likes: r.likes, reposts: r.reposts, replies: r.replies, views: r.views, tweetAt: r.tweet_at,
  }))
  const handles = query.watchOnly ? new Set(watch.map((w) => w.handle)) : null
  const notes = Object.fromEntries(watch.map((w) => [w.handle, w.note]))
  const kw = String(query.q || '').trim().toLowerCase().slice(0, 60)
  const found = kw ? items.filter((i) => `${i.text} ${i.handle} ${i.displayName}`.toLowerCase().includes(kw)) : items
  const limit = Math.min(50, Math.max(1, Math.floor(Number(query.limit)) || 50))
  const list = filterAndSort(found, { ...query, handles }, now).slice(0, limit)
    .map((i) => ({ ...i, watched: i.handle in notes, note: notes[i.handle] || '' }))
  return { ok: true, items: list, watch }
}

const DAY_MS = 86_400_000

async function boardRows(db, dim, from, to) {
  const { results } = await db.prepare(
    `SELECT handle, MAX(display_name) AS display_name, COUNT(*) AS posts, SUM(replies) AS replies,
            SUM(views) AS views, SUM(likes) AS likes
     FROM x_radar_items WHERE tweet_at >= ?1 AND tweet_at < ?2
     GROUP BY handle ORDER BY ${BOARD_DIMS[dim].column} DESC, posts DESC, handle ASC LIMIT 16`
  ).bind(from, to).all()
  return (results || []).map((r, i) => ({ rank: i + 1, ...r }))
}

export async function statsDays(db, now = Date.now(), limit = 8) {
  const end = Math.floor(now / DAY_MS) * DAY_MS + DAY_MS
  const { results } = await db.prepare(
    `SELECT (tweet_at / ${DAY_MS}) * ${DAY_MS} AS day_from, COUNT(*) AS posts
     FROM x_radar_items WHERE tweet_at < ?1
     GROUP BY day_from ORDER BY day_from DESC LIMIT ?2`
  ).bind(end, limit).all()
  return (results || []).map((r) => ({ from: Number(r.day_from), posts: Number(r.posts) }))
}

function dayWindow(from) {
  const start = Math.floor(Number(from) / DAY_MS) * DAY_MS
  return { key: 'day', from: start, to: start + DAY_MS }
}

// auto：今天有收录就用今天；今天是空的就落到最近一个有收录的统计日。显式 today 不改口。
export async function leaderboard(db, windowKey, dimKey, now = Date.now()) {
  const dim = BOARD_DIMS[dimKey] ? dimKey : 'views'
  const requested = String(windowKey || 'auto')
  const days = await statsDays(db, now)
  let win = boardWindow(requested, now)
  let fallback = false
  if (requested === 'auto') {
    const today = boardWindow('today', now)
    const todayRows = await boardRows(db, dim, today.from, today.to)
    // 刚过北京时间 8 点时，当天往往只有零星公开帖。不足一屏就继续显示最近一个有收录的统计日。
    if (todayRows.length >= 8) {
      return { ok: true, window: 'today', dim, from: today.from, fallback: false, days, rows: todayRows }
    }
    const latest = days.find((day) => day.from < today.from && day.posts >= 8) || days.find((day) => day.from < today.from)
    if (!latest) {
      return { ok: true, window: 'today', dim, from: today.from, fallback: false, days, rows: [] }
    }
    win = dayWindow(latest.from)
    fallback = true
  } else if (/^\d{13}$/.test(requested)) {
    win = dayWindow(requested)
  }
  return {
    ok: true,
    window: win.key,
    dim,
    from: win.from,
    fallback,
    days,
    rows: await boardRows(db, dim, win.from, win.to),
  }
}

// 依当前采集指标重算最近七个完整统计日；不把后来采集的数据伪称为当日快照。
export async function championHistory(db, dimKey, now = Date.now()) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const board = await leaderboard(db, 'yesterday', dimKey, now - i * 86400000)
    days.push({ from: board.from, champion: board.rows[0] || null })
  }
  return { ok: true, days }
}

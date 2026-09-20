import { isPublishedRssRow } from './rssFeedVisibility'
import { parseFeed } from './rssFeedParse'
import {
  rssArticleKey,
  selectNewRssEntries,
  shouldNotifyRssFeed,
} from './rssUpdateCore'
import { findOwnerAccount } from './siteNotifications'

const FETCH_TIMEOUT_MS = 12000

function parseSeenGuids(raw) {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map((value) => String(value || '')).filter(Boolean) : []
  } catch {
    return []
  }
}

async function loadPublishedFeeds(db) {
  const result = await db
    .prepare(
      `SELECT id, site_name, site_url, rss_url, published
       FROM rss_feeds
       ORDER BY sort_order DESC, created_at DESC`
    )
    .all()
  return (result?.results || []).filter((row) => row?.rss_url && isPublishedRssRow(row))
}

async function loadCursor(db, feedId) {
  const row = await db
    .prepare(
      `SELECT feed_id, last_guid, last_pub_at, last_checked_at, seen_guids
       FROM rss_feed_cursors
       WHERE feed_id = ?1`
    )
    .bind(feedId)
    .first()
  if (!row) return null
  return {
    lastGuid: row.last_guid || '',
    lastPubAt: Number(row.last_pub_at) || 0,
    lastCheckedAt: Number(row.last_checked_at) || 0,
    seenGuids: parseSeenGuids(row.seen_guids),
  }
}

async function saveCursor(db, feedId, cursor, now) {
  await db
    .prepare(
      `INSERT INTO rss_feed_cursors (feed_id, last_guid, last_pub_at, last_checked_at, seen_guids)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(feed_id) DO UPDATE SET
         last_guid = excluded.last_guid,
         last_pub_at = excluded.last_pub_at,
         last_checked_at = excluded.last_checked_at,
         seen_guids = excluded.seen_guids`
    )
    .bind(
      feedId,
      String(cursor.lastGuid || ''),
      Number(cursor.lastPubAt) || 0,
      now,
      JSON.stringify(cursor.seenGuids || []),
    )
    .run()
}

async function fetchFeedXml(rssUrl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 2aran-rss-reader/1.0; +https://2aran.com)',
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    })
    if (!res.ok) return { ok: false, error: `UPSTREAM_${res.status}` }
    return { ok: true, xml: await res.text() }
  } catch (error) {
    return {
      ok: false,
      error: error?.name === 'AbortError' ? 'TIMEOUT' : 'FETCH_FAILED',
      detail: String(error?.message || error),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function createRssUpdateNotification(db, {
  ownerId,
  feedId,
  feedName,
  guid,
  title,
  createdAt,
}) {
  const articleKey = rssArticleKey(feedId, guid)
  const existing = await db
    .prepare(
      `SELECT id FROM comment_notifications
       WHERE type = 'rss_update' AND recipient_user_id = ?1 AND article_key = ?2
       LIMIT 1`
    )
    .bind(String(ownerId), articleKey)
    .first()
  if (existing?.id) return { created: false, reason: 'already_created' }

  const row = await db
    .prepare(
      `INSERT INTO comment_notifications
         (type, recipient_user_id, actor_user_id, actor_user_provider, actor_user_name,
          actor_user_image, article_key, comment_id, reply_to_comment_id, message_excerpt, created_at)
       VALUES ('rss_update', ?1, ?2, 'rss', ?3, NULL, ?4, 0, 0, ?5, ?6)
       RETURNING id`
    )
    .bind(
      String(ownerId),
      `rss:${feedId}`.slice(0, 80),
      String(feedName || 'RSS').slice(0, 80),
      articleKey,
      String(title || '有一条新更新').slice(0, 160),
      createdAt,
    )
    .first()

  return { created: Boolean(row?.id), id: Number(row?.id) || null }
}

export async function pollRssUpdates(db, { now = Date.now() } = {}) {
  const owner = await findOwnerAccount(db)
  if (!owner?.id) return { ok: false, error: 'OWNER_NOT_FOUND', feeds: [] }

  const feeds = await loadPublishedFeeds(db)
  const results = []
  let notified = 0

  for (const feed of feeds) {
    const fetched = await fetchFeedXml(feed.rss_url)
    if (!fetched.ok) {
      results.push({ id: feed.id, status: 'error', error: fetched.error })
      continue
    }

    const entries = parseFeed(fetched.xml, { includeSummary: false })
    const cursor = await loadCursor(db, feed.id)
    const selected = selectNewRssEntries(entries, cursor, { now })
    await saveCursor(db, feed.id, selected.nextCursor, now)

    const created = []
    if (shouldNotifyRssFeed(feed.id)) {
      for (const entry of selected.notify) {
        const result = await createRssUpdateNotification(db, {
          ownerId: owner.id,
          feedId: feed.id,
          feedName: feed.site_name,
          guid: entry.guid,
          title: entry.title,
          createdAt: now,
        })
        if (result.created) {
          created.push(entry.guid)
          notified += 1
        }
      }
    }

    results.push({
      id: feed.id,
      status: 'ok',
      fetched: entries.length,
      firstPoll: selected.isFirst,
      notified: created.length,
    })
  }

  return {
    ok: true,
    generatedAt: now,
    feedCount: feeds.length,
    notified,
    feeds: results,
  }
}

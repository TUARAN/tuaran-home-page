export const RSS_UPDATE_MAX_PER_FEED = 3
export const RSS_UPDATE_RECENT_MS = 48 * 60 * 60 * 1000
export const RSS_SEEN_GUID_LIMIT = 40
export const RSS_UPDATE_PAGE_PATH = '/crypto-research/rss'
export const RSS_SELF_FEED_ID = 'tuaran-home'

export function entryGuid(entry) {
  return String(entry?.guid || entry?.link || `${entry?.title || ''}|${entry?.date || ''}`)
    .trim()
    .slice(0, 400)
}

export function rssArticleKey(feedId, guid) {
  return `rss:${String(feedId || '').trim()}:${entryGuid({ guid })}`
}

export function parseRssArticleKey(articleKey) {
  const raw = String(articleKey || '')
  if (!raw.startsWith('rss:')) return { feedId: '', guid: '' }
  const rest = raw.slice(4)
  const idx = rest.indexOf(':')
  if (idx < 0) return { feedId: rest, guid: '' }
  return { feedId: rest.slice(0, idx), guid: rest.slice(idx + 1) }
}

export function rssUpdateHref(feedId) {
  const id = String(feedId || '').trim()
  return id ? `${RSS_UPDATE_PAGE_PATH}?feed=${encodeURIComponent(id)}` : RSS_UPDATE_PAGE_PATH
}

function uniqueGuids(values) {
  const seen = new Set()
  const out = []
  for (const value of values) {
    const guid = String(value || '').trim()
    if (!guid || seen.has(guid)) continue
    seen.add(guid)
    out.push(guid)
  }
  return out.slice(0, RSS_SEEN_GUID_LIMIT)
}

export function selectNewRssEntries(entries, cursor, { now = Date.now() } = {}) {
  const list = Array.isArray(entries) ? entries : []
  const seen = new Set(cursor?.seenGuids || [])
  if (cursor?.lastGuid) seen.add(cursor.lastGuid)

  const unseen = []
  for (const entry of list) {
    const guid = entryGuid(entry)
    if (!guid || seen.has(guid)) continue
    unseen.push({ ...entry, guid })
  }

  const isFirst = !cursor?.lastGuid && !(cursor?.seenGuids || []).length
  const notify = isFirst
    ? unseen
        .filter((entry) => entry.publishedAt && entry.publishedAt >= now - RSS_UPDATE_RECENT_MS)
        .slice(0, RSS_UPDATE_MAX_PER_FEED)
    : unseen.slice(0, RSS_UPDATE_MAX_PER_FEED)

  const newest = list[0]
  return {
    isFirst,
    notify,
    nextCursor: {
      lastGuid: newest ? entryGuid(newest) : String(cursor?.lastGuid || ''),
      lastPubAt: newest?.publishedAt || Number(cursor?.lastPubAt) || 0,
      seenGuids: uniqueGuids([
        ...list.map(entryGuid),
        ...(cursor?.seenGuids || []),
        cursor?.lastGuid,
      ]),
    },
  }
}

export function shouldNotifyRssFeed(feedId) {
  return String(feedId || '').trim() !== RSS_SELF_FEED_ID
}

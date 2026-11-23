import fallback from './xHotBoardFallback.json' with { type: 'json' }

export const X_HOT_BOARD_LIMIT = 10
export const X_HOT_BOARD_SOURCE_REPO = 'https://github.com/xiongma0-at/x-bangdan'

const USER_AGENT = '2aran-x-hot-board/1.0'

function stripHandle(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

function normalizeTweet(raw, index) {
  const handle = stripHandle(raw?.handle)
  if (!handle) return null
  const text = String(raw?.content ?? raw?.text ?? '').trim()
  return {
    id: String(raw?.id || `${handle}-${index}`),
    handle,
    displayName: String(raw?.author ?? raw?.displayName ?? handle).trim(),
    text: text.slice(0, 180),
    url: String(raw?.url || `https://x.com/${handle}`).trim(),
    category: String(raw?.category || '').trim(),
    media: raw?.media || 'none',
    views: Number(raw?.views) || 0,
    likes: Number(raw?.likes) || 0,
    reposts: Number(raw?.retweets ?? raw?.reposts) || 0,
    replies: Number.isFinite(Number(raw?.replies)) ? Number(raw.replies) : null,
    score: Number.isFinite(Number(raw?.score)) ? Number(raw.score) : null,
    rank: Number(raw?.rank) || index + 1,
    topic: String(raw?.category || '').trim(),
  }
}

function normalizeCreator(raw, index) {
  const handle = stripHandle(raw?.handle)
  if (!handle) return null
  return {
    handle,
    displayName: String(raw?.author ?? raw?.displayName ?? handle).trim(),
    views: Number(raw?.totalViews ?? raw?.views) || 0,
    index: Number.isFinite(Number(raw?.index)) ? Number(raw.index) : null,
    tweetCount: Number(raw?.tweetCount) || null,
    rank: Number(raw?.rank) || index + 1,
  }
}

function loadFallback(limit, gaps, reason) {
  if (reason) gaps.push(reason)
  const tweets = (fallback.tweets || []).slice(0, limit).map(normalizeTweet).filter(Boolean)
  const accounts = (fallback.accounts || []).slice(0, limit).map(normalizeCreator).filter(Boolean)
  return {
    tweets,
    accounts,
    meta: { ...fallback.meta, source: 'bundled' },
    unavailable: !tweets.length,
  }
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    cf: { cacheTtl: 120, cacheEverything: true },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function loadXHotBoard({ apiBase = '', limit = X_HOT_BOARD_LIMIT, fetchImpl = fetch } = {}) {
  const gaps = []
  const base = String(apiBase || '').trim().replace(/\/$/, '')
  if (!base) {
    return {
      ...loadFallback(limit, gaps, '未配置热榜接口，展示内置示例数据。部署 x-bangdan 后设置环境变量 X_HOT_BOARD_API_BASE。'),
      gaps,
    }
  }

  try {
    const [tweetsBody, creatorsBody] = await Promise.all([
      fetchJson(`${base}/api/tweets?range=today&limit=${limit}`, fetchImpl),
      fetchJson(`${base}/api/creators?range=today&limit=${limit}`, fetchImpl),
    ])
    const tweets = (Array.isArray(tweetsBody?.items) ? tweetsBody.items : [])
      .map(normalizeTweet)
      .filter(Boolean)
      .slice(0, limit)
    const accounts = (Array.isArray(creatorsBody?.items) ? creatorsBody.items : [])
      .map(normalizeCreator)
      .filter(Boolean)
      .slice(0, limit)

    if (!tweets.length && !accounts.length) {
      return { ...loadFallback(limit, gaps, '热榜接口返回空列表，回退到内置示例数据。'), gaps }
    }

    return {
      tweets,
      accounts,
      meta: {
        source: tweetsBody?.meta?.source || creatorsBody?.meta?.source || 'api',
        updatedAt: tweetsBody?.meta?.updatedAt || creatorsBody?.meta?.updatedAt || new Date().toISOString(),
        apiProject: X_HOT_BOARD_SOURCE_REPO,
        apiBase: base,
      },
      unavailable: false,
      gaps,
    }
  } catch {
    return {
      ...loadFallback(limit, gaps, '热榜接口暂时连不上，展示内置示例数据。'),
      gaps,
    }
  }
}
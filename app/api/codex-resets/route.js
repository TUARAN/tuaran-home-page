import {
  AIHOT_CODEX_RESETS_RECENT_URL,
  AIHOT_CODEX_RESETS_URL,
  FALLBACK_SNAPSHOT,
  mergeCodexResetSnapshots,
  parseCodexResetsPayload,
} from '../../../lib/ai/codexResets'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const LIVE_CACHE_SEC = 600
const STORE_TTL_SEC = 24 * 60 * 60
const FRESH_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000
const STORE_PATH = '/api/codex-resets/__store'

let refreshTask = null

function jsonResponse(body, { status = 200, cacheControl = 'no-store' } = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': cacheControl,
    },
  })
}

function liveResponse(snapshot) {
  return jsonResponse({
    source: 'live',
    attribution: 'AIHOT',
    generatedAt: new Date().toISOString(),
    snapshot,
  }, {
    cacheControl: `public, s-maxage=${LIVE_CACHE_SEC}, stale-while-revalidate=${LIVE_CACHE_SEC}`,
  })
}

function fallbackResponse() {
  return jsonResponse({
    source: 'fallback',
    attribution: 'AIHOT',
    generatedAt: new Date().toISOString(),
    snapshot: FALLBACK_SNAPSHOT,
  })
}

function cacheStore() {
  return globalThis.caches?.default || null
}

function storeRequest(request) {
  return new Request(new URL(STORE_PATH, request.url), { method: 'GET' })
}

async function readStoredSnapshot(request) {
  const cache = cacheStore()
  if (!cache) return null
  try {
    const hit = await cache.match(storeRequest(request))
    if (!hit) return null
    const body = await hit.json()
    const snapshot = body?.snapshot
    const storedAt = Number(body?.storedAt)
    if (!snapshot?.events?.length || !Number.isFinite(storedAt)) return null
    return { snapshot, storedAt }
  } catch {
    return null
  }
}

async function writeStoredSnapshot(request, snapshot) {
  const cache = cacheStore()
  if (!cache) return
  try {
    await cache.put(storeRequest(request), new Response(JSON.stringify({
      storedAt: Date.now(),
      snapshot,
    }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': `public, max-age=${STORE_TTL_SEC}`,
      },
    }))
  } catch {
    // Local Next.js has no Cache API.
  }
}

async function fetchParsed(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'user-agent': '2aran-codex-reset/1.0 (+https://2aran.com/codex-reset)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) return null
  const parsed = parseCodexResetsPayload(await response.json())
  if (!parsed?.events?.length) return null
  return parsed
}

async function refreshSnapshot(request, stored) {
  const full = await fetchParsed(AIHOT_CODEX_RESETS_URL)
  if (full) {
    await writeStoredSnapshot(request, full)
    return full
  }

  const recent = await fetchParsed(AIHOT_CODEX_RESETS_RECENT_URL)
  if (recent) {
    const merged = mergeCodexResetSnapshots(stored?.snapshot, recent) || recent
    await writeStoredSnapshot(request, merged)
    return merged
  }

  return stored?.snapshot?.events?.length ? stored.snapshot : null
}

export async function GET(request) {
  const stored = await readStoredSnapshot(request)
  try {
    if (stored && Date.now() - stored.storedAt < FRESH_MS) {
      return liveResponse(stored.snapshot)
    }

    if (!refreshTask) {
      refreshTask = refreshSnapshot(request, stored).finally(() => {
        refreshTask = null
      })
    }
    const snapshot = await refreshTask
    if (snapshot?.events?.length) return liveResponse(snapshot)
  } catch {
    if (stored?.snapshot?.events?.length) return liveResponse(stored.snapshot)
  }
  return fallbackResponse()
}

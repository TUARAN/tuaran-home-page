import { FALLBACK_SNAPSHOT, parseCodexResetsPayload, AIHOT_CODEX_RESETS_URL } from '../../../lib/codexResets'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CACHE_TTL_SEC = 300
const FETCH_TIMEOUT_MS = 8000

function jsonResponse(body, { status = 200, cacheSec = CACHE_TTL_SEC } = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': `public, s-maxage=${cacheSec}, stale-while-revalidate=600`,
    },
  })
}

export async function GET() {
  try {
    const response = await fetch(AIHOT_CODEX_RESETS_URL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': '2aran-codex-reset/1.0 (+https://2aran.com/codex-reset)',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`upstream ${response.status}`)
    const parsed = parseCodexResetsPayload(await response.json())
    if (!parsed || !parsed.events.length) throw new Error('invalid snapshot')
    return jsonResponse({
      source: 'live',
      attribution: 'AIHOT',
      generatedAt: new Date().toISOString(),
      snapshot: parsed,
    })
  } catch {
    return jsonResponse({
      source: 'fallback',
      attribution: 'AIHOT',
      generatedAt: new Date().toISOString(),
      snapshot: FALLBACK_SNAPSHOT,
    }, { cacheSec: 30 })
  }
}

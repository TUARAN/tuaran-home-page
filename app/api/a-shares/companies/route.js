export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STATIC_ROOT = '/generated/a-shares'

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const indexResponse = await fetch(new URL(`${STATIC_ROOT}/index.json`, request.url))
  if (!indexResponse.ok) {
    return Response.json({ error: 'A_SHARE_SNAPSHOT_UNAVAILABLE' }, { status: 503 })
  }

  const { totalPages } = await indexResponse.json()
  const page = Math.min(positiveInteger(searchParams.get('page'), 1), totalPages)
  const pageResponse = await fetch(new URL(`${STATIC_ROOT}/page-${page}.json`, request.url))
  if (!pageResponse.ok) {
    return Response.json({ error: 'A_SHARE_PAGE_UNAVAILABLE' }, { status: 503 })
  }

  return new Response(pageResponse.body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}

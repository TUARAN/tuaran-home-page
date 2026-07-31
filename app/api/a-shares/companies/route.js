import snapshot from '../../../../data/a-shares/companies.json'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const total = snapshot.companies.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(positiveInteger(searchParams.get('page'), 1), totalPages)
  const start = (page - 1) * PAGE_SIZE

  return Response.json(
    {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      companies: snapshot.companies.slice(start, start + PAGE_SIZE),
    },
    {
      headers: {
        'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  )
}

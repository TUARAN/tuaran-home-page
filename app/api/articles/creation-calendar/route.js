import { readContentCatalog } from '../../../../lib/content/contentCatalogRuntime'
import { calendarPage, calendarRecord, selectCreationCalendarItems } from '../../../../lib/article/creationCalendar'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const year = params.get('year') || ''
  const month = params.get('month') || 'all'
  const date = params.get('date') || ''
  const page = Number(params.get('page') || 1)
  if (!/^\d{4}$/.test(year) || !/^(all|0[1-9]|1[0-2])$/.test(month) || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) || !Number.isInteger(page) || page < 1) {
    return Response.json({ error: 'INVALID_CALENDAR_FILTER' }, { status: 400 })
  }

  try {
    const catalog = await readContentCatalog()
    const filtered = selectCreationCalendarItems(catalog.knowledgeItems, { year, month, date })
    return Response.json({
      items: calendarPage(filtered, page).map(calendarRecord),
      total: filtered.length,
      page,
    }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch {
    return Response.json({ error: 'CALENDAR_UNAVAILABLE' }, { status: 503 })
  }
}

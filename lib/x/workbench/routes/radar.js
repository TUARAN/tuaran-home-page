import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { addWatch, ingestItems, listRadar, removeWatch } from '../../../../lib/x/workbench/radarStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }
const body = (request) => request.json().catch(() => ({}))

export function GET(request) {
  const q = new URL(request.url).searchParams
  return handleWorkbench(request, services, (db, userId) => listRadar(db, userId, {
    topic: q.get('topic') || '',
    level: q.get('level') || '',
    media: q.get('media') || '',
    minViews: q.get('minViews'),
    minLikes: q.get('minLikes'),
    sort: q.get('sort') || 'score',
    hours: q.get('hours'),
    limit: q.get('limit'),
    q: q.get('q') || '',
    watchOnly: q.get('watch') === '1',
  }))
}

// POST 按 action 分发：ingest（插件提交采集到的推文）、watch（加监控与备注）。
export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => {
    const data = await body(request)
    if (data.action === 'ingest') return ingestItems(db, userId, data.items)
    return addWatch(db, userId, data.handle, data.note)
  })
}

export function DELETE(request) {
  return handleWorkbench(request, services, async (db, userId) => removeWatch(db, userId, (await body(request)).handle))
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET', 'POST', 'DELETE'])
}

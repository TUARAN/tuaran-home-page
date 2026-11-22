import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { addSchedule, cancelSchedule, claimDue, listSchedules, reportSchedule } from '../../../../lib/x/workbench/workbenchQueue'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }
const body = (request) => request.json().catch(() => ({}))

export function GET(request) {
  return handleWorkbench(request, services, (db, userId) =>
    listSchedules(db, userId, new URL(request.url).searchParams.get('handle')))
}

// POST 按 action 分发：add（站长排期）、claim / report（插件领取与回报）。
export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => {
    const data = await body(request)
    if (data.action === 'claim') return claimDue(db, userId, data.handle)
    if (data.action === 'report') return reportSchedule(db, userId, data)
    return addSchedule(db, userId, data)
  })
}

export function DELETE(request) {
  return handleWorkbench(request, services, async (db, userId) => cancelSchedule(db, userId, (await body(request)).id))
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET', 'POST', 'DELETE'])
}

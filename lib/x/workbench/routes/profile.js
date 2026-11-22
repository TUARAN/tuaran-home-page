import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { getProfile, saveProfile } from '../../../../lib/x/workbench/workbenchStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }

export function GET(request) {
  return handleWorkbench(request, services, (db, userId) =>
    getProfile(db, userId, new URL(request.url).searchParams.get('handle')))
}

export function PUT(request) {
  return handleWorkbench(request, services, async (db, userId) => {
    const body = await request.json().catch(() => ({}))
    return saveProfile(db, userId, body.handle, body)
  })
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET', 'PUT'])
}

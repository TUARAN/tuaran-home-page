import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { deleteDraft, listDrafts, saveDraft } from '../../../../lib/x/workbench/workbenchQueue'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }
const body = (request) => request.json().catch(() => ({}))

export function GET(request) {
  return handleWorkbench(request, services, (db, userId) =>
    listDrafts(db, userId, new URL(request.url).searchParams.get('handle')))
}

export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => saveDraft(db, userId, await body(request)))
}

export function DELETE(request) {
  return handleWorkbench(request, services, async (db, userId) => deleteDraft(db, userId, (await body(request)).id))
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET', 'POST', 'DELETE'])
}

import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { observeHome } from '../../../../lib/x/workbench/observeStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'

const services = { getD1, getUserFromRequest }

export function GET(request) {
  return handleWorkbench(request, services, (db) => observeHome(db), { allowAnonymousGet: true })
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET'])
}

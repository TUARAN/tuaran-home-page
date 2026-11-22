import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { getUsage } from '../../../../lib/x/workbench/workbenchStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }

export function GET(request) {
  return handleWorkbench(request, services, async (db, userId) => ({ ok: true, ...(await getUsage(db, userId)) }))
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET'])
}

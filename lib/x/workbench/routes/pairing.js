import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { handleWorkbench } from '../../../../lib/x/workbench/workbenchHttp'
import { createPairing, revokePlugins } from '../../../../lib/x/workbench/pairingStore'
const services = { getD1, getUserFromRequest }
export function POST(request) {
  return handleWorkbench(request, services, (db, userId) => createPairing(db, userId))
}
export function DELETE(request) {
  return handleWorkbench(request, services, (db, userId) => revokePlugins(db, userId))
}

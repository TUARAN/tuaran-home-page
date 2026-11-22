import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { bindAccount, listAccounts, unbindAccount } from '../../../../lib/x/workbench/workbenchStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }
const body = (request) => request.json().catch(() => ({}))

export function GET(request) {
  return handleWorkbench(request, services, async (db, userId) => ({ ok: true, accounts: await listAccounts(db, userId) }))
}

export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => bindAccount(db, userId, (await body(request)).handle))
}

export function DELETE(request) {
  return handleWorkbench(request, services, async (db, userId) => unbindAccount(db, userId, (await body(request)).handle))
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET', 'POST', 'DELETE'])
}

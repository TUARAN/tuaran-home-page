import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { observeHome } from '../../../../lib/x/workbench/observeStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'

const services = { getD1, getUserFromRequest }

function hotBoardApiBase() {
  const env = getOptionalRequestContext()?.env || {}
  return String(env.X_HOT_BOARD_API_BASE || process.env.X_HOT_BOARD_API_BASE || '').trim()
}

export function GET(request) {
  return handleWorkbench(
    request,
    services,
    (db) => observeHome(db, { hotBoardApiBase: hotBoardApiBase() }),
    { allowAnonymousGet: true },
  )
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET'])
}

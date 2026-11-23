import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { leaderboard, championHistory } from '../../../../lib/x/workbench/radarStore'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }

export function GET(request) {
  const q = new URL(request.url).searchParams
  const run = (db) => (q.get('history') === '1'
    ? championHistory(db, q.get('dim') || 'views')
    : leaderboard(db, q.get('window') || 'auto', q.get('dim') || 'views'))
  return handleWorkbench(request, services, run, { allowAnonymousGet: true })
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET'])
}

import * as accounts from '../../../../lib/x/workbench/routes/accounts'
import * as bridge from '../../../../lib/x/workbench/routes/bridge'
import * as drafts from '../../../../lib/x/workbench/routes/drafts'
import * as leaderboard from '../../../../lib/x/workbench/routes/leaderboard'
import * as monitor from '../../../../lib/x/workbench/routes/monitor'
import * as observe from '../../../../lib/x/workbench/routes/observe'
import * as pairing from '../../../../lib/x/workbench/routes/pairing'
import * as profile from '../../../../lib/x/workbench/routes/profile'
import * as radar from '../../../../lib/x/workbench/routes/radar'
import * as rewrite from '../../../../lib/x/workbench/routes/rewrite'
import * as schedules from '../../../../lib/x/workbench/routes/schedules'
import * as topics from '../../../../lib/x/workbench/routes/topics'
import * as usage from '../../../../lib/x/workbench/routes/usage'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const routes = { accounts, bridge, drafts, leaderboard, monitor, observe, pairing, profile, radar, rewrite, schedules, topics, usage }

function dispatch(request) {
  const name = new URL(request.url).pathname.slice('/api/x-workbench/'.length)
  const route = Object.prototype.hasOwnProperty.call(routes, name) ? routes[name] : null
  const handler = route?.[request.method]
  if (typeof handler === 'function') return handler(request)
  return Response.json({ error: route ? 'METHOD_NOT_ALLOWED' : 'NOT_FOUND' }, {
    status: route ? 405 : 404,
    headers: { 'Cache-Control': 'no-store', ...(route ? { Allow: Object.keys(route).join(', ') } : {}) },
  })
}
export { dispatch as GET, dispatch as POST, dispatch as PUT, dispatch as DELETE, dispatch as OPTIONS }

import { getUserFromRequest } from '../../../auth/edgeSession'
import { isOwnerUser } from '../../../auth/ownerAuth'
import { getD1 } from '../../../db/d1'
import { handleWorkbench, workbenchPreflight } from '../workbenchHttp'
import { listTopics, pendingTopics, reviewTopic, suggestTopic } from '../topicStore'
const services = { getD1, getUserFromRequest }
async function owner(request) {
  return isOwnerUser(await getUserFromRequest(request))
}
export function GET(request) {
  const review = new URL(request.url).searchParams.get('review') === '1'
  return handleWorkbench(request, services, async db => {
    if (!review) return listTopics(db)
    return await owner(request) ? pendingTopics(db) : { ok: false, status: 403, error: 'NOT_OWNER' }
  }, { allowAnonymousGet: !review })
}
export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => {
    const data = await request.json().catch(() => ({}))
    if (data.action !== 'review') return suggestTopic(db, userId, data)
    return await owner(request) ? reviewTopic(db, data) : { ok: false, status: 403, error: 'NOT_OWNER' }
  })
}
export function OPTIONS(request) { return workbenchPreflight(request, ['GET', 'POST']) }

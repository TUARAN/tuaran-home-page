import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import { rewritePost, suggestAngles } from '../../../../lib/x/workbench/rewriteCore'
import { workbenchLlm } from '../../../../lib/x/workbench/llm'
import { handleWorkbench, workbenchPreflight } from '../../../../lib/x/workbench/workbenchHttp'


const services = { getD1, getUserFromRequest }

export function POST(request) {
  return handleWorkbench(request, services, async (db, userId) => {
    const data = await request.json().catch(() => ({}))
    return data.action === 'angles' ? suggestAngles(db, userId, data, workbenchLlm) : rewritePost(db, userId, data, workbenchLlm)
  })
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['POST'])
}

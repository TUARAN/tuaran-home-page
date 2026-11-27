import { getD1 } from '../../../../../../lib/db/d1'
import {
  claimDistributionJob,
  distributionJobErrorResponse,
  finishDistributionJob,
  NO_STORE,
  reportDistributionResult,
} from '../../../../../../lib/distribution/jobs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 分发智能体接口：凭任务的一次性 token（Authorization: Bearer）领取、回报、收尾。
function bearer(req) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') || '')
  return match ? match[1] : ''
}

const invalid = () => Response.json({ error: 'INVALID_TOKEN' }, { status: 401, headers: NO_STORE })

export async function GET(req, context) {
  const { id } = await context.params
  try {
    const job = await claimDistributionJob(getD1(), id, bearer(req))
    return job ? Response.json(job, { headers: NO_STORE }) : invalid()
  } catch (error) {
    return distributionJobErrorResponse(error, 'Claim distribution job')
  }
}

export async function POST(req, context) {
  const { id } = await context.params
  try {
    const body = await req.json()
    const db = getD1()
    let result
    if (body?.action === 'result') result = await reportDistributionResult(db, id, bearer(req), body)
    else if (body?.action === 'finish') result = await finishDistributionJob(db, id, bearer(req))
    else throw new RangeError('INVALID_ACTION')
    return result ? Response.json(result, { headers: NO_STORE }) : invalid()
  } catch (error) {
    return distributionJobErrorResponse(error, 'Report distribution job')
  }
}

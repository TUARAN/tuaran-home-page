import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import {
  cancelDistributionJob,
  createDistributionJob,
  distributionJobErrorResponse,
  listDistributionJobs,
  NO_STORE,
  reissueDistributionJobToken,
} from '../../../../lib/distribution/jobs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 后台智能体任务台：列任务、建任务、取消、重新签发领取 token。
// 建任务返回的一次性 token 只出现在这次响应里。
export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    return Response.json({ jobs: await listDistributionJobs(getD1()) }, { headers: NO_STORE })
  } catch (error) {
    return distributionJobErrorResponse(error, 'List distribution jobs')
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const body = await req.json()
    const { action, id } = body
    const db = getD1()
    if (action === 'create') {
      const createdBy = auth.user?.login || auth.user?.name || ''
      return Response.json(await createDistributionJob(db, body, { createdBy }), { status: 201, headers: NO_STORE })
    }
    if (action === 'cancel') return Response.json(await cancelDistributionJob(db, id), { headers: NO_STORE })
    if (action === 'reissue') return Response.json(await reissueDistributionJobToken(db, id), { headers: NO_STORE })
    throw new RangeError('INVALID_ACTION')
  } catch (error) {
    return distributionJobErrorResponse(error, 'Update distribution job')
  }
}

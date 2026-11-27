import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { createDistributionJob, distributionJobErrorResponse, NO_STORE } from '../../../../lib/distribution/jobs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 文章页「ego」按钮建分发任务（站长）。返回一次性 token，只在这次响应里出现。
export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const createdBy = auth.user?.login || auth.user?.name || ''
    const job = await createDistributionJob(getD1(), await req.json(), { createdBy })
    return Response.json(job, { status: 201, headers: NO_STORE })
  } catch (error) {
    return distributionJobErrorResponse(error, 'Create distribution job')
  }
}

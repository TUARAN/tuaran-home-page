import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { listAdminRewards, updateRedemption, upsertReward } from '../../../../lib/rewards'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  try {
    return Response.json({ ok: true, ...(await listAdminRewards(getD1())) })
  } catch (error) {
    return Response.json({ error: 'REWARDS_READ_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  try {
    const result = body.action === 'updateRedemption'
      ? await updateRedemption(getD1(), body)
      : body.action === 'upsertReward'
        ? await upsertReward(getD1(), body)
        : { ok: false, status: 400, error: 'UNKNOWN_ACTION' }
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 })
  } catch (error) {
    return Response.json({ error: 'REWARDS_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

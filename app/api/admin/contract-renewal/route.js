import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  getContractRenewalBriefingState,
  resetContractRenewalBriefing,
  setContractRenewalBriefing,
} from '../../../../lib/contractRenewalStore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const state = await getContractRenewalBriefingState()
  return json({ status: state.persistent ? 'ok' : 'preview', ...state })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'INVALID_JSON' }, 400)
  }

  const result = body?.reset
    ? await resetContractRenewalBriefing(guard.user)
    : await setContractRenewalBriefing(body?.briefing, guard.user)
  return json(result, result.ok ? 200 : result.status || 500)
}

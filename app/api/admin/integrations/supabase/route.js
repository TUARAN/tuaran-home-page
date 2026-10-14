import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getIntegrationEnv } from '../../../../../lib/site/integrationKeys'
import { checkSupabaseHealth } from '../../../../../lib/supabase/health'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const result = await checkSupabaseHealth(getIntegrationEnv())
  return Response.json(result, { headers: { 'cache-control': 'no-store' } })
}

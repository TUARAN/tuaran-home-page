import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { handleSiteManagement } from '../../../../lib/site/secondarySiteManagement'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(request) {
  return handleSiteManagement(request, { getOwnerOrReject, getD1 })
}

export function POST(request) {
  return handleSiteManagement(request, { getOwnerOrReject, getD1 })
}

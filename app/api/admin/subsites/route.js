import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { handleSiteManagement } from '../../../../lib/secondarySiteManagement'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(request) {
  return handleSiteManagement(request, { getOwnerOrReject, getD1 })
}

export function POST(request) {
  return handleSiteManagement(request, { getOwnerOrReject, getD1 })
}

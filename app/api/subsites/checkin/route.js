import { POST as checkin } from '../../points/checkin/route'
import { handleSubsiteCheckin, subsitePreflight } from '../../../../lib/subsiteAccount'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function POST(request) {
  return handleSubsiteCheckin(request, { checkin })
}

export function OPTIONS(request) {
  return subsitePreflight(request, 'POST')
}

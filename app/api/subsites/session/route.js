import { getD1 } from '../../../../lib/d1'
import { getSecrets, getUserFromRequest } from '../../../../lib/edgeSession'
import { getOrIssueGuest } from '../../../../lib/guestSession'
import { awardGuestSeed, getBalance, hasCheckedInToday } from '../../../../lib/points'
import { handleSubsiteSession, subsitePreflight } from '../../../../lib/subsiteAccount'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getUserRole(db, userId) {
  // The general directory helper falls back to 'member' on database errors.
  // Federation must fail closed when the blocked-account lookup is unavailable.
  const row = await db.prepare('SELECT role FROM site_users WHERE platform_id = ?1 OR id = ?1 LIMIT 1')
    .bind(userId).first()
  return row?.role || 'member'
}

export function GET(request) {
  return handleSubsiteSession(request, {
    getD1, getSecrets, getUserFromRequest, getOrIssueGuest, getUserRole,
    awardGuestSeed, getBalance, hasCheckedInToday,
  })
}

export function OPTIONS(request) {
  return subsitePreflight(request, 'GET')
}

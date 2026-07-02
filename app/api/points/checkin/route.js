import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { getUserRole } from '../../../../lib/userDirectory'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../../lib/abuseControls'
import { POINT_RULES, awardCheckin, countCheckins, getBalance } from '../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** 每日签到赚燃币（自然日内幂等：重复签到不重复发）。游客不可签到。 */
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const userId = String(user.id)
    if ((await getUserRole(userId)) === 'blocked') {
      return Response.json({ error: 'USER_BLOCKED' }, { status: 403 })
    }

    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'points:checkin:user:day', subject: userId, limit: 5, windowMs: DAY_MS },
      { scope: 'points:checkin:ip:5m', subject: ip, limit: 20, windowMs: FIVE_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    if (user.provider === 'email' && user.status === 'pending') {
      const checkins = await countCheckins(db, userId)
      if (checkins >= POINT_RULES.pendingCheckinLimit) {
        return Response.json(
          {
            error: 'EMAIL_ACTIVATION_REQUIRED',
            pendingCheckinLimit: POINT_RULES.pendingCheckinLimit,
            balance: await getBalance(db, userId),
          },
          { status: 403 }
        )
      }
    }

    const result = await awardCheckin(db, userId)
    await cleanupRateLimits(db).catch(() => {})

    return Response.json({
      ok: true,
      awarded: result.awarded,
      gained: result.awarded ? POINT_RULES.checkin : 0,
      balance: result.balance ?? (await getBalance(db, userId)),
      alreadyCheckedIn: !result.awarded,
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

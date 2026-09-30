import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { GUEST_USER_PREFIX, getGuestId } from '../../../../lib/guestSession'
import { countCheckins, getBalance, getCheckinStatus, getPointRules, hasCheckedInToday } from '../../../../lib/points'
import { listUnlocksForUser } from '../../../../lib/resourceUnlocks'
import { listResourceEventsForUser } from '../../../../lib/resourceEvents'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/**
 * 当前身份的燃币余额与签到状态。
 *  - 登录用户：真实余额 + 今日签到状态。
 *  - 游客：只读取已有试用余额；普通访问不再创建身份或发放燃币。
 *  - 无 D1：余额 0、dbUnavailable:true（不阻断页面）。
 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    const db = dbOrNull()
    const rules = await getPointRules(db)

    if (!user) {
      if (!db) {
        return Response.json({ authed: false, isGuest: true, balance: 0, checkedInToday: false, rules, dbUnavailable: true })
      }
      const gid = await getGuestId(req)
      if (!gid) {
        return Response.json({ authed: false, isGuest: true, balance: 0, checkedInToday: false, rules })
      }
      const guestId = `${GUEST_USER_PREFIX}${gid}`
      const balance = await getBalance(db, guestId)
      return Response.json({ authed: false, isGuest: true, balance, checkedInToday: false, rules })
    }

    if (!db) {
      return Response.json({ authed: true, balance: 0, checkedInToday: false, rules, dbUnavailable: true })
    }

    const userId = String(user.id)
    const isPendingEmail = user.provider === 'email' && user.status === 'pending'
    const [balance, checkedInToday, checkinStatus, unlocks, resourceEvents, pendingCheckins] = await Promise.all([
      getBalance(db, userId),
      hasCheckedInToday(db, userId),
      getCheckinStatus(db, userId),
      listUnlocksForUser(db, userId, { limit: 100 }),
      listResourceEventsForUser(db, userId, { limit: 100 }),
      isPendingEmail ? countCheckins(db, userId) : Promise.resolve(0),
    ])
    return Response.json({
      authed: true,
      balance,
      checkedInToday,
      checkinStatus,
      activationRequired: isPendingEmail,
      pendingCheckins,
      pendingCheckinLimit: isPendingEmail ? rules.pendingCheckinLimit : null,
      rules,
      unlockCount: unlocks.length,
      unlocks,
      resourceEvents,
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

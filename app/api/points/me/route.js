import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest } from '../../../../lib/guestSession'
import { POINT_RULES, awardGuestSeed, getBalance, hasCheckedInToday } from '../../../../lib/points'
import { listUnlocksForUser } from '../../../../lib/resourceUnlocks'

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
 *  - 游客：按 guest:<gid> 自动播种 50 燃币并返回余额（isGuest:true）。
 *  - 无 D1：余额 0、dbUnavailable:true（不阻断页面）。
 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    const db = dbOrNull()

    if (!user) {
      if (!db) {
        return Response.json({ authed: false, isGuest: true, balance: 0, checkedInToday: false, rules: POINT_RULES, dbUnavailable: true })
      }
      const guest = await getOrIssueGuest(req)
      if (!guest) {
        return Response.json({ authed: false, isGuest: true, balance: 0, checkedInToday: false, rules: POINT_RULES })
      }
      const guestId = `${GUEST_USER_PREFIX}${guest.gid}`
      await awardGuestSeed(db, guestId)
      const balance = await getBalance(db, guestId)
      const headers = guest.setCookie ? { 'Set-Cookie': guest.setCookie } : undefined
      return Response.json({ authed: false, isGuest: true, balance, checkedInToday: false, rules: POINT_RULES }, { headers })
    }

    if (!db) {
      return Response.json({ authed: true, balance: 0, checkedInToday: false, rules: POINT_RULES, dbUnavailable: true })
    }

    const userId = String(user.id)
    const [balance, checkedInToday, unlocks] = await Promise.all([
      getBalance(db, userId),
      hasCheckedInToday(db, userId),
      listUnlocksForUser(db, userId, { limit: 100 }),
    ])
    return Response.json({
      authed: true,
      balance,
      checkedInToday,
      rules: POINT_RULES,
      unlockCount: unlocks.length,
      unlocks,
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

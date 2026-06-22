import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { POINT_RULES, getBalance, hasCheckedInToday } from '../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 当前用户的燃币余额与签到状态；游客返回 authed:false、余额 0。 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ authed: false, balance: 0, checkedInToday: false, rules: POINT_RULES })
    }

    const db = dbOrNull()
    if (!db) {
      return Response.json({ authed: true, balance: 0, checkedInToday: false, rules: POINT_RULES, dbUnavailable: true })
    }

    const userId = String(user.id)
    const [balance, checkedInToday] = await Promise.all([
      getBalance(db, userId),
      hasCheckedInToday(db, userId),
    ])
    return Response.json({ authed: true, balance, checkedInToday, rules: POINT_RULES })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

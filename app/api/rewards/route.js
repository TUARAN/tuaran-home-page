import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { getBalance, getCheckinStatus, getPointRules, hasCheckedInToday } from '../../../lib/points'
import { applyMakeupCard, getMakeupCardBalance, listPublicRewards, listUserRedemptions, redeemReward } from '../../../lib/rewards'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const db = getD1()
    const user = await getUserFromRequest(req)
    const userId = user ? String(user.id) : ''
    const [rewards, rules, balance, checkedInToday, checkinStatus, redemptions, makeupCards] = await Promise.all([
      listPublicRewards(db, userId),
      getPointRules(db),
      userId ? getBalance(db, userId) : Promise.resolve(0),
      userId ? hasCheckedInToday(db, userId) : Promise.resolve(false),
      userId ? getCheckinStatus(db, userId) : Promise.resolve(null),
      userId ? listUserRedemptions(db, userId) : Promise.resolve([]),
      userId ? getMakeupCardBalance(db, userId) : Promise.resolve(0),
    ])
    return Response.json({
      ok: true,
      authed: Boolean(user),
      balance,
      checkedInToday,
      checkinStatus,
      checkinReward: rules.checkin,
      rewards,
      redemptions,
      makeupCards,
    })
  } catch (error) {
    return Response.json({
      ok: true,
      unavailable: true,
      authed: false,
      balance: 0,
      checkedInToday: false,
      checkinStatus: null,
      checkinReward: 5,
      rewards: [],
      redemptions: [],
      makeupCards: 0,
    })
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    const body = await req.json().catch(() => null)
    if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    const result = body.action === 'makeupCheckin'
      ? await applyMakeupCard(getD1(), String(user.id), body.day)
      : await redeemReward(getD1(), String(user.id), body.rewardId, body)
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 })
  } catch (error) {
    return Response.json({ error: 'REDEMPTION_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

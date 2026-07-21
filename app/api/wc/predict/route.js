/**
 * 世界杯竞猜读写入口
 *  - GET  → 当前登录用户的全部竞猜 + 规则 + 燃币余额；未登录返回 authed:false。
 *  - POST { fixtureId, pick } → 下注/改注（需登录、比赛未开赛）。
 *
 * 竞猜只对登录用户开放（游客不参与）；发币与结算见 lib/wc/predictions.js。
 */
import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from '../../../../lib/edgeSession'
import { getBalance } from '../../../../lib/points'
import { PREDICT_REWARD, getUserPredictions } from '../../../../lib/wc/predictions'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const GET = async (request) => {
  const ctx = getOptionalRequestContext()
  const db = ctx?.env?.DB || null
  const user = await getUserFromRequest(request)
  if (!user) {
    return Response.json({ authed: false, reward: PREDICT_REWARD, predictions: {}, balance: 0 })
  }
  if (!db) {
    return Response.json({ authed: true, reward: PREDICT_REWARD, predictions: {}, balance: 0, dbUnavailable: true })
  }
  const id = String(user.id)
  const [predictions, balance] = await Promise.all([getUserPredictions(db, id), getBalance(db, id)])
  return Response.json({ authed: true, reward: PREDICT_REWARD, predictions, balance })
}

export const POST = async () => {
  return Response.json(
    { ok: false, error: 'ACTIVITY_ARCHIVED', archivedAt: '2026-07-21' },
    { status: 410 }
  )
}

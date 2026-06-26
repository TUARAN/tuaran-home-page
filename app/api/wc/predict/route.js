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
import { PREDICT_REWARD, getUserPredictions, setPrediction } from '../../../../lib/wc/predictions'

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

export const POST = async (request) => {
  const ctx = getOptionalRequestContext()
  const db = ctx?.env?.DB || null
  const user = await getUserFromRequest(request)
  if (!user) return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const result = await setPrediction(db, String(user.id), body.fixtureId, body.pick)
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status || 400 })
  }
  const balance = await getBalance(db, String(user.id))
  return Response.json({ ok: true, fixtureId: result.fixtureId, pick: result.pick, balance })
}

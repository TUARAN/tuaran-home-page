/**
 * 世界杯竞猜（猜胜平负，免费竞猜、猜中得燃币）
 *
 * - 玩法：每场未开赛比赛可选 主胜(home) / 平(draw) / 客胜(away)，开赛后锁定。
 * - 奖励：比赛结束后比对结果，猜中固定发 PREDICT_REWARD 燃币，猜错不扣。
 * - 结算与发币幂等：发币用 points.award 的 (user_id, reason, ref) 唯一约束；
 *   wc_predictions.settled 标记避免重复结算。
 * - 数据表见 migrations/0030_wc_predictions.sql（需站长在 Cloudflare D1 手动跑迁移）。
 */
import { award } from '../points.js'

export const PREDICT_REWARD = 10

const PICKS = new Set(['home', 'draw', 'away'])
const FINISHED = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const NOT_STARTED = new Set(['NS', 'TBD', 'PST', ''])

export function isFinished(match) {
  return FINISHED.has(match?.status_short)
}

/** 是否仍可竞猜：未开赛且未到开球时间 */
export function isOpenForPrediction(match, now = Date.now()) {
  if (!match) return false
  if (!NOT_STARTED.has(match.status_short || '')) return false
  const kickoff = Number(match.match_timestamp || 0) * 1000
  return kickoff === 0 ? true : now < kickoff
}

/** 结算结果：home / draw / away；未结束返回 null。点球决出的按点球胜方。 */
export function outcomeOf(match) {
  if (!isFinished(match)) return null
  if (match.status_short === 'PEN') {
    const hp = Number(match.home_goals_pen || 0)
    const ap = Number(match.away_goals_pen || 0)
    if (hp !== ap) return hp > ap ? 'home' : 'away'
  }
  const h = Number(match.home_goals || 0)
  const a = Number(match.away_goals || 0)
  return h > a ? 'home' : a > h ? 'away' : 'draw'
}

/** 取某用户全部竞猜，返回 { [fixture_id]: { pick, settled, correct, awarded } } */
export async function getUserPredictions(db, userId) {
  const id = String(userId || '').trim()
  if (!db || !id) return {}
  const { results } = await db
    .prepare('SELECT fixture_id, pick, settled, correct, awarded FROM wc_predictions WHERE user_id = ?')
    .bind(id)
    .all()
  const map = {}
  for (const r of results || []) {
    map[r.fixture_id] = {
      pick: r.pick,
      settled: Number(r.settled || 0),
      correct: r.correct == null ? null : Number(r.correct),
      awarded: Number(r.awarded || 0),
    }
  }
  return map
}

/** 下注 / 改注：仅未开赛、未结算时允许；返回 {ok, status?, error?} */
export async function setPrediction(db, userId, fixtureId, pick, now = Date.now()) {
  const id = String(userId || '').trim()
  if (!db || !id) return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  if (!PICKS.has(pick)) return { ok: false, status: 400, error: 'INVALID_PICK' }
  const fid = Number(fixtureId)
  if (!Number.isInteger(fid)) return { ok: false, status: 400, error: 'INVALID_FIXTURE' }

  const match = await db
    .prepare('SELECT fixture_id, status_short, match_timestamp FROM wc_matches WHERE fixture_id = ?')
    .bind(fid)
    .first()
  if (!match) return { ok: false, status: 404, error: 'MATCH_NOT_FOUND' }
  if (!isOpenForPrediction(match, now)) return { ok: false, status: 409, error: 'PREDICTION_CLOSED' }

  // 已结算的竞猜不允许改（WHERE settled=0 兜底）；未结算可改注。
  await db
    .prepare(
      `INSERT INTO wc_predictions (user_id, fixture_id, pick, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?4)
       ON CONFLICT(user_id, fixture_id) DO UPDATE SET
         pick = excluded.pick,
         updated_at = excluded.updated_at
       WHERE wc_predictions.settled = 0`
    )
    .bind(id, fid, pick, now)
    .run()

  return { ok: true, fixtureId: fid, pick }
}

/**
 * 结算所有已结束、且仍有未结算竞猜的比赛。猜中发 PREDICT_REWARD 燃币。
 * best-effort：单场或单条失败不影响其余。返回 { settled, awarded }。
 */
export async function settleAllFinished(db, now = Date.now()) {
  if (!db) return { settled: 0, awarded: 0 }
  let settled = 0
  let awarded = 0
  const { results: matches } = await db
    .prepare(
      `SELECT m.fixture_id, m.status_short, m.home_goals, m.away_goals, m.home_goals_pen, m.away_goals_pen
       FROM wc_matches m
       WHERE m.status_short IN ('FT','AET','PEN','AWD','WO')
         AND EXISTS (SELECT 1 FROM wc_predictions p WHERE p.fixture_id = m.fixture_id AND p.settled = 0)`
    )
    .all()

  for (const m of matches || []) {
    const outcome = outcomeOf(m)
    if (!outcome) continue
    const { results: preds } = await db
      .prepare('SELECT user_id, pick FROM wc_predictions WHERE fixture_id = ? AND settled = 0')
      .bind(m.fixture_id)
      .all()
    for (const p of preds || []) {
      const correct = p.pick === outcome ? 1 : 0
      let awardedAmt = 0
      try {
        if (correct) {
          const res = await award(db, p.user_id, {
            delta: PREDICT_REWARD,
            reason: 'wc_predict',
            ref: `wc_predict:${m.fixture_id}`,
          })
          awardedAmt = res.awarded ? PREDICT_REWARD : 0
        }
        await db
          .prepare(
            'UPDATE wc_predictions SET settled = 1, correct = ?1, awarded = ?2, updated_at = ?3 WHERE user_id = ?4 AND fixture_id = ?5'
          )
          .bind(correct, awardedAmt, now, p.user_id, m.fixture_id)
          .run()
        settled += 1
        awarded += awardedAmt
      } catch (err) {
        console.error('[wc-settle] failed', m.fixture_id, p.user_id, err?.message)
      }
    }
  }
  return { settled, awarded }
}

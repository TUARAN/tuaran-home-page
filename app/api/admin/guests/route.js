import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function toNumber(value) {
  return Number(value || 0)
}

function firstNonZero(...values) {
  const nums = values.map((v) => Number(v || 0)).filter((v) => v > 0)
  return nums.length ? Math.min(...nums) : 0
}

function lastNonZero(...values) {
  const nums = values.map((v) => Number(v || 0)).filter((v) => v > 0)
  return nums.length ? Math.max(...nums) : 0
}

function normalizeGuest(row) {
  const firstSeenAt = firstNonZero(
    row.first_ledger_at,
    row.first_unlock_at,
    row.first_comment_at,
    row.bound_at,
    row.points_updated_at
  )
  const lastSeenAt = lastNonZero(
    row.last_ledger_at,
    row.last_unlock_at,
    row.last_comment_at,
    row.bound_at,
    row.points_updated_at
  )
  const spent = Math.abs(toNumber(row.spent))
  return {
    userId: row.user_id,
    gid: String(row.user_id || '').replace(/^guest:/, ''),
    balance: toNumber(row.balance),
    earned: toNumber(row.earned),
    spent,
    ledgerCount: toNumber(row.ledger_count),
    unlockCount: toNumber(row.unlock_count),
    commentCount: toNumber(row.comment_count),
    firstSeenAt,
    lastSeenAt,
    boundUserId: row.bound_user_id || '',
    boundAt: toNumber(row.bound_at),
    latestLedger: row.latest_ledger_id
      ? {
          id: row.latest_ledger_id,
          delta: toNumber(row.latest_delta),
          reason: row.latest_reason || '',
          ref: row.latest_ref || '',
          createdAt: toNumber(row.latest_created_at),
        }
      : null,
  }
}

function buildStats(guests) {
  return guests.reduce(
    (acc, guest) => {
      acc.total += 1
      if (guest.boundUserId) acc.bound += 1
      else acc.active += 1
      acc.totalBalance += guest.balance
      acc.totalEarned += guest.earned
      acc.totalSpent += guest.spent
      acc.unlocks += guest.unlockCount
      acc.comments += guest.commentCount
      return acc
    },
    {
      total: 0,
      active: 0,
      bound: 0,
      totalBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      unlocks: 0,
      comments: 0,
    }
  )
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      message: '当前运行环境没有 D1 绑定，无法读取游客目录。',
    })
  }

  try {
    const result = await db
      .prepare(
        `WITH guest_ids AS (
           SELECT user_id FROM user_points WHERE user_id LIKE 'guest:%'
           UNION
           SELECT user_id FROM point_ledger WHERE user_id LIKE 'guest:%'
           UNION
           SELECT user_id FROM resource_unlocks WHERE user_id LIKE 'guest:%'
           UNION
           SELECT user_id FROM article_comments WHERE user_id LIKE 'guest:%'
           UNION
           SELECT 'guest:' || gid AS user_id FROM guest_bindings
         ),
         ledger_rollup AS (
           SELECT
             user_id,
             COUNT(*) AS ledger_count,
             MIN(created_at) AS first_ledger_at,
             MAX(created_at) AS last_ledger_at,
             SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS earned,
             SUM(CASE WHEN delta < 0 THEN delta ELSE 0 END) AS spent
           FROM point_ledger
           WHERE user_id LIKE 'guest:%'
           GROUP BY user_id
         ),
         latest_ledger AS (
           SELECT pl.id, pl.user_id, pl.delta, pl.reason, pl.ref, pl.created_at
           FROM point_ledger pl
           INNER JOIN (
             SELECT user_id, MAX(id) AS id
             FROM point_ledger
             WHERE user_id LIKE 'guest:%'
             GROUP BY user_id
           ) latest ON latest.id = pl.id
         ),
         unlock_rollup AS (
           SELECT
             user_id,
             COUNT(*) AS unlock_count,
             MIN(unlocked_at) AS first_unlock_at,
             MAX(unlocked_at) AS last_unlock_at
           FROM resource_unlocks
           WHERE user_id LIKE 'guest:%'
           GROUP BY user_id
         ),
         comment_rollup AS (
           SELECT
             user_id,
             COUNT(*) AS comment_count,
             MIN(created_at) AS first_comment_at,
             MAX(created_at) AS last_comment_at
           FROM article_comments
           WHERE user_id LIKE 'guest:%'
           GROUP BY user_id
         )
         SELECT
           g.user_id,
           COALESCE(up.balance, 0) AS balance,
           up.updated_at AS points_updated_at,
           gb.user_id AS bound_user_id,
           gb.bound_at,
           lr.ledger_count,
           lr.first_ledger_at,
           lr.last_ledger_at,
           lr.earned,
           lr.spent,
           ur.unlock_count,
           ur.first_unlock_at,
           ur.last_unlock_at,
           cr.comment_count,
           cr.first_comment_at,
           cr.last_comment_at,
           ll.id AS latest_ledger_id,
           ll.delta AS latest_delta,
           ll.reason AS latest_reason,
           ll.ref AS latest_ref,
           ll.created_at AS latest_created_at
         FROM guest_ids g
         LEFT JOIN user_points up ON up.user_id = g.user_id
         LEFT JOIN guest_bindings gb ON ('guest:' || gb.gid) = g.user_id
         LEFT JOIN ledger_rollup lr ON lr.user_id = g.user_id
         LEFT JOIN latest_ledger ll ON ll.user_id = g.user_id
         LEFT JOIN unlock_rollup ur ON ur.user_id = g.user_id
         LEFT JOIN comment_rollup cr ON cr.user_id = g.user_id
         ORDER BY COALESCE(lr.last_ledger_at, ur.last_unlock_at, cr.last_comment_at, gb.bound_at, up.updated_at, 0) DESC
         LIMIT 1000`
      )
      .all()

    const guests = (result?.results || []).map(normalizeGuest)
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      stats: buildStats(guests),
      guests,
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'GUESTS_READ_FAILED',
        message: '游客目录读取失败（迁移 0027 / 0028 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  return Response.json({ error: 'GUEST_POINTS_UNSUPPORTED' }, { status: 400 })
}

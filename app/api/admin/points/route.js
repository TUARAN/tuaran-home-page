import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  POINT_POLICY,
  POINT_RULES,
  adminAdjust,
  deleteResource,
  getBalancesFor,
  getBalance,
  listResources,
  reverseLedgerEntry,
  upsertResource,
} from '../../../../lib/points'
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

function toNumber(value) {
  return Number(value || 0)
}

function normalizeLedgerRow(row, balanceMap = {}) {
  return {
    ...row,
    user_balance: balanceMap[row.user_id] ?? 0,
  }
}

/** 列出登录账户燃币概览 + 门槛资源配置 + 规则初值。游客燃币留给游客管理页聚合。 */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const url = new URL(req.url)
  const detailUserId = String(url.searchParams.get('userId') || '').trim()

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      message: '当前运行环境没有 D1 绑定，无法读取燃币配置（迁移 0028 是否已应用？）。',
      rules: POINT_RULES,
      policy: POINT_POLICY,
    })
  }

  try {
    const resources = await listResources(db)
    const accountsResult = await db
      .prepare(
        `SELECT up.user_id, up.balance, up.updated_at, MAX(pl.created_at) AS last_ledger_at, COUNT(pl.id) AS ledger_count
           FROM user_points up
           LEFT JOIN point_ledger pl ON pl.user_id = up.user_id
          WHERE up.user_id NOT LIKE 'guest:%'
          GROUP BY up.user_id, up.balance, up.updated_at
          ORDER BY up.balance DESC, up.updated_at DESC
          LIMIT 80`
      )
      .all()
    const ledger = await db
      .prepare(
        `SELECT id, user_id, delta, reason, ref, created_at
           FROM point_ledger
          WHERE user_id NOT LIKE 'guest:%'
          ORDER BY id DESC
          LIMIT 50`
      )
      .all()
    const accountSummary = await db
      .prepare(
        `SELECT COUNT(*) AS account_count, COALESCE(SUM(balance), 0) AS total_balance
           FROM user_points
          WHERE user_id NOT LIKE 'guest:%'`
      )
      .first()
    const ledgerSummary = await db
      .prepare(
        `SELECT
           COUNT(*) AS ledger_count,
           COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0) AS issued_points,
           COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS spent_points
           FROM point_ledger
          WHERE user_id NOT LIKE 'guest:%'`
      )
      .first()
    const ledgerRows = ledger?.results || []
    const balanceMap = await getBalancesFor(db, ledgerRows.map((row) => row.user_id))

    let accountDetail = null
    let accountLedger = []
    let accountUnlocks = []
    if (detailUserId && !detailUserId.startsWith('guest:')) {
      const [balance, detailRollup, detailLedger, unlocks] = await Promise.all([
        getBalance(db, detailUserId),
        db
          .prepare(
            `SELECT
               COUNT(*) AS ledger_count,
               COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0) AS earned_points,
               COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS spent_points,
               MIN(created_at) AS first_ledger_at,
               MAX(created_at) AS last_ledger_at
               FROM point_ledger
              WHERE user_id = ?1
                AND user_id NOT LIKE 'guest:%'`
          )
          .bind(detailUserId)
          .first(),
        db
          .prepare(
            `SELECT id, user_id, delta, reason, ref, created_at
               FROM point_ledger
              WHERE user_id = ?1
                AND user_id NOT LIKE 'guest:%'
              ORDER BY id DESC
              LIMIT 200`
          )
          .bind(detailUserId)
          .all(),
        listUnlocksForUser(db, detailUserId, { limit: 300 }),
      ])
      accountUnlocks = unlocks
      accountDetail = {
        user_id: detailUserId,
        balance,
        ledgerCount: toNumber(detailRollup?.ledger_count),
        earnedPoints: toNumber(detailRollup?.earned_points),
        spentPoints: toNumber(detailRollup?.spent_points),
        unlockCount: unlocks.length,
        firstLedgerAt: detailRollup?.first_ledger_at || null,
        lastLedgerAt: detailRollup?.last_ledger_at || null,
      }
      accountLedger = (detailLedger?.results || []).map((row) => normalizeLedgerRow(row, { [detailUserId]: balance }))
    }

    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      rules: POINT_RULES,
      policy: POINT_POLICY,
      resources,
      summary: {
        accountCount: toNumber(accountSummary?.account_count),
        totalBalance: toNumber(accountSummary?.total_balance),
        ledgerCount: toNumber(ledgerSummary?.ledger_count),
        issuedPoints: toNumber(ledgerSummary?.issued_points),
        spentPoints: toNumber(ledgerSummary?.spent_points),
      },
      accounts: (accountsResult?.results || []).map((row) => ({
        user_id: row.user_id,
        balance: toNumber(row.balance),
        updated_at: row.updated_at,
        last_ledger_at: row.last_ledger_at,
        ledger_count: toNumber(row.ledger_count),
      })),
      accountDetail,
      accountLedger,
      accountUnlocks,
      recentLedger: ledgerRows.map((row) => normalizeLedgerRow(row, balanceMap)),
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: 'POINTS_READ_FAILED',
        message: '燃币配置读取失败（迁移 0028 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

/**
 * 写操作（action 区分）：
 *  - upsertResource: { resourceKey, costPoints, minRole }
 *  - deleteResource: { resourceKey }
 *  - adjust:         { userId, delta, note }  站长手动加/减燃币
 *  - reverse:        { ledgerId }             撤销某条燃币变动（补一笔反向变动）
 */
export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const action = String(body?.action || '')
  try {
    if (action === 'upsertResource') {
      const result = await upsertResource(db, {
        resourceKey: body?.resourceKey,
        costPoints: body?.costPoints,
        minRole: body?.minRole,
      })
      if (!result.ok) return Response.json(result, { status: result.status || 400 })
      return Response.json({ ok: true, resource: result })
    }

    if (action === 'deleteResource') {
      const result = await deleteResource(db, body?.resourceKey)
      if (!result.ok) return Response.json(result, { status: result.status || 400 })
      return Response.json({ ok: true })
    }

    if (action === 'adjust') {
      const result = await adminAdjust(db, body?.userId, body?.delta, String(body?.note || ''))
      if (!result.ok) return Response.json(result, { status: result.status || 400 })
      const balance = await getBalance(db, String(body?.userId || ''))
      return Response.json({ ok: true, balance })
    }

    if (action === 'reverse') {
      const result = await reverseLedgerEntry(db, body?.ledgerId)
      if (!result.ok) return Response.json(result, { status: result.status || 400 })
      return Response.json({ ok: true, ...result })
    }

    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
  } catch (error) {
    return Response.json(
      { error: 'POINTS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

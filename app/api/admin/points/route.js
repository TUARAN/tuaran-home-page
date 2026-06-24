import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  POINT_RULES,
  adminAdjust,
  deleteResource,
  getBalance,
  listResources,
  reverseLedgerEntry,
  upsertResource,
} from '../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 列出门槛资源配置 + 最近燃币流水 + 规则初值。 */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      message: '当前运行环境没有 D1 绑定，无法读取燃币配置（迁移 0028 是否已应用？）。',
      rules: POINT_RULES,
    })
  }

  try {
    const resources = await listResources(db)
    const ledger = await db
      .prepare(
        `SELECT id, user_id, delta, reason, ref, created_at
           FROM point_ledger ORDER BY id DESC LIMIT 50`
      )
      .all()
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      rules: POINT_RULES,
      resources,
      recentLedger: ledger?.results || [],
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
 *  - reverse:        { ledgerId }             撤销某条流水（补一笔反向变动）
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

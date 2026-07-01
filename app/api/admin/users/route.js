import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { isOwnerUser } from '../../../../lib/ownerAuth'
import { getBalance, getBalancesFor, getUnlockCountsForUsers } from '../../../../lib/points'
import { listSiteUsers, updateSiteUser } from '../../../../lib/userDirectory'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 给目录行补上 isOwner 标记（owner 由环境变量判定，仅作展示） */
function withOwnerFlag(user) {
  return {
    ...user,
    isOwner: isOwnerUser({
      id: user.id,
      login: user.login,
      email: user.email,
      name: user.name,
    }),
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      message: '当前运行环境没有 D1 绑定，无法读取用户目录。',
    })
  }

  try {
    const users = (await listSiteUsers(db)).map(withOwnerFlag)
    // 燃币余额按 user_id 关联；迁移 0028 未应用时容错为 0，不阻断目录加载。
    let balances = {}
    try {
      balances = await getBalancesFor(db, users.map((user) => user.id))
    } catch {
      balances = {}
    }
    let unlockCounts = {}
    try {
      unlockCounts = await getUnlockCountsForUsers(db, users.map((user) => user.id))
    } catch {
      unlockCounts = {}
    }
    const withBalance = users.map((user) => ({
      ...user,
      balance: balances[user.id] || 0,
      unlockCount: unlockCounts[user.id]?.unlockCount || 0,
      lastUnlockAt: unlockCounts[user.id]?.lastUnlockAt || null,
    }))
    return Response.json({ status: 'ok', generatedAt: Date.now(), users: withBalance })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'USERS_READ_FAILED',
        message: '用户目录读取失败（迁移 0021 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  try {
    const row = await db.prepare('SELECT * FROM site_users WHERE id = ?').bind(id).first()
    if (!row) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // 站长账号的角色锁定：owner 权限由环境变量决定，不允许在目录里降级/封禁，
    // 避免出现「界面上封了但权限还在」的假象。备注仍可改。
    const targetIsOwner = isOwnerUser({ id: row.id, login: row.login, email: row.email, name: row.name })
    if (targetIsOwner && body.role != null && body.role !== row.role) {
      return Response.json({ error: 'OWNER_ROLE_LOCKED' }, { status: 400 })
    }

    const result = await updateSiteUser(db, id, { role: body.role ?? null, note: body.note ?? null })
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status || 400 })
    }

    const updated = await db.prepare('SELECT * FROM site_users WHERE id = ?').bind(id).first()
    let balance = 0
    let unlockCounts = {}
    try {
      balance = await getBalance(db, updated.id)
      unlockCounts = await getUnlockCountsForUsers(db, [updated.id])
    } catch {}

    return Response.json({
      ok: true,
      user: withOwnerFlag({
        id: updated.id,
        provider: updated.provider,
        login: updated.login,
        name: updated.name,
        email: updated.email,
        image: updated.image,
        role: updated.role,
        note: updated.note || '',
        firstSeenAt: updated.first_seen_at,
        lastSeenAt: updated.last_seen_at,
        loginCount: updated.login_count,
        balance,
        unlockCount: unlockCounts[updated.id]?.unlockCount || 0,
        lastUnlockAt: unlockCounts[updated.id]?.lastUnlockAt || null,
      }),
    })
  } catch (error) {
    return Response.json(
      { error: 'USERS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

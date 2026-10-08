export const GUEST_SEED = 50

export async function getGuestSeed(db) {
  try {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'ranbi.guestSeed'").first()
    const value = row == null ? GUEST_SEED : Number(row.value)
    return Number.isInteger(value) && value >= 0 && value <= 100000 ? value : GUEST_SEED
  } catch {
    return GUEST_SEED
  }
}

export async function ensureGuestBalance(db, actor) {
  if (!actor?.isGuest) return
  const now = Date.now()
  const amount = await getGuestSeed(db)
  if (!amount) return
  // 已有试用流水时不再转账。旧路径直接写过账本，补转账会让触发器把余额再加一次。
  await db.prepare(
    `INSERT OR IGNORE INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
     SELECT 'pool:community', ?1, ?2, 'guest_seed', 'guest_seed', ?3
      WHERE NOT EXISTS (
        SELECT 1 FROM point_ledger
         WHERE user_id = ?1 AND reason = 'guest_seed' AND ref = 'guest_seed'
      )`,
  ).bind(actor.userId, amount, now).run()
}

export async function getBalance(db, userId) {
  const row = await db.prepare('SELECT balance FROM user_points WHERE user_id = ?1').bind(userId).first()
  return Number(row?.balance || 0)
}

export async function isUnlocked(db, userId, resourceKey) {
  const row = await db
    .prepare('SELECT 1 AS unlocked FROM resource_unlocks WHERE user_id = ?1 AND resource_key = ?2')
    .bind(userId, resourceKey)
    .first()
  return Boolean(row)
}

export async function getResourceAccess(db, actor, resource) {
  const [balance, unlocked] = await Promise.all([
    getBalance(db, actor.userId),
    isUnlocked(db, actor.userId, resource.resourceKey),
  ])
  return { balance, unlocked, cost: resource.costPoints }
}

export async function unlockResource(db, actor, resource) {
  const alreadyUnlocked = await isUnlocked(db, actor.userId, resource.resourceKey)
  if (alreadyUnlocked) {
    return { ok: true, alreadyUnlocked: true, balance: await getBalance(db, actor.userId), cost: resource.costPoints }
  }

  const cost = Math.max(0, Math.trunc(Number(resource.costPoints || 0)))
  const now = Date.now()
  if (cost === 0) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO resource_unlocks (user_id, resource_key, unlocked_at, cost_points)
         VALUES (?1, ?2, ?3, 0)`,
      )
      .bind(actor.userId, resource.resourceKey, now)
      .run()
    return { ok: true, cost: 0, balance: await getBalance(db, actor.userId) }
  }

  const balance = await getBalance(db, actor.userId)
  if (balance < cost) {
    return { ok: false, status: 402, error: 'INSUFFICIENT_BALANCE', balance, cost, need: cost - balance }
  }

  const results = await db.batch([
    // 转账触发器同时扣减余额、写入流水并进入黑洞。权益插入失败时整批回滚。
    db.prepare(
      `INSERT OR IGNORE INTO ranbi_transfers
        (from_account, to_account, amount, reason, ref, created_at)
       SELECT ?1, 'system:burn', ?2, 'unlock', ?3, ?4
        WHERE EXISTS (SELECT 1 FROM user_points WHERE user_id = ?1 AND balance >= ?2)
          AND NOT EXISTS (SELECT 1 FROM resource_unlocks WHERE user_id = ?1 AND resource_key = ?5)`,
    ).bind(actor.userId, cost, `unlock:${resource.resourceKey}`, now, resource.resourceKey),
    db
      .prepare(
        `INSERT OR IGNORE INTO resource_unlocks (user_id, resource_key, unlocked_at, cost_points)
         SELECT ?1, ?2, ?3, ?4
          WHERE changes() > 0`,
      )
      .bind(actor.userId, resource.resourceKey, now, cost),
  ])

  if (Number(results[0]?.meta?.changes || 0) < 1) {
    const unlocked = await isUnlocked(db, actor.userId, resource.resourceKey)
    const currentBalance = await getBalance(db, actor.userId)
    if (unlocked) return { ok: true, alreadyUnlocked: true, balance: currentBalance, cost }
    if (currentBalance >= cost) return { ok: false, status: 409, error: 'LEDGER_CONFLICT', balance: currentBalance, cost }
    return { ok: false, status: 402, error: 'INSUFFICIENT_BALANCE', balance: currentBalance, cost, need: Math.max(0, cost - currentBalance) }
  }

  return { ok: true, cost, balance: await getBalance(db, actor.userId) }
}

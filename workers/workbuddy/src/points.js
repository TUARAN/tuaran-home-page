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
  await db.batch([
    db.prepare(
      `INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
       VALUES (?1, ?2, 'guest_seed', 'guest_seed', ?3)`,
    ).bind(actor.userId, amount, now),
    db.prepare(
      `INSERT INTO user_points (user_id, balance, updated_at)
       SELECT ?1, ?2, ?3 WHERE changes() > 0
       ON CONFLICT(user_id) DO UPDATE SET
         balance = user_points.balance + excluded.balance,
         updated_at = excluded.updated_at`,
    ).bind(actor.userId, amount, now),
  ])
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
    // The ledger's unique idempotency key is the transaction's claim.
    // A failed statement rolls back the entire D1 batch.
    db.prepare(
      `INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
       SELECT ?1, -?2, 'unlock', ?3, ?4
       WHERE EXISTS (SELECT 1 FROM user_points WHERE user_id = ?1 AND balance >= ?2)
         AND NOT EXISTS (SELECT 1 FROM resource_unlocks WHERE user_id = ?1 AND resource_key = ?5)`,
    ).bind(actor.userId, cost, `unlock:${resource.resourceKey}`, now, resource.resourceKey),
    db
      .prepare(
        `UPDATE user_points
            SET balance = balance - ?1, updated_at = ?2
          WHERE user_id = ?3
            AND changes() > 0`,
      )
      .bind(cost, now, actor.userId),
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

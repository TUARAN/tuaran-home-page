import { getD1 } from './d1'
import {
  CONTRACT_RENEWAL_SETTING_KEY,
  defaultContractRenewalBriefing,
  normalizeContractRenewalBriefing,
  serializeContractRenewalBriefing,
} from './contractRenewalBriefing'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

async function ensureTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT NOT NULL DEFAULT ''
    )`,
  ).run()
}

function actorName(user) {
  return String(user?.login || user?.email || user?.name || user?.id || 'admin')
}

export async function getContractRenewalBriefingState() {
  const fallback = {
    persistent: false,
    source: 'default',
    updatedAt: null,
    briefing: defaultContractRenewalBriefing(),
  }
  const db = dbOrNull()
  if (!db) return fallback

  try {
    await ensureTable(db)
    const row = await db
      .prepare('SELECT value, updated_at FROM site_settings WHERE key = ?1')
      .bind(CONTRACT_RENEWAL_SETTING_KEY)
      .first()
    if (!row?.value) {
      return { ...fallback, persistent: true }
    }
    return {
      persistent: true,
      source: 'saved',
      updatedAt: Number(row.updated_at) || null,
      briefing: normalizeContractRenewalBriefing(JSON.parse(row.value)),
    }
  } catch {
    return { ...fallback, persistent: true }
  }
}

export async function setContractRenewalBriefing(input, user) {
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE', briefing: defaultContractRenewalBriefing() }

  const briefing = serializeContractRenewalBriefing(input)
  const now = Date.now()
  try {
    await ensureTable(db)
    await db.prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(CONTRACT_RENEWAL_SETTING_KEY, JSON.stringify(briefing), now, actorName(user)).run()
    return { ok: true, persistent: true, source: 'saved', updatedAt: now, briefing }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: 'DB_WRITE_FAILED',
      detail: String(error?.message || error),
      briefing: defaultContractRenewalBriefing(),
    }
  }
}

export async function resetContractRenewalBriefing(user) {
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE', briefing: defaultContractRenewalBriefing() }

  const briefing = defaultContractRenewalBriefing()
  const now = Date.now()
  try {
    await ensureTable(db)
    await db.prepare('DELETE FROM site_settings WHERE key = ?1').bind(CONTRACT_RENEWAL_SETTING_KEY).run()
    return {
      ok: true,
      persistent: true,
      source: 'default',
      updatedAt: now,
      briefing,
      resetBy: actorName(user),
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: 'DB_WRITE_FAILED',
      detail: String(error?.message || error),
      briefing,
    }
  }
}

import { getD1 } from './d1'
import {
  defaultHolidayJournal,
  HOLIDAY_JOURNAL_SETTING_KEY,
  normalizeHolidayJournal,
  serializeHolidayJournal,
} from './holidayJournal'

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

export async function getHolidayJournalState() {
  const fallback = {
    persistent: false,
    source: 'default',
    updatedAt: null,
    journal: defaultHolidayJournal(),
  }
  const db = dbOrNull()
  if (!db) return fallback

  try {
    await ensureTable(db)
    const row = await db
      .prepare('SELECT value, updated_at FROM site_settings WHERE key = ?1')
      .bind(HOLIDAY_JOURNAL_SETTING_KEY)
      .first()
    if (!row?.value) return { ...fallback, persistent: true }
    return {
      persistent: true,
      source: 'saved',
      updatedAt: Number(row.updated_at) || null,
      journal: normalizeHolidayJournal(JSON.parse(row.value)),
    }
  } catch {
    return { ...fallback, persistent: true }
  }
}

export async function setHolidayJournal(input, user) {
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }

  const journal = serializeHolidayJournal(input)
  const now = Date.now()
  try {
    await ensureTable(db)
    await db.prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(HOLIDAY_JOURNAL_SETTING_KEY, JSON.stringify(journal), now, actorName(user)).run()
    return { ok: true, persistent: true, source: 'saved', updatedAt: now, journal }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

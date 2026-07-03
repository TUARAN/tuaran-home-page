import { getD1 } from './d1'

const ADS_ENABLED_KEY = 'ads.enabled'

export const DEFAULT_SITE_SETTINGS = {
  ads: {
    enabled: true,
  },
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function parseBoolean(value, fallback) {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function serializeBoolean(value) {
  return value ? 'true' : 'false'
}

async function ensureSiteSettingsTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        updated_by TEXT NOT NULL DEFAULT ''
      )`
    )
    .run()
}

export async function getSiteSettings() {
  const db = dbOrNull()
  if (!db) return DEFAULT_SITE_SETTINGS

  try {
    await ensureSiteSettingsTable(db)
    const row = await db
      .prepare('SELECT value FROM site_settings WHERE key = ?1')
      .bind(ADS_ENABLED_KEY)
      .first()
    return {
      ads: {
        enabled: parseBoolean(row?.value, DEFAULT_SITE_SETTINGS.ads.enabled),
      },
    }
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

export async function setAdsEnabled(enabled, user) {
  if (typeof enabled !== 'boolean') {
    return { ok: false, status: 400, error: 'INVALID_ADS_ENABLED' }
  }

  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }

  const now = Date.now()
  const updatedBy = String(user?.login || user?.email || user?.name || user?.id || '')

  try {
    await ensureSiteSettingsTable(db)
    await db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at, updated_by)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`
      )
      .bind(ADS_ENABLED_KEY, serializeBoolean(enabled), now, updatedBy)
      .run()
    return { ok: true, settings: { ads: { enabled } }, updated_at: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

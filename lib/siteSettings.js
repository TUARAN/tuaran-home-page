import { getD1 } from './d1'

const ADS_ENABLED_KEY = 'ads.enabled' // 兼容旧设置
const ADS_SCRIPT_ENABLED_KEY = 'ads.script_enabled'
const ADS_MANUAL_SLOTS_ENABLED_KEY = 'ads.manual_slots_enabled'
const ADS_REVIEW_MODE_KEY = 'ads.review_mode'

export const DEFAULT_SITE_SETTINGS = {
  ads: {
    scriptEnabled: true,
    manualSlotsEnabled: false,
    reviewMode: true,
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
    const result = await db
      .prepare('SELECT key, value FROM site_settings WHERE key IN (?1, ?2, ?3, ?4)')
      .bind(ADS_ENABLED_KEY, ADS_SCRIPT_ENABLED_KEY, ADS_MANUAL_SLOTS_ENABLED_KEY, ADS_REVIEW_MODE_KEY)
      .all()
    const values = Object.fromEntries((result?.results || []).map((row) => [row.key, row.value]))
    const legacyEnabled = parseBoolean(values[ADS_ENABLED_KEY], DEFAULT_SITE_SETTINGS.ads.scriptEnabled)
    return {
      ads: {
        scriptEnabled: parseBoolean(values[ADS_SCRIPT_ENABLED_KEY], legacyEnabled),
        manualSlotsEnabled: parseBoolean(
          values[ADS_MANUAL_SLOTS_ENABLED_KEY],
          DEFAULT_SITE_SETTINGS.ads.manualSlotsEnabled,
        ),
        reviewMode: parseBoolean(values[ADS_REVIEW_MODE_KEY], DEFAULT_SITE_SETTINGS.ads.reviewMode),
      },
    }
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

export async function setAdsSettings(nextAds, user) {
  const allowed = {
    scriptEnabled: ADS_SCRIPT_ENABLED_KEY,
    manualSlotsEnabled: ADS_MANUAL_SLOTS_ENABLED_KEY,
    reviewMode: ADS_REVIEW_MODE_KEY,
  }
  const updates = Object.entries(allowed)
    .filter(([field]) => typeof nextAds?.[field] === 'boolean')
    .map(([field, key]) => ({ field, key, value: nextAds[field] }))
  if (!updates.length) return { ok: false, status: 400, error: 'INVALID_ADS_SETTINGS' }

  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }

  const now = Date.now()
  const updatedBy = String(user?.login || user?.email || user?.name || user?.id || '')

  try {
    await ensureSiteSettingsTable(db)
    for (const update of updates) {
      await db
        .prepare(
          `INSERT INTO site_settings (key, value, updated_at, updated_by)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             updated_at = excluded.updated_at,
             updated_by = excluded.updated_by`
        )
        .bind(update.key, serializeBoolean(update.value), now, updatedBy)
        .run()
    }
    const settings = await getSiteSettings()
    return { ok: true, settings, updated_at: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

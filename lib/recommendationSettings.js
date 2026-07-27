import { getD1 } from './d1'
import {
  HOME_RECOMMENDATION_MAX_BATCH_SIZE,
  HOME_RECOMMENDATION_MIN_BATCH_SIZE,
} from './homeRecommendationEngine'

export const HOME_RECOMMENDATION_KEY = 'recommendations.home'
export const HOME_RECOMMENDATION_SOURCES = ['feed', 'column', 'research', 'resources']

export const DEFAULT_HOME_RECOMMENDATION_SETTINGS = {
  enabled: true,
  batchSize: HOME_RECOMMENDATION_MIN_BATCH_SIZE,
  autoRotateHours: 12,
  rotationMode: 'random',
  avoidImmediateRepeats: true,
  sources: {
    feed: { enabled: true, weight: 2 },
    column: { enabled: true, weight: 3 },
    research: { enabled: true, weight: 3 },
    resources: { enabled: true, weight: 2 },
  },
  pinnedIds: [],
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function intInRange(value, min, max, fallback) {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export function normalizeHomeRecommendationSettings(input = {}) {
  const defaults = DEFAULT_HOME_RECOMMENDATION_SETTINGS
  const sources = Object.fromEntries(
    HOME_RECOMMENDATION_SOURCES.map((source) => {
      const next = input?.sources?.[source]
      return [source, {
        enabled: typeof next?.enabled === 'boolean' ? next.enabled : defaults.sources[source].enabled,
        weight: intInRange(next?.weight, 1, 10, defaults.sources[source].weight),
      }]
    }),
  )
  if (!Object.values(sources).some((source) => source.enabled)) sources.column.enabled = true

  return {
    enabled: typeof input?.enabled === 'boolean' ? input.enabled : defaults.enabled,
    batchSize: intInRange(
      input?.batchSize,
      HOME_RECOMMENDATION_MIN_BATCH_SIZE,
      HOME_RECOMMENDATION_MAX_BATCH_SIZE,
      defaults.batchSize,
    ),
    autoRotateHours: intInRange(input?.autoRotateHours, 1, 168, defaults.autoRotateHours),
    rotationMode: input?.rotationMode === 'ordered' ? 'ordered' : 'random',
    avoidImmediateRepeats: typeof input?.avoidImmediateRepeats === 'boolean'
      ? input.avoidImmediateRepeats
      : defaults.avoidImmediateRepeats,
    sources,
    pinnedIds: [...new Set(Array.isArray(input?.pinnedIds) ? input.pinnedIds : [])]
      .filter((id) => typeof id === 'string' && id.length <= 240)
      .slice(0, HOME_RECOMMENDATION_MAX_BATCH_SIZE),
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

export async function getHomeRecommendationSettings() {
  const db = dbOrNull()
  if (!db) return DEFAULT_HOME_RECOMMENDATION_SETTINGS
  try {
    await ensureTable(db)
    const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?1')
      .bind(HOME_RECOMMENDATION_KEY).first()
    return normalizeHomeRecommendationSettings(row?.value ? JSON.parse(row.value) : {})
  } catch {
    return DEFAULT_HOME_RECOMMENDATION_SETTINGS
  }
}

export async function setHomeRecommendationSettings(input, user) {
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }
  const settings = normalizeHomeRecommendationSettings(input)
  const now = Date.now()
  const updatedBy = String(user?.login || user?.email || user?.name || user?.id || '')
  try {
    await ensureTable(db)
    await db.prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(HOME_RECOMMENDATION_KEY, JSON.stringify(settings), now, updatedBy).run()
    return { ok: true, settings, updatedAt: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

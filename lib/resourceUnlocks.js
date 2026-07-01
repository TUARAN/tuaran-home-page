import { CONTENT_TYPE_LABELS, resolveContentEntry } from './contentRegistry'
import { POINT_RULES } from './points'
import { CATEGORY_META } from './research/categories'
import { RESEARCH_ENTRY_META } from './research/catalog'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function defaultCostFor(resourceKey) {
  if (resourceKey.startsWith('research:')) return POINT_RULES.researchDefaultCost
  if (resourceKey.startsWith('resource:')) return POINT_RULES.resourceDefaultCost
  return 0
}

export function resolveUnlockResource(resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!key) {
    return { resourceKey: '', title: '未知资源', href: '', typeLabel: '资源' }
  }

  if (key.startsWith('resource:')) {
    const slug = key.slice('resource:'.length)
    const meta = resolveContentEntry('resource', slug)
    return {
      resourceKey: key,
      title: meta?.title || slug || key,
      href: meta?.href || '',
      typeLabel: meta?.typeLabel || CONTENT_TYPE_LABELS.resource || '资源',
    }
  }

  if (key.startsWith('research:')) {
    const [, category, ...slugParts] = key.split(':')
    const slug = slugParts.join(':')
    const meta = RESEARCH_ENTRY_META[`${category}/${slug}`]
    return {
      resourceKey: key,
      title: meta?.title || slug || key,
      href: `/articles/research/${category}/${slug}`,
      typeLabel: CATEGORY_META[category]?.label || '调研',
    }
  }

  return {
    resourceKey: key,
    title: key,
    href: '',
    typeLabel: key.split(':')[0] || '资源',
  }
}

function normalizeUnlockRow(row) {
  const resourceKey = String(row?.resource_key || '')
  const meta = resolveUnlockResource(resourceKey)
  const explicitCost = row?.cost_points == null ? null : toNumber(row.cost_points)
  return {
    ...meta,
    userId: row?.user_id || '',
    unlockedAt: row?.unlocked_at || null,
    costPoints: explicitCost == null ? defaultCostFor(resourceKey) : explicitCost,
    minRole: row?.min_role || 'guest',
  }
}

export async function listUnlocksForUser(db, userId, { limit = 100 } = {}) {
  const id = String(userId || '').trim()
  const max = Math.max(1, Math.min(300, Math.trunc(Number(limit) || 100)))
  if (!db || !id) return []
  const result = await db
    .prepare(
      `SELECT ru.user_id, ru.resource_key, ru.unlocked_at, gr.cost_points, gr.min_role
         FROM resource_unlocks ru
         LEFT JOIN gated_resources gr ON gr.resource_key = ru.resource_key
        WHERE ru.user_id = ?1
        ORDER BY ru.unlocked_at DESC
        LIMIT ?2`
    )
    .bind(id, max)
    .all()
  return (result?.results || []).map(normalizeUnlockRow)
}

import { getD1 } from './d1'

export const FESTIVAL_BANNER_THEMES = ['red-gold', 'spring', 'warm', 'cool', 'neutral']

const DEFAULT_BANNER = {
  id: 'national-day-2026',
  festivalKey: 'national-day',
  name: '国庆节 2026',
  enabled: true,
  startAt: 1790784000000,
  endAt: 1791734399999,
  title: '热烈庆祝中华人民共和国成立',
  compactTitle: '热烈庆祝新中国成立',
  subtitle: '一九四九 · 二〇二六',
  badgeValue: '77',
  badgeLabel: '周年',
  leftImage: '/images/home/national-day-flag.webp',
  rightImage: '/images/home/national-day-tiananmen.webp',
  theme: 'red-gold',
  animateLeft: true,
  priority: 100,
}

export function getDefaultActiveFestivalBanner(at = Date.now()) {
  return at >= DEFAULT_BANNER.startAt && at <= DEFAULT_BANNER.endAt ? { ...DEFAULT_BANNER } : null
}

function cleanText(value, max = 120) {
  return String(value ?? '').trim().slice(0, max)
}

function cleanImagePath(value) {
  const path = cleanText(value, 500)
  if (!path) return ''
  if (path.startsWith('/') || /^https:\/\//i.test(path)) return path
  return ''
}

function rowToBanner(row) {
  if (!row) return null
  return {
    id: row.id,
    festivalKey: row.festival_key,
    name: row.name,
    enabled: row.enabled === 1,
    startAt: Number(row.start_at),
    endAt: Number(row.end_at),
    title: row.title,
    compactTitle: row.compact_title,
    subtitle: row.subtitle,
    badgeValue: row.badge_value,
    badgeLabel: row.badge_label,
    leftImage: row.left_image,
    rightImage: row.right_image,
    theme: row.theme,
    animateLeft: row.animate_left === 1,
    priority: Number(row.priority || 0),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
    updatedBy: row.updated_by || '',
  }
}

async function ensureTable(db, { seed = false } = {}) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS festival_banners (
    id TEXT PRIMARY KEY, festival_key TEXT NOT NULL DEFAULT '', name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL,
    title TEXT NOT NULL, compact_title TEXT NOT NULL DEFAULT '', subtitle TEXT NOT NULL DEFAULT '',
    badge_value TEXT NOT NULL DEFAULT '', badge_label TEXT NOT NULL DEFAULT '',
    left_image TEXT NOT NULL DEFAULT '', right_image TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'red-gold', animate_left INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL DEFAULT '')`).run()
  if (seed) {
    const now = Date.now()
    const banner = DEFAULT_BANNER
    await db.prepare(`INSERT OR IGNORE INTO festival_banners (
    id, festival_key, name, enabled, start_at, end_at, title, compact_title, subtitle,
    badge_value, badge_label, left_image, right_image, theme, animate_left, priority,
    created_at, updated_at, updated_by
  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)`)
      .bind(banner.id, banner.festivalKey, banner.name, 1, banner.startAt, banner.endAt,
        banner.title, banner.compactTitle, banner.subtitle, banner.badgeValue, banner.badgeLabel,
        banner.leftImage, banner.rightImage, banner.theme, 1, banner.priority, now, now, 'system')
      .run()
  }
}

export function validateFestivalBanner(input, existingId = '') {
  const startAt = Number(input?.startAt)
  const endAt = Number(input?.endAt)
  const title = cleanText(input?.title)
  const name = cleanText(input?.name, 80)
  if (!name) return { ok: false, error: '请输入内部名称。' }
  if (!title) return { ok: false, error: '请输入横幅主标题。' }
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    return { ok: false, error: '展示结束时间必须晚于开始时间。' }
  }
  const theme = FESTIVAL_BANNER_THEMES.includes(input?.theme) ? input.theme : 'red-gold'
  return {
    ok: true,
    banner: {
      id: existingId || cleanText(input?.id, 100) || crypto.randomUUID(),
      festivalKey: cleanText(input?.festivalKey, 80),
      name,
      enabled: input?.enabled !== false,
      startAt: Math.round(startAt),
      endAt: Math.round(endAt),
      title,
      compactTitle: cleanText(input?.compactTitle) || title,
      subtitle: cleanText(input?.subtitle),
      badgeValue: cleanText(input?.badgeValue, 24),
      badgeLabel: cleanText(input?.badgeLabel, 24),
      leftImage: cleanImagePath(input?.leftImage),
      rightImage: cleanImagePath(input?.rightImage),
      theme,
      animateLeft: input?.animateLeft === true,
      priority: Math.max(-999, Math.min(999, Math.round(Number(input?.priority) || 0))),
    },
  }
}

export async function listFestivalBanners() {
  const db = getD1()
  await ensureTable(db)
  const { results } = await db.prepare('SELECT * FROM festival_banners ORDER BY start_at DESC, priority DESC, updated_at DESC').all()
  return (results || []).map(rowToBanner)
}

export async function getActiveFestivalBanner(at = Date.now()) {
  const db = getD1()
  const query = () => db.prepare(`SELECT * FROM festival_banners
    WHERE enabled = 1 AND start_at <= ?1 AND end_at >= ?1
    ORDER BY priority DESC, updated_at DESC LIMIT 1`).bind(at).first()
  let row
  try {
    row = await query()
  } catch {
    await ensureTable(db, { seed: true })
    row = await query()
  }
  return rowToBanner(row)
}

export async function saveFestivalBanner(input, user) {
  const db = getD1()
  await ensureTable(db)
  const id = cleanText(input?.id, 100)
  const validation = validateFestivalBanner(input, id)
  if (!validation.ok) return validation
  const item = validation.banner
  const now = Date.now()
  const actor = cleanText(user?.login || user?.name || user?.email || '', 120)
  await db.prepare(`INSERT INTO festival_banners (
    id, festival_key, name, enabled, start_at, end_at, title, compact_title, subtitle,
    badge_value, badge_label, left_image, right_image, theme, animate_left, priority,
    created_at, updated_at, updated_by
  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
  ON CONFLICT(id) DO UPDATE SET festival_key=excluded.festival_key, name=excluded.name,
    enabled=excluded.enabled, start_at=excluded.start_at, end_at=excluded.end_at,
    title=excluded.title, compact_title=excluded.compact_title, subtitle=excluded.subtitle,
    badge_value=excluded.badge_value, badge_label=excluded.badge_label,
    left_image=excluded.left_image, right_image=excluded.right_image, theme=excluded.theme,
    animate_left=excluded.animate_left, priority=excluded.priority,
    updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
    .bind(item.id, item.festivalKey, item.name, item.enabled ? 1 : 0, item.startAt, item.endAt,
      item.title, item.compactTitle, item.subtitle, item.badgeValue, item.badgeLabel,
      item.leftImage, item.rightImage, item.theme, item.animateLeft ? 1 : 0, item.priority,
      now, now, actor)
    .run()
  return { ok: true, banner: { ...item, createdAt: now, updatedAt: now, updatedBy: actor } }
}

export async function deleteFestivalBanner(id) {
  const db = getD1()
  await ensureTable(db)
  await db.prepare('DELETE FROM festival_banners WHERE id = ?1').bind(cleanText(id, 100)).run()
  return { ok: true }
}

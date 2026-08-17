/** D1 每日问候模板存取。文件名保留以兼容旧引用。 */

import {
  DAILY_GREETING_TEMPLATES,
  normalizeGreetingNewlines,
  normalizeGreetingPeriod,
  templatesForPeriod,
} from './dailyGreeting.js'

const VALID_KINDS = new Set(['quote', 'story', 'reflection'])

function normalizeContentKind(value) {
  const kind = String(value || '').trim().toLowerCase()
  return VALID_KINDS.has(kind) ? kind : 'reflection'
}

export function rowToTemplate(row) {
  return {
    id: Number(row.id) || 0,
    text: normalizeGreetingNewlines(row.text || ''),
    period: normalizeGreetingPeriod(row.period),
    contentKind: normalizeContentKind(row.content_kind),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

function filtersSql({ period = 'all', query = '' } = {}) {
  const clauses = []
  const binds = []
  if (period !== 'all') {
    clauses.push('period = ?')
    binds.push(normalizeGreetingPeriod(period))
  }
  const cleanQuery = String(query || '').trim()
  if (cleanQuery) {
    clauses.push('text LIKE ?')
    binds.push(`%${cleanQuery}%`)
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', binds }
}

export async function listMorningGreetingTemplates(db, { offset = 0, limit = 20, period = 'all', query = '' } = {}) {
  const filters = filtersSql({ period, query })
  const rowsStatement = db
    .prepare(`SELECT * FROM morning_greeting_templates ${filters.where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`)
    .bind(...filters.binds, limit, offset)
  const countStatement = db
    .prepare(`SELECT COUNT(*) AS total FROM morning_greeting_templates ${filters.where}`)
    .bind(...filters.binds)
  const [rows, count] = await Promise.all([rowsStatement.all(), countStatement.first()])
  return { items: (rows?.results || []).map(rowToTemplate), total: Number(count?.total) || 0 }
}

export async function greetingTemplateStats(db) {
  const { results } = await db
    .prepare(`SELECT period, COUNT(*) AS total, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) AS enabled
              FROM morning_greeting_templates GROUP BY period`)
    .all()
  const byPeriod = { morning: { total: 0, enabled: 0 }, noon: { total: 0, enabled: 0 }, evening: { total: 0, enabled: 0 } }
  for (const row of results || []) {
    const period = normalizeGreetingPeriod(row.period)
    byPeriod[period] = { total: Number(row.total) || 0, enabled: Number(row.enabled) || 0 }
  }
  return {
    total: Object.values(byPeriod).reduce((sum, item) => sum + item.total, 0),
    enabled: Object.values(byPeriod).reduce((sum, item) => sum + item.enabled, 0),
    byPeriod,
  }
}

/** 只取指定时段启用文案；表不可用或该时段为空时回退代码默认池。 */
export async function listEnabledMorningGreetingTexts(db, period = 'morning') {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  try {
    const { results } = await db
      .prepare('SELECT text FROM morning_greeting_templates WHERE enabled = 1 AND period = ? ORDER BY sort_order ASC, id ASC')
      .bind(normalizedPeriod)
      .all()
    const texts = (results || []).map((row) => normalizeGreetingNewlines(row.text || '').trim()).filter(Boolean)
    return texts.length ? texts : templatesForPeriod(DAILY_GREETING_TEMPLATES, normalizedPeriod).map((item) => item.text)
  } catch {
    return templatesForPeriod(DAILY_GREETING_TEMPLATES, normalizedPeriod).map((item) => item.text)
  }
}

export async function upsertMorningGreetingTemplate(db, {
  id = 0,
  text = '',
  period = 'morning',
  contentKind = 'reflection',
  enabled = true,
  sortOrder = 0,
}) {
  const cleanText = String(text || '').trim()
  if (!cleanText) return { ok: false, error: 'MISSING_TEXT' }
  const now = Date.now()
  const templateId = Number(id) || 0
  const nextOrder = Number(sortOrder) || 0
  const nextPeriod = normalizeGreetingPeriod(period)
  const nextKind = normalizeContentKind(contentKind)
  if (templateId > 0) {
    const result = await db
      .prepare(`UPDATE morning_greeting_templates
                SET text = ?, period = ?, content_kind = ?, enabled = ?, sort_order = ?, updated_at = ?
                WHERE id = ?`)
      .bind(cleanText, nextPeriod, nextKind, enabled ? 1 : 0, nextOrder, now, templateId)
      .run()
    if (!result?.meta?.changes) return { ok: false, error: 'NOT_FOUND' }
    return { ok: true, id: templateId }
  }
  const row = await db
    .prepare(`INSERT INTO morning_greeting_templates
              (text, period, content_kind, enabled, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`)
    .bind(cleanText, nextPeriod, nextKind, enabled ? 1 : 0, nextOrder, now, now)
    .first()
  return { ok: Boolean(row?.id), id: Number(row?.id) || null }
}

export async function deleteMorningGreetingTemplate(db, id) {
  const templateId = Number(id) || 0
  if (!templateId) return { ok: false, error: 'MISSING_ID' }
  const result = await db.prepare('DELETE FROM morning_greeting_templates WHERE id = ?').bind(templateId).run()
  return { ok: Boolean(result?.meta?.changes), id: templateId }
}

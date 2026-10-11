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

export async function listMorningGreetingTemplates(db) {
  const rows = await db
    .prepare('SELECT * FROM morning_greeting_templates ORDER BY sort_order ASC, id ASC LIMIT 3')
    .all()
  const items = (rows?.results || []).map(rowToTemplate)
  return { items, total: items.length }
}

/** 只取指定时段的固定文案；表不可用或该时段为空时回退代码默认值。 */
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
}) {
  const cleanText = String(text || '').trim()
  if (!cleanText) return { ok: false, error: 'MISSING_TEXT' }
  const now = Date.now()
  const templateId = Number(id) || 0
  if (templateId > 0) {
    const result = await db
      .prepare(`UPDATE morning_greeting_templates
                SET text = ?, enabled = 1, updated_at = ?
                WHERE id = ?`)
      .bind(cleanText, now, templateId)
      .run()
    if (!result?.meta?.changes) return { ok: false, error: 'NOT_FOUND' }
    return { ok: true, id: templateId }
  }
  return { ok: false, error: 'MISSING_ID' }
}

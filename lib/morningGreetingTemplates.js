/**
 * 早安文案模板存取（D1）。后台 /admin/morning-greeting 可增删改启停；
 * 发布端点按日期稳定随机选一条启用的模板，表为空时回退代码默认池。
 */

import { MORNING_GREETING_TEMPLATES, normalizeGreetingNewlines } from './morningGreeting.js'

export function rowToTemplate(row) {
  return {
    id: Number(row.id) || 0,
    text: normalizeGreetingNewlines(row.text || ''),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

export async function listMorningGreetingTemplates(db) {
  const { results } = await db
    .prepare('SELECT * FROM morning_greeting_templates ORDER BY sort_order ASC, id ASC')
    .all()
  return (results || []).map(rowToTemplate)
}

/** 只取启用的文案文本（发布用）；表不存在或为空时回退代码默认池。 */
export async function listEnabledMorningGreetingTexts(db) {
  try {
    const { results } = await db
      .prepare("SELECT text FROM morning_greeting_templates WHERE enabled = 1 ORDER BY sort_order ASC, id ASC")
      .all()
    const texts = (results || []).map((row) => normalizeGreetingNewlines(row.text || '').trim()).filter(Boolean)
    return texts.length ? texts : MORNING_GREETING_TEMPLATES
  } catch {
    return MORNING_GREETING_TEMPLATES
  }
}

export async function upsertMorningGreetingTemplate(db, { id = 0, text = '', enabled = true, sortOrder = 0 }) {
  const cleanText = String(text || '').trim()
  if (!cleanText) return { ok: false, error: 'MISSING_TEXT' }
  const now = Date.now()
  const templateId = Number(id) || 0
  const nextOrder = Number(sortOrder) || 0
  if (templateId > 0) {
    const result = await db
      .prepare(
        `UPDATE morning_greeting_templates
         SET text = ?, enabled = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(cleanText, enabled ? 1 : 0, nextOrder, now, templateId)
      .run()
    if (!result?.meta?.changes) return { ok: false, error: 'NOT_FOUND' }
    return { ok: true, id: templateId }
  }
  const row = await db
    .prepare(
      `INSERT INTO morning_greeting_templates (text, enabled, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(cleanText, enabled ? 1 : 0, nextOrder, now, now)
    .first()
  return { ok: Boolean(row?.id), id: Number(row?.id) || null }
}

export async function deleteMorningGreetingTemplate(db, id) {
  const templateId = Number(id) || 0
  if (!templateId) return { ok: false, error: 'MISSING_ID' }
  const result = await db.prepare('DELETE FROM morning_greeting_templates WHERE id = ?').bind(templateId).run()
  return { ok: Boolean(result?.meta?.changes), id: templateId }
}

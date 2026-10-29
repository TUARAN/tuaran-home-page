import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { normalizePromptFeedback } from '../../../../lib/community/xExtensionPromptFeedback'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const TABLE = 'x_extension_prompt_feedback'

function reply(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function storageError(error) {
  const migrationRequired = /no such table/i.test(String(error?.message || error))
  return reply({ ok: false, error: migrationRequired ? '请先应用数据库迁移 0123_x_extension_prompt_feedback.sql。' : '反馈台账暂时无法读取或保存。' }, 503)
}

function present(row) {
  return {
    id: row.id,
    kind: row.kind,
    promptKey: row.prompt_key,
    content: row.content,
    assessment: row.assessment,
    expected: row.expected,
    context: row.context,
    sourceUrl: row.source_url,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    syncedAt: row.synced_at,
  }
}

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const requested = new URL(req.url).searchParams.get('status')
    const status = requested === 'pending' || requested === 'reviewed' ? requested : ''
    const db = getD1()
    const query = status
      ? db.prepare(`SELECT * FROM ${TABLE} WHERE status = ? ORDER BY created_at DESC LIMIT 200`).bind(status)
      : db.prepare(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT 200`)
    const result = await query.all()
    return reply({ ok: true, entries: (result.results || []).map(present), limitedTo: 200 })
  } catch (error) {
    return storageError(error)
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const input = await req.json().catch(() => null)
  const normalized = normalizePromptFeedback(input)
  if (!normalized.ok) return reply({ ok: false, error: normalized.error }, 422)
  const { kind, promptKey, content, assessment, expected, context, sourceUrl } = normalized.value
  const id = crypto.randomUUID()
  const createdAt = Date.now()
  try {
    await getD1().prepare(
      `INSERT INTO ${TABLE} (id, kind, prompt_key, content, assessment, expected, context, source_url, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, kind, promptKey, content, assessment, expected, context, sourceUrl, createdAt, auth.user?.login || 'owner').run()
    return reply({ ok: true, id, createdAt }, 201)
  } catch (error) {
    return storageError(error)
  }
}

export async function PATCH(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const input = await req.json().catch(() => null)
  const id = String(input?.id || '')
  const status = input?.status
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['pending', 'reviewed'].includes(status)) {
    return reply({ ok: false, error: '无效的反馈编号或状态。' }, 422)
  }
  try {
    const updatedAt = status === 'reviewed' ? Date.now() : null
    const result = await getD1().prepare(`UPDATE ${TABLE} SET status = ?, reviewed_at = ? WHERE id = ?`)
      .bind(status, updatedAt, id).run()
    if (!result.meta?.changes) return reply({ ok: false, error: '反馈不存在。' }, 404)
    return reply({ ok: true, id, status, reviewedAt: updatedAt })
  } catch (error) {
    return storageError(error)
  }
}

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../../lib/adminAuth'
import { getD1 } from '../../../../../../lib/d1'
import { getXCredentials, publishXPost } from '../../../../../../lib/xDistribution'
import { recordXApiPostCost } from '../../../../../../lib/xApiCost'
import { xReplyTaskFromRow } from '../../../../../../lib/xReplyTasks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function POST(request, { params }) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'INVALID_TASK_ID' }, { status: 400 })

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const env = getOptionalRequestContext()?.env || {}
  const credentials = getXCredentials(env)
  if (!credentials) return Response.json({ error: 'X_NOT_CONFIGURED' }, { status: 503 })

  const now = Date.now()
  let row
  try {
    row = await db.prepare(
      `UPDATE x_reply_tasks
       SET status = 'publishing', error = '', updated_at = ?2
       WHERE id = ?1 AND status IN ('draft', 'failed')
       RETURNING *`,
    ).bind(id, now).first()
    if (!row) {
      const existing = await db.prepare('SELECT * FROM x_reply_tasks WHERE id = ?1').bind(id).first()
      if (!existing) return Response.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
      return Response.json(
        { error: existing.status === 'published' ? 'TASK_ALREADY_PUBLISHED' : 'TASK_REQUIRES_REVIEW', task: xReplyTaskFromRow(existing) },
        { status: 409 },
      )
    }
  } catch {
    return Response.json({ error: 'X_REPLY_TASK_ACQUIRE_FAILED' }, { status: 500 })
  }

  const result = await publishXPost(row.reply_text, {
    credentials,
    replyToPostId: row.target_post_id,
  })
  if (!result.ok) {
    const uncertain = result.error === 'X_UNREACHABLE'
      || !result.xStatus
      || result.xStatus >= 500
    const status = uncertain ? 'publish-unknown' : 'failed'
    await db.prepare(
      `UPDATE x_reply_tasks SET status = ?2, error = ?3, updated_at = ?4 WHERE id = ?1`,
    ).bind(id, status, result.detail || result.error, Date.now()).run().catch(() => {})
    return Response.json({ ...result, taskStatus: status }, { status: result.status || 502 })
  }

  const publishedAt = Date.now()
  const published = await db.prepare(
    `UPDATE x_reply_tasks
     SET status = 'published', reply_post_id = ?2, reply_post_url = ?3,
         error = '', published_at = ?4, updated_at = ?5
     WHERE id = ?1
     RETURNING *`,
  ).bind(id, result.post.id, result.post.url, publishedAt, publishedAt).first()
  await recordXApiPostCost(db, {
    postId: result.post.id,
    automationId: 'x-reply-admin',
    slot: 'manual-review',
    contentType: 'reply',
    text: row.reply_text,
    createdAt: publishedAt,
  }).catch(() => {})
  return Response.json({ ok: true, task: xReplyTaskFromRow(published), post: result.post })
}

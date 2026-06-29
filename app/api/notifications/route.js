import { resolveArticleKey } from '../../../lib/articleLinks'
import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function notificationHref(articleKey, commentId) {
  const resolved = resolveArticleKey(articleKey)
  if (!resolved.href) return null
  return `${resolved.href}#comment-${commentId || 'comments'}`
}

function mapNotification(row) {
  const article = resolveArticleKey(row.article_key)
  return {
    id: Number(row.id),
    type: row.type || 'comment_reply',
    actorUserId: row.actor_user_id || '',
    actorUserProvider: row.actor_user_provider || '',
    actorUserName: row.actor_user_name || '',
    actorUserImage: row.actor_user_image || '',
    articleKey: row.article_key || '',
    articleTitle: article.title,
    href: notificationHref(row.article_key, row.comment_id),
    commentId: Number(row.comment_id) || null,
    replyToCommentId: Number(row.reply_to_comment_id) || null,
    messageExcerpt: row.message_excerpt || '',
    readAt: Number(row.read_at) || null,
    createdAt: Number(row.created_at) || 0,
  }
}

export async function GET(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ items: [], unread: 0, status: 'anonymous' })

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ items: [], unread: 0, status: 'unavailable' })
  }

  try {
    const [itemsResult, unreadRow] = await Promise.all([
      db
        .prepare(
          `SELECT id, type, actor_user_id, actor_user_provider, actor_user_name, actor_user_image,
                  article_key, comment_id, reply_to_comment_id, message_excerpt, read_at, created_at
           FROM comment_notifications
           WHERE recipient_user_id = ?1
           ORDER BY created_at DESC
           LIMIT 20`
        )
        .bind(String(user.id))
        .all(),
      db
        .prepare(
          `SELECT COUNT(*) AS unread
           FROM comment_notifications
           WHERE recipient_user_id = ?1 AND read_at IS NULL`
        )
        .bind(String(user.id))
        .first(),
    ])

    return Response.json({
      status: 'ok',
      unread: Number(unreadRow?.unread) || 0,
      items: (itemsResult?.results || []).map(mapNotification),
    })
  } catch {
    return Response.json({ items: [], unread: 0, status: 'error' }, { status: 500 })
  }
}

export async function PATCH(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body = {}
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  const now = Date.now()
  try {
    if (body?.all) {
      const result = await db
        .prepare(
          `UPDATE comment_notifications
           SET read_at = ?1
           WHERE recipient_user_id = ?2 AND read_at IS NULL`
        )
        .bind(now, String(user.id))
        .run()
      return Response.json({ ok: true, changed: result?.meta?.changes || 0 })
    }

    const id = Number(body?.id)
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'INVALID_ID' }, { status: 400 })
    }
    const result = await db
      .prepare(
        `UPDATE comment_notifications
         SET read_at = ?1
         WHERE id = ?2 AND recipient_user_id = ?3`
      )
      .bind(now, id, String(user.id))
      .run()
    return Response.json({ ok: true, changed: result?.meta?.changes || 0 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

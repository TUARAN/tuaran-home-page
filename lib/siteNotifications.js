import { isOwnerUser } from './ownerAuth'
import { listSiteUsers } from './userDirectory'
import {
  automationAlertKey,
  buildAutomationAlertExcerpt,
} from './siteNotificationsCore'

export { automationAlertKey, buildAutomationAlertExcerpt } from './siteNotificationsCore'

export async function findOwnerAccount(db) {
  try {
    const users = await listSiteUsers(db)
    return users.find((user) => isOwnerUser(user)) || null
  } catch {
    return null
  }
}

export async function notifyOwner(db, {
  type,
  actor,
  articleKey,
  commentId = 0,
  replyToCommentId = 0,
  messageExcerpt,
  createdAt = Date.now(),
  skipRecipientUserId = '',
}) {
  if (!db || !type || !articleKey) return { created: false, reason: 'invalid' }
  if (actor?.isOwner || isOwnerUser(actor)) return { created: false, reason: 'owner_action' }

  const owner = await findOwnerAccount(db)
  if (!owner?.id) return { created: false, reason: 'owner_not_found' }
  if (String(owner.id) === String(skipRecipientUserId || '')) {
    return { created: false, reason: 'already_notified' }
  }
  if (actor?.id && String(owner.id) === String(actor.id)) {
    return { created: false, reason: 'owner_action' }
  }

  const result = await db
    .prepare(
      `INSERT INTO comment_notifications
         (type, recipient_user_id, actor_user_id, actor_user_provider, actor_user_name,
          actor_user_image, article_key, comment_id, reply_to_comment_id, message_excerpt, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
    )
    .bind(
      type,
      String(owner.id),
      String(actor?.id || 'visitor'),
      String(actor?.provider || 'guest'),
      String(actor?.name || '一位访客'),
      actor?.image ? String(actor.image) : null,
      articleKey,
      Number(commentId) || 0,
      Number(replyToCommentId) || 0,
      String(messageExcerpt || '').slice(0, 160),
      createdAt
    )
    .run()

  return { created: Boolean(result?.meta?.changes), recipientUserId: owner.id }
}

export async function createWeeklySummaryNotification(db, {
  weekKey,
  messageExcerpt,
  createdAt = Date.now(),
}) {
  const owner = await findOwnerAccount(db)
  if (!owner?.id) return { created: false, reason: 'owner_not_found' }

  const articleKey = `system:weekly:${weekKey}`
  const existing = await db
    .prepare(
      `SELECT id FROM comment_notifications
       WHERE type = 'weekly_summary' AND recipient_user_id = ?1 AND article_key = ?2
       LIMIT 1`
    )
    .bind(String(owner.id), articleKey)
    .first()
  if (existing?.id) return { created: false, reason: 'already_created', id: Number(existing.id) }

  const row = await db
    .prepare(
      `INSERT INTO comment_notifications
         (type, recipient_user_id, actor_user_id, actor_user_provider, actor_user_name,
          actor_user_image, article_key, comment_id, reply_to_comment_id, message_excerpt, created_at)
       VALUES ('weekly_summary', ?1, 'system:weekly', 'system', '周总结', NULL, ?2, 0, 0, ?3, ?4)
       RETURNING id`
    )
    .bind(String(owner.id), articleKey, String(messageExcerpt || '').slice(0, 160), createdAt)
    .first()

  return { created: Boolean(row?.id), id: Number(row?.id) || null, recipientUserId: owner.id }
}

/**
 * 自动化任务失败告警：写入站长消息中心（type = automation_monitor）。
 * 同一 workflow + runId 只写一条（幂等），避免失败重试时重复打扰。
 */
export async function createAutomationAlertNotification(db, {
  workflow,
  runId,
  taskName = '',
  status = 'failed',
  error = '',
  runUrl = '',
  createdAt = Date.now(),
}) {
  const owner = await findOwnerAccount(db)
  if (!owner?.id) return { created: false, reason: 'owner_not_found' }

  const articleKey = automationAlertKey(workflow, runId)
  const existing = await db
    .prepare(
      `SELECT id FROM comment_notifications
       WHERE type = 'automation_monitor' AND recipient_user_id = ?1 AND article_key = ?2
       LIMIT 1`
    )
    .bind(String(owner.id), articleKey)
    .first()
  if (existing?.id) return { created: false, reason: 'already_created', id: Number(existing.id) }

  const excerpt = buildAutomationAlertExcerpt({ taskName, status, error, runUrl })
  const row = await db
    .prepare(
      `INSERT INTO comment_notifications
         (type, recipient_user_id, actor_user_id, actor_user_provider, actor_user_name,
          actor_user_image, article_key, comment_id, reply_to_comment_id, message_excerpt, created_at)
       VALUES ('automation_monitor', ?1, 'system:automation', 'system', ?2, NULL, ?3, 0, 0, ?4, ?5)
       RETURNING id`
    )
    .bind(
      String(owner.id),
      String(taskName || '自动化任务').slice(0, 80),
      articleKey,
      excerpt,
      createdAt
    )
    .first()

  return { created: Boolean(row?.id), id: Number(row?.id) || null, recipientUserId: owner.id }
}

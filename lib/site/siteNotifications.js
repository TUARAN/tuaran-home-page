import { isSuccessfulAutomationStatus, lastRunSettingKey } from '../automation/automationLastRun'
import { isOwnerUser } from '../auth/ownerAuth'
import { listSiteUsers } from '../auth/userDirectory'
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

const EXTENSION_ALERT_LABELS = {
  'x-transient-error': 'X 页面提示临时错误，插件正在重连',
  'x-network-unreachable': '插件无法连接 X，正在自动重试',
  'x-draft-blocked': '回复框有未发送内容，安全重连正在等待',
}

export async function createExtensionAlertNotification(db, {
  deviceId,
  task,
  errorCode,
  accountHandle = '',
  extensionVersion = '',
  targetId = '',
  createdAt = Date.now(),
}) {
  const detail = EXTENSION_ALERT_LABELS[errorCode]
  if (!detail || !deviceId || !task) return { created: false, reason: 'unsupported' }
  const owner = await findOwnerAccount(db)
  if (!owner?.id) return { created: false, reason: 'owner_not_found' }
  const articleKey = `extension:x:${deviceId}:${task}:${errorCode}`
  const existing = await db.prepare(
    `SELECT id FROM comment_notifications
     WHERE type = 'automation_monitor' AND recipient_user_id = ?1 AND article_key = ?2 AND created_at >= ?3
     LIMIT 1`
  ).bind(String(owner.id), articleKey, createdAt - 30 * 60 * 1000).first()
  if (existing?.id) return { created: false, reason: 'recently_notified', id: Number(existing.id) }

  const taskName = {
    'timeline-reply': '评论帖子',
    'notification-reply': '评论通知',
  }[task] || task
  const excerpt = [detail, accountHandle ? `@${accountHandle}` : '', extensionVersion ? `v${extensionVersion}` : '', targetId ? `帖子 ${targetId}` : '']
    .filter(Boolean).join('；').slice(0, 160)
  const row = await db.prepare(
    `INSERT INTO comment_notifications
       (type, recipient_user_id, actor_user_id, actor_user_provider, actor_user_name,
        actor_user_image, article_key, comment_id, reply_to_comment_id, message_excerpt, created_at)
     VALUES ('automation_monitor', ?1, 'system:extension', 'system', ?2, NULL, ?3, 0, 0, ?4, ?5)
     RETURNING id`
  ).bind(String(owner.id), `X 插件 · ${taskName}`, articleKey, excerpt, createdAt).first()
  return { created: Boolean(row?.id), id: Number(row?.id) || null, recipientUserId: owner.id }
}

/**
 * 自动化任务失败告警：写入站长消息中心（type = automation_monitor）。
 * 同一 workflow + runId 只写一条（幂等），避免失败重试时重复打扰。
 */
async function recordAutomationLastRun(db, {
  workflow,
  runId,
  taskName = '',
  status = 'failed',
  error = '',
  runUrl = '',
  createdAt = Date.now(),
}) {
  if (!db) return
  const workflowId = String(workflow || '').trim()
  if (!workflowId) return
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
    .bind(
      lastRunSettingKey(workflowId),
      JSON.stringify({
        ok: isSuccessfulAutomationStatus(status),
        at: Number(createdAt) || Date.now(),
        runId: String(runId || ''),
        runUrl: String(runUrl || '').slice(0, 500),
        error: String(error || '').slice(0, 200),
        taskName: String(taskName || '').slice(0, 80),
        status: String(status || 'failed').slice(0, 20),
      }),
      Number(createdAt) || Date.now(),
      'automation',
    )
    .run()
}

export async function createAutomationAlertNotification(db, {
  workflow,
  runId,
  taskName = '',
  status = 'failed',
  error = '',
  runUrl = '',
  createdAt = Date.now(),
}) {
  try {
    await recordAutomationLastRun(db, { workflow, runId, taskName, status, error, runUrl, createdAt })
  } catch {
    // 最近运行回写失败不阻断告警本身。
  }
  if (isSuccessfulAutomationStatus(status)) {
    return { created: false, reason: 'success_recorded' }
  }

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

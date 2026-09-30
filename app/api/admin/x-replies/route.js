import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { callDeepSeek } from '../../../../lib/deepseek'
import {
  buildGenericXReplyMessages,
  normalizeXPostTarget,
  sanitizeGeneratedXReply,
  validateXReplyText,
  xReplyTaskFromRow,
} from '../../../../lib/xReplyTasks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function isMissingTable(error) {
  return /no such table|x_reply_tasks/i.test(String(error?.message || error))
}

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ tasks: [], persistent: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  try {
    const result = await db.prepare(
      `SELECT * FROM x_reply_tasks
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
    ).all()
    return Response.json({ tasks: (result?.results || []).map(xReplyTaskFromRow), persistent: true })
  } catch (error) {
    if (isMissingTable(error)) {
      return Response.json({ tasks: [], persistent: false, migrationRequired: '0103_x_reply_tasks.sql' })
    }
    return Response.json({ error: 'X_REPLY_TASKS_READ_FAILED' }, { status: 500 })
  }
}

export async function POST(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const body = await readBody(request)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })

  if (body.action === 'generate-ai') {
    const env = getOptionalRequestContext()?.env || {}
    try {
      const result = await callDeepSeek({
        env,
        messages: buildGenericXReplyMessages(),
        temperature: 1,
        maxTokens: 64,
        timeoutMs: 45_000,
        taskDefaultModel: 'deepseek-v4-flash',
        disableThinking: true,
        task: {
          source: 'x-reply-admin',
          taskType: 'generic-reply-generation',
          title: 'X 通用短回复生成',
          actorId: guard.user?.id || guard.user?.login || '',
          actorName: guard.user?.name || guard.user?.login || 'TUARAN',
          inputSummary: '人工请求生成一条通用短回复；只返回草稿，不自动发布。',
          metadata: { directPublish: false },
        },
      })
      const text = sanitizeGeneratedXReply(result.content)
      if (!text) return Response.json({ error: 'INVALID_GENERATED_REPLY' }, { status: 502 })
      return Response.json({ ok: true, text, model: result.model, taskId: result.taskId })
    } catch (error) {
      return Response.json(
        { error: error?.code || 'X_REPLY_GENERATION_FAILED', detail: error?.message || '模型生成失败。' },
        { status: error?.status >= 400 && error?.status < 600 ? error.status : 502 },
      )
    }
  }

  if (body.action !== 'create') {
    return Response.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  }

  const target = normalizeXPostTarget(body.targetUrl || body.targetPostId)
  if (!target.ok) return Response.json({ error: target.error }, { status: 400 })
  const reply = validateXReplyText(body.replyText)
  if (!reply.ok) return Response.json({ error: reply.error }, { status: 400 })
  const source = ['manual', 'library', 'ai'].includes(body.source) ? body.source : 'manual'
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  try {
    const now = Date.now()
    const row = await db.prepare(
      `INSERT INTO x_reply_tasks
         (target_post_id, target_url, reply_text, source, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, 'draft', ?5, ?6)
       RETURNING *`,
    ).bind(target.postId, target.url, reply.text, source, now, now).first()
    return Response.json({ ok: true, task: xReplyTaskFromRow(row) }, { status: 201 })
  } catch (error) {
    if (isMissingTable(error)) {
      return Response.json({ error: 'MIGRATION_REQUIRED', migration: '0103_x_reply_tasks.sql' }, { status: 503 })
    }
    if (/unique/i.test(String(error?.message || error))) {
      return Response.json({ error: 'TARGET_ALREADY_QUEUED' }, { status: 409 })
    }
    return Response.json({ error: 'X_REPLY_TASK_CREATE_FAILED' }, { status: 500 })
  }
}

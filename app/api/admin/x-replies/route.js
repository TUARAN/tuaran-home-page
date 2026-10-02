import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { callDeepSeek } from '../../../../lib/deepseek'
import { hasUsableDeepSeekKey } from '../../../../lib/deepseekKeys'
import { DAILY_GREETING_MODEL_SELECTIONS_KEY } from '../../../../lib/dailyGreetingLlm'
import { parseModelSelection } from '../../../../lib/modelSelection'
import { callOllama } from '../../../../lib/ollama'
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

async function readSetting(db, key) {
  if (!db) return ''
  const { results } = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).all()
  return results?.[0]?.value ?? ''
}

function selectedModelId(raw) {
  const value = String(raw || '').trim()
  if (!value.startsWith('[')) return value || 'deepseek'
  try {
    return String(JSON.parse(value)?.[0] || 'deepseek')
  } catch {
    return 'deepseek'
  }
}

async function activeOllamaFallback(db) {
  if (!db) return null
  return db.prepare(
    `SELECT id, name, default_model
     FROM llm_providers
     WHERE provider_type = 'ollama' AND status = 'active'
     ORDER BY updated_at DESC LIMIT 1`,
  ).first()
}

function modelError(code, message, status = 503) {
  return Object.assign(new Error(message), { code, status })
}

async function generateReply({ db, env, task }) {
  const [savedRaw, deepseekUsable, ollamaFallback] = await Promise.all([
    readSetting(db, DAILY_GREETING_MODEL_SELECTIONS_KEY).catch(() => ''),
    hasUsableDeepSeekKey({ env, source: task.source, taskType: task.taskType }),
    activeOllamaFallback(db).catch(() => null),
  ])
  const selected = parseModelSelection(selectedModelId(savedRaw)) || parseModelSelection('deepseek')
  const candidates = []
  const seen = new Set()
  const addCandidate = (candidate) => {
    if (!candidate) return
    const key = `${candidate.provider}:${candidate.providerId || ''}:${candidate.model || ''}`
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(candidate)
  }

  if (selected.provider === 'ollama') addCandidate(selected)
  if (selected.provider === 'deepseek' && deepseekUsable) addCandidate(selected)
  if (ollamaFallback) addCandidate({
    provider: 'ollama',
    providerId: ollamaFallback.id,
    providerName: ollamaFallback.name,
    model: ollamaFallback.default_model,
  })
  if (deepseekUsable) addCandidate(parseModelSelection('deepseek'))
  if (!candidates.length) {
    throw modelError('MODEL_PROVIDER_NOT_CONFIGURED', '后台没有可用的 DeepSeek 密钥或 NAS 模型服务。')
  }

  const messages = buildGenericXReplyMessages()
  let lastError = null
  for (const [index, candidate] of candidates.entries()) {
    try {
      const result = candidate.provider === 'ollama'
        ? await callOllama({
            providerId: candidate.providerId,
            model: candidate.model || undefined,
            messages,
            temperature: 1,
            maxTokens: 64,
            reasoningEffort: 'none',
            timeoutMs: 90_000,
            task: { ...task, metadata: { ...task.metadata, fallbackIndex: index } },
          })
        : await callDeepSeek({
            env,
            messages,
            temperature: 1,
            maxTokens: 64,
            timeoutMs: 45_000,
            taskDefaultModel: 'deepseek-v4-flash',
            disableThinking: true,
            task: { ...task, metadata: { ...task.metadata, fallbackIndex: index } },
          })
      const text = sanitizeGeneratedXReply(result.content)
      if (!text) throw modelError('INVALID_GENERATED_REPLY', '模型返回的回复内容不可用。', 502)
      return {
        text,
        model: result.model,
        taskId: result.taskId,
        provider: candidate.provider,
        providerName: result.providerName || candidate.providerName || 'DeepSeek',
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || modelError('X_REPLY_GENERATION_FAILED', '模型生成失败。', 502)
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
      const result = await generateReply({
        db: dbOrNull(),
        env,
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
      return Response.json({ ok: true, ...result })
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

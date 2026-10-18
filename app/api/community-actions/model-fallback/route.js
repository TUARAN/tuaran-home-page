import { getD1 } from '../../../../lib/db/d1'
import { callOllama } from '../../../../lib/ai/ollama'
import {
  COMMUNITY_ACTION_SECRET_HEADER,
  COMMUNITY_ACTION_SECRET_KEY,
  communityActionAuthorized,
} from '../../../../lib/community/communityActions'
import { normalizeXModelFallbackRequest, X_MODEL_FALLBACK_MAX_CALLS_PER_HOUR } from '../../../../lib/community/xModelFallback'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  const secretRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(COMMUNITY_ACTION_SECRET_KEY).first()
  const authorized = communityActionAuthorized(request.headers.get(COMMUNITY_ACTION_SECRET_HEADER), secretRow?.value)
  if (!authorized.ok) return Response.json({ error: authorized.error }, { status: authorized.status })

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 8000) return Response.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  const text = await request.text()
  if (text.length > 8000) return Response.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  let body
  try { body = JSON.parse(text) } catch { body = null }
  const input = normalizeXModelFallbackRequest(body)
  if (!input) return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 })

  const hourAgo = Date.now() - 60 * 60 * 1000
  const recent = await db.prepare(
    "SELECT COUNT(*) AS total FROM deepseek_tasks WHERE source = 'x-extension' AND task_type = 'reply-fallback' AND started_at >= ?",
  ).bind(hourAgo).first()
  if (Number(recent?.total) >= X_MODEL_FALLBACK_MAX_CALLS_PER_HOUR) {
    return Response.json({ error: 'FALLBACK_HOURLY_LIMIT' }, { status: 429 })
  }

  const provider = await db.prepare(
    `SELECT id, name, default_model FROM llm_providers
     WHERE provider_type = 'ollama' AND status = 'active'
     ORDER BY updated_at DESC LIMIT 1`,
  ).first()
  if (!provider) return Response.json({ error: 'NAS_PROVIDER_UNAVAILABLE' }, { status: 503 })

  try {
    const result = await callOllama({
      providerId: provider.id,
      model: provider.default_model,
      messages: input.messages,
      temperature: 0.8,
      maxTokens: 96,
      reasoningEffort: 'none',
      timeoutMs: 90_000,
      task: {
        source: 'x-extension',
        taskType: 'reply-fallback',
        title: 'X 扩展回复 · DeepSeek 临时故障回退',
        actorName: 'X 高频互动助手',
        inputSummary: `账号 ${input.accountHandle || '未提供'}；只记录长度 ${input.messages[1].content.length}，不保存回复上下文。`,
        metadata: { reason: 'deepseek-transient-failure' },
      },
    })
    return Response.json({ ok: true, provider: 'ollama', model: result.model, content: result.content })
  } catch (error) {
    return Response.json({ error: error?.code || 'NAS_FALLBACK_FAILED', detail: String(error?.message || error).slice(0, 300) }, { status: 502 })
  }
}

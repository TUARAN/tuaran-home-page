import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { normalizeLocalLlmSyncPayload, localLlmTaskId } from '../../../../../lib/localLlmSync'
import { safeEqual } from '../../../../../lib/ownerAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function bearerToken(req) {
  const authorization = String(req.headers.get('authorization') || '')
  return authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : ''
}

export async function POST(req) {
  const env = getOptionalRequestContext()?.env || {}
  const expectedToken = String(env.LOCAL_LLM_SYNC_SECRET || process.env.LOCAL_LLM_SYNC_SECRET || '').trim()
  if (!expectedToken) {
    return Response.json({ error: 'LOCAL_LLM_SYNC_SECRET_NOT_CONFIGURED' }, { status: 503 })
  }
  if (!safeEqual(bearerToken(req), expectedToken)) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const normalized = normalizeLocalLlmSyncPayload(body)
  if (!normalized.ok) {
    return Response.json({ error: normalized.error }, { status: 400 })
  }

  const item = normalized.record
  const taskId = await localLlmTaskId(item.deviceId, item.localCallId)
  const title = item.inputSummary.slice(0, 240) || `Mac 调用 ${item.model}`
  const metadata = JSON.stringify({
    executionScope: 'local',
    deviceId: item.deviceId,
    deviceName: item.deviceName,
    localCallId: item.localCallId,
    endpoint: item.endpoint,
    loadDurationMs: item.loadDurationMs,
  }).slice(0, 5000)

  try {
    await env.DB.prepare(
      `INSERT INTO deepseek_tasks
        (id, source, task_type, title, execution_status, management_status, priority,
         actor_id, actor_name, model, key_id, key_name, provider, provider_id, provider_name,
         execution_scope, input_summary, result_summary, metadata_json,
         prompt_tokens, completion_tokens, total_tokens, duration_ms, error_code,
         error_detail, management_note, started_at, finished_at, created_at, updated_at)
       VALUES
        (?1, 'mac-nas-qwen', 'chat', ?2, ?3, 'pending', 'normal',
         ?4, ?5, ?6, '', '', 'ollama', 'mac-nas-qwen', 'Mac调用 NAS Qwen',
         'local', ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, '', ?16, ?17, ?16, ?17)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         execution_status = excluded.execution_status,
         actor_id = excluded.actor_id,
         actor_name = excluded.actor_name,
         model = excluded.model,
         input_summary = excluded.input_summary,
         result_summary = excluded.result_summary,
         metadata_json = excluded.metadata_json,
         prompt_tokens = excluded.prompt_tokens,
         completion_tokens = excluded.completion_tokens,
         total_tokens = excluded.total_tokens,
         duration_ms = excluded.duration_ms,
         error_code = excluded.error_code,
         error_detail = excluded.error_detail,
         finished_at = excluded.finished_at,
         updated_at = excluded.updated_at`,
    ).bind(
      taskId,
      title,
      item.status,
      item.deviceId,
      item.deviceName,
      item.model,
      item.inputSummary,
      item.resultSummary,
      metadata,
      item.promptTokens,
      item.completionTokens,
      item.totalTokens,
      item.durationMs,
      item.status === 'failed' ? 'LOCAL_LLM_CALL_FAILED' : '',
      item.error,
      item.startedAt,
      item.finishedAt,
    ).run()
    return Response.json({ ok: true, taskId, executionScope: 'local' })
  } catch (error) {
    return Response.json(
      { error: 'LOCAL_LLM_SYNC_FAILED', detail: String(error?.message || error).slice(0, 500) },
      { status: 500 },
    )
  }
}

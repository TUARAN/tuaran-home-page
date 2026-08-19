import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { callDeepSeek } from '../../../../lib/deepseek'
import { callOllama } from '../../../../lib/ollama'
import {
  X_AI_NEWS_LAST_RUN_KEY,
  buildXAiNewsMessages,
  normalizeXAiNewsBrief,
  validateXAiNewsDraft,
} from '../../../../lib/xAiNews'
import { getXCredentials, publishXPost } from '../../../../lib/xDistribution'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function readSetting(db, key) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(key).first()
  return row?.value ?? null
}

async function writeSetting(db, key, value, updatedBy) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(key, value, Date.now(), String(updatedBy || 'admin')).run()
}

function parseLastRun(raw) {
  try {
    return JSON.parse(raw || 'null')
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  try {
    const db = getD1()
    const [{ results }, lastRunRaw] = await Promise.all([
      db.prepare(
        `SELECT id, name, default_model, last_check_status, last_check_detail, last_checked_at
         FROM llm_providers
         WHERE provider_type = 'ollama' AND status = 'active'
         ORDER BY CASE WHEN default_model LIKE 'qwen3.5:%' THEN 0 ELSE 1 END, updated_at DESC`,
      ).all(),
      readSetting(db, X_AI_NEWS_LAST_RUN_KEY),
    ])
    const providers = (results || []).map((row) => ({
      id: row.id,
      name: row.name,
      model: row.default_model,
      lastCheckStatus: row.last_check_status,
      lastCheckDetail: row.last_check_detail,
      lastCheckedAt: Number(row.last_checked_at) || null,
    }))
    return Response.json({
      ok: true,
      providers,
      defaultProviderId: providers.find((item) => /^qwen3\.5:/i.test(item.model))?.id || providers[0]?.id || '',
      lastRun: parseLastRun(lastRunRaw),
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'X_AI_NEWS_UNAVAILABLE', detail: String(error?.message || error) },
      { status: 503 },
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '').trim()
  if (!body || !action) return Response.json({ ok: false, error: 'INVALID_REQUEST' }, { status: 400 })

  if (action === 'generate') {
    const providerType = String(body.providerType || 'ollama').trim().toLowerCase()
    const providerId = String(body.providerId || '').trim()
    const brief = normalizeXAiNewsBrief(body.brief)
    if (!['deepseek', 'ollama'].includes(providerType)) return Response.json({ ok: false, error: 'INVALID_PROVIDER_TYPE' }, { status: 400 })
    if (providerType === 'ollama' && !providerId) return Response.json({ ok: false, error: 'OLLAMA_PROVIDER_REQUIRED' }, { status: 400 })
    if (brief.length < 8) return Response.json({ ok: false, error: 'AI_NEWS_BRIEF_TOO_SHORT' }, { status: 400 })
    if (brief.length > 4000) return Response.json({ ok: false, error: 'AI_NEWS_BRIEF_TOO_LONG' }, { status: 400 })

    try {
      const generationArgs = {
        messages: buildXAiNewsMessages({ brief }),
        temperature: 0.35,
        maxTokens: 256,
        task: {
          source: 'x-ai-news',
          taskType: 'manual-copy-generation',
          title: 'X AI 资讯手动文案',
          actorId: guard.user?.id || guard.user?.login || '',
          actorName: guard.user?.name || guard.user?.login || 'TUARAN',
          inputSummary: `站长已核实素材：${brief.slice(0, 500)}`,
          metadata: { manualPublish: true, providerType },
        },
      }
      const result = providerType === 'deepseek'
        ? await callDeepSeek({
            ...generationArgs,
            timeoutMs: 45_000,
            taskDefaultModel: 'deepseek-v4-flash',
            disableThinking: true,
          })
        : await callOllama({
            ...generationArgs,
            providerId,
            reasoningEffort: 'none',
            timeoutMs: 120_000,
          })
      const draft = validateXAiNewsDraft(result.content)
      if (!draft.ok) {
        return Response.json(
          { ok: false, error: draft.error, detail: draft.error === 'X_AI_NEWS_TOO_LONG' ? `生成文案加权长度为 ${draft.weight}，超过 280。` : '模型没有生成可用文案。' },
          { status: 422 },
        )
      }
      return Response.json({
        ok: true,
        draft: draft.text,
        weight: draft.weight,
        model: result.model,
        providerType,
        providerId: result.providerId || '',
        providerName: result.providerName || 'DeepSeek Flash',
        taskId: result.taskId,
        usage: result.usage || null,
      })
    } catch (error) {
      return Response.json(
        { ok: false, error: error?.code || 'X_AI_NEWS_GENERATION_FAILED', detail: error?.message || String(error) },
        { status: error?.status || 502 },
      )
    }
  }

  if (action === 'publish') {
    const draft = validateXAiNewsDraft(body.text)
    if (!draft.ok) {
      return Response.json(
        { ok: false, error: draft.error, detail: draft.error === 'X_AI_NEWS_TOO_LONG' ? `文案加权长度为 ${draft.weight}，超过 280。` : '发布文案不能为空。' },
        { status: 400 },
      )
    }

    const db = getD1()
    const env = getOptionalRequestContext()?.env || {}
    const result = await publishXPost(draft.text, { credentials: getXCredentials(env) })
    const run = {
      at: Date.now(),
      ok: result.ok,
      text: draft.text,
      weight: draft.weight,
      postId: result.post?.id || '',
      postUrl: result.post?.url || '',
      error: result.ok ? '' : result.error,
      actorId: guard.user?.id || guard.user?.login || '',
      actorName: guard.user?.name || guard.user?.login || 'TUARAN',
    }
    await writeSetting(db, X_AI_NEWS_LAST_RUN_KEY, JSON.stringify(run), run.actorName).catch(() => {})
    if (!result.ok) return Response.json(result, { status: result.status })
    return Response.json({ ok: true, post: result.post, text: draft.text, weight: draft.weight }, { status: 201 })
  }

  return Response.json({ ok: false, error: 'UNSUPPORTED_ACTION' }, { status: 400 })
}

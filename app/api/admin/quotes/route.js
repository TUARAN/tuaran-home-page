import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { callDeepSeek } from '../../../../lib/deepseek'
import { callOllama, listOllamaModels } from '../../../../lib/ollama'
import {
  QUOTE_GENERATION_MODELS,
  buildQuoteGenerationMessages,
  parseGeneratedQuotes,
} from '../../../../lib/quoteGeneration'
import { insertGeneratedQuote, QUOTE_SELECT_COLUMNS, quoteRowToJson } from '../../../../lib/quoteStore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function readBody(request) {
  return request.json().catch(() => null)
}

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'preview',
      persistent: false,
      quote: null,
      quotes: [],
      quoteCount: 0,
      generationModels: QUOTE_GENERATION_MODELS,
    })
  }

  try {
    const result = await db
      .prepare(
        `SELECT ${QUOTE_SELECT_COLUMNS}
         FROM famous_quotes
         WHERE enabled = 1
         ORDER BY updated_at DESC
         LIMIT 100`
      )
      .all()
    const quotes = (result?.results || []).map(quoteRowToJson)
    const countRow = await db.prepare('SELECT COUNT(*) AS count FROM famous_quotes WHERE enabled = 1').first()
    return Response.json({
      status: 'ok',
      persistent: true,
      quote: quotes[0] || null,
      quotes,
      quoteCount: Number(countRow?.count) || 0,
      generationModels: QUOTE_GENERATION_MODELS,
    })
  } catch (error) {
    return Response.json({
      error: 'QUOTES_READ_FAILED',
      message: '名言表不可用，请确认已应用 0057 与 0080 数据库迁移。',
      detail: String(error?.message || error),
    }, { status: 500 })
  }
}

export async function POST(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  const prompt = String(body?.prompt || '').trim().slice(0, 500)
  if (!prompt) return Response.json({ error: 'PROMPT_REQUIRED' }, { status: 400 })
  return generateAndRecord({ db, prompt, user: guard.user })
}

async function generateAndRecord({ db, prompt, user }) {
  const providerResult = await db.prepare(
      `SELECT id, name, default_model
       FROM llm_providers
       WHERE provider_type = 'ollama' AND status = 'active'
       ORDER BY updated_at DESC`,
    ).all()
  const providers = providerResult?.results || []
  const messages = buildQuoteGenerationMessages({ prompt })
  const task = {
    source: 'quote-admin',
    taskType: 'quote-generation',
    title: '原创短句生成',
    actorId: user?.id || user?.login || '',
    actorName: user?.name || user?.login || 'TUARAN',
    inputSummary: prompt,
    metadata: { addToPool: true, maxAttempts: 3 },
  }
  const attempts = []

  const localAttempts = [
    { model: QUOTE_GENERATION_MODELS.primary, family: /^qwen3\.8-27b(?::|$)/i, timeoutMs: 120_000 },
    { model: QUOTE_GENERATION_MODELS.secondary, family: /^qwen3\.5:9b(?::|$)/i, timeoutMs: 90_000 },
  ]
  const modelListCache = new Map()

  async function resolveLocalTarget(attempt) {
    const provider = providers.find((item) => attempt.family.test(String(item.default_model || '')))
      || providers[0]
      || null
    if (!provider) return null
    if (attempt.family.test(String(provider.default_model || ''))) {
      return { provider, model: provider.default_model }
    }
    if (!modelListCache.has(provider.id)) {
      modelListCache.set(
        provider.id,
        listOllamaModels(provider.id, { timeoutMs: 12_000 }).catch(() => ({ models: [] })),
      )
    }
    const available = await modelListCache.get(provider.id)
    const installed = available.models.find((item) => attempt.family.test(item.name))
    return { provider, model: installed?.name || attempt.model }
  }

  for (const attempt of localAttempts) {
    const target = await resolveLocalTarget(attempt)
    if (!target) {
      attempts.push({ provider: 'ollama', model: attempt.model, ok: false, error: 'OLLAMA_PROVIDER_NOT_CONFIGURED' })
      continue
    }
    try {
      const result = await callOllama({
        providerId: target.provider.id,
        model: target.model,
        messages,
        temperature: 0.7,
        maxTokens: 420,
        reasoningEffort: 'none',
        timeoutMs: attempt.timeoutMs,
        task: { ...task, metadata: { ...task.metadata, fallbackStage: attempts.length + 1 } },
      })
      const quote = await insertGeneratedQuote(db, parseGeneratedQuotes(result.content)[0], {
        prompt,
        trigger: 'manual',
        model: result.model || target.model,
      })
      attempts.push({ provider: 'ollama', model: result.model || attempt.model, ok: true })
      return Response.json({
        ok: true,
        quote,
        provider: 'ollama',
        providerName: result.providerName || target.provider.name,
        model: result.model || target.model,
        taskId: result.taskId,
        attempts,
      })
    } catch (error) {
      attempts.push({
        provider: 'ollama',
        model: target.model,
        ok: false,
        error: error?.code || error?.message || 'OLLAMA_CALL_FAILED',
      })
    }
  }

  try {
    const result = await callDeepSeek({
      messages,
      temperature: 0.7,
      maxTokens: 420,
      timeoutMs: 45_000,
      taskDefaultModel: QUOTE_GENERATION_MODELS.fallback,
      disableThinking: true,
      task: { ...task, metadata: { ...task.metadata, fallbackStage: 3 } },
    })
    const quote = await insertGeneratedQuote(db, parseGeneratedQuotes(result.content)[0], {
      prompt,
      trigger: 'manual',
      model: result.model || QUOTE_GENERATION_MODELS.fallback,
    })
    attempts.push({ provider: 'deepseek', model: result.model || QUOTE_GENERATION_MODELS.fallback, ok: true })
    return Response.json({
      ok: true,
      quote,
      provider: 'deepseek',
      providerName: 'DeepSeek',
      model: result.model || QUOTE_GENERATION_MODELS.fallback,
      taskId: result.taskId,
      attempts,
    })
  } catch (error) {
    attempts.push({
      provider: 'deepseek',
      model: QUOTE_GENERATION_MODELS.fallback,
      ok: false,
      error: error?.code || error?.message || 'DEEPSEEK_CALL_FAILED',
    })
    return Response.json({
      ok: false,
      error: 'QUOTE_GENERATION_FAILED',
      detail: '所有可用模型均未生成有效短句。',
      attempts,
    }, { status: 502 })
  }
}

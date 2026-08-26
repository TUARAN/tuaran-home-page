import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { callDeepSeek } from '../../../../lib/deepseek'
import { callOllama, listOllamaModels } from '../../../../lib/ollama'
import {
  QUOTE_GENERATION_MODELS,
  buildQuoteGenerationMessages,
  parseGeneratedQuotes,
} from '../../../../lib/quoteGeneration'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToQuote(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source || '',
    sourceUrl: row.source_url || '',
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
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
      generationModels: QUOTE_GENERATION_MODELS,
    })
  }

  try {
    const row = await db
      .prepare(
        `SELECT id, text, author, source, source_url, enabled, sort_order, created_at, updated_at
         FROM famous_quotes
         WHERE enabled = 1
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .first()
    return Response.json({
      status: 'ok',
      persistent: true,
      quote: row ? rowToQuote(row) : null,
      generationModels: QUOTE_GENERATION_MODELS,
    })
  } catch (error) {
    return Response.json({
      error: 'QUOTES_READ_FAILED',
      message: '名言表不可用，请先应用 0057_famous_quotes.sql。',
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
  return generateAndPublish({ db, prompt, user: guard.user })
}

async function publishGeneratedQuote(db, generated) {
  const id = crypto.randomUUID()
  const now = Date.now()
  const quote = {
    id,
    text: generated.text,
    author: 'TUARAN',
    source: '大模型生成',
    sourceUrl: '',
    enabled: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.batch([
    db.prepare('DELETE FROM famous_quotes'),
    db.prepare(
      `INSERT INTO famous_quotes
       (id, text, author, source, source_url, enabled, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
    ).bind(id, quote.text, quote.author, quote.source, quote.sourceUrl, now, now),
  ])
  return quote
}

async function generateAndPublish({ db, prompt, user }) {
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
    metadata: { publishImmediately: true, maxAttempts: 3 },
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
      const quote = await publishGeneratedQuote(db, parseGeneratedQuotes(result.content)[0])
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
    const quote = await publishGeneratedQuote(db, parseGeneratedQuotes(result.content)[0])
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

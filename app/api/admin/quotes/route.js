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

function cleanQuote(body) {
  return {
    text: String(body?.text || '').trim().slice(0, 80),
    author: String(body?.author || '').trim().slice(0, 40),
    source: String(body?.source || '').trim().slice(0, 80),
    sourceUrl: String(body?.sourceUrl || '').trim().slice(0, 500),
    enabled: body?.enabled !== false,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
  }
}

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'preview',
      persistent: false,
      quotes: [],
      generationModels: QUOTE_GENERATION_MODELS,
    })
  }

  try {
    const result = await db
      .prepare(
        `SELECT id, text, author, source, source_url, enabled, sort_order, created_at, updated_at
         FROM famous_quotes
         ORDER BY sort_order DESC, updated_at DESC`
      )
      .all()
    return Response.json({
      status: 'ok',
      persistent: true,
      quotes: (result?.results || []).map(rowToQuote),
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
  if (body.action === 'generate') return generateCandidates({ db, body, user: guard.user })
  const item = cleanQuote(body)
  if (!item.text || !item.author) {
    return Response.json({ error: 'TEXT_AND_AUTHOR_REQUIRED' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO famous_quotes
         (id, text, author, source, source_url, enabled, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, item.text, item.author, item.source, item.sourceUrl, item.enabled ? 1 : 0, item.sortOrder, now, now)
      .run()
    return Response.json({ ok: true, quote: { id, ...item, createdAt: now, updatedAt: now } })
  } catch (error) {
    return Response.json({ error: 'QUOTE_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

async function generateCandidates({ db, body, user }) {
  const direction = String(body?.direction || '').trim().slice(0, 240)
  const [providerResult, quoteResult] = await Promise.all([
    db.prepare(
      `SELECT id, name, default_model
       FROM llm_providers
       WHERE provider_type = 'ollama' AND status = 'active'
       ORDER BY updated_at DESC`,
    ).all(),
    db.prepare(
      `SELECT text FROM famous_quotes
       ORDER BY updated_at DESC
       LIMIT 80`,
    ).all(),
  ])
  const providers = providerResult?.results || []
  const messages = buildQuoteGenerationMessages({
    direction,
    existingQuotes: (quoteResult?.results || []).map((row) => row.text),
  })
  const task = {
    source: 'quote-admin',
    taskType: 'quote-candidate-generation',
    title: '原创短句候选生成',
    actorId: user?.id || user?.login || '',
    actorName: user?.name || user?.login || 'TUARAN',
    inputSummary: direction || '自由选择日常经验角度',
    metadata: { manualReviewRequired: true, maxAttempts: 3 },
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
      const quotes = parseGeneratedQuotes(result.content)
      attempts.push({ provider: 'ollama', model: result.model || attempt.model, ok: true })
      return Response.json({
        ok: true,
        quotes,
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
    const quotes = parseGeneratedQuotes(result.content)
    attempts.push({ provider: 'deepseek', model: result.model || QUOTE_GENERATION_MODELS.fallback, ok: true })
    return Response.json({
      ok: true,
      quotes,
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
      detail: '27B、9B 与 DeepSeek 均未生成可用候选。',
      attempts,
    }, { status: 502 })
  }
}

export async function PATCH(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  const id = String(body?.id || '').trim()
  const item = cleanQuote(body)
  if (!id || !item.text || !item.author) {
    return Response.json({ error: 'ID_TEXT_AND_AUTHOR_REQUIRED' }, { status: 400 })
  }
  const now = Date.now()
  try {
    const result = await db
      .prepare(
        `UPDATE famous_quotes
         SET text = ?, author = ?, source = ?, source_url = ?, enabled = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(item.text, item.author, item.source, item.sourceUrl, item.enabled ? 1 : 0, item.sortOrder, now, id)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, quote: { id, ...item, updatedAt: now } })
  } catch (error) {
    return Response.json({ error: 'QUOTE_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function DELETE(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  try {
    const result = await db.prepare('DELETE FROM famous_quotes WHERE id = ?').bind(id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: 'QUOTE_DELETE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

import { callDeepSeek } from './deepseek'
import {
  QUOTE_GENERATION_MODELS,
  buildAutomatedQuotePrompt,
  buildQuoteGenerationMessages,
  parseGeneratedQuotes,
} from './quoteGeneration'
import { insertGeneratedQuote } from './quoteStore'

const LAST_RUN_KEY = 'automation.quote_generation.last_run'
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000

export function beijingDateKey(now = Date.now()) {
  return new Date(now + BEIJING_OFFSET_MS).toISOString().slice(0, 10)
}

async function readLastRun(db) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(LAST_RUN_KEY).first()
  if (!row?.value) return null
  try { return JSON.parse(row.value) } catch { return null }
}

async function writeLastRun(db, value) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?, ?, ?, 'automation')
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(LAST_RUN_KEY, JSON.stringify(value), Date.now()).run()
}

export async function runQuoteAutomation({ db, env, force = false } = {}) {
  const dateKey = beijingDateKey()
  const lastRun = await readLastRun(db)
  if (!force && lastRun?.dateKey === dateKey && lastRun?.quoteId) {
    return { skipped: true, reason: 'ALREADY_GENERATED_TODAY', dateKey, quoteId: lastRun.quoteId }
  }

  const recentResult = await db.prepare(
    `SELECT text FROM famous_quotes WHERE enabled = 1 ORDER BY created_at DESC LIMIT 20`,
  ).all()
  const prompt = buildAutomatedQuotePrompt({
    dateKey,
    recentQuotes: (recentResult?.results || []).map((row) => row.text),
  })
  const result = await callDeepSeek({
    env,
    messages: buildQuoteGenerationMessages({ prompt }),
    temperature: 0.9,
    maxTokens: 420,
    timeoutMs: 45_000,
    taskDefaultModel: QUOTE_GENERATION_MODELS.fallback,
    disableThinking: true,
    task: {
      source: 'quote-automation',
      taskType: 'quote-generation',
      title: '每日原创短句自动生成',
      actorId: 'cron:quote-generation',
      actorName: '自动化',
      inputSummary: prompt,
      metadata: { dateKey, addToPool: true },
    },
  })
  const quote = await insertGeneratedQuote(db, parseGeneratedQuotes(result.content)[0], {
    prompt,
    trigger: 'automation',
    model: result.model || QUOTE_GENERATION_MODELS.fallback,
  })
  await writeLastRun(db, { dateKey, quoteId: quote.id, generatedAt: Date.now() })

  return { skipped: false, dateKey, quote, model: result.model || QUOTE_GENERATION_MODELS.fallback }
}

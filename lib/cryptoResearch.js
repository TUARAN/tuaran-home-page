import { RESEARCH_STYLE_TEMPLATES } from './researchStyleTemplates'
import { callDeepSeekResponses } from './deepseek'
import { repairUnclosedFrontmatter, stripPreamble } from './aSharePublishCore'
import { autoPublishOldestDueCryptoDraft } from './cryptoPublisher'
import {
  COINGECKO_MARKETS_API,
  CRYPTO_POOL_SIZE,
  CRYPTO_POOL_STALE_MS,
  CRYPTO_RESEARCH_TEMPLATE_VERSION,
  GENERATION_TIMEOUT_MS,
  buildCryptoDraftPrompt,
  draftGenerationDecision,
  normalizeMarketCoins,
  pickHighestRankedUnresearched,
  shanghaiDate,
  validateCryptoDraft,
  validateMarketSnapshot,
} from './cryptoResearchCore'

async function fetchMarketCoins(env) {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(CRYPTO_POOL_SIZE),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
    locale: 'en',
  })
  const proApiKey = String(env.COINGECKO_PRO_API_KEY || '').trim()
  const demoApiKey = String(env.COINGECKO_DEMO_API_KEY || env.COINGECKO_API_KEY || '').trim()
  const headers = { accept: 'application/json', 'user-agent': 'tuaran-home-page/crypto-research' }
  if (proApiKey) headers['x-cg-pro-api-key'] = proApiKey
  else if (demoApiKey) headers['x-cg-demo-api-key'] = demoApiKey
  const endpoint = proApiKey ? 'https://pro-api.coingecko.com/api/v3/coins/markets' : COINGECKO_MARKETS_API
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(`${endpoint}?${params}`, { headers, signal: controller.signal })
    if (!response.ok) throw new Error(`CoinGecko markets 返回 HTTP ${response.status}`)
    const coins = normalizeMarketCoins(await response.json())
    validateMarketSnapshot(coins)
    return coins
  } finally {
    clearTimeout(timer)
  }
}

async function readSnapshot(db) {
  return db.prepare('SELECT * FROM crypto_pool_snapshot WHERE id = 1').first()
}

function parseCoins(snapshot) {
  try {
    const parsed = JSON.parse(snapshot?.content || '')
    return Array.isArray(parsed?.coins) ? parsed.coins : []
  } catch {
    return []
  }
}

export async function syncCryptoPool(db, env, { force = false, now = Date.now() } = {}) {
  const current = await readSnapshot(db)
  if (!force && current?.generated_at && now - Number(current.generated_at) < CRYPTO_POOL_STALE_MS) {
    return { status: 'fresh', snapshotDate: current.snapshot_date, count: Number(current.count), coins: parseCoins(current) }
  }
  const coins = await fetchMarketCoins(env)
  const snapshotDate = shanghaiDate(new Date(now))
  const content = JSON.stringify({ schemaVersion: 1, generatedAt: now, snapshotDate, source: COINGECKO_MARKETS_API, coins })
  await db.prepare(
    `INSERT INTO crypto_pool_snapshot (id, snapshot_date, count, generated_at, content) VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET snapshot_date = excluded.snapshot_date, count = excluded.count,
       generated_at = excluded.generated_at, content = excluded.content`,
  ).bind(snapshotDate, coins.length, now, content).run()
  return { status: 'synced', snapshotDate, count: coins.length, coins }
}

export async function selectNextCrypto(db, coins, { now = Date.now() } = {}) {
  const pending = await db.prepare("SELECT * FROM crypto_selections WHERE status = 'selected' ORDER BY selected_at ASC LIMIT 1").first()
  if (pending) {
    const coin = coins.find((candidate) => candidate.id === pending.coin_id)
    if (!coin) throw new Error(`待完成币种 ${pending.coin_id} 已不在当前市值池，请人工处理。`)
    return { coin, resumed: true }
  }
  const { results: selected } = await db.prepare("SELECT coin_id FROM crypto_selections WHERE status IN ('completed', 'skipped')").all()
  const { results: drafted } = await db.prepare('SELECT coin_id FROM crypto_drafts').all()
  const usedIds = new Set([...(selected || []).map((row) => row.coin_id), ...(drafted || []).map((row) => row.coin_id)])
  const coin = pickHighestRankedUnresearched(coins, usedIds)
  const date = shanghaiDate(new Date(now))
  await db.prepare(
    `INSERT INTO crypto_selections (coin_id, symbol, name, market_cap_rank, status, selected_at, selection_date)
     VALUES (?, ?, ?, ?, 'selected', ?, ?)`,
  ).bind(coin.id, coin.symbol, coin.name, coin.marketCapRank, now, date).run()
  return { coin, resumed: false }
}

function draftIdFor(coin, date) {
  return `crypto-${date}-${coin.id}`
}

async function createDraft(db, coin, date, now) {
  const id = draftIdFor(coin, date)
  await db.prepare(
    `INSERT INTO crypto_drafts
      (id, coin_id, symbol, name, market_cap_rank, title, draft_date, template_version, style_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'default-research', 'generating', ?, ?)
     ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
  ).bind(id, coin.id, coin.symbol, coin.name, coin.marketCapRank, `阿燃调研：每天一个加密资产 —— ${coin.name}（${coin.symbol}）观察`, date, String(CRYPTO_RESEARCH_TEMPLATE_VERSION), now, now).run()
  return id
}

async function recordRun(db, { action, coin, draftId = '', taskId = '', status, error = '', startedAt }) {
  await db.prepare(
    `INSERT INTO crypto_run_log
      (id, ran_at, action, coin_id, symbol, coin_name, draft_id, deepseek_task_id, status, error, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), startedAt, action, coin?.id || '', coin?.symbol || '', coin?.name || '', draftId, taskId, status, String(error).slice(0, 2000), Date.now() - startedAt).run()
}

export async function runCryptoDaily({ db, env, forceSync = false }) {
  const startedAt = Date.now()
  let action = 'auto-publish'
  let coin = null
  let draftId = ''
  let generatedContent = ''
  let generatedTaskId = ''
  try {
    const autoPublish = await autoPublishOldestDueCryptoDraft({ db, env, now: startedAt }).catch((error) => ({ ok: false, error: String(error?.message || error).slice(0, 2000) }))
    action = 'pool-sync'
    const sync = await syncCryptoPool(db, env, { force: forceSync, now: startedAt })
    if (sync.status === 'synced') {
      await recordRun(db, { action, status: 'ok', startedAt })
      return { ok: true, phase: 'pool-synced', autoPublish, snapshotDate: sync.snapshotDate, count: sync.count }
    }

    action = 'draft'
    const picked = await selectNextCrypto(db, sync.coins, { now: startedAt })
    coin = picked.coin
    const date = shanghaiDate(new Date(startedAt))
    draftId = draftIdFor(coin, date)
    let draft = await db.prepare('SELECT * FROM crypto_drafts WHERE id = ?').bind(draftId).first()
    if (!draft) {
      await createDraft(db, coin, date, startedAt)
      draft = await db.prepare('SELECT * FROM crypto_drafts WHERE id = ?').bind(draftId).first()
    }
    const decision = draftGenerationDecision(draft, startedAt)
    if (decision.action === 'done') return { ok: true, phase: 'already-done', coin: coin.id, draftId, autoPublish }
    if (decision.action === 'stop') throw new Error(`草稿 ${draftId} 当前状态 ${draft.status} 不允许继续生成。`)
    if (decision.action === 'exhausted') {
      return { ok: true, phase: 'manual-review', coin: coin.id, draftId, attempts: decision.attempts, autoPublish }
    }
    if (decision.action === 'locked') return { ok: true, phase: 'generation-locked', coin: coin.id, draftId, retryAfterMs: Math.max(1000, decision.retryAfterMs), autoPublish }

    await db.prepare("UPDATE crypto_drafts SET attempt_count = attempt_count + 1, status = 'generating', generation_error = '', updated_at = ? WHERE id = ?").bind(Date.now(), draftId).run()
    const style = RESEARCH_STYLE_TEMPLATES.find((item) => item.status === 'active') || RESEARCH_STYLE_TEMPLATES[0]
    const result = await callDeepSeekResponses({
      env,
      input: buildCryptoDraftPrompt({ coin, style, now: new Date(startedAt) }),
      tools: [{ type: 'web_search' }],
      toolChoice: 'auto',
      temperature: 0.3,
      maxTokens: 4096,
      timeoutMs: GENERATION_TIMEOUT_MS,
      taskDefaultModel: 'deepseek-v4-flash',
      disableThinking: true,
      task: {
        source: 'crypto-research', taskType: 'daily-draft',
        title: `加密资产观察：${coin.name}（${coin.symbol}）`,
        actorId: 'cron:crypto-research', actorName: '线上定时自动化',
        inputSummary: `市值 #${coin.marketCapRank}：${coin.name}（${coin.symbol}）`,
        metadata: { coinId: coin.id, marketCapRank: coin.marketCapRank, draftId },
      },
    })
    const article = repairUnclosedFrontmatter(stripPreamble(result.content))
    generatedContent = article
    generatedTaskId = result.taskId || ''
    validateCryptoDraft(article, coin)
    const updatedAt = Date.now()
    await db.prepare("UPDATE crypto_drafts SET content = ?, status = 'pending', deepseek_task_id = ?, generation_error = '', updated_at = ? WHERE id = ?")
      .bind(article.slice(0, 240_000), result.taskId || '', updatedAt, draftId).run()
    await db.prepare("UPDATE crypto_selections SET status = 'completed', draft_id = ?, completed_at = ? WHERE coin_id = ?")
      .bind(draftId, updatedAt, coin.id).run()
    await recordRun(db, { action, coin, draftId, taskId: result.taskId || '', status: 'ok', startedAt })
    return { ok: true, phase: 'drafted', coin: coin.id, symbol: coin.symbol, name: coin.name, marketCapRank: coin.marketCapRank, draftId, taskId: result.taskId || '', autoPublish }
  } catch (error) {
    const detail = String(error?.message || error).slice(0, 2000)
    if (draftId) {
      const query = generatedContent
        ? db.prepare("UPDATE crypto_drafts SET content = ?, deepseek_task_id = ?, status = 'failed', generation_error = ?, updated_at = ? WHERE id = ? AND status = 'generating'")
          .bind(generatedContent.slice(0, 240_000), generatedTaskId, detail, Date.now(), draftId)
        : db.prepare("UPDATE crypto_drafts SET status = 'failed', generation_error = ?, updated_at = ? WHERE id = ? AND status = 'generating'")
          .bind(detail, Date.now(), draftId)
      await query.run().catch(() => {})
    }
    await recordRun(db, { action, coin, draftId, taskId: generatedTaskId, status: 'failed', error: detail, startedAt }).catch(() => {})
    throw error
  }
}

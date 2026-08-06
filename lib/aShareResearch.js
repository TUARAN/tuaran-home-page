/**
 * A 股公司观察 · 在线自动化编排（Edge 运行时）
 *
 * 替代本地 scripts/manage-a-share-research.mjs 的云端版本：
 *  - 公司池快照、选题状态、草稿与运行日志全部落 D1；
 *  - 公司池仅在过期（默认 7 天）或 force=1 时从巨潮资讯 + 腾讯行情同步；
 *  - 每日选题 + DeepSeek 起草使用「分次续跑」状态机：
 *    单次 Worker 请求有墙钟限制，长文本生成拆成多次调度触发，
 *    草稿未完成时下次调用继续同一家公司，不重复选题（与本地幂等约定一致）。
 *
 * 自动生成稿保持 review_ready: false / ad_eligible: false，
 * 由站长在后台复核后决定是否进入内容管线。
 */

import { RESEARCH_STYLE_TEMPLATES } from './researchStyleTemplates'
import { callDeepSeek } from './deepseek'
import {
  CNINFO_STOCK_LIST,
  DEFAULT_STALE_DAYS,
  GENERATION_LOCK_MS,
  GENERATION_TIMEOUT_MS,
  MAX_DRAFT_ATTEMPTS,
  QUOTE_BATCH_SIZE,
  QUOTE_CONCURRENCY,
  TENCENT_QUOTE_API,
  buildDraftPrompt,
  classifyCompany,
  normalizeCompanies,
  parseQuote,
  pickBestCompany,
  shanghaiDate,
  validateDraft,
  validateSnapshot,
} from './aShareResearchCore'

function fetchWithTimeout(url, { headers = {}, timeoutMs = 30_000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { headers, signal: controller.signal }).finally(() => clearTimeout(timer))
}

async function fetchCninfoRows() {
  const response = await fetchWithTimeout(CNINFO_STOCK_LIST, {
    headers: { accept: 'application/json,text/plain,*/*', 'user-agent': 'tuaran-home-page/a-share-research-pool' },
    timeoutMs: 30_000,
  })
  if (!response.ok) throw new Error(`巨潮资讯公司列表返回 HTTP ${response.status}`)
  const payload = await response.json()
  if (!Array.isArray(payload?.stockList)) throw new Error('巨潮资讯返回了无法识别的公司列表。')
  return payload.stockList
    .filter((company) => company.category === 'A股')
    .map((company) => ({ code: company.code, name: company.zwjc }))
}

function quoteSymbol(company) {
  if (company.exchange === 'SSE') return `sh${company.code}`
  if (company.exchange === 'SZSE') return `sz${company.code}`
  return `bj${company.code}`
}

function decodeQuoteSource(buffer) {
  try {
    return new TextDecoder('gb18030').decode(buffer)
  } catch {
    // 运行时若不支持 gb18030，退化为 UTF-8 有损解码；
    // 我们只依赖 ASCII 标记（~D~），证券简称不从行情响应取用。
    return new TextDecoder('utf-8').decode(buffer)
  }
}

async function fetchQuoteLines(symbols) {
  const url = `${TENCENT_QUOTE_API}${(symbols || []).join(',')}`
  const response = await fetchWithTimeout(url, { timeoutMs: 15_000 })
  if (!response.ok) throw new Error(`腾讯行情状态核验返回 HTTP ${response.status}`)
  return decodeQuoteSource(new Uint8Array(await response.arrayBuffer()))
}

function chunkItems(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}

async function fetchActiveCompanies(companies) {
  const batches = chunkItems(companies, QUOTE_BATCH_SIZE)
  const results = await mapWithConcurrency(batches, QUOTE_CONCURRENCY, async (batch) => {
    const source = await fetchQuoteLines(batch.map((company) => quoteSymbol(company)))
    const statusByCode = new Map()
    for (const line of source.split(/;\s*/u)) {
      const match = /^v_(?:sh|sz|bj)(\d{6})="(.*)"$/u.exec(line.trim())
      if (match) statusByCode.set(match[1], match[2])
    }
    return batch.filter((company) => {
      const status = statusByCode.get(company.code)
      return status && !status.includes('~D~')
    })
  })
  const active = results.flat()
  if (active.length < companies.length * 0.9) {
    throw new Error(`行情状态响应覆盖不足：请求 ${companies.length} 家，核验通过 ${active.length} 家。`)
  }
  return active
}

async function readPoolSnapshot(db) {
  return db.prepare('SELECT * FROM a_share_pool_snapshot WHERE id = 1').first() || null
}

async function readPoolCompanies(db) {
  const snapshot = await readPoolSnapshot(db)
  try {
    const parsed = snapshot?.content ? JSON.parse(snapshot.content) : null
    return Array.isArray(parsed?.companies) ? parsed.companies : []
  } catch {
    return []
  }
}

/** 同步公司池到 D1；快照新鲜或未过期时跳过（force=1 强制）。 */
export async function syncPoolToD1(db, { force = false, staleDays = DEFAULT_STALE_DAYS, now = Date.now() } = {}) {
  const snapshot = await readPoolSnapshot(db)
  if (!force && snapshot?.snapshot_date) {
    const staleMs = Number(staleDays) * 24 * 60 * 60 * 1000
    if (now - Number(snapshot.generated_at) < staleMs) {
      return { status: 'fresh', snapshotDate: snapshot.snapshot_date, count: Number(snapshot.count) }
    }
  }

  const rows = await fetchCninfoRows()
  const companies = normalizeCompanies(rows)
  validateSnapshot(companies)
  const active = await fetchActiveCompanies(companies)
  validateSnapshot(active)

  const generatedAt = now
  const date = shanghaiDate(new Date(now))
  const content = JSON.stringify({
    schemaVersion: 1,
    generatedAt,
    snapshotDate: date,
    count: active.length,
    companies: active,
  })
  await db
    .prepare(
      `INSERT INTO a_share_pool_snapshot (id, snapshot_date, count, generated_at, content) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET snapshot_date = excluded.snapshot_date,
         count = excluded.count, generated_at = excluded.generated_at, content = excluded.content`,
    )
    .bind(date, active.length, generatedAt, content)
    .run()
  return { status: 'synced', snapshotDate: date, count: active.length, generatedAt }
}

/** 读取待完成选题；没有则从未完成公司中随机选一家并落库。 */
export async function selectNextCompany(db, { now = Date.now() } = {}) {
  const pending = await db
    .prepare("SELECT * FROM a_share_selections WHERE status = 'selected' LIMIT 1")
    .first()
  if (pending) {
    const company = (await readPoolCompanies(db)).find((candidate) => candidate.code === pending.code)
    if (!company) throw new Error(`待完成公司 ${pending.code} 已不在当前公司池，请人工处理状态。`)
    return { company, selection: pending, resumed: true }
  }

  const allCompanies = await readPoolCompanies(db)
  const { results: usedRows } = await db
    .prepare("SELECT code FROM a_share_selections WHERE status IN ('completed', 'skipped')")
    .all()
  const { results: draftRows } = await db.prepare('SELECT code FROM a_share_drafts').all()
  const usedCodes = new Set([
    ...(usedRows || []).map((row) => row.code),
    ...(draftRows || []).map((row) => row.code),
  ])
  const company = pickBestCompany(allCompanies, usedCodes)
  const selectionDate = shanghaiDate(new Date(now))
  await db
    .prepare(
      `INSERT INTO a_share_selections (code, name, status, selected_at, selection_date)
       VALUES (?, ?, 'selected', ?, ?)`,
    )
    .bind(company.code, company.name, now, selectionDate)
    .run()
  return { company, selection: { code: company.code, name: company.name, status: 'selected', selected_at: now, selection_date: selectionDate }, resumed: false }
}

export function getActiveResearchStyle() {
  return RESEARCH_STYLE_TEMPLATES.find((template) => template.status === 'active') || RESEARCH_STYLE_TEMPLATES[0]
}

export async function fetchCompanyQuote(company) {
  const source = await fetchQuoteLines([quoteSymbol(company)])
  return parseQuote(source)
}

async function bumpDraftAttempt(db, draftId) {
  await db
    .prepare('UPDATE a_share_drafts SET attempt_count = attempt_count + 1, updated_at = ? WHERE id = ?')
    .bind(Date.now(), draftId)
    .run()
}

function draftIdFor(company, date) {
  return `ashare-${date}-${company.code}`
}

async function createDraftRow(db, { company, date, now }) {
  const id = draftIdFor(company, date)
  await db
    .prepare(
      `INSERT INTO a_share_drafts
        (id, code, name, title, draft_date, content, template_version, style_id, deepseek_task_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, '', '2', 'default-research', '', 'generating', ?, ?)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
    )
    .bind(id, company.code, company.name, `阿燃调研：每天一家A股上市公司 —— ${company.name}（${company.code}）公司观察`, date, now, now)
    .run()
  return id
}

async function readDraftRow(db, id) {
  return db.prepare('SELECT * FROM a_share_drafts WHERE id = ?').bind(id).first()
}

async function recordRun(db, { action, code, companyName, draftId, deepseekTaskId, status, error, durationMs, ranAt = Date.now() }) {
  await db
    .prepare(
      `INSERT INTO a_share_run_log
        (id, ran_at, action, code, company_name, draft_id, deepseek_task_id, status, error, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      ranAt,
      String(action || '').slice(0, 60),
      String(code || '').slice(0, 20),
      String(companyName || '').slice(0, 80),
      String(draftId || '').slice(0, 120),
      String(deepseekTaskId || '').slice(0, 120),
      String(status || 'ok').slice(0, 20),
      String(error || '').slice(0, 2000),
      Math.max(0, Number(durationMs) || 0),
    )
    .run()
}

/**
 * 一次线上调度：同步（可选）→ 选题 → 尝试 DeepSeek 起草。
 * 草稿未完成时下次调用继续，天然幂等。
 */
export async function runAShareDaily({ db, env, forceSync = false, staleDays = DEFAULT_STALE_DAYS }) {
  const startedAt = Date.now()
  let action = 'draft'
  try {
    action = 'pool-sync'
    const sync = await syncPoolToD1(db, { force: forceSync, staleDays, now: startedAt })
    if (sync.status === 'synced') {
      // 同步较重（5000+ 公司行情核验），本调用只同步，起草留给下一次调度。
      await recordRun(db, { action: 'pool-sync', status: 'ok', error: '', durationMs: Date.now() - startedAt, ranAt: startedAt })
      return { ok: true, phase: 'pool-synced', ...sync }
    }

    action = 'draft'
    const picked = await selectNextCompany(db, { now: startedAt })
    const draftDate = shanghaiDate(new Date(startedAt))
    const draftId = draftIdFor(picked.company, draftDate)
    if (!(await readDraftRow(db, draftId))) {
      await createDraftRow(db, { company: picked.company, date: draftDate, now: startedAt })
    }
    const draft = await readDraftRow(db, draftId)
    const canAttempt = !draft || draft.status !== 'pending'
    if (!canAttempt) {
      await recordRun(db, {
        action: 'draft',
        code: picked.company.code,
        companyName: picked.company.name,
        draftId,
        status: 'skipped',
        error: '草稿已完成',
        durationMs: Date.now() - startedAt,
        ranAt: startedAt,
      })
      return { ok: true, phase: 'already-done', company: picked.company.code, draftId }
    }

    const attempts = Number(draft?.attempt_count || 0)
    if (draft?.status === 'generating' && attempts >= MAX_DRAFT_ATTEMPTS) {
      throw new Error(`草稿 ${draftId} 已重试 ${attempts} 次仍未完成，转为人工处理。`)
    }
    if (
      draft?.status === 'generating'
      && Number(draft.attempt_count) > 0
      && startedAt - Number(draft.updated_at) < GENERATION_LOCK_MS
    ) {
      await recordRun(db, {
        action: 'draft',
        code: picked.company.code,
        companyName: picked.company.name,
        draftId,
        status: 'skipped',
        error: '上一次生成仍在锁定期内',
        durationMs: Date.now() - startedAt,
        ranAt: startedAt,
      })
      return { ok: true, phase: 'generation-locked', company: picked.company.code, draftId }
    }

    const quote = await fetchCompanyQuote(picked.company).catch(() => null)
    const style = getActiveResearchStyle()
    const messages = buildDraftPrompt({ company: picked.company, quote, style })
    await bumpDraftAttempt(db, draftId)
    const result = await callDeepSeek({
      env,
      messages,
      temperature: 0.35,
      maxTokens: 2048,
      timeoutMs: GENERATION_TIMEOUT_MS,
      // 起草是结构化的简单任务，默认走 flash（密钥绑定 default_model 或
      // DEEPSEEK_MODEL 显式配置时仍优先生效）。
      taskDefaultModel: 'deepseek-v4-flash',
      task: {
        source: 'a-share-research',
        taskType: 'daily-draft',
        title: `A 股公司观察：${picked.company.name}（${picked.company.code}）`,
        actorId: 'cron:a-share-research',
        actorName: '线上定时自动化',
        inputSummary: `公司池选题：${picked.company.name}（${picked.company.code}），${picked.company.exchangeName}${picked.company.boardName}`,
        metadata: { code: picked.company.code, draftId },
      },
    })

    validateDraft(result.content)
    const updatedAt = Date.now()
    await db
      .prepare(
        `UPDATE a_share_drafts SET content = ?, status = 'pending', deepseek_task_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(result.content.slice(0, 200_000), result.taskId || '', updatedAt, draftId)
      .run()
    await db
      .prepare(
        `UPDATE a_share_selections SET status = 'completed', draft_id = ?, completed_at = ? WHERE code = ?`,
      )
      .bind(draftId, updatedAt, picked.company.code)
      .run()
    await recordRun(db, {
      action: 'draft',
      code: picked.company.code,
      companyName: picked.company.name,
      draftId,
      deepseekTaskId: result.taskId || '',
      status: 'ok',
      durationMs: Date.now() - startedAt,
      ranAt: startedAt,
    })
    return { ok: true, phase: 'drafted', company: picked.company.code, name: picked.company.name, draftId, taskId: result.taskId || '' }
  } catch (error) {
    await recordRun(db, {
      action,
      status: 'failed',
      error: String(error?.message || error).slice(0, 2000),
      durationMs: Date.now() - startedAt,
      ranAt: startedAt,
    }).catch(() => {})
    throw error
  }
}

export { classifyCompany, normalizeCompanies, validateSnapshot, parseQuote }

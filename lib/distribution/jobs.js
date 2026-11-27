// 分发任务台账：站长建任务，智能体凭一次性 token 领取、逐平台回报、收尾。
// 存储函数都接收 D1 binding（db），方便在 Edge 路由和测试里复用。

import { HARNESS_VERSION, RESULT_STATUS_LABELS } from './harness.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from './playbooks.js'
import { prepareDistributionMarkdown } from './markdownPrep.js'
import { absolutizeMarkdownUrls } from './taskPrompt.js'

export const DISTRIBUTION_JOB_STATUSES = ['pending', 'claimed', 'done', 'partial', 'failed', 'cancelled']
export const DISTRIBUTION_RESULT_STATUSES = Object.keys(RESULT_STATUS_LABELS)
export const DISTRIBUTION_JOB_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

const ACTIVE_STATUSES = ['pending', 'claimed']
const SUCCESS_RESULTS = ['published', 'reviewing', 'draft']
const MAX_MARKDOWN = 400_000
const JOB_ID = /^[0-9a-f-]{36}$/

function text(value, max) {
  return String(value ?? '').trim().slice(0, max)
}

function line(value, max) {
  return text(value, max * 2).replace(/\s+/g, ' ').slice(0, max)
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashDistributionToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token)))
  return hex(new Uint8Array(digest))
}

async function issueToken(now) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)))
  return { token, tokenHash: await hashDistributionToken(token), expiresAt: now + DISTRIBUTION_JOB_TOKEN_TTL_MS }
}

export function assertJobId(id) {
  if (!JOB_ID.test(String(id || ''))) throw new RangeError('INVALID_JOB_ID')
  return id
}

export function normalizeDistributionJobInput(raw) {
  const title = line(raw?.title, 200)
  const url = text(raw?.url, 500)
  const markdown = String(raw?.markdown ?? '').trim()
  if (!title) throw new RangeError('TITLE_REQUIRED')
  if (!/^https?:\/\//.test(url)) throw new RangeError('INVALID_URL')
  if (!markdown) throw new RangeError('MARKDOWN_REQUIRED')
  if (markdown.length > MAX_MARKDOWN) throw new RangeError('MARKDOWN_TOO_LARGE')
  const requested = Array.isArray(raw?.platformIds) ? raw.platformIds : DISTRIBUTION_AGENT_PLATFORM_IDS
  const platformIds = DISTRIBUTION_AGENT_PLATFORM_IDS.filter((id) => requested.includes(id))
  if (!platformIds.length) throw new RangeError('PLATFORMS_REQUIRED')
  const tags = (Array.isArray(raw?.tags) ? raw.tags : []).map((tag) => line(tag, 40)).filter(Boolean).slice(0, 20)
  const preparedMarkdown = prepareDistributionMarkdown(markdown, { title })
  return {
    contentKey: line(raw?.contentKey, 200),
    title,
    url,
    summary: line(raw?.summary, 600),
    tags,
    markdown: preparedMarkdown,
    platformIds,
  }
}

export function normalizeDistributionResult(raw) {
  const platformId = String(raw?.platformId || '')
  const status = String(raw?.status || '')
  if (!DISTRIBUTION_RESULT_STATUSES.includes(status)) throw new RangeError('INVALID_RESULT_STATUS')
  return {
    platformId,
    status,
    articleUrl: line(raw?.articleUrl, 500),
    notes: text(raw?.notes, 4000),
    playbookDeviation: text(raw?.playbookDeviation, 4000),
  }
}

// 收尾状态：全部目标平台都有成功结果为 done，一个都没有为 failed，其余为 partial。
export function summarizeJobStatus(platformIds, results) {
  const succeeded = new Set(results.filter((result) => SUCCESS_RESULTS.includes(result.status)).map((result) => result.platformId))
  const count = platformIds.filter((id) => succeeded.has(id)).length
  if (count === platformIds.length) return 'done'
  return count === 0 ? 'failed' : 'partial'
}

function toJob(row, results = []) {
  return {
    id: row.id,
    contentKey: row.content_key,
    title: row.title,
    url: row.url,
    summary: row.summary,
    tags: parseJson(row.tags_json, []),
    platformIds: parseJson(row.platforms_json, []),
    harnessVersion: row.harness_version,
    status: row.status,
    tokenExpiresAt: row.token_hash ? row.token_expires_at : 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    claimedAt: row.claimed_at ?? null,
    finishedAt: row.finished_at ?? null,
    updatedAt: row.updated_at,
    results: results.map((result) => ({
      platformId: result.platform_id,
      status: result.status,
      articleUrl: result.article_url,
      notes: result.notes,
      playbookDeviation: result.playbook_deviation,
      reportedAt: result.reported_at,
    })),
  }
}

async function readResults(db, jobId) {
  const { results } = await db
    .prepare('SELECT * FROM distribution_job_results WHERE job_id = ? ORDER BY reported_at')
    .bind(jobId)
    .all()
  return results || []
}

export async function createDistributionJob(db, raw, { createdBy = '', now = Date.now() } = {}) {
  const input = normalizeDistributionJobInput(raw)
  const id = crypto.randomUUID()
  const { token, tokenHash, expiresAt } = await issueToken(now)
  await db
    .prepare(`INSERT INTO distribution_jobs
      (id, content_key, title, url, summary, tags_json, markdown, platforms_json, harness_version, status, token_hash, token_expires_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`)
    .bind(id, input.contentKey, input.title, input.url, input.summary, JSON.stringify(input.tags), input.markdown,
      JSON.stringify(input.platformIds), HARNESS_VERSION, tokenHash, expiresAt, line(createdBy, 100), now, now)
    .run()
  return { id, token, tokenExpiresAt: expiresAt, platformIds: input.platformIds }
}

export async function listDistributionJobs(db, { limit = 30 } = {}) {
  const size = Math.max(1, Math.min(100, Number(limit) || 30))
  const { results: rows } = await db
    .prepare(`SELECT id, content_key, title, url, summary, tags_json, platforms_json, harness_version, status, token_hash,
      token_expires_at, created_by, created_at, claimed_at, finished_at, updated_at
      FROM distribution_jobs ORDER BY created_at DESC LIMIT ?`)
    .bind(size)
    .all()
  const jobs = []
  for (const row of rows || []) jobs.push(toJob(row, await readResults(db, row.id)))
  return jobs
}

export async function cancelDistributionJob(db, id, now = Date.now()) {
  assertJobId(id)
  const result = await db
    .prepare(`UPDATE distribution_jobs SET status = 'cancelled', token_hash = '', token_expires_at = 0, finished_at = ?, updated_at = ?
      WHERE id = ? AND status IN ('pending', 'claimed')`)
    .bind(now, now, id)
    .run()
  if (!result.meta?.changes) throw new RangeError('JOB_NOT_ACTIVE')
  return { ok: true }
}

export async function reissueDistributionJobToken(db, id, now = Date.now()) {
  assertJobId(id)
  const { token, tokenHash, expiresAt } = await issueToken(now)
  const result = await db
    .prepare(`UPDATE distribution_jobs SET token_hash = ?, token_expires_at = ?, updated_at = ?
      WHERE id = ? AND status IN ('pending', 'claimed')`)
    .bind(tokenHash, expiresAt, now, id)
    .run()
  if (!result.meta?.changes) throw new RangeError('JOB_NOT_ACTIVE')
  return { id, token, tokenExpiresAt: expiresAt }
}

// 智能体侧：token 不对、过期或任务已结束都按无效处理，不区分原因。
async function authorizeAgent(db, id, token, now) {
  if (!JOB_ID.test(String(id || '')) || !/^[0-9a-f]{64}$/.test(String(token || ''))) return null
  const row = await db.prepare('SELECT * FROM distribution_jobs WHERE id = ?').bind(id).first()
  if (!row || !ACTIVE_STATUSES.includes(row.status) || !row.token_hash || row.token_expires_at <= now) return null
  return row.token_hash === (await hashDistributionToken(token)) ? row : null
}

export async function claimDistributionJob(db, id, token, now = Date.now()) {
  const row = await authorizeAgent(db, id, token, now)
  if (!row) return null
  if (row.status === 'pending') {
    await db
      .prepare(`UPDATE distribution_jobs SET status = 'claimed', claimed_at = ?, updated_at = ? WHERE id = ? AND status = 'pending'`)
      .bind(now, now, id)
      .run()
  }
  const job = toJob({ ...row, status: 'claimed', claimed_at: row.claimed_at ?? now }, await readResults(db, id))
  return { ...job, markdown: absolutizeMarkdownUrls(row.markdown) }
}

export async function reportDistributionResult(db, id, token, raw, now = Date.now()) {
  const row = await authorizeAgent(db, id, token, now)
  if (!row) return null
  const result = normalizeDistributionResult(raw)
  if (!parseJson(row.platforms_json, []).includes(result.platformId)) throw new RangeError('PLATFORM_NOT_IN_JOB')
  await db
    .prepare(`INSERT INTO distribution_job_results (job_id, platform_id, status, article_url, notes, playbook_deviation, reported_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id, platform_id) DO UPDATE SET status = excluded.status, article_url = excluded.article_url,
        notes = excluded.notes, playbook_deviation = excluded.playbook_deviation, reported_at = excluded.reported_at`)
    .bind(id, result.platformId, result.status, result.articleUrl, result.notes, result.playbookDeviation, now)
    .run()
  await db
    .prepare(`UPDATE distribution_jobs SET status = 'claimed', claimed_at = COALESCE(claimed_at, ?), updated_at = ? WHERE id = ?`)
    .bind(now, now, id)
    .run()
  return { ok: true, platformId: result.platformId, status: result.status }
}

export async function finishDistributionJob(db, id, token, now = Date.now()) {
  const row = await authorizeAgent(db, id, token, now)
  if (!row) return null
  const results = (await readResults(db, id)).map((result) => ({ platformId: result.platform_id, status: result.status }))
  const status = summarizeJobStatus(parseJson(row.platforms_json, []), results)
  await db
    .prepare(`UPDATE distribution_jobs SET status = ?, token_hash = '', token_expires_at = 0, finished_at = ?, updated_at = ?
      WHERE id = ? AND status IN ('pending', 'claimed')`)
    .bind(status, now, now, id)
    .run()
  return { ok: true, status }
}

export const NO_STORE = { 'Cache-Control': 'private, no-store' }

// 路由共用的错误映射：入参错误 400，任务表未建 503 MIGRATION_REQUIRED。
export function distributionJobErrorResponse(error, label) {
  if (error instanceof RangeError || error instanceof SyntaxError) {
    return Response.json({ error: error.message }, { status: 400, headers: NO_STORE })
  }
  console.error(`${label} failed`, error?.message)
  const missing = /no such table/.test(String(error?.message || ''))
  return Response.json({ error: missing ? 'MIGRATION_REQUIRED' : 'DISTRIBUTION_JOBS_UNAVAILABLE' }, { status: 503, headers: NO_STORE })
}

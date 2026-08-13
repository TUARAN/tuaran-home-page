/** A 股草稿共享发布服务：供后台人工发布与定时自动发布共同调用。 */

import {
  AUTO_PUBLISH_DELAY_MS,
  draftToArticleContent,
  publishFileName,
  publishSlug,
  validatePublishContent,
} from './aSharePublishCore.js'

const DEFAULT_REPO = 'TUARAN/tuaran-home-page'
const BASE_PATH = 'research/companies'

export class ASharePublishError extends Error {
  constructor(code, message, status = 500) {
    super(message)
    this.name = 'ASharePublishError'
    this.code = code
    this.status = status
  }
}

function publishToken(env) {
  return String(
    env.A_SHARE_PUBLISH_TOKEN
      || env.GITHUB_SYNC_TOKEN
      || env.GITHUB_TOKEN
      || process.env.A_SHARE_PUBLISH_TOKEN
      || process.env.GITHUB_SYNC_TOKEN
      || process.env.GITHUB_TOKEN
      || '',
  ).trim()
}

function base64EncodeUtf8(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function githubJson(url, token, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'tuaran-home-page/a-share-publish',
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = data?.message || `HTTP ${response.status}`
      throw new Error(`GitHub API ${response.status}：${detail}`)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

async function recordRun(db, { action, draft, status, error, durationMs, ranAt }) {
  await db
    .prepare(
      `INSERT INTO a_share_run_log
        (id, ran_at, action, code, company_name, draft_id, deepseek_task_id, status, error, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      ranAt,
      action,
      String(draft?.code || '').slice(0, 20),
      String(draft?.name || '').slice(0, 80),
      String(draft?.id || '').slice(0, 120),
      String(status || 'ok').slice(0, 20),
      String(error || '').slice(0, 2000),
      Math.max(0, Number(durationMs) || 0),
    )
    .run()
}

async function claimPendingDraft(db, draft) {
  if (draft.status !== 'pending') return true
  const result = await db
    .prepare("UPDATE a_share_drafts SET status = 'reviewed' WHERE id = ? AND status = 'pending' AND updated_at = ?")
    .bind(draft.id, draft.updated_at)
    .run()
  return Boolean(result?.meta?.changes)
}

/** 发布单篇草稿。pending 草稿先以条件更新占用，防止后台与定时任务重复发布。 */
export async function publishAShareDraft({ db, env, draft, mode = 'manual', now = Date.now() }) {
  const startedAt = now
  const action = mode === 'auto' ? 'auto-publish' : 'publish'
  if (!draft) throw new ASharePublishError('NOT_FOUND', '草稿不存在。', 404)
  if (draft.status === 'published') throw new ASharePublishError('ALREADY_PUBLISHED', '该草稿已发布，请勿重复提交。', 409)
  if (draft.status !== 'pending' && (mode === 'auto' || draft.status !== 'reviewed')) {
    throw new ASharePublishError('INVALID_STATUS', `草稿状态 ${draft.status} 不允许发布。`, 400)
  }

  const token = publishToken(env)
  if (!token) {
    await recordRun(db, { action, draft, status: 'failed', error: '缺少 A_SHARE_PUBLISH_TOKEN', durationMs: Date.now() - startedAt, ranAt: startedAt })
    throw new ASharePublishError(
      'PUBLISH_TOKEN_MISSING',
      '请先在 Cloudflare Pages 配置 A_SHARE_PUBLISH_TOKEN（GitHub fine-grained PAT，需对 tuaran-home-page 有 Contents 读写权限）。',
      503,
    )
  }

  let article
  try {
    article = draftToArticleContent(draft.content)
    validatePublishContent(article, { code: draft.code, name: draft.name })
  } catch (error) {
    const detail = String(error?.message || error)
    await recordRun(db, { action, draft, status: 'failed', error: detail, durationMs: Date.now() - startedAt, ranAt: startedAt })
    throw new ASharePublishError('INVALID_CONTENT', detail, 422)
  }

  const claimed = await claimPendingDraft(db, draft)
  if (!claimed) return { ok: true, skipped: true, reason: 'status-changed', id: draft.id }

  try {
    const fileName = publishFileName(draft)
    const slug = publishSlug(fileName)
    const repo = String(env.A_SHARE_PUBLISH_REPO || process.env.A_SHARE_PUBLISH_REPO || DEFAULT_REPO)
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
    const path = `${BASE_PATH}/${fileName}`

    let existingSha = ''
    try {
      const existing = await githubJson(`https://api.github.com/repos/${repo}/contents/${path}?ref=main`, token)
      existingSha = existing?.sha || ''
    } catch (error) {
      if (!/404|Not Found/i.test(String(error?.message || ''))) throw error
    }

    const commit = await githubJson(`https://api.github.com/repos/${repo}/contents/${path}`, token, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `content: ${mode === 'auto' ? 'auto-' : ''}publish A-share observation ${draft.name} ${draft.code}`,
        content: base64EncodeUtf8(article),
        branch: 'main',
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    })
    const commitSha = commit?.commit?.sha || ''
    const publishedAt = Date.now()
    await db
      .prepare("UPDATE a_share_drafts SET status = 'published', publish_commit = ?, publish_at = ?, updated_at = ? WHERE id = ? AND status = 'reviewed'")
      .bind(commitSha, publishedAt, publishedAt, draft.id)
      .run()
    await recordRun(db, { action, draft, status: 'ok', error: '', durationMs: publishedAt - startedAt, ranAt: startedAt })
    return { ok: true, id: draft.id, commitSha, file: path, slug, url: `/articles/research/companies/${slug}` }
  } catch (error) {
    // 自动发布失败后恢复 pending 且保留原 updated_at，下一次调度仍可重试；人工发布失败沿用 reviewed。
    if (mode === 'auto' && draft.status === 'pending') {
      await db.prepare("UPDATE a_share_drafts SET status = 'pending', updated_at = ? WHERE id = ? AND status = 'reviewed'")
        .bind(draft.updated_at, draft.id)
        .run()
        .catch(() => {})
    }
    await recordRun(db, { action, draft, status: 'failed', error: String(error?.message || error), durationMs: Date.now() - startedAt, ranAt: startedAt })
    if (error instanceof ASharePublishError) throw error
    throw new ASharePublishError('PUBLISH_FAILED', String(error?.message || error), 500)
  }
}

/** 每次调度最多自动发布一篇最早到期草稿，避免积压时单次批量公开。 */
export async function autoPublishOldestDueDraft({ db, env, now = Date.now() }) {
  const cutoff = now - AUTO_PUBLISH_DELAY_MS
  const { results } = await db
    .prepare("SELECT * FROM a_share_drafts WHERE status = 'pending' AND updated_at <= ? ORDER BY updated_at ASC LIMIT 20")
    .bind(cutoff)
    .all()
  const drafts = results || []
  if (!drafts.length) return { ok: true, skipped: true, reason: 'none-due' }

  const rejected = []
  for (const draft of drafts) {
    try {
      const result = await publishAShareDraft({ db, env, draft, mode: 'auto', now })
      return rejected.length ? { ...result, rejectedInvalidDrafts: rejected } : result
    } catch (error) {
      if (!(error instanceof ASharePublishError) || error.code !== 'INVALID_CONTENT') throw error
      await db
        .prepare("UPDATE a_share_drafts SET status = 'rejected', updated_at = ? WHERE id = ? AND status = 'pending'")
        .bind(Date.now(), draft.id)
        .run()
      rejected.push({ id: draft.id, code: draft.code, error: error.message })
    }
  }

  return { ok: true, skipped: true, reason: 'invalid-content-rejected', rejectedInvalidDrafts: rejected }
}

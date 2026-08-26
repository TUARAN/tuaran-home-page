import {
  CRYPTO_AUTO_PUBLISH_DELAY_MS,
  cryptoDraftToArticleContent,
  cryptoPublishFileName,
  cryptoPublishSlug,
} from './cryptoPublishCore.js'

const DEFAULT_REPO = 'TUARAN/tuaran-home-page'
const BASE_PATH = 'research/topics'

export class CryptoPublishError extends Error {
  constructor(code, message, status = 500) {
    super(message)
    this.name = 'CryptoPublishError'
    this.code = code
    this.status = status
  }
}

function publishToken(env) {
  return String(env.CRYPTO_PUBLISH_TOKEN || env.A_SHARE_PUBLISH_TOKEN || env.GITHUB_SYNC_TOKEN || env.GITHUB_TOKEN || process.env.CRYPTO_PUBLISH_TOKEN || process.env.A_SHARE_PUBLISH_TOKEN || '').trim()
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
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'tuaran-home-page/crypto-publish', ...(options.headers || {}) },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(`GitHub API ${response.status}：${data?.message || '请求失败'}`)
    return data
  } finally {
    clearTimeout(timer)
  }
}

async function recordRun(db, { action, draft, status, error = '', startedAt }) {
  await db.prepare(
    `INSERT INTO crypto_run_log
      (id, ran_at, action, coin_id, symbol, coin_name, draft_id, deepseek_task_id, status, error, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?)`,
  ).bind(crypto.randomUUID(), startedAt, action, draft?.coin_id || '', draft?.symbol || '', draft?.name || '', draft?.id || '', status, String(error).slice(0, 2000), Date.now() - startedAt).run()
}

async function claimPendingDraft(db, draft) {
  if (draft.status !== 'pending') return true
  const result = await db.prepare("UPDATE crypto_drafts SET status = 'reviewed' WHERE id = ? AND status = 'pending' AND updated_at = ?")
    .bind(draft.id, draft.updated_at).run()
  return Boolean(result?.meta?.changes)
}

export async function publishCryptoDraft({ db, env, draft, mode = 'manual', now = Date.now() }) {
  const action = mode === 'auto' ? 'auto-publish' : 'publish'
  if (!draft) throw new CryptoPublishError('NOT_FOUND', '草稿不存在。', 404)
  if (draft.status === 'published') throw new CryptoPublishError('ALREADY_PUBLISHED', '该草稿已发布。', 409)
  if (draft.status !== 'pending' && (mode === 'auto' || draft.status !== 'reviewed')) throw new CryptoPublishError('INVALID_STATUS', `草稿状态 ${draft.status} 不允许发布。`, 400)
  const token = publishToken(env)
  if (!token) throw new CryptoPublishError('PUBLISH_TOKEN_MISSING', '缺少 CRYPTO_PUBLISH_TOKEN（可回退 A_SHARE_PUBLISH_TOKEN）。', 503)

  let article
  try {
    article = cryptoDraftToArticleContent(draft.content, { id: draft.coin_id, name: draft.name })
  } catch (error) {
    await recordRun(db, { action, draft, status: 'failed', error: error.message, startedAt: now })
    throw new CryptoPublishError('INVALID_CONTENT', error.message, 422)
  }
  if (!(await claimPendingDraft(db, draft))) return { ok: true, skipped: true, reason: 'status-changed', id: draft.id }

  try {
    const fileName = cryptoPublishFileName(draft)
    const slug = cryptoPublishSlug(fileName)
    const repo = String(env.CRYPTO_PUBLISH_REPO || env.A_SHARE_PUBLISH_REPO || DEFAULT_REPO).replace(/^https?:\/\/(www\.)?github\.com\//, '')
    const path = `${BASE_PATH}/${fileName}`
    let existingSha = ''
    try {
      existingSha = (await githubJson(`https://api.github.com/repos/${repo}/contents/${path}?ref=main`, token))?.sha || ''
    } catch (error) {
      if (!/404|Not Found/i.test(String(error?.message || ''))) throw error
    }
    const commit = await githubJson(`https://api.github.com/repos/${repo}/contents/${path}`, token, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `content: ${mode === 'auto' ? 'auto-' : ''}publish crypto observation ${draft.name} ${draft.symbol}`,
        content: base64EncodeUtf8(article),
        branch: 'main',
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    })
    const publishedAt = Date.now()
    const commitSha = commit?.commit?.sha || ''
    await db.prepare("UPDATE crypto_drafts SET status = 'published', publish_commit = ?, publish_at = ?, updated_at = ? WHERE id = ? AND status = 'reviewed'")
      .bind(commitSha, publishedAt, publishedAt, draft.id).run()
    await recordRun(db, { action, draft, status: 'ok', startedAt: now })
    return { ok: true, id: draft.id, commitSha, file: path, slug, url: `/articles/research/topics/${slug}` }
  } catch (error) {
    if (mode === 'auto' && draft.status === 'pending') {
      await db.prepare("UPDATE crypto_drafts SET status = 'pending', updated_at = ? WHERE id = ? AND status = 'reviewed'").bind(draft.updated_at, draft.id).run().catch(() => {})
    }
    await recordRun(db, { action, draft, status: 'failed', error: error.message, startedAt: now }).catch(() => {})
    throw error instanceof CryptoPublishError ? error : new CryptoPublishError('PUBLISH_FAILED', String(error?.message || error), 500)
  }
}

export async function autoPublishOldestDueCryptoDraft({ db, env, now = Date.now() }) {
  const { results } = await db.prepare("SELECT * FROM crypto_drafts WHERE status = 'pending' AND updated_at <= ? ORDER BY updated_at ASC LIMIT 20")
    .bind(now - CRYPTO_AUTO_PUBLISH_DELAY_MS).all()
  if (!results?.length) return { ok: true, skipped: true, reason: 'none-due' }
  for (const draft of results) {
    try {
      return await publishCryptoDraft({ db, env, draft, mode: 'auto', now })
    } catch (error) {
      if (!(error instanceof CryptoPublishError) || error.code !== 'INVALID_CONTENT') throw error
      await db.prepare("UPDATE crypto_drafts SET status = 'rejected', updated_at = ? WHERE id = ? AND status = 'pending'").bind(Date.now(), draft.id).run()
    }
  }
  return { ok: true, skipped: true, reason: 'invalid-content-rejected' }
}

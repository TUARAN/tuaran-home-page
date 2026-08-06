import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import {
  draftToArticleContent,
  publishFileName,
  publishSlug,
  validatePublishContent,
} from '../../../../../lib/aSharePublishCore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DEFAULT_REPO = 'TUARAN/tuaran-home-page'
const BASE_PATH = 'research/companies'

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

async function recordRun(db, { action, code, companyName, draftId, status, error, durationMs, ranAt = Date.now() }) {
  await db
    .prepare(
      `INSERT INTO a_share_run_log
        (id, ran_at, action, code, company_name, draft_id, deepseek_task_id, status, error, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      ranAt,
      String(action || '').slice(0, 60),
      String(code || '').slice(0, 20),
      String(companyName || '').slice(0, 80),
      String(draftId || '').slice(0, 120),
      String(status || 'ok').slice(0, 20),
      String(error || '').slice(0, 2000),
      Math.max(0, Number(durationMs) || 0),
    )
    .run()
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id || '').trim()
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  const startedAt = Date.now()
  let draft
  try {
    draft = await db.prepare('SELECT * FROM a_share_drafts WHERE id = ?').bind(id).first()
  } catch (error) {
    return Response.json({ error: 'A_SHARE_FETCH_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
  if (!draft) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (draft.status === 'published') {
    return Response.json({ error: 'ALREADY_PUBLISHED', detail: '该草稿已发布，请勿重复提交。' }, { status: 409 })
  }
  if (draft.status !== 'pending' && draft.status !== 'reviewed') {
    return Response.json({ error: 'INVALID_STATUS', detail: `草稿状态 ${draft.status} 不允许发布。` }, { status: 400 })
  }

  const env = getOptionalRequestContext()?.env || {}
  const token = publishToken(env)
  if (!token) {
    await recordRun(db, {
      action: 'publish',
      code: draft.code,
      companyName: draft.name,
      draftId: id,
      status: 'failed',
      error: '缺少 A_SHARE_PUBLISH_TOKEN',
      durationMs: Date.now() - startedAt,
      ranAt: startedAt,
    })
    return Response.json(
      {
        error: 'PUBLISH_TOKEN_MISSING',
        detail: '请先在 Cloudflare Pages 配置 A_SHARE_PUBLISH_TOKEN（GitHub fine-grained PAT，需对 tuaran-home-page 有 Contents 读写权限）。',
      },
      { status: 503 },
    )
  }

  try {
    const article = draftToArticleContent(draft.content)
    validatePublishContent(article, { code: draft.code, name: draft.name })
    const fileName = publishFileName(draft)
    const slug = publishSlug(fileName)
    const repo = String(env.A_SHARE_PUBLISH_REPO || process.env.A_SHARE_PUBLISH_REPO || DEFAULT_REPO).replace(/^https?:\/\/(www\.)?github\.com\//, '')
    const path = `${BASE_PATH}/${fileName}`

    // 同名文件已存在时带上 sha 覆盖（同一天对同一代码重发）。
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
        message: `content: publish A-share observation ${draft.name} ${draft.code}`,
        content: base64EncodeUtf8(article),
        branch: 'main',
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    })
    const commitSha = commit?.commit?.sha || ''
    const publishedAt = Date.now()

    await db
      .prepare(
        `UPDATE a_share_drafts SET status = 'published', publish_commit = ?, publish_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(commitSha, publishedAt, publishedAt, id)
      .run()
    await recordRun(db, {
      action: 'publish',
      code: draft.code,
      companyName: draft.name,
      draftId: id,
      status: 'ok',
      error: '',
      durationMs: publishedAt - startedAt,
      ranAt: startedAt,
    })

    return Response.json({
      ok: true,
      id,
      commitSha,
      file: path,
      slug,
      url: `/articles/research/companies/${slug}`,
      note: '已提交 main，Cloudflare Pages 构建完成后即可访问。',
    })
  } catch (error) {
    await recordRun(db, {
      action: 'publish',
      code: draft.code,
      companyName: draft.name,
      draftId: id,
      status: 'failed',
      error: String(error?.message || error),
      durationMs: Date.now() - startedAt,
      ranAt: startedAt,
    })
    // 发布失败时把草稿置为「已复核」，可稍后重试发布。
    await db
      .prepare("UPDATE a_share_drafts SET status = 'reviewed', updated_at = ? WHERE id = ? AND status != 'published'")
      .bind(Date.now(), id)
      .run()
      .catch(() => {})
    return Response.json({ error: 'PUBLISH_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

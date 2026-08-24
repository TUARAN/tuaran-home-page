import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  X_ARTICLE_LAST_RUN_KEY,
  X_ARTICLE_SECRET_HEADER,
  X_ARTICLE_TASK_SETTING_KEY,
  normalizeXArticleReport,
  pickDailyXArticle,
  shanghaiDateKey,
} from '../../../../lib/xArticleExtension'
import { MORNING_GREETING_SETTING_KEY, isAutomationPaused } from '../../../../lib/morningGreeting'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://2aran.com'

async function readSetting(db, key) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(key).first()
  return row?.value ?? null
}

async function writeSetting(db, key, value) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?, ?, ?, 'x-article-extension')
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(key, value, Date.now()).run()
}

function parseJson(value) {
  try { return JSON.parse(value || 'null') } catch { return null }
}

function requestContext() {
  const env = getOptionalRequestContext()?.env || {}
  const secret = String(env.X_ARTICLE_EXTENSION_SECRET || process.env.X_ARTICLE_EXTENSION_SECRET || '').trim()
  return { env, secret, db: env.DB || null }
}

function authorize(req, secret) {
  if (!secret) {
    return Response.json({ ok: false, error: 'X_ARTICLE_EXTENSION_SECRET_NOT_CONFIGURED' }, { status: 503 })
  }
  if (req.headers.get(X_ARTICLE_SECRET_HEADER) !== secret) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  return null
}

export async function GET(req) {
  const { db, secret } = requestContext()
  const rejected = authorize(req, secret)
  if (rejected) return rejected
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  const today = shanghaiDateKey()
  try {
    const [taskRaw, lastRunRaw, automationState] = await Promise.all([
      readSetting(db, X_ARTICLE_TASK_SETTING_KEY),
      readSetting(db, X_ARTICLE_LAST_RUN_KEY),
      readSetting(db, MORNING_GREETING_SETTING_KEY),
    ])
    if (isAutomationPaused(automationState)) {
      return Response.json({ ok: false, error: 'PAUSED', detail: '后台已暂停 X 自动发布任务。' }, { status: 423 })
    }
    const currentTask = parseJson(taskRaw)
    const lastRun = parseJson(lastRunRaw)

    if (currentTask?.date === today) {
      if (currentTask.status === 'published') {
        return Response.json({ ok: true, done: true, date: today, task: currentTask })
      }
      return Response.json({ ok: true, done: false, date: today, task: currentTask })
    }

    const { results } = await db.prepare(
      `SELECT content_key, content_type, title, summary, href
       FROM content_index
       WHERE status = 'published'
         AND content_type IN ('article', 'research')
         AND href LIKE '/articles/%'
       ORDER BY content_key ASC`,
    ).all()
    const article = pickDailyXArticle(results || [], {
      dateKey: today,
      previousContentKey: lastRun?.contentKey || '',
    })
    if (!article) return Response.json({ ok: false, error: 'NO_PUBLISHED_ARTICLE' }, { status: 404 })

    const task = {
      id: `${today}:${article.contentKey}`,
      date: today,
      status: 'ready',
      contentKey: article.contentKey,
      title: article.title,
      summary: article.summary,
      sourceUrl: new URL(article.href, SITE_URL).toString(),
      createdAt: Date.now(),
      attempts: 0,
    }
    await writeSetting(db, X_ARTICLE_TASK_SETTING_KEY, JSON.stringify(task))
    return Response.json({ ok: true, done: false, date: today, task }, { status: 201 })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'X_ARTICLE_TASK_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  const { db, secret } = requestContext()
  const rejected = authorize(req, secret)
  if (rejected) return rejected
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  const body = await req.json().catch(() => null)
  const normalized = normalizeXArticleReport(body)
  if (normalized.error) return Response.json({ ok: false, error: normalized.error }, { status: 400 })

  try {
    const current = parseJson(await readSetting(db, X_ARTICLE_TASK_SETTING_KEY))
    if (!current || current.id !== normalized.report.taskId) {
      return Response.json({ ok: false, error: 'TASK_MISMATCH' }, { status: 409 })
    }
    if (current.status === 'published') {
      return Response.json({ ok: true, done: true, task: current })
    }
    const next = {
      ...current,
      status: normalized.report.status,
      attempts: Math.max(Number(current.attempts) || 0, normalized.report.attempt),
      detail: normalized.report.detail,
      xArticleUrl: normalized.report.xArticleUrl,
      updatedAt: Date.now(),
      publishedAt: normalized.report.status === 'published' ? Date.now() : null,
    }
    await writeSetting(db, X_ARTICLE_TASK_SETTING_KEY, JSON.stringify(next))
    await writeSetting(db, X_ARTICLE_LAST_RUN_KEY, JSON.stringify(next))
    return Response.json({ ok: true, done: next.status === 'published', task: next })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'X_ARTICLE_REPORT_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

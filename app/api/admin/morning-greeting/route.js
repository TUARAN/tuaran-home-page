import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  MORNING_GREETING_ID,
  MORNING_GREETING_SETTING_KEY,
  greetingLastRunKey,
  isAutomationPaused,
} from '../../../../lib/morningGreeting'
import {
  deleteMorningGreetingTemplate,
  greetingTemplateStats,
  listMorningGreetingTemplates,
  upsertMorningGreetingTemplate,
} from '../../../../lib/morningGreetingTemplates'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

async function readSetting(db, key) {
  const { results } = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).all()
  return results?.[0]?.value ?? null
}

async function writeSetting(db, key, value, updatedBy) {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
    .bind(key, value, Date.now(), String(updatedBy || 'admin'))
    .run()
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', message: '当前运行环境没有 D1 绑定。' }, { status: 503 })
  }

  const url = new URL(req.url)
  const parsedOffset = Number.parseInt(url.searchParams.get('offset') || '0', 10)
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10)
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 20
  const period = String(url.searchParams.get('period') || 'all')
  const query = String(url.searchParams.get('q') || '').trim().slice(0, 100)

  try {
    const [templatePage, stats, state, morningRaw, noonRaw, eveningRaw] = await Promise.all([
      listMorningGreetingTemplates(db, { offset, limit, period, query }),
      greetingTemplateStats(db),
      readSetting(db, MORNING_GREETING_SETTING_KEY),
      readSetting(db, greetingLastRunKey('morning')),
      readSetting(db, greetingLastRunKey('noon')),
      readSetting(db, greetingLastRunKey('evening')),
    ])
    const lastRuns = {}
    for (const [key, raw] of [['morning', morningRaw], ['noon', noonRaw], ['evening', eveningRaw]]) {
      try {
        lastRuns[key] = JSON.parse(raw || 'null')
      } catch {
        lastRuns[key] = null
      }
    }
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      templates: templatePage.items,
      total: templatePage.total,
      offset,
      limit,
      paused: isAutomationPaused(state),
      lastRuns,
      stats,
    })
  } catch (error) {
    return Response.json(
      { status: 'error', message: '每日问候模板读取失败。', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })

  try {
    const result = await upsertMorningGreetingTemplate(db, {
      id: Number(body.id) || 0,
      text: String(body.text || ''),
      period: String(body.period || 'morning'),
      contentKind: String(body.contentKind || 'reflection'),
      enabled: body.enabled !== false,
      sortOrder: Number(body.sortOrder) || 0,
    })
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.error === 'NOT_FOUND' ? 404 : 400 })
    }
    return Response.json({ ok: true, id: result.id }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: 'TEMPLATE_UPSERT_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const id = Number(new URL(req.url).searchParams.get('id') || 0)
  const result = await deleteMorningGreetingTemplate(db, id)
  if (!result.ok) return Response.json({ error: result.error || 'NOT_FOUND' }, { status: 404 })
  return Response.json({ ok: true, id })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '')
  if (action !== 'pause' && action !== 'resume') {
    return Response.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  }

  const next = action === 'pause' ? 'paused' : 'running'
  await writeSetting(db, MORNING_GREETING_SETTING_KEY, next, guard.user?.name || 'admin')
  return Response.json({ ok: true, id: MORNING_GREETING_ID, status: next })
}

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  MORNING_GREETING_ID,
  MORNING_GREETING_LAST_RUN_KEY,
  MORNING_GREETING_SETTING_KEY,
  isAutomationPaused,
} from '../../../../lib/morningGreeting'
import {
  deleteMorningGreetingTemplate,
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

  try {
    const [templates, state, lastRunRaw] = await Promise.all([
      listMorningGreetingTemplates(db),
      readSetting(db, MORNING_GREETING_SETTING_KEY),
      readSetting(db, MORNING_GREETING_LAST_RUN_KEY),
    ])
    let lastRun = null
    try {
      lastRun = JSON.parse(lastRunRaw || 'null')
    } catch {
      lastRun = null
    }
    const enabledCount = templates.filter((item) => item.enabled).length
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      templates,
      paused: isAutomationPaused(state),
      lastRun,
      stats: {
        total: templates.length,
        enabled: enabledCount,
      },
    })
  } catch (error) {
    return Response.json(
      { status: 'error', message: '问早模板读取失败。', detail: String(error?.message || error) },
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

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { FAMOUS_QUOTES } from '../../../../lib/famousQuotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToQuote(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source || '',
    sourceUrl: row.source_url || '',
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

function seedToQuote(item, index) {
  return {
    ...item,
    sortOrder: FAMOUS_QUOTES.length - index,
    createdAt: 0,
    updatedAt: 0,
  }
}

async function ensureSeeded(db) {
  const marker = await db
    .prepare(`SELECT value FROM site_settings WHERE key = 'quotes.seed.version'`)
    .first()
  if (marker?.value) return
  const now = Date.now()
  const statements = FAMOUS_QUOTES.map((item, index) => db
    .prepare(
      `INSERT OR IGNORE INTO famous_quotes
       (id, text, author, source, source_url, enabled, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
    .bind(
      item.id,
      item.text,
      item.author,
      item.source,
      item.sourceUrl,
      FAMOUS_QUOTES.length - index,
      now,
      now,
    ))
  statements.push(db
    .prepare(
      `INSERT OR REPLACE INTO site_settings (key, value, updated_at, updated_by)
       VALUES ('quotes.seed.version', '1', ?, 'quote-admin')`
    )
    .bind(now))
  await db.batch(statements)
}

function readBody(request) {
  return request.json().catch(() => null)
}

function cleanQuote(body) {
  return {
    text: String(body?.text || '').trim().slice(0, 80),
    author: String(body?.author || '').trim().slice(0, 40),
    source: String(body?.source || '').trim().slice(0, 80),
    sourceUrl: String(body?.sourceUrl || '').trim().slice(0, 500),
    enabled: body?.enabled !== false,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
  }
}

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'preview',
      persistent: false,
      quotes: FAMOUS_QUOTES.map(seedToQuote),
    })
  }

  try {
    await ensureSeeded(db)
    const result = await db
      .prepare(
        `SELECT id, text, author, source, source_url, enabled, sort_order, created_at, updated_at
         FROM famous_quotes
         ORDER BY sort_order DESC, updated_at DESC`
      )
      .all()
    return Response.json({
      status: 'ok',
      persistent: true,
      quotes: (result?.results || []).map(rowToQuote),
    })
  } catch (error) {
    return Response.json({
      error: 'QUOTES_READ_FAILED',
      message: '名言表不可用，请先应用 0057_famous_quotes.sql。',
      detail: String(error?.message || error),
    }, { status: 500 })
  }
}

export async function POST(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  const item = cleanQuote(body)
  if (!item.text || !item.author) {
    return Response.json({ error: 'TEXT_AND_AUTHOR_REQUIRED' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO famous_quotes
         (id, text, author, source, source_url, enabled, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, item.text, item.author, item.source, item.sourceUrl, item.enabled ? 1 : 0, item.sortOrder, now, now)
      .run()
    return Response.json({ ok: true, quote: { id, ...item, createdAt: now, updatedAt: now } })
  } catch (error) {
    return Response.json({ error: 'QUOTE_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function PATCH(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(request)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  const id = String(body?.id || '').trim()
  const item = cleanQuote(body)
  if (!id || !item.text || !item.author) {
    return Response.json({ error: 'ID_TEXT_AND_AUTHOR_REQUIRED' }, { status: 400 })
  }
  const now = Date.now()
  try {
    const result = await db
      .prepare(
        `UPDATE famous_quotes
         SET text = ?, author = ?, source = ?, source_url = ?, enabled = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(item.text, item.author, item.source, item.sourceUrl, item.enabled ? 1 : 0, item.sortOrder, now, id)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, quote: { id, ...item, updatedAt: now } })
  } catch (error) {
    return Response.json({ error: 'QUOTE_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function DELETE(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  try {
    const result = await db.prepare('DELETE FROM famous_quotes WHERE id = ?').bind(id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: 'QUOTE_DELETE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

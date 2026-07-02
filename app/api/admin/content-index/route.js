import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  deleteContentEntry,
  listContentIndex,
  normalizeContentEntryInput,
  syncBuildContentToD1,
  upsertContentEntry,
} from '../../../../lib/contentIndex'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/** 站长内容索引管理：GET 全量列表；POST sync/upsert；DELETE 删除。 */
export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const entries = await listContentIndex({ limit: 1000 })
    return Response.json({ entries })
  } catch (err) {
    return Response.json({ error: 'DB_ERROR', message: String(err?.message || err) }, { status: 500 })
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  try {
    if (body?.action === 'sync') {
      const result = await syncBuildContentToD1()
      if (!result.ok) return Response.json(result, { status: 500 })
      return Response.json(result)
    }

    if (body?.action === 'upsert') {
      const { entry, error } = normalizeContentEntryInput(body?.entry, { source: 'manual' })
      if (error) return Response.json({ error }, { status: 400 })
      await upsertContentEntry(getD1(), entry)
      return Response.json({ ok: true, entry })
    }

    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: 'DB_ERROR', message: String(err?.message || err) }, { status: 500 })
  }
}

export async function DELETE(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const url = new URL(req.url)
  const contentKey = url.searchParams.get('contentKey') || ''
  if (!contentKey) return Response.json({ error: 'MISSING_CONTENT_KEY' }, { status: 400 })
  try {
    const result = await deleteContentEntry(contentKey)
    return Response.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    return Response.json({ error: 'DB_ERROR', message: String(err?.message || err) }, { status: 500 })
  }
}

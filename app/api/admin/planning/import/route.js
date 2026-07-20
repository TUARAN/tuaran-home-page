import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { CHANGELOG } from '../../../../../lib/changelogData'
import {
  applyInitialImport,
  previewInitialImport,
  readPortfolioCatalog,
} from '../../../../../lib/planning/repository.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function sourceKeys(items) {
  return items.map((item) => item.sourceKey).filter(Boolean)
}

async function countExistingSourceKeys(db, table, keys) {
  if (!keys.length) return 0
  const placeholders = keys.map((_, index) => `?${index + 1}`).join(', ')
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE source_key IN (${placeholders})`).bind(...keys).first()
  return Number(row?.count || 0)
}

async function buildPreview(db) {
  const projects = await readPortfolioCatalog(db)
  const preview = previewInitialImport(projects, CHANGELOG)
  const [milestones, events] = await Promise.all([
    countExistingSourceKeys(db, 'planning_milestones', sourceKeys(preview.milestones)),
    countExistingSourceKeys(db, 'planning_events', sourceKeys(preview.events)),
  ])
  return { preview, existingSourceKeyCounts: { milestones, events } }
}

async function readJson(req) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  try {
    const { preview, existingSourceKeyCounts } = await buildPreview(db)
    return Response.json({ status: 'ok', ...preview, existingSourceKeyCounts })
  } catch {
    return Response.json({ error: 'IMPORT_READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const body = await readJson(req)
  if (body?.confirm !== true) {
    return Response.json({ error: 'IMPORT_CONFIRMATION_REQUIRED' }, { status: 400 })
  }

  try {
    const { preview } = await buildPreview(db)
    const { inserted, skipped } = await applyInitialImport(db, preview)
    return Response.json({ status: 'ok', inserted, skipped })
  } catch {
    return Response.json({ error: 'IMPORT_WRITE_FAILED' }, { status: 500 })
  }
}

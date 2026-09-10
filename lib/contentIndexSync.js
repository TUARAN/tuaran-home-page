import { getD1 } from './d1'
import { readContentCatalog } from './contentCatalogRuntime'
import { prepareUpsertContentEntry } from './contentIndex'

/**
 * 一键同步：把构建期统一内容管线镜像进 D1（source='sync'）。
 * 手工条目（source='manual'）不受影响；同步条目按 content_key 覆盖更新。
 */
export async function syncBuildContentToD1() {
  const db = getD1()
  if (!db) return { ok: false, error: 'NO_DB' }
  const entries = (await readContentCatalog()).entries
  const now = Date.now()
  const statements = entries.map((entry) =>
    prepareUpsertContentEntry(db, { ...entry, status: 'published', source: 'sync' }, { now })
  )
  // D1 batch：一次事务写入全部镜像，避免上百次网络往返
  const CHUNK = 50
  for (let i = 0; i < statements.length; i += CHUNK) {
    await db.batch(statements.slice(i, i + CHUNK))
  }
  return { ok: true, count: entries.length }
}

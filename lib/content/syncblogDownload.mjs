export const SYNCBLOG_DOWNLOAD_KEY = 'resource.syncblog-publisher.download'
export async function readSyncblogDownload(db) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(SYNCBLOG_DOWNLOAD_KEY).first()
  return row ? JSON.parse(row.value) : {}
}
export async function saveSyncblogDownload(db, record, actor) {
  await db.prepare(`INSERT INTO site_settings (key, value, updated_at, updated_by) VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(SYNCBLOG_DOWNLOAD_KEY, JSON.stringify(record), Date.now(), String(actor || 'owner')).run()
}
export function syncblogDownloadStatus(record) {
  return { ready: Boolean(record.objectKey && record.password), fileName: record.fileName || '', uploadedAt: record.uploadedAt || null, passwordUpdatedAt: record.password?.createdAt || null }
}

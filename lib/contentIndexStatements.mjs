const UPSERT_SQL = `INSERT INTO content_index
    (content_key, content_type, category, slug, title, summary, tags_json, href, date, status, source, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(content_key) DO UPDATE SET
    content_type = excluded.content_type,
    category = excluded.category,
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    tags_json = excluded.tags_json,
    href = excluded.href,
    date = excluded.date,
    status = excluded.status,
    source = excluded.source,
    updated_at = excluded.updated_at`

export function prepareContentIndexUpsert(db, entry, now = Date.now()) {
  // Archive synchronization must not overwrite manual edits or Git publication tombstones.
  const sql = entry.source === 'sync' ? `${UPSERT_SQL} WHERE content_index.source = 'sync'`
    : entry.source === 'manual' ? `${UPSERT_SQL} WHERE content_index.source <> 'git'` : UPSERT_SQL
  return db
    .prepare(sql)
    .bind(
      entry.contentKey,
      entry.type,
      entry.category,
      entry.slug,
      entry.title,
      entry.summary,
      JSON.stringify(entry.tags || []),
      entry.href,
      entry.date,
      entry.status,
      entry.source,
      now,
      now
    )
}

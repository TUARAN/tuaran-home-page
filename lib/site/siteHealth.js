export async function checkSiteHealth(env, now = Date.now()) {
  const startedAt = Date.now()
  const db = env?.DB || null
  const storage = env?.CONTENT_FEED || null
  let database = { status: db ? 'checking' : 'unavailable', tableCount: null }

  if (db) {
    try {
      const row = await db
        .prepare("SELECT COUNT(*) AS value FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .first()
      const tableCount = Math.max(0, Number(row?.value) || 0)
      // 能执行 SQL 但连到空库通常意味着 binding 指错，同样视为不可用。
      database = { status: tableCount > 0 ? 'ok' : 'error', tableCount }
    } catch {
      database = { status: 'error', tableCount: null }
    }
  }

  return {
    healthy: database.status === 'ok',
    checkedAt: now,
    latencyMs: Math.max(0, Date.now() - startedAt),
    components: {
      site: { status: 'ok' },
      database,
      statusStorage: { status: storage ? 'ok' : 'unavailable' },
    },
  }
}

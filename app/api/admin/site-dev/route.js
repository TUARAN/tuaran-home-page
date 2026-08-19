import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const VALID_PROVIDERS = ['github', 'npm']
const VALID_SOURCE_STATUSES = ['active', 'paused']
const VALID_LOCAL_STATUSES = ['inbox', 'todo', 'doing', 'blocked', 'done']
const VALID_PRIORITIES = ['low', 'normal', 'high']

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function now() {
  return Date.now()
}

function toMillis(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function normalizeSlug(value) {
  return String(value || '').trim()
}

function sourceIdFor(source) {
  if (source.provider === 'github') {
    return `github:${source.owner.toLowerCase()}/${source.repo.toLowerCase()}`
  }
  return `npm:${source.npmPackage.toLowerCase()}`
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value || '')
  } catch {
    return fallback
  }
}

function rowToSource(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    provider: row.provider,
    owner: row.owner || '',
    repo: row.repo || '',
    npmPackage: row.npm_package || '',
    displayName: row.display_name || '',
    status: row.status || 'active',
    repoUrl: row.repo_url || '',
    latestVersion: row.latest_version || '',
    latestVersionAt: row.latest_version_at || null,
    openIssuesCount: Number(row.open_issues_count) || 0,
    openPrsCount: Number(row.open_prs_count) || 0,
    lastSyncedAt: row.last_synced_at || null,
    lastSyncStatus: row.last_sync_status || 'never',
    lastSyncError: row.last_sync_error || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToWorkItem(row) {
  return {
    id: row.id,
    sourceId: row.source_id,
    projectId: row.project_id,
    provider: row.provider,
    type: row.type,
    externalId: row.external_id || '',
    number: row.number == null ? null : Number(row.number),
    title: row.title || '',
    bodyExcerpt: row.body_excerpt || '',
    state: row.state || '',
    localStatus: row.local_status || 'inbox',
    priority: row.priority || 'normal',
    author: row.author || '',
    labels: safeJson(row.labels_json, []),
    url: row.url || '',
    milestone: row.milestone || '',
    note: row.note || '',
    externalCreatedAt: row.external_created_at || null,
    externalUpdatedAt: row.external_updated_at || null,
    externalClosedAt: row.external_closed_at || null,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToWorkItemDetail(row) {
  const item = rowToWorkItem(row)
  const raw = safeJson(row.raw_json, {})
  return {
    ...item,
    body: typeof raw?.body === 'string' ? raw.body : item.bodyExcerpt,
  }
}

function rowToProject(row) {
  return {
    id: row.id,
    name: row.name,
    pillar: row.pillar,
    action: row.action,
  }
}

function rowToEvent(row) {
  return {
    id: row.id,
    sourceId: row.source_id || '',
    provider: row.provider || '',
    status: row.status,
    message: row.message || '',
    itemCount: Number(row.item_count) || 0,
    startedAt: row.started_at,
    finishedAt: row.finished_at || null,
    errorDetail: row.error_detail || '',
  }
}

async function ensureTables(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_dev_sources (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        owner TEXT NOT NULL DEFAULT '',
        repo TEXT NOT NULL DEFAULT '',
        npm_package TEXT NOT NULL DEFAULT '',
        display_name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        repo_url TEXT NOT NULL DEFAULT '',
        latest_version TEXT NOT NULL DEFAULT '',
        latest_version_at INTEGER,
        open_issues_count INTEGER NOT NULL DEFAULT 0,
        open_prs_count INTEGER NOT NULL DEFAULT 0,
        last_synced_at INTEGER,
        last_sync_status TEXT NOT NULL DEFAULT 'never',
        last_sync_error TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    )
    .run()
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_dev_work_items (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        type TEXT NOT NULL,
        external_id TEXT NOT NULL DEFAULT '',
        number INTEGER,
        title TEXT NOT NULL,
        body_excerpt TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT '',
        local_status TEXT NOT NULL DEFAULT 'inbox',
        priority TEXT NOT NULL DEFAULT 'normal',
        author TEXT NOT NULL DEFAULT '',
        labels_json TEXT NOT NULL DEFAULT '[]',
        url TEXT NOT NULL DEFAULT '',
        milestone TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        external_created_at INTEGER,
        external_updated_at INTEGER,
        external_closed_at INTEGER,
        synced_at INTEGER NOT NULL,
        raw_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    )
    .run()
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_dev_sync_events (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL DEFAULT '',
        provider TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        message TEXT NOT NULL DEFAULT '',
        item_count INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        finished_at INTEGER,
        error_detail TEXT NOT NULL DEFAULT ''
      )`,
    )
    .run()
}

async function readDashboard(db) {
  await ensureTables(db)
  const [projectsResult, sourcesResult, itemsResult, eventsResult] = await Promise.all([
    db.prepare('SELECT id, name, pillar, action FROM portfolio_projects ORDER BY sort_order ASC').all(),
    db.prepare('SELECT * FROM site_dev_sources ORDER BY updated_at DESC').all(),
    db
      .prepare(
        `SELECT * FROM site_dev_work_items
         WHERE local_status != 'done' OR external_updated_at >= ?1
         ORDER BY
           CASE local_status
             WHEN 'doing' THEN 1
             WHEN 'blocked' THEN 2
             WHEN 'todo' THEN 3
             WHEN 'inbox' THEN 4
             ELSE 5
           END,
           external_updated_at DESC,
           updated_at DESC
         LIMIT 200`,
      )
      .bind(now() - 14 * 24 * 60 * 60 * 1000)
      .all(),
    db
      .prepare('SELECT * FROM site_dev_sync_events ORDER BY started_at DESC LIMIT 12')
      .all(),
  ])
  const projects = (projectsResult?.results || []).map(rowToProject)
  const sources = (sourcesResult?.results || []).map(rowToSource)
  const items = (itemsResult?.results || []).map(rowToWorkItem)
  const events = (eventsResult?.results || []).map(rowToEvent)
  const byStatus = Object.fromEntries(VALID_LOCAL_STATUSES.map((status) => [status, 0]))
  for (const item of items) byStatus[item.localStatus] = (byStatus[item.localStatus] || 0) + 1
  const stats = {
    sources: sources.length,
    activeSources: sources.filter((source) => source.status === 'active').length,
    openIssues: sources.reduce((sum, source) => sum + source.openIssuesCount, 0),
    openPrs: sources.reduce((sum, source) => sum + source.openPrsCount, 0),
    items: items.length,
    byStatus,
    tokenConfigured: Boolean(process.env.GITHUB_SYNC_TOKEN || process.env.GITHUB_TOKEN),
  }
  return {
    status: 'ok',
    generatedAt: now(),
    projects,
    sources,
    items,
    events,
    stats,
  }
}

async function insertEvent(db, event) {
  await db
    .prepare(
      `INSERT INTO site_dev_sync_events
        (id, source_id, provider, status, message, item_count, started_at, finished_at, error_detail)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      event.id,
      event.sourceId || '',
      event.provider || '',
      event.status,
      event.message || '',
      event.itemCount || 0,
      event.startedAt,
      event.finishedAt || null,
      event.errorDetail || '',
    )
    .run()
}

async function upsertSource(db, body) {
  const provider = normalizeSlug(body?.provider)
  if (!VALID_PROVIDERS.includes(provider)) {
    return Response.json({ error: 'INVALID_PROVIDER' }, { status: 400 })
  }
  const projectId = normalizeSlug(body?.projectId)
  if (!projectId) return Response.json({ error: 'INVALID_PROJECT' }, { status: 400 })

  const project = await db.prepare('SELECT id FROM portfolio_projects WHERE id = ?').bind(projectId).first()
  if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })

  const status = VALID_SOURCE_STATUSES.includes(body?.status) ? body.status : 'active'
  const source = {
    provider,
    projectId,
    owner: '',
    repo: '',
    npmPackage: '',
  }

  if (provider === 'github') {
    source.owner = normalizeSlug(body?.owner)
    source.repo = normalizeSlug(body?.repo)
    if (!source.owner || !source.repo) return Response.json({ error: 'INVALID_REPO' }, { status: 400 })
  } else {
    source.npmPackage = normalizeSlug(body?.npmPackage)
    if (!source.npmPackage) return Response.json({ error: 'INVALID_NPM_PACKAGE' }, { status: 400 })
  }

  const id = sourceIdFor(source)
  const displayName =
    normalizeSlug(body?.displayName) ||
    (provider === 'github' ? `${source.owner}/${source.repo}` : source.npmPackage)
  const repoUrl =
    provider === 'github'
      ? `https://github.com/${source.owner}/${source.repo}`
      : `https://www.npmjs.com/package/${encodeURIComponent(source.npmPackage)}`
  const t = now()
  await db
    .prepare(
      `INSERT INTO site_dev_sources
        (id, project_id, provider, owner, repo, npm_package, display_name, status, repo_url, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)
       ON CONFLICT(id) DO UPDATE SET
         project_id = excluded.project_id,
         display_name = excluded.display_name,
         status = excluded.status,
         repo_url = excluded.repo_url,
         updated_at = excluded.updated_at`,
    )
    .bind(id, projectId, provider, source.owner, source.repo, source.npmPackage, displayName, status, repoUrl, t)
    .run()
  const row = await db.prepare('SELECT * FROM site_dev_sources WHERE id = ?').bind(id).first()
  return Response.json({ ok: true, source: rowToSource(row) })
}

async function fetchJson(url, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': '2aran-site-dev-manager',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.message || `HTTP_${res.status}`
    throw new Error(message)
  }
  return data
}

function itemExcerpt(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 260)
}

async function upsertWorkItem(db, source, item) {
  const t = now()
  await db
    .prepare(
      `INSERT INTO site_dev_work_items
        (id, source_id, project_id, provider, type, external_id, number, title, body_excerpt, state,
         local_status, priority, author, labels_json, url, milestone, external_created_at,
         external_updated_at, external_closed_at, synced_at, raw_json, created_at, updated_at)
       VALUES
        (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
         'inbox', 'normal', ?11, ?12, ?13, ?14, ?15,
         ?16, ?17, ?18, ?19, ?20, ?20)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         body_excerpt = excluded.body_excerpt,
         state = excluded.state,
         author = excluded.author,
         labels_json = excluded.labels_json,
         url = excluded.url,
         milestone = excluded.milestone,
         external_updated_at = excluded.external_updated_at,
         external_closed_at = excluded.external_closed_at,
         synced_at = excluded.synced_at,
         raw_json = excluded.raw_json,
         updated_at = excluded.updated_at`,
    )
    .bind(
      item.id,
      source.id,
      source.project_id,
      source.provider,
      item.type,
      item.externalId,
      item.number,
      item.title,
      item.bodyExcerpt,
      item.state,
      item.author,
      JSON.stringify(item.labels || []),
      item.url,
      item.milestone || '',
      item.externalCreatedAt,
      item.externalUpdatedAt,
      item.externalClosedAt,
      t,
      JSON.stringify(item.raw || {}),
      t,
    )
    .run()
}

async function syncGitHubSource(db, source) {
  const token = process.env.GITHUB_SYNC_TOKEN || process.env.GITHUB_TOKEN || ''
  const base = `https://api.github.com/repos/${source.owner}/${source.repo}`
  const [repo, issues, prs, releases] = await Promise.all([
    fetchJson(base, token),
    fetchJson(`${base}/issues?state=open&per_page=80`, token),
    fetchJson(`${base}/pulls?state=open&per_page=80`, token),
    fetchJson(`${base}/releases?per_page=1`, token).catch(() => []),
  ])
  let count = 0
  const prNumbers = new Set((prs || []).map((pr) => pr.number))
  for (const issue of issues || []) {
    const isPr = Boolean(issue.pull_request) || prNumbers.has(issue.number)
    const type = isPr ? 'pr' : 'issue'
    await upsertWorkItem(db, source, {
      id: `${source.id}:${type}:${issue.number}`,
      type,
      externalId: String(issue.id || issue.number),
      number: issue.number,
      title: issue.title || '(untitled)',
      bodyExcerpt: itemExcerpt(issue.body),
      state: issue.state || 'open',
      author: issue.user?.login || '',
      labels: (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean),
      url: issue.html_url || '',
      milestone: issue.milestone?.title || '',
      externalCreatedAt: toMillis(issue.created_at),
      externalUpdatedAt: toMillis(issue.updated_at),
      externalClosedAt: toMillis(issue.closed_at),
      raw: issue,
    })
    count += 1
  }
  const latestRelease = Array.isArray(releases) ? releases[0] : null
  const t = now()
  await db
    .prepare(
      `UPDATE site_dev_sources
       SET display_name = COALESCE(NULLIF(display_name, ''), ?2),
           repo_url = ?3,
           latest_version = ?4,
           latest_version_at = ?5,
           open_issues_count = ?6,
           open_prs_count = ?7,
           last_synced_at = ?8,
           last_sync_status = 'ok',
           last_sync_error = '',
           updated_at = ?8
       WHERE id = ?1`,
    )
    .bind(
      source.id,
      repo.full_name || `${source.owner}/${source.repo}`,
      repo.html_url || `https://github.com/${source.owner}/${source.repo}`,
      latestRelease?.tag_name || '',
      toMillis(latestRelease?.published_at),
      Math.max(0, Number(repo.open_issues_count || 0) - (prs || []).length),
      (prs || []).length,
      t,
    )
    .run()
  return count
}

async function syncNpmSource(db, source) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(source.npm_package)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
  const latestVersion = data?.['dist-tags']?.latest || ''
  const latestAt = toMillis(data?.time?.[latestVersion])
  const t = now()
  await db
    .prepare(
      `UPDATE site_dev_sources
       SET display_name = COALESCE(NULLIF(display_name, ''), ?2),
           repo_url = ?3,
           latest_version = ?4,
           latest_version_at = ?5,
           last_synced_at = ?6,
           last_sync_status = 'ok',
           last_sync_error = '',
           updated_at = ?6
       WHERE id = ?1`,
    )
    .bind(source.id, data?.name || source.npm_package, `https://www.npmjs.com/package/${encodeURIComponent(source.npm_package)}`, latestVersion, latestAt, t)
    .run()
  return 0
}

async function syncSources(db, sourceId = '') {
  await ensureTables(db)
  const query = sourceId
    ? db.prepare('SELECT * FROM site_dev_sources WHERE id = ? AND status = ?').bind(sourceId, 'active')
    : db.prepare('SELECT * FROM site_dev_sources WHERE status = ? ORDER BY updated_at DESC').bind('active')
  const rows = sourceId ? [await query.first()].filter(Boolean) : (await query.all()).results || []
  let total = 0
  for (const source of rows) {
    const startedAt = now()
    const event = {
      id: `${startedAt}:${source.id}`,
      sourceId: source.id,
      provider: source.provider,
      status: 'ok',
      message: '同步完成',
      itemCount: 0,
      startedAt,
      finishedAt: now(),
      errorDetail: '',
    }
    try {
      const itemCount = source.provider === 'github'
        ? await syncGitHubSource(db, source)
        : await syncNpmSource(db, source)
      event.itemCount = itemCount
      event.finishedAt = now()
      total += itemCount
    } catch (error) {
      const message = String(error?.message || error)
      event.status = 'failed'
      event.message = '同步失败'
      event.errorDetail = message
      event.finishedAt = now()
      await db
        .prepare(
          `UPDATE site_dev_sources
           SET last_synced_at = ?2,
               last_sync_status = 'failed',
               last_sync_error = ?3,
               updated_at = ?2
           WHERE id = ?1`,
        )
        .bind(source.id, event.finishedAt, message.slice(0, 500))
        .run()
    }
    await insertEvent(db, event)
  }
  return { syncedSources: rows.length, itemCount: total }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: now(),
      message: '当前运行环境没有 D1 绑定，本站开发管理不可用。',
      projects: [],
      sources: [],
      items: [],
      events: [],
      stats: {},
    })
  }

  try {
    const itemId = new URL(req.url).searchParams.get('itemId')?.trim()
    if (itemId) {
      await ensureTables(db)
      const row = await db.prepare('SELECT * FROM site_dev_work_items WHERE id = ?').bind(itemId).first()
      if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
      return Response.json({ item: rowToWorkItemDetail(row) })
    }
    return Response.json(await readDashboard(db))
  } catch (error) {
    return Response.json(
      { error: 'SITE_DEV_READ_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  await ensureTables(db)

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (body?.action === 'upsert-source') return upsertSource(db, body)
  if (body?.action === 'sync') {
    const result = await syncSources(db, normalizeSlug(body?.sourceId))
    return Response.json({ ok: true, ...result })
  }
  return Response.json({ error: 'INVALID_ACTION' }, { status: 400 })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  await ensureTables(db)

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const id = normalizeSlug(body?.id)
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  const sets = []
  const binds = []
  if (body?.localStatus != null) {
    if (!VALID_LOCAL_STATUSES.includes(body.localStatus)) return Response.json({ error: 'INVALID_STATUS' }, { status: 400 })
    sets.push('local_status = ?')
    binds.push(body.localStatus)
  }
  if (body?.priority != null) {
    if (!VALID_PRIORITIES.includes(body.priority)) return Response.json({ error: 'INVALID_PRIORITY' }, { status: 400 })
    sets.push('priority = ?')
    binds.push(body.priority)
  }
  if (body?.note != null) {
    sets.push('note = ?')
    binds.push(String(body.note).slice(0, 2000))
  }
  if (!sets.length) return Response.json({ error: 'NO_FIELDS' }, { status: 400 })

  sets.push('updated_at = ?')
  binds.push(now(), id)

  const result = await db
    .prepare(`UPDATE site_dev_work_items SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...binds)
    .run()
  if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  const row = await db.prepare('SELECT * FROM site_dev_work_items WHERE id = ?').bind(id).first()
  return Response.json({ ok: true, item: rowToWorkItem(row) })
}

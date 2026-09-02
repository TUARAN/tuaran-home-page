export const EXPECTED_D1_TABLES = [
  { name: 'stomps', label: '踩踏留言', group: '互动', description: '首页/站内轻互动记录' },
  { name: 'dad_todo_completions', label: '奶爸待办', group: '私域', description: '家庭待办按日完成记录' },
  { name: 'short_links', label: '短链', group: '工具', description: '自建短链接记录' },
  { name: 'dishes', label: '吃什么菜品', group: '工具', description: 'Eatwhat 菜品清单' },
  { name: 'voice_tasks', label: '语音任务', group: '私域', description: '语音记事任务池' },
  { name: 'research_pv', label: '调研 PV', group: '内容', description: '调研文章累计阅读计数' },
  { name: 'research_pv_hits', label: '调研 PV 去重', group: '内容', description: '阅读计数去重窗口' },
  { name: 'article_comments', label: '文章评论', group: '互动', description: '文章页评论' },
  { name: 'private_records', label: '软贴空间 · 长期档案', group: '私域', description: '端到端加密的 Notion 备份整理记录' },
  { name: 'email_users', label: '邮箱用户', group: '账号', description: '邮箱登录用户' },
  { name: 'email_verification_codes', label: '邮箱验证码', group: '账号', description: '验证码发送与验证记录' },
  { name: 'nav_overrides', label: '菜单覆盖', group: '后台', description: '菜单权限管理覆盖项' },
  { name: 'api_rate_limits', label: '接口限流', group: '安全', description: '公开写接口限流窗口' },
  { name: 'shared_notes', label: '加密分享', group: '私域', description: '后台明文管理，公开链接加密分享' },
  { name: 'private_documents', label: '私密文档', group: '私域', description: '站长鉴权与 AES-GCM 口令加密文档' },
  { name: 'article_likes', label: '文章点赞', group: '互动', description: '普通文章与分析详情页的点赞计数' },
  { name: 'engagement_bots', label: '路过读者人设', group: '互动', description: '前台显示为路过的互动账号' },
  { name: 'engagement_bot_runs', label: '路过互动运行', group: '互动', description: '定时 / 手动运行摘要' },
  { name: 'engagement_bot_actions', label: '路过互动记录', group: '互动', description: '点赞与评论动作台账' },
  { name: 'blogger_eye_runs', label: '小眼睛定时检查', group: '后台', description: '多出口网站检查运行记录' },
  { name: 'blogger_eye_scheduler_state', label: '小眼睛轮换状态', group: '后台', description: 'Runner 轮换游标与最近出口' },
  { name: 'guest_directory', label: '游客目录汇总', group: '账号', description: '游客分页目录的增量物化数据' },
  { name: 'guest_stats', label: '游客全局统计', group: '账号', description: '游客后台总览的单行物化汇总' },
  { name: 'newsletter_subscribers', label: 'Newsletter 订阅', group: '运营', description: '邮件订阅用户池' },
  { name: 'rss_feeds', label: 'RSS 订阅墙', group: '内容', description: '公开 RSS 订阅墙条目' },
  { name: 'rss_hits', label: 'RSS 请求记录', group: '内容', description: '本站 /rss.xml 请求统计' },
  { name: 'site_dev_sources', label: '开发来源', group: '项目', description: 'GitHub / npm 项目来源绑定' },
  { name: 'site_dev_work_items', label: '开发待办', group: '项目', description: 'Issue / PR / 本地开发工作项' },
  { name: 'site_dev_sync_events', label: '开发同步日志', group: '项目', description: 'GitHub / npm 同步记录' },
  { name: 'site_settings', label: '站点设置', group: '后台', description: '广告、第三方脚本与功能开关' },
  { name: 'digital_human_jobs', label: '数字人口播', group: '工具', description: '照片口播异步生成任务' },
]

const EXPECTED_BY_NAME = new Map(EXPECTED_D1_TABLES.map((table) => [table.name, table]))
const RECENT_COLUMN_PRIORITY = [
  'updated_at',
  'last_synced_at',
  'created_at',
  'last_viewed_at',
  'completed_at',
  'voided_at',
  'email_verified_at',
  'expires_at',
  'check_date',
]

function quoteIdentifier(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`)
  }
  return `"${name}"`
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}

async function all(db, sql, binds = []) {
  const stmt = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql)
  return rows(await stmt.all())
}

async function first(db, sql, binds = []) {
  const stmt = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql)
  return (await stmt.first()) || null
}

function normalizeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

async function getTableColumns(db, tableName) {
  try {
    return await all(db, `PRAGMA table_info(${quoteIdentifier(tableName)})`)
  } catch {
    return []
  }
}

async function getTableIndexesCount(db, tableName) {
  try {
    const row = await first(
      db,
      `SELECT COUNT(*) AS value
       FROM sqlite_master
       WHERE type = 'index'
         AND tbl_name = ?1
         AND name NOT LIKE 'sqlite_autoindex%'`,
      [tableName]
    )
    return normalizeNumber(row?.value)
  } catch {
    return null
  }
}

async function getRecentValue(db, tableName, columns) {
  const columnNames = new Set(columns.map((column) => String(column.name || '')))
  const recentColumn = RECENT_COLUMN_PRIORITY.find((column) => columnNames.has(column))
  if (!recentColumn) return { recentColumn: null, recentValue: null }

  try {
    const row = await first(
      db,
      `SELECT MAX(${quoteIdentifier(recentColumn)}) AS value FROM ${quoteIdentifier(tableName)}`
    )
    return { recentColumn, recentValue: row?.value ?? null }
  } catch {
    return { recentColumn, recentValue: null }
  }
}

async function getApproxTextBytes(db, tableName, columns) {
  const textColumns = columns
    .filter((column) => /TEXT|CHAR|CLOB|VARCHAR/i.test(String(column.type || '')))
    .map((column) => column.name)
    .filter(Boolean)

  if (textColumns.length === 0) return 0

  try {
    const expression = textColumns
      .map((column) => `COALESCE(LENGTH(${quoteIdentifier(column)}), 0)`)
      .join(' + ')
    const row = await first(db, `SELECT SUM(${expression}) AS value FROM ${quoteIdentifier(tableName)}`)
    return normalizeNumber(row?.value)
  } catch {
    return null
  }
}

/**
 * 轻量 D1 状态：只回「连没连上 + 表数量」，用于 Dashboard 总览这类不需要逐表体检的场景。
 */
export async function getD1QuickStatus(db) {
  try {
    const row = await first(
      db,
      `SELECT COUNT(*) AS value
       FROM sqlite_master
       WHERE type = 'table'
         AND name NOT LIKE 'sqlite_%'`
    )
    return { status: 'connected', tableCount: normalizeNumber(row?.value) }
  } catch {
    return { status: 'error', tableCount: null }
  }
}

export async function getD1AdminSnapshot(db) {
  const tableRows = await all(
    db,
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name NOT LIKE 'sqlite_%'
     ORDER BY name`
  )
  const tableNames = tableRows.map((row) => String(row.name || '')).filter(Boolean)
  const tableNameSet = new Set(tableNames)

  const tables = tableNames.map((tableName) => {
    const meta = EXPECTED_BY_NAME.get(tableName)
    return {
      name: tableName,
      label: meta?.label || tableName,
      group: meta?.group || '未归类',
      description: meta?.description || '数据库中存在，但不在当前迁移清单里',
      expected: Boolean(meta),
    }
  })

  const missingTables = EXPECTED_D1_TABLES.filter((table) => !tableNameSet.has(table.name)).map((table) => table.name)
  const extraTables = tableNames.filter((name) => !EXPECTED_BY_NAME.has(name))

  return {
    status: 'connected',
    generatedAt: Date.now(),
    expectedTables: EXPECTED_D1_TABLES.length,
    tableCount: tableNames.length,
    missingTables,
    extraTables,
    tables,
  }
}

export async function getD1TableDetail(db, tableName) {
  const name = String(tableName || '').trim()
  quoteIdentifier(name)
  const exists = await first(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1 AND name NOT LIKE 'sqlite_%'`,
    [name]
  )
  if (!exists) return null

  const meta = EXPECTED_BY_NAME.get(name)
  const columns = await getTableColumns(db, name)
  let rowCount = null
  try {
    const countRow = await first(db, `SELECT COUNT(*) AS value FROM ${quoteIdentifier(name)}`)
    rowCount = normalizeNumber(countRow?.value)
  } catch {
    rowCount = null
  }
  const [{ recentColumn, recentValue }, indexesCount, approxTextBytes] = await Promise.all([
    getRecentValue(db, name, columns),
    getTableIndexesCount(db, name),
    getApproxTextBytes(db, name, columns),
  ])

  return {
    name,
    label: meta?.label || name,
    group: meta?.group || '未归类',
    description: meta?.description || '数据库中存在，但不在当前迁移清单里',
    expected: Boolean(meta),
    rowCount,
    columnsCount: columns.length,
    indexesCount,
    approxTextBytes,
    recentColumn,
    recentValue,
    columns: columns.map((column) => ({
      name: String(column.name || ''),
      type: String(column.type || ''),
      required: Boolean(column.notnull),
      primaryKey: Boolean(column.pk),
    })),
  }
}

export const EXPECTED_D1_TABLES = [
  { name: 'stomps', label: '踩踏留言', group: '互动', description: '首页/站内轻互动记录' },
  { name: 'dad_todo_completions', label: '奶爸待办', group: '私域', description: '家庭待办按日完成记录' },
  { name: 'short_links', label: '短链', group: '工具', description: '自建短链接记录' },
  { name: 'dishes', label: '吃什么菜品', group: '工具', description: 'Eatwhat 菜品清单' },
  { name: 'voice_tasks', label: '语音任务', group: '私域', description: '语音记事任务池' },
  { name: 'research_pv', label: '调研 PV', group: '内容', description: '调研文章累计阅读计数' },
  { name: 'research_pv_hits', label: '调研 PV 去重', group: '内容', description: '阅读计数去重窗口' },
  { name: 'article_comments', label: '文章评论', group: '互动', description: '文章页评论' },
  { name: 'private_records', label: '长期罗盘', group: '私域', description: '端到端加密私域记录' },
  { name: 'email_users', label: '邮箱用户', group: '账号', description: '邮箱登录用户' },
  { name: 'email_verification_codes', label: '邮箱验证码', group: '账号', description: '验证码发送与验证记录' },
  { name: 'nav_overrides', label: '菜单覆盖', group: '后台', description: '菜单权限管理覆盖项' },
  { name: 'api_rate_limits', label: '接口限流', group: '安全', description: '公开写接口限流窗口' },
  { name: 'shared_notes', label: '加密分享', group: '私域', description: '端到端加密分享链接' },
  { name: 'article_likes', label: '文章点赞', group: '互动', description: '文章页 / 调研页的点赞计数' },
  { name: 'newsletter_subscribers', label: 'Newsletter 订阅', group: '运营', description: '邮件订阅用户池' },
  { name: 'rss_feeds', label: 'RSS 订阅墙', group: '内容', description: '公开 RSS 订阅墙条目' },
  { name: 'rss_hits', label: 'RSS 请求记录', group: '内容', description: '本站 /rss.xml 请求统计' },
]

const EXPECTED_BY_NAME = new Map(EXPECTED_D1_TABLES.map((table) => [table.name, table]))
const RECENT_COLUMN_PRIORITY = [
  'updated_at',
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

async function getBusinessSummaries(db, tableNames) {
  const has = (name) => tableNames.has(name)
  const summaries = []

  if (has('research_pv')) {
    try {
      const row = await first(db, 'SELECT COUNT(*) AS tracked, COALESCE(SUM(pv), 0) AS totalPv FROM research_pv')
      summaries.push({
        key: 'research-pv',
        label: '调研阅读',
        value: normalizeNumber(row?.totalPv),
        unit: 'PV',
        hint: `${normalizeNumber(row?.tracked)} 篇调研有计数`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('article_comments')) {
    try {
      const row = await first(
        db,
        'SELECT COUNT(*) AS total, COUNT(DISTINCT article_key) AS articles FROM article_comments'
      )
      summaries.push({
        key: 'comments',
        label: '文章评论',
        value: normalizeNumber(row?.total),
        unit: '条',
        hint: `${normalizeNumber(row?.articles)} 篇文章有评论`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('article_likes')) {
    try {
      const row = await first(
        db,
        'SELECT COUNT(*) AS total, COUNT(DISTINCT article_key) AS articles FROM article_likes'
      )
      summaries.push({
        key: 'article-likes',
        label: '文章点赞',
        value: normalizeNumber(row?.total),
        unit: '个',
        hint: `${normalizeNumber(row?.articles)} 篇文章有点赞`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('newsletter_subscribers')) {
    try {
      const row = await first(
        db,
        "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active FROM newsletter_subscribers"
      )
      summaries.push({
        key: 'newsletter',
        label: 'Newsletter',
        value: normalizeNumber(row?.active),
        unit: '人',
        hint: `${normalizeNumber(row?.total)} 条订阅记录`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('short_links')) {
    try {
      const row = await first(db, 'SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS users FROM short_links')
      summaries.push({
        key: 'short-links',
        label: '短链',
        value: normalizeNumber(row?.total),
        unit: '条',
        hint: `${normalizeNumber(row?.users)} 个账号创建过`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('shared_notes')) {
    try {
      const now = Date.now()
      const row = await first(
        db,
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < ?1 THEN 1 ELSE 0 END) AS expired,
                COALESCE(SUM(view_count), 0) AS views
         FROM shared_notes`,
        [now]
      )
      summaries.push({
        key: 'shared-notes',
        label: '加密分享',
        value: normalizeNumber(row?.total),
        unit: '条',
        hint: `${normalizeNumber(row?.expired)} 条已过期 · ${normalizeNumber(row?.views)} 次查看`,
      })
    } catch {
      /* ignore */
    }
  }

  if (has('voice_tasks')) {
    try {
      const grouped = await all(db, 'SELECT status, COUNT(*) AS total FROM voice_tasks GROUP BY status')
      const total = grouped.reduce((sum, row) => sum + normalizeNumber(row.total), 0)
      const hint = grouped.map((row) => `${row.status}:${normalizeNumber(row.total)}`).join(' · ')
      summaries.push({
        key: 'voice-tasks',
        label: '语音任务',
        value: total,
        unit: '条',
        hint: hint || '暂无状态分布',
      })
    } catch {
      /* ignore */
    }
  }

  return summaries
}

/**
 * 轻量 D1 状态：只回「连没连上 + 表数量」，用于 Dashboard 总览这类不需要逐表体检的场景。
 * 整库逐表 COUNT / SUM(LENGTH) / PRAGMA 的全量体检见 getD1AdminSnapshot（成本高，留给数据库状态页）。
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

  // 逐表 introspect：原来 N 张表 × 每表 ~5 个查询全部串行（30+ 表 = 150+ 次串行往返）。
  // 改成表之间并行、表内仍按依赖顺序（先取列，再统计），峰值并发约等于表数；业务汇总同时并行。
  async function describeTable(tableName) {
    const meta = EXPECTED_BY_NAME.get(tableName)
    const columns = await getTableColumns(db, tableName)
    let rowCount = null
    try {
      const countRow = await first(db, `SELECT COUNT(*) AS value FROM ${quoteIdentifier(tableName)}`)
      rowCount = normalizeNumber(countRow?.value)
    } catch {
      rowCount = null
    }

    const { recentColumn, recentValue } = await getRecentValue(db, tableName, columns)
    const indexesCount = await getTableIndexesCount(db, tableName)
    const approxTextBytes = await getApproxTextBytes(db, tableName, columns)

    return {
      name: tableName,
      label: meta?.label || tableName,
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

  const [tables, summaries] = await Promise.all([
    Promise.all(tableNames.map(describeTable)),
    getBusinessSummaries(db, tableNameSet),
  ])

  const missingTables = EXPECTED_D1_TABLES.filter((table) => !tableNameSet.has(table.name)).map((table) => table.name)
  const extraTables = tableNames.filter((name) => !EXPECTED_BY_NAME.has(name))
  const totalRows = tables.reduce((sum, table) => sum + (typeof table.rowCount === 'number' ? table.rowCount : 0), 0)
  const approxTextBytes = tables.reduce(
    (sum, table) => sum + (typeof table.approxTextBytes === 'number' ? table.approxTextBytes : 0),
    0
  )

  return {
    status: 'connected',
    generatedAt: Date.now(),
    expectedTables: EXPECTED_D1_TABLES.length,
    tableCount: tableNames.length,
    totalRows,
    approxTextBytes,
    missingTables,
    extraTables,
    summaries,
    tables,
  }
}

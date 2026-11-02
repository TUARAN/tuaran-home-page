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
  { name: 'engagement_bot_runs', label: '站内互动运行', group: '互动', description: '定时 / 手动运行摘要' },
  { name: 'engagement_bot_actions', label: '站内互动记录', group: '互动', description: '点赞与评论动作台账' },
  { name: 'blogger_eye_runs', label: '小眼睛定时检查', group: '后台', description: '多出口网站检查运行记录' },
  { name: 'blogger_eye_scheduler_state', label: '小眼睛轮换状态', group: '后台', description: 'Runner 轮换游标与最近出口' },
  { name: 'guest_directory', label: '游客目录汇总', group: '账号', description: '游客分页目录的增量物化数据' },
  { name: 'guest_stats', label: '游客全局统计', group: '账号', description: '游客后台总览的单行物化汇总' },
  { name: 'newsletter_subscribers', label: 'Newsletter 订阅', group: '运营', description: '邮件订阅用户池' },
  { name: 'rss_feeds', label: 'RSS 订阅墙', group: '内容', description: '公开 RSS 订阅墙条目' },
  { name: 'rss_feed_cursors', label: 'RSS 更新游标', group: '内容', description: '订阅源最近条目，用于站长更新通知' },
  { name: 'rss_hits', label: 'RSS 请求记录', group: '内容', description: '本站 /rss.xml 请求统计' },
  { name: 'site_dev_sources', label: '开发来源', group: '项目', description: 'GitHub / npm 项目来源绑定' },
  { name: 'site_dev_work_items', label: '开发待办', group: '项目', description: 'Issue / PR / 本地开发工作项' },
  { name: 'site_dev_sync_events', label: '开发同步日志', group: '项目', description: 'GitHub / npm 同步记录' },
  { name: 'site_settings', label: '站点设置', group: '后台', description: '广告、第三方脚本与功能开关' },
  { name: 'digital_human_jobs', label: '数字人口播', group: '工具', description: '照片口播异步生成任务' },
  { name: 'a_share_drafts', label: 'A 股调研草稿', group: '内容', description: '公司调研正文、生成状态、失败原因与发布记录' },
  { name: 'a_share_pool', label: 'A 股公司池', group: '内容', description: '候选公司的代码、名称、交易所与板块' },
  { name: 'a_share_pool_snapshot', label: 'A 股公司池快照', group: '内容', description: '公司池快照日期、数量与生成时间' },
  { name: 'a_share_run_log', label: 'A 股调研运行日志', group: '后台', description: '选题、生成及发布任务的执行结果与错误' },
  { name: 'a_share_selections', label: 'A 股调研选题', group: '内容', description: '公司选题进度、关联草稿与完成记录' },
  { name: 'account_identities', label: '登录身份绑定', group: '账号', description: 'OAuth 提供方身份与站内用户的绑定关系' },
  { name: 'article_posts', label: '在线文章', group: '内容', description: '后台编辑的文章正文、版本及发布状态' },
  { name: 'bookmark_nav_imports', label: '书签导入批次', group: '工具', description: '书签导入来源、去重统计与激活状态' },
  { name: 'bookmark_nav_items', label: '书签导航条目', group: '工具', description: '导入书签的链接、目录、分类与风险标记' },
  { name: 'checkin_makeup_card_ledger', label: '补签卡流水', group: '互动', description: '用户补签卡的获得、消耗与关联业务记录' },
  { name: 'checkin_makeups', label: '补签记录', group: '互动', description: '用户补签日期及对应卡片消耗流水' },
  { name: 'comment_notifications', label: '评论回复通知', group: '互动', description: '评论回复的接收人、摘要与已读状态' },
  { name: 'community_action_daily_counts', label: '社区动作日统计', group: '运营', description: '按平台、日期、任务及结果汇总的动作计数' },
  { name: 'community_action_devices', label: '社区插件设备', group: '运营', description: '插件设备、平台、账号与最近心跳' },
  { name: 'community_action_events', label: '社区动作回执', group: '运营', description: '插件上报的动作结果、目标与错误记录' },
  { name: 'content_documents', label: '调研文档快照', group: '内容', description: '调研正文、元数据、来源文件与版本快照' },
  { name: 'content_index', label: '统一内容索引', group: '内容', description: '文章、调研与资源的公开元数据和访问地址' },
  { name: 'content_ledger_cost_events', label: '内容存证成本', group: '内容', description: '链上发布交易的 Gas、成本与重试信息' },
  { name: 'content_ledger_publish_attempts', label: '内容存证发布记录', group: '内容', description: '存证批次的链上发布状态、交易与错误' },
  { name: 'content_proof_batches', label: '内容存证批次', group: '内容', description: 'Merkle 批次根、清单及链上锚定信息' },
  { name: 'content_proofs', label: '内容存证索引', group: '内容', description: '内容版本哈希、签名证明与 Merkle 路径' },
  { name: 'content_replicas', label: '内容副本索引', group: '内容', description: 'IPFS 副本、固定服务、网关及验证状态' },
  { name: 'content_routes', label: '内容路由映射', group: '内容', description: '公开访问路径与统一内容标识的对应关系' },
  { name: 'crypto_drafts', label: '加密资产调研草稿', group: '内容', description: '资产调研正文、生成状态与发布记录' },
  { name: 'crypto_pool_snapshot', label: '加密资产池快照', group: '内容', description: '市值候选池的内容、数量与快照日期' },
  { name: 'crypto_run_log', label: '加密资产调研日志', group: '后台', description: '选题、生成及发布任务的结果与错误' },
  { name: 'crypto_selections', label: '加密资产调研选题', group: '内容', description: '候选资产的选题进度与关联草稿' },
  { name: 'deepseek_keys', label: 'DeepSeek 密钥', group: '安全', description: '加密保存的调用密钥、掩码与使用统计' },
  { name: 'deepseek_tasks', label: '模型调用任务', group: '后台', description: '调用摘要、模型、Token 用量、耗时与错误' },
  { name: 'famous_quotes', label: '名言库', group: '内容', description: '名言原文、作者、出处与启用排序' },
  { name: 'festival_banners', label: '节日横幅', group: '运营', description: '节日展示时间、文案、图片与主题配置' },
  { name: 'gated_resources', label: '资源权益配置', group: '运营', description: '资源燃币价格与最低访问角色' },
  { name: 'guest_bindings', label: '游客账号绑定', group: '账号', description: '游客身份与登录用户的归属关系' },
  { name: 'hosted_images', label: '用户图床', group: '工具', description: '用户上传图片的 R2 对象及文件元数据' },
  { name: 'integration_credentials', label: '集成服务凭证', group: '安全', description: '外部服务加密凭证、环境变量引用与使用记录' },
  { name: 'llm_providers', label: '模型服务配置', group: '后台', description: '模型服务地址、默认模型、加密认证与健康状态' },
  { name: 'login_credentials', label: '站内登录凭证', group: '安全', description: '登录凭证的派生哈希、有效期与停用状态' },
  { name: 'morning_greeting_templates', label: '早安文案模板', group: '运营', description: '自动发布的早安文案、启用状态与排序' },
  { name: 'nsfw_media', label: '私有成人媒体', group: '私域', description: '私有媒体对象元数据，文件由鉴权接口读取' },
  { name: 'oauth_access_tokens', label: 'OAuth 访问令牌', group: '安全', description: '委托访问令牌的授权范围、有效期与撤销状态' },
  { name: 'oauth_audit_events', label: 'OAuth 审计事件', group: '安全', description: '委托授权与令牌相关的安全审计记录' },
  { name: 'oauth_authorization_codes', label: 'OAuth 授权码', group: '安全', description: '授权码、PKCE 校验信息与使用状态' },
  { name: 'oauth_clients', label: 'OAuth 客户端', group: '安全', description: '委托访问客户端及其回调地址登记' },
  { name: 'oauth_consents', label: 'OAuth 用户授权', group: '安全', description: '用户对客户端授权范围的同意记录' },
  { name: 'oauth_refresh_tokens', label: 'OAuth 刷新令牌', group: '安全', description: '刷新令牌的有效期、轮换及撤销记录' },
  { name: 'planning_decisions', label: '规划决策', group: '项目', description: '规划过程的决策内容与关联项目' },
  { name: 'planning_dependencies', label: '规划依赖', group: '项目', description: '规划工作项之间的前置依赖关系' },
  { name: 'planning_directions', label: '规划方向', group: '项目', description: '规划中心的长期方向与状态' },
  { name: 'planning_events', label: '规划事件', group: '项目', description: '规划中心的事件与进展记录' },
  { name: 'planning_milestones', label: '项目里程碑', group: '项目', description: '项目阶段目标、时间与完成状态' },
  { name: 'planning_project_profiles', label: '项目规划档案', group: '项目', description: '项目规划属性及方向关联' },
  { name: 'planning_tasks', label: '规划任务', group: '项目', description: '规划中心任务、进度与时间安排' },
  { name: 'planning_work_items', label: '站长私有工作项', group: '私域', description: '站长个人工作清单，与公开项目台账分开' },
  { name: 'platform_accounts', label: '平台账号', group: '账号', description: '站内平台账号档案与身份归属' },
  { name: 'point_ledger', label: '燃币收支账本', group: '运营', description: '用户燃币增减的历史流水与业务引用' },
  { name: 'portfolio_projects', label: '公开项目台账', group: '项目', description: '项目展示资料与管理状态' },
  { name: 'private_document_files', label: '私密文档附件', group: '私域', description: '私密档案关联文件与存储对象元数据' },
  { name: 'private_document_notes', label: '私密文档笔记', group: '私域', description: '站长私密笔记正文与管理信息' },
  { name: 'private_information_records', label: '私密信息记录', group: '私域', description: '按用户归属保存的私密信息档案' },
  { name: 'public_opinion_meta', label: '舆情采集状态', group: '内容', description: '舆情采集的元信息与更新状态' },
  { name: 'public_opinion_posts', label: '舆情帖子', group: '内容', description: '采集的舆情来源帖子及分析数据' },
  { name: 'public_opinion_trends', label: '舆情趋势', group: '内容', description: '舆情话题趋势与汇总数据' },
  { name: 'publishing_checkins', label: '发文打卡', group: '互动', description: '用户按日期记录各平台发文与链接' },
  { name: 'ranbi_supply', label: '燃币总量配置', group: '运营', description: '固定发行总量、公开版本与升级时间' },
  { name: 'ranbi_system_accounts', label: '燃币系统账户', group: '运营', description: '系统储备池的额度、余额与可支出状态' },
  { name: 'ranbi_transfers', label: '燃币转账流水', group: '运营', description: '账户间转账金额、原因与业务引用' },
  { name: 'resource_events', label: '资源领取记录', group: '运营', description: '资源领取、打开等用户行为事实' },
  { name: 'resource_unlocks', label: '资源解锁权益', group: '运营', description: '用户已解锁的资源与解锁时间' },
  { name: 'reward_items', label: '签到礼物', group: '运营', description: '可兑换礼物、燃币价格、库存与限额' },
  { name: 'reward_redemptions', label: '礼物兑换订单', group: '运营', description: '礼物兑换、收货信息与人工履约状态' },
  { name: 'site_presence', label: '在线访客心跳', group: '互动', description: '访客最近活跃时间，用于统计在线人数' },
  { name: 'site_users', label: '站内用户目录', group: '账号', description: '用户资料、角色与登录活动汇总' },
  { name: 'user_points', label: '用户燃币余额', group: '运营', description: '用户燃币当前余额的物化记录' },
  { name: 'wallpapers', label: '壁纸资源', group: '内容', description: '壁纸展示信息、R2 文件、尺寸与下载量' },
  { name: 'wc_assists', label: '世界杯助攻榜', group: '内容', description: '球员助攻数量与参赛统计' },
  { name: 'wc_cards', label: '世界杯红黄牌', group: '内容', description: '球员红黄牌类型与数量' },
  { name: 'wc_matches', label: '世界杯赛程比分', group: '内容', description: '比赛时间、球队、比赛状态与比分' },
  { name: 'wc_meta', label: '世界杯采集元数据', group: '内容', description: '赛事数据采集的状态与更新时间' },
  { name: 'wc_predictions', label: '世界杯竞猜', group: '互动', description: '用户比赛预测、结算结果与奖励状态' },
  { name: 'wc_scorers', label: '世界杯射手榜', group: '内容', description: '球员进球、点球及参赛统计' },
  { name: 'wc_standings', label: '世界杯积分榜', group: '内容', description: '球队分组、排名与积分统计' },
  { name: 'x_api_cost_events', label: 'X 发布成本', group: '运营', description: '确认发布成功的帖文及 API 成本流水' },
  { name: 'x_extension_commands', label: 'X 插件远程指令', group: '运营', description: '站长下发指令与插件领取、执行结果' },
  { name: 'x_extension_daily_reports', label: 'X 插件日报', group: '运营', description: '设备按日上报的成功动作汇总' },
  { name: 'x_extension_prompt_feedback', label: 'X 提示词反馈', group: '运营', description: '提示词好坏案例、评估及复核同步状态' },
  { name: 'x_extension_prompt_votes', label: 'X 素材评价', group: '运营', description: '账号对已发素材的赞踩与最新判断' },
  { name: 'x_extension_runtime', label: 'X 插件运行快照', group: '运营', description: '设备最近上报的流程阶段与任务状态' },
  { name: 'x_image_pool', label: 'X 配图素材池', group: '运营', description: '配图文件、生成模型、提示词与启用状态' },
  { name: 'x_post_assets', label: 'X 发帖素材', group: '运营', description: '按日期时段保存的文案、配图及发布状态' },
  { name: 'x_reply_person_invites', label: 'X 插件邀请', group: '运营', description: '个人邀请码、下载次数与首次设备绑定' },
  { name: 'x_reply_tasks', label: 'X 回复任务', group: '运营', description: '待人工审核的回复内容与发布结果' },
  // 平台维护表仅在实际存在时展示，不作为业务迁移必需项。
  { name: '_cf_KV', label: 'Cloudflare 内部键值', group: '系统', description: 'Cloudflare 平台维护的内部键值表，不由业务功能写入', optional: true },
  { name: 'd1_migrations', label: 'D1 迁移记录', group: '系统', description: 'Wrangler 已执行迁移文件与应用时间', optional: true },
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
    // Full-table SUM(LENGTH(...)) scans every row. Only run when explicitly requested.
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
      description: meta?.description || '尚未收录用途说明，可按需查看表结构',
      expected: Boolean(meta),
    }
  })

  const missingTables = EXPECTED_D1_TABLES.filter((table) => !table.optional && !tableNameSet.has(table.name)).map((table) => table.name)
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

export async function getD1TableDetail(db, tableName, { includeTextBytes = false } = {}) {
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
    // COUNT(*) still scans the table; keep it for single-table drill-in only.
    const countRow = await first(db, `SELECT COUNT(*) AS value FROM ${quoteIdentifier(name)}`)
    rowCount = normalizeNumber(countRow?.value)
  } catch {
    rowCount = null
  }
  const [{ recentColumn, recentValue }, indexesCount] = await Promise.all([
    getRecentValue(db, name, columns),
    getTableIndexesCount(db, name),
  ])
  const approxTextBytes = includeTextBytes ? await getApproxTextBytes(db, name, columns) : null

  return {
    name,
    label: meta?.label || name,
    group: meta?.group || '未归类',
    description: meta?.description || '尚未收录用途说明，可按需查看表结构',
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

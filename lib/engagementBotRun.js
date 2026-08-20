import { callDeepSeek } from './deepseek'
import {
  DEFAULT_ENGAGEMENT_BOTS,
  DEFAULT_ENGAGEMENT_BOT_SETTINGS,
  ENGAGEMENT_BOT_SEED_KEY,
  ENGAGEMENT_BOT_SEED_VERSION,
  ENGAGEMENT_BOT_SETTINGS_KEY,
  ENGAGEMENT_BOT_SOURCE,
  READER_PROVIDER,
  buildEngagementCommentMessages,
  filterPublishedContent,
  normalizeBotInput,
  normalizeEngagementBotSettings,
  pairKey,
  parseStoredEngagementBotSettings,
  planEngagementRun,
  readerUserId,
  readerVoterKey,
  rowToEngagementAction,
  rowToEngagementBot,
  rowToEngagementRun,
  sanitizeGeneratedComment,
  shouldSkipRun,
} from './engagementBot'

function first(result) {
  return result || null
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}

async function readSetting(db, key) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).first()
  return row?.value || ''
}

async function writeSetting(db, key, value, updatedBy) {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
    )
    .bind(key, String(value), Date.now(), updatedBy || 'engagement-bot')
    .run()
}

export async function ensureEngagementBotsSeeded(db) {
  const marker = await readSetting(db, ENGAGEMENT_BOT_SEED_KEY)
  if (marker) return
  const now = Date.now()
  const statements = DEFAULT_ENGAGEMENT_BOTS.map((bot) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO engagement_bots
         (slug, display_name, voice_prompt, enabled, created_at, updated_at)
         VALUES (?1, ?2, ?3, 1, ?4, ?5)`
      )
      .bind(bot.slug, bot.displayName, bot.voicePrompt, now, now)
  )
  statements.push(
    db
      .prepare(
        `INSERT OR REPLACE INTO site_settings (key, value, updated_at, updated_by)
         VALUES (?1, ?2, ?3, 'engagement-bot-seed')`
      )
      .bind(ENGAGEMENT_BOT_SEED_KEY, ENGAGEMENT_BOT_SEED_VERSION, now)
  )
  await db.batch(statements)
}

export async function getEngagementBotSettings(db) {
  const raw = await readSetting(db, ENGAGEMENT_BOT_SETTINGS_KEY)
  return parseStoredEngagementBotSettings(raw)
}

export async function saveEngagementBotSettings(db, input, updatedBy) {
  const settings = normalizeEngagementBotSettings(input)
  await writeSetting(db, ENGAGEMENT_BOT_SETTINGS_KEY, JSON.stringify(settings), updatedBy)
  return settings
}

export async function listEngagementBots(db) {
  await ensureEngagementBotsSeeded(db)
  const result = await db
    .prepare('SELECT * FROM engagement_bots ORDER BY id ASC')
    .all()
  return rows(result).map(rowToEngagementBot).filter(Boolean)
}

export async function createEngagementBot(db, input) {
  const parsed = normalizeBotInput(input)
  if (parsed.error) return parsed
  const now = Date.now()
  try {
    const row = await db
      .prepare(
        `INSERT INTO engagement_bots (slug, display_name, voice_prompt, enabled, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING *`
      )
      .bind(
        parsed.bot.slug,
        parsed.bot.displayName,
        parsed.bot.voicePrompt,
        parsed.bot.enabled ? 1 : 0,
        now,
        now
      )
      .first()
    return { bot: rowToEngagementBot(row) }
  } catch (error) {
    if (String(error?.message || error).toLowerCase().includes('unique')) {
      return { error: 'SLUG_TAKEN' }
    }
    throw error
  }
}

export async function updateEngagementBot(db, input) {
  const id = Number(input?.id)
  if (!Number.isInteger(id) || id <= 0) return { error: 'INVALID_ID' }
  const existing = await db.prepare('SELECT * FROM engagement_bots WHERE id = ?1').bind(id).first()
  if (!existing) return { error: 'NOT_FOUND' }
  const parsed = normalizeBotInput({
    slug: input.slug || existing.slug,
    displayName: input.displayName ?? existing.display_name,
    voicePrompt: input.voicePrompt ?? existing.voice_prompt,
    enabled: input.enabled == null ? existing.enabled : input.enabled,
  })
  if (parsed.error) return parsed
  const row = await db
    .prepare(
      `UPDATE engagement_bots
       SET display_name = ?2, voice_prompt = ?3, enabled = ?4, updated_at = ?5
       WHERE id = ?1
       RETURNING *`
    )
    .bind(
      id,
      parsed.bot.displayName,
      parsed.bot.voicePrompt,
      parsed.bot.enabled ? 1 : 0,
      Date.now()
    )
    .first()
  return { bot: rowToEngagementBot(row) }
}

export async function deleteEngagementBot(db, id) {
  const botId = Number(id)
  if (!Number.isInteger(botId) || botId <= 0) return { error: 'INVALID_ID' }
  const existing = await db.prepare('SELECT id FROM engagement_bots WHERE id = ?1').bind(botId).first()
  if (!existing) return { error: 'NOT_FOUND' }
  await db.prepare('DELETE FROM engagement_bots WHERE id = ?1').bind(botId).run()
  return { ok: true }
}

export async function listEngagementActions(db, { limit = 60, offset = 0 } = {}) {
  const result = await db
    .prepare(
      `SELECT * FROM engagement_bot_actions
       ORDER BY created_at DESC, id DESC
       LIMIT ?1 OFFSET ?2`
    )
    .bind(Math.max(1, Math.min(200, Number(limit) || 60)), Math.max(0, Number(offset) || 0))
    .all()
  return rows(result).map(rowToEngagementAction).filter(Boolean)
}

export async function listEngagementRuns(db, { limit = 20 } = {}) {
  const result = await db
    .prepare(
      `SELECT * FROM engagement_bot_runs
       ORDER BY started_at DESC, id DESC
       LIMIT ?1`
    )
    .bind(Math.max(1, Math.min(50, Number(limit) || 20)))
    .all()
  return rows(result).map(rowToEngagementRun).filter(Boolean)
}

async function listRecentPublishedContent(db, settings) {
  const result = await db
    .prepare(
      `SELECT content_key, title, summary, href, date, status
       FROM content_index
       WHERE status = 'published'
       ORDER BY date DESC, updated_at DESC
       LIMIT 400`
    )
    .all()
  return filterPublishedContent(
    rows(result).map((row) => ({
      contentKey: row.content_key,
      title: row.title,
      summary: row.summary,
      href: row.href,
      date: row.date,
      status: row.status,
    })),
    settings
  )
}

async function loadLikedPairs(db, bots) {
  const pairs = new Set()
  if (!bots.length) return pairs
  const keys = bots.map((bot) => readerVoterKey(bot.slug))
  const placeholders = keys.map((_, index) => `?${index + 1}`).join(', ')
  const result = await db
    .prepare(`SELECT article_key, voter_key FROM article_likes WHERE voter_key IN (${placeholders})`)
    .bind(...keys)
    .all()
  const voterToBot = new Map(bots.map((bot) => [readerVoterKey(bot.slug), bot.id]))
  for (const row of rows(result)) {
    const botId = voterToBot.get(row.voter_key)
    if (botId) pairs.add(pairKey(botId, row.article_key))
  }
  return pairs
}

async function loadRecentCommentPairs(db, bots, cooldownMs) {
  const pairs = new Set()
  if (!bots.length) return pairs
  const since = Date.now() - cooldownMs
  const userIds = bots.map((bot) => readerUserId(bot.slug))
  const placeholders = userIds.map((_, index) => `?${index + 2}`).join(', ')
  const result = await db
    .prepare(
      `SELECT article_key, user_id
       FROM article_comments
       WHERE created_at >= ?1 AND user_id IN (${placeholders})`
    )
    .bind(since, ...userIds)
    .all()
  const userToBot = new Map(bots.map((bot) => [readerUserId(bot.slug), bot.id]))
  for (const row of rows(result)) {
    const botId = userToBot.get(row.user_id)
    if (botId) pairs.add(pairKey(botId, row.article_key))
  }
  return pairs
}

async function insertAction(db, action) {
  await db
    .prepare(
      `INSERT INTO engagement_bot_actions
       (run_id, bot_id, bot_slug, bot_name, action_type, article_key, article_title,
        comment_id, message, deepseek_task_id, status, error, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    )
    .bind(
      action.runId,
      action.botId,
      action.botSlug,
      action.botName,
      action.actionType,
      action.articleKey || '',
      action.articleTitle || '',
      action.commentId || null,
      action.message || '',
      action.deepseekTaskId || null,
      action.status,
      action.error || '',
      action.createdAt || Date.now()
    )
    .run()
}

async function insertLike(db, bot, article) {
  const inserted = await db
    .prepare(
      `INSERT INTO article_likes (article_key, voter_key, user_id, created_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(article_key, voter_key) DO NOTHING
       RETURNING id`
    )
    .bind(article.contentKey, readerVoterKey(bot.slug), readerUserId(bot.slug), Date.now())
    .first()
  return Boolean(inserted?.id)
}

async function insertComment(db, bot, article, message) {
  const row = await db
    .prepare(
      `INSERT INTO article_comments
         (article_key, user_id, user_provider, user_name, user_image, message, reply_to_id, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7)
       RETURNING id, article_key, user_id, user_provider, user_name, message, created_at`
    )
    .bind(
      article.contentKey,
      readerUserId(bot.slug),
      READER_PROVIDER,
      bot.displayName,
      null,
      message,
      Date.now()
    )
    .first()
  return first(row)
}

async function generateComment({ env, bot, article, settings }) {
  const generation = await callDeepSeek({
    env,
    messages: buildEngagementCommentMessages({ bot, article, settings }),
    temperature: 0.9,
    maxTokens: 256,
    timeoutMs: 45_000,
    taskDefaultModel: 'deepseek-v4-flash',
    disableThinking: true,
    task: {
      source: ENGAGEMENT_BOT_SOURCE,
      taskType: 'comment',
      title: `路过评论：${article.title || article.contentKey}`,
      actorId: `cron:${ENGAGEMENT_BOT_SOURCE}`,
      actorName: bot.displayName,
      inputSummary: `${bot.displayName} → ${article.contentKey}`,
      metadata: { botSlug: bot.slug, articleKey: article.contentKey },
    },
  })
  const message = sanitizeGeneratedComment(generation.content, {
    minChars: settings.minCommentChars,
    maxChars: settings.maxCommentChars,
  })
  if (!message) {
    const error = new Error('EMPTY_GENERATED_COMMENT')
    error.code = 'EMPTY_GENERATED_COMMENT'
    error.taskId = generation.taskId
    throw error
  }
  return { message, taskId: generation.taskId || null }
}

async function finishRun(db, runId, payload) {
  await db
    .prepare(
      `UPDATE engagement_bot_runs
       SET status = ?2, likes = ?3, comments = ?4, failed = ?5, detail = ?6, finished_at = ?7
       WHERE id = ?1`
    )
    .bind(
      runId,
      payload.status,
      payload.likes || 0,
      payload.comments || 0,
      payload.failed || 0,
      payload.detail || '',
      Date.now()
    )
    .run()
}

export async function getEngagementBotOverview(db) {
  await ensureEngagementBotsSeeded(db)
  const [settings, bots, actions, runs] = await Promise.all([
    getEngagementBotSettings(db),
    listEngagementBots(db),
    listEngagementActions(db, { limit: 40 }),
    listEngagementRuns(db, { limit: 12 }),
  ])
  const enabledBots = bots.filter((bot) => bot.enabled).length
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const today = actions.filter((item) => item.createdAt >= dayAgo)
  return {
    persistent: true,
    settings,
    bots,
    actions,
    runs,
    stats: {
      bots: bots.length,
      enabledBots,
      likesToday: today.filter((item) => item.actionType === 'like' && item.status === 'ok').length,
      commentsToday: today.filter((item) => item.actionType === 'comment' && item.status === 'ok').length,
      failedToday: today.filter((item) => item.status === 'failed').length,
    },
  }
}

export async function runEngagementBot({ db, env, triggeredBy = 'cron', force = false, rng = Math.random } = {}) {
  if (!db) {
    return { ok: false, error: 'DB_UNAVAILABLE' }
  }

  await ensureEngagementBotsSeeded(db)
  const settings = await getEngagementBotSettings(db)
  const startedAt = Date.now()
  const runRow = await db
    .prepare(
      `INSERT INTO engagement_bot_runs
         (triggered_by, status, likes, comments, failed, detail, started_at, finished_at)
       VALUES (?1, 'running', 0, 0, 0, '', ?2, 0)
       RETURNING id`
    )
    .bind(triggeredBy, startedAt)
    .first()
  const runId = Number(runRow?.id) || 0

  async function conclude(payload) {
    if (runId) await finishRun(db, runId, payload)
    return { ok: payload.status !== 'failed', runId, ...payload }
  }

  if (!settings.enabled && !force) {
    return conclude({
      status: 'skipped',
      detail: 'paused',
      likes: 0,
      comments: 0,
      failed: 0,
    })
  }

  if (shouldSkipRun(settings, { force, rng })) {
    return conclude({
      status: 'skipped',
      detail: 'random-skip',
      likes: 0,
      comments: 0,
      failed: 0,
    })
  }

  const bots = (await listEngagementBots(db)).filter((bot) => bot.enabled)
  if (!bots.length) {
    return conclude({
      status: 'skipped',
      detail: 'no-enabled-bots',
      likes: 0,
      comments: 0,
      failed: 0,
    })
  }

  const articles = await listRecentPublishedContent(db, settings)
  if (!articles.length) {
    return conclude({
      status: 'skipped',
      detail: 'no-published-content',
      likes: 0,
      comments: 0,
      failed: 0,
    })
  }

  const cooldownMs = settings.cooldownHours * 60 * 60 * 1000
  const [likedPairs, recentCommentPairs] = await Promise.all([
    loadLikedPairs(db, bots),
    loadRecentCommentPairs(db, bots, cooldownMs),
  ])
  const plan = planEngagementRun({
    bots,
    articles,
    likedPairs,
    recentCommentPairs,
    likesPerRun: settings.likesPerRun,
    commentsPerRun: settings.commentsPerRun,
    rng,
  })

  let likes = 0
  let comments = 0
  let failed = 0

  for (const item of plan.likes) {
    try {
      const inserted = await insertLike(db, item.bot, item.article)
      await insertAction(db, {
        runId,
        botId: item.bot.id,
        botSlug: item.bot.slug,
        botName: item.bot.displayName,
        actionType: 'like',
        articleKey: item.article.contentKey,
        articleTitle: item.article.title,
        status: inserted ? 'ok' : 'skipped',
        error: inserted ? '' : 'already-liked',
      })
      if (inserted) likes += 1
    } catch (error) {
      failed += 1
      await insertAction(db, {
        runId,
        botId: item.bot.id,
        botSlug: item.bot.slug,
        botName: item.bot.displayName,
        actionType: 'like',
        articleKey: item.article.contentKey,
        articleTitle: item.article.title,
        status: 'failed',
        error: String(error?.message || error).slice(0, 300),
      })
    }
  }

  for (const item of plan.comments) {
    try {
      const generated = await generateComment({ env, bot: item.bot, article: item.article, settings })
      const inserted = await insertComment(db, item.bot, item.article, generated.message)
      await insertAction(db, {
        runId,
        botId: item.bot.id,
        botSlug: item.bot.slug,
        botName: item.bot.displayName,
        actionType: 'comment',
        articleKey: item.article.contentKey,
        articleTitle: item.article.title,
        commentId: inserted?.id || null,
        message: generated.message,
        deepseekTaskId: generated.taskId,
        status: inserted?.id ? 'ok' : 'failed',
        error: inserted?.id ? '' : 'INSERT_FAILED',
      })
      if (inserted?.id) comments += 1
      else failed += 1
    } catch (error) {
      failed += 1
      await insertAction(db, {
        runId,
        botId: item.bot.id,
        botSlug: item.bot.slug,
        botName: item.bot.displayName,
        actionType: 'comment',
        articleKey: item.article.contentKey,
        articleTitle: item.article.title,
        deepseekTaskId: error?.taskId || null,
        status: 'failed',
        error: String(error?.code || error?.message || error).slice(0, 300),
      })
    }
  }

  const status = failed && !(likes || comments) ? 'failed' : failed ? 'partial' : 'ok'
  return conclude({
    status,
    likes,
    comments,
    failed,
    detail: JSON.stringify({
      plannedLikes: plan.likes.length,
      plannedComments: plan.comments.length,
      articles: articles.length,
      bots: bots.length,
    }),
  })
}

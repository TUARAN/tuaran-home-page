import { interactionAgentHandles } from '../agentPool.js'
import { DAILY_TOP_SUBJECT, isIsoDate, shiftIsoDate, shanghaiDateKey } from './model.js'

/**
 * 本账号任务次数来自插件写入 D1 的 x_extension_daily_reports。
 * report_date 是动作发生的北京时间日期。日历格子用次日：选择 10 日看到 9 日。
 * 公开页只保留类别和次数。
 */

const HISTORY_DAYS = 120
const OPTIONAL_COLUMNS = ['reply_prunes', 'timeline_comments', 'notification_comments', 'kol_comments', 'prunes', 'posts']

const COUNT_COLUMNS = Object.freeze([
  ['comments', 'comments'],
  ['likes', 'likes'],
  ['follows', 'follows'],
  ['unfollows', 'unfollows'],
  ['follow_backs', 'followBacks'],
  ['posts', 'posts'],
  ['prunes', 'prunes'],
  ['reply_prunes', 'replyPrunes'],
  ['timeline_comments', 'timelineComments'],
  ['notification_comments', 'notificationComments'],
  ['kol_comments', 'kolComments'],
])

export const OWN_ACTIVITY_METRICS = Object.freeze([
  { key: 'comments', label: '评论合计' },
  { key: 'timelineComments', label: '评论首页' },
  { key: 'notificationComments', label: '评论回复' },
  { key: 'kolComments', label: '评论大V' },
  { key: 'likes', label: '点赞' },
  { key: 'follows', label: '关注（含回关）' },
  { key: 'unfollows', label: '取关' },
  { key: 'followBacks', label: '其中回关' },
  { key: 'posts', label: '发帖' },
  { key: 'prunes', label: '删帖' },
  { key: 'replyPrunes', label: '删评论' },
])

function emptyCounts() {
  return {
    comments: 0,
    timelineComments: 0,
    notificationComments: 0,
    kolComments: 0,
    likes: 0,
    follows: 0,
    unfollows: 0,
    followBacks: 0,
    posts: 0,
    prunes: 0,
    replyPrunes: 0,
  }
}

function countValue(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : 0
}

export function ownActivityMetrics(counts = {}) {
  const raw = { ...emptyCounts(), ...counts }
  const comments = Math.max(
    countValue(raw.comments),
    countValue(raw.timelineComments) + countValue(raw.notificationComments) + countValue(raw.kolComments),
  )
  const follows = countValue(raw.follows) + countValue(raw.followBacks)
  const values = { ...raw, comments, follows }
  return OWN_ACTIVITY_METRICS.map((metric) => ({
    key: metric.key,
    label: metric.label,
    count: metric.key === 'follows' ? follows : countValue(values[metric.key]),
  }))
}

export function activitySourceDate(calendarDate) {
  return isIsoDate(calendarDate) ? shiftIsoDate(calendarDate, -1) : ''
}

function selectList(dropped) {
  return COUNT_COLUMNS.map(([column, alias]) => (
    dropped.has(column) ? `0 AS ${alias}` : `SUM(${column}) AS ${alias}`
  )).join(', ')
}

function reportSql(dropped) {
  return `SELECT report_date, ${selectList(dropped)}
    FROM x_extension_daily_reports
    WHERE lower(account_handle) = lower(?)
      AND report_date >= ?
      AND report_date <= ?
    GROUP BY report_date`
}

function missingColumn(error) {
  const message = String(error?.message || error)
  if (!/no such column|no column named/i.test(message)) return ''
  return OPTIONAL_COLUMNS.find((column) => message.includes(column)) || ''
}

export function presentOwnActivityDays(rows, { accountHandle = DAILY_TOP_SUBJECT, today = shanghaiDateKey() } = {}) {
  const bySource = new Map()
  for (const row of rows || []) {
    const sourceDate = String(row?.report_date || row?.reportDate || '')
    if (!isIsoDate(sourceDate) || sourceDate > today) continue
    const calendarDate = shiftIsoDate(sourceDate, 1)
    if (calendarDate > today) continue
    const current = bySource.get(sourceDate) || emptyCounts()
    for (const [, alias] of COUNT_COLUMNS) current[alias] += countValue(row?.[alias])
    bySource.set(sourceDate, current)
  }
  return [...bySource.entries()]
    .map(([sourceDate, counts]) => ({
      date: shiftIsoDate(sourceDate, 1),
      sourceDate,
      accountHandle,
      metrics: ownActivityMetrics(counts),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

const OBSERVED_QUERY_COLUMNS = Object.freeze([
  ['comments', 'comments'],
  ['likes', 'likes'],
  ['follows', 'follows'],
  ['unfollows', 'unfollows'],
  ['follow_backs', 'followBacks'],
  ['posts', 'posts'],
  ['timeline_comments', 'timelineComments'],
  ['notification_comments', 'notificationComments'],
  ['kol_comments', 'kolComments'],
])

function nullableCount(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 0 ? number : null
}

// 观察卡使用原始列。关注与回关分列，不把回关加进关注。
// 没有行、或该列不在表里时返回 null，调用方显示「未采集」。
export function presentObservedActions(row) {
  if (!row) return null
  const comments = nullableCount(row.comments)
  const knownParts = ['timelineComments', 'notificationComments', 'kolComments']
    .map((key) => nullableCount(row[key]))
    .filter((value) => value != null)
  const partSum = knownParts.length ? knownParts.reduce((sum, value) => sum + value, 0) : null
  return {
    posts: nullableCount(row.posts),
    comments: comments == null && partSum == null ? null : Math.max(comments || 0, partSum || 0),
    likes: nullableCount(row.likes),
    follows: nullableCount(row.follows),
    followBacks: nullableCount(row.followBacks),
    unfollows: nullableCount(row.unfollows),
  }
}

function observedSelect(dropped) {
  return OBSERVED_QUERY_COLUMNS.map(([column, alias]) => (
    dropped.has(column) ? `NULL AS ${alias}` : `SUM(${column}) AS ${alias}`
  )).join(', ')
}

function observedColumn(error) {
  const message = String(error?.message || error)
  if (!/no such column|no column named/i.test(message)) return ''
  return [...OBSERVED_QUERY_COLUMNS].sort((a, b) => b[0].length - a[0].length).find(([column]) => message.includes(column))?.[0] || ''
}

export async function loadObservedActions(db, { handles = [], reportDate } = {}) {
  const keys = [...new Set(handles.map((handle) => String(handle || '').replace(/^@+/, '').trim().toLowerCase()).filter(Boolean))]
  const byHandle = new Map(keys.map((key) => [key, null]))
  if (!db || !isIsoDate(reportDate) || !keys.length) return byHandle
  const dropped = new Set()
  for (let attempt = 0; attempt <= OBSERVED_QUERY_COLUMNS.length; attempt += 1) {
    const sql = `SELECT lower(account_handle) AS handle, ${observedSelect(dropped)}
      FROM x_extension_daily_reports
      WHERE report_date = ?
        AND lower(account_handle) IN (${keys.map(() => '?').join(', ')})
      GROUP BY lower(account_handle)`
    try {
      const result = await db.prepare(sql).bind(reportDate, ...keys).all()
      for (const row of result?.results || []) {
        const key = String(row.handle || '').toLowerCase()
        if (!byHandle.has(key)) continue
        byHandle.set(key, presentObservedActions(row))
      }
      return byHandle
    } catch (error) {
      const column = observedColumn(error)
      if (!column || dropped.has(column)) throw error
      dropped.add(column)
    }
  }
  return byHandle
}

export async function loadOwnActivityDays(db, { accountHandle = DAILY_TOP_SUBJECT, today = shanghaiDateKey(), historyDays = HISTORY_DAYS } = {}) {
  if (!db || !isIsoDate(today)) return []
  const oldest = shiftIsoDate(today, -historyDays)
  const dropped = new Set()
  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt += 1) {
    try {
      const result = await db.prepare(reportSql(dropped)).bind(accountHandle, oldest, today).all()
      return presentOwnActivityDays(result?.results || [], { accountHandle, today })
    } catch (error) {
      if (/no such table/i.test(String(error?.message || error))) return []
      const column = missingColumn(error)
      if (!column || dropped.has(column)) throw error
      dropped.add(column)
    }
  }
  return []
}

/** 按共享账号池拉取各账号日报，日历等多账号视图用。 */
export async function loadOwnActivityDaysForPool(db, options = {}) {
  const handles = Array.isArray(options.handles) && options.handles.length
    ? options.handles
    : interactionAgentHandles()
  if (!handles.length) return []
  const chunks = await Promise.all(handles.map((accountHandle) => loadOwnActivityDays(db, { ...options, accountHandle })))
  return chunks.flat().sort((left, right) => (
    left.date.localeCompare(right.date) || String(left.accountHandle).localeCompare(String(right.accountHandle), 'en')
  ))
}

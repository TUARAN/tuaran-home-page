/**
 * 大互动日历 · 每日互动前十
 *
 * 落盘：`lib/interaction/dailyTop/days/YYYY-MM-DD.json`（一天一个文件）。
 * 加载：`lib/interaction/dailyTop/load.js` 在构建时扫描该目录，不必改索引。
 *
 * schemaVersion: 1
 * {
 *   schemaVersion: 1,
 *   date: "YYYY-MM-DD",                 // 与文件名相同，Asia/Shanghai 自然日
 *   timezone: "Asia/Shanghai",
 *   window: {
 *     start: "YYYY-MM-DDT21:00:00+08:00", // 前一日 21:00
 *     end:   "YYYY-MM-DDT21:00:00+08:00"  // 当日 21:00
 *   },
 *   metric: "bidirectional_public_interaction",
 *   metricLabel: "双向公开互动（回复/提及/引用），不含私信",
 *   subject: "tarsixseveneig1",
 *   excludedHandles: ["tarsixseveneig1"],
 *   opponents: number,                  // 窗口内互动对手数
 *   events: number,                     // 窗口内互动事件数
 *   top: [                              // 1–10 条，按 count 降序，rank 从 1 连续
 *     {
 *       rank: number,
 *       handle: string,                 // 不含 @
 *       displayName: string,
 *       count: number,
 *       breakdown: string               // 构成简述，如「我回复 29」「对方 1 · 我 21」「我提及 14」
 *     }
 *   ]
 * }
 *
 * 主页链接不入库，统一由 handle 生成 https://x.com/{handle}。
 * 口径：双向公开互动（回复 / 提及 / 引用），不含私信，已排除本人。
 */

export const DAILY_TOP_SCHEMA_VERSION = 1
export const DAILY_TOP_TIMEZONE = 'Asia/Shanghai'
export const DAILY_TOP_METRIC = 'bidirectional_public_interaction'
export const DAILY_TOP_METRIC_LABEL = '双向公开互动（回复/提及/引用），不含私信'
export const DAILY_TOP_SUBJECT = 'tarsixseveneig1'
export const DAILY_TOP_SAMPLE_DATE = '2026-11-05'
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
}

export function shiftIsoDate(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

export function expectedWindow(date) {
  return {
    start: `${shiftIsoDate(date, -1)}T21:00:00+08:00`,
    end: `${date}T21:00:00+08:00`,
  }
}

export function profileUrlFor(handle) {
  return `https://x.com/${handle}`
}

export function shanghaiDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function recordedDates(availableDates) {
  if (!Array.isArray(availableDates)) return []
  return availableDates.filter(isIsoDate).sort()
}

export function latestRecordedDate(availableDates) {
  const dates = recordedDates(availableDates)
  return dates.length ? dates[dates.length - 1] : null
}

export function resolveSelectedDate(query, today, availableDates) {
  if (isIsoDate(query)) return query
  const dates = recordedDates(availableDates)
  if (!dates.length || dates.includes(today)) return today
  return dates[dates.length - 1]
}

export function formatWindowLabel(window) {
  const stamp = (value) => String(value || '').replace('T', ' ').slice(0, 16)
  return `${stamp(window?.start)} → ${stamp(window?.end)}`
}

export function monthMatrix(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const lead = (firstWeekday + 6) % 7
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells = Array.from({ length: lead }, () => null)
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

export function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}`
}

export function emptyStateCopy(selectedDate, availableDates) {
  const dates = [...availableDates].sort()
  const lead = '这一天还没有收录互动前十。'
  if (!dates.length || dates.includes(selectedDate)) return lead
  if (dates.length === 1 && dates[0] === DAILY_TOP_SAMPLE_DATE) {
    return `${lead}${DAILY_TOP_SAMPLE_DATE} 已有样例，可改选这一天。`
  }
  const shown = dates.slice(-8).join('、')
  return `${lead}已收录 ${shown}。`
}

function fail(fileName, message) {
  throw new Error(`每日互动前十 ${fileName || ''}：${message}`.trim())
}

export function validateDailyTopDay(day, fileName = '') {
  if (!day || typeof day !== 'object' || Array.isArray(day)) fail(fileName, '根节点必须是对象')
  if (day.schemaVersion !== DAILY_TOP_SCHEMA_VERSION) fail(fileName, `schemaVersion 必须是 ${DAILY_TOP_SCHEMA_VERSION}`)
  if (!isIsoDate(day.date)) fail(fileName, 'date 必须是有效的 YYYY-MM-DD')
  const expectedName = `${day.date}.json`
  if (fileName && fileName !== expectedName) fail(fileName, `文件名必须是 ${expectedName}`)
  if (day.timezone !== DAILY_TOP_TIMEZONE) fail(fileName, `timezone 必须是 ${DAILY_TOP_TIMEZONE}`)
  if (day.metric !== DAILY_TOP_METRIC) fail(fileName, `metric 必须是 ${DAILY_TOP_METRIC}`)
  if (day.metricLabel !== DAILY_TOP_METRIC_LABEL) fail(fileName, 'metricLabel 与口径文案不一致')
  if (day.subject !== DAILY_TOP_SUBJECT) fail(fileName, `subject 必须是 ${DAILY_TOP_SUBJECT}`)
  if (!Array.isArray(day.excludedHandles) || day.excludedHandles.length !== 1 || day.excludedHandles[0] !== DAILY_TOP_SUBJECT) {
    fail(fileName, `excludedHandles 必须是 ["${DAILY_TOP_SUBJECT}"]`)
  }
  const window = expectedWindow(day.date)
  if (day.window?.start !== window.start || day.window?.end !== window.end) {
    fail(fileName, `window 必须是 ${window.start} → ${window.end}`)
  }
  for (const key of ['opponents', 'events']) {
    if (!Number.isInteger(day[key]) || day[key] < 0) fail(fileName, `${key} 必须是非负整数`)
  }
  if (!Array.isArray(day.top) || day.top.length < 1 || day.top.length > 10) fail(fileName, 'top 必须是 1 到 10 条')

  const top = day.top.map((row, index) => {
    const rank = index + 1
    if (!row || typeof row !== 'object') fail(fileName, `第 ${rank} 行缺失`)
    if (row.rank !== rank) fail(fileName, `第 ${rank} 行 rank 必须是 ${rank}`)
    if (typeof row.handle !== 'string' || !HANDLE_RE.test(row.handle)) fail(fileName, `第 ${rank} 行 handle 无效`)
    if (row.handle.toLowerCase() === DAILY_TOP_SUBJECT) fail(fileName, 'top 不能包含本人账号')
    if (typeof row.displayName !== 'string' || !row.displayName.trim()) fail(fileName, `第 ${rank} 行 displayName 不能为空`)
    if (!Number.isInteger(row.count) || row.count < 1) fail(fileName, `第 ${rank} 行 count 必须是正整数`)
    if (index > 0 && row.count > day.top[index - 1].count) fail(fileName, 'top 必须按 count 降序')
    if (typeof row.breakdown !== 'string' || !row.breakdown.trim()) fail(fileName, `第 ${rank} 行 breakdown 不能为空`)
    return {
      rank,
      handle: row.handle,
      displayName: row.displayName,
      count: row.count,
      breakdown: row.breakdown,
      profileUrl: profileUrlFor(row.handle),
    }
  })

  return {
    schemaVersion: DAILY_TOP_SCHEMA_VERSION,
    date: day.date,
    timezone: day.timezone,
    window: { start: window.start, end: window.end },
    metric: day.metric,
    metricLabel: day.metricLabel,
    subject: day.subject,
    excludedHandles: [...day.excludedHandles],
    opponents: day.opponents,
    events: day.events,
    top,
  }
}

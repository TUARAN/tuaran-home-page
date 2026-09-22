/**
 * Codex 重置日历：把 AIHOT 公开快照换成站内可渲染的日期、状态和首页卡片。
 * 不预测下一次重置，也不展示个人额度。
 */

export const CODEX_RESET_PATH = '/codex-reset'
export const CODEX_RESET_PAGE_URL = 'https://2aran.com/codex-reset'
export const AIHOT_CODEX_RESETS_URL = 'https://aihot.news/api/v1/codex-resets'
export const AIHOT_CODEX_RESET_PAGE = 'https://aihot.news/codex-reset'
export const TIBO_PROFILE_URL = 'https://x.com/thsottiaux'
export const TIBO_HANDLE = '@thsottiaux'
export const TIBO_NAME = 'Tibo'
export const TIBO_AVATAR_PATH = '/images/codex-reset/tibo-avatar.jpg'
export const CODEX_RESET_HERO_BG_PATH = '/images/codex-reset/saint-tibo-bg.jpg'

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export const KIND_META = {
  preview: { label: '重置预告', calendarLabel: '重置预告', tone: 'preview' },
  credit: { label: '发重置卡', calendarLabel: '发重置卡', tone: 'credit' },
  reset: { label: '全员重置', calendarLabel: '全员重置', tone: 'reset' },
}

const EVENT_TYPES = new Set(['direct_reset', 'reset_credit'])
const EVENT_STATUSES = new Set(['announced', 'confirmed'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const FALLBACK_SNAPSHOT = Object.freeze({
  schemaVersion: 1,
  timezone: 'Asia/Shanghai',
  checkedAt: '2026-09-22T10:29:41.977+08:00',
  historyFrom: '2026-06-12T00:00:00.000+08:00',
  count: 6,
  events: Object.freeze([
    Object.freeze({
      id: 'banked-2101352781219258527-1-1',
      type: 'reset_credit',
      label: '发重置卡',
      status: 'announced',
      title: 'Tibo 预告发放重置卡',
      scope: '',
      createdAt: '2026-09-20T00:48:38.000+08:00',
      updatedAt: '2026-09-20T00:48:38.000+08:00',
      confirmedAt: null,
      occurredOn: null,
      confirmationBasis: null,
      schedule: Object.freeze({
        precision: 'date',
        from: '2026-09-22T15:00:00.000+08:00',
        through: '2026-09-23T15:00:00.000+08:00',
        label: '北京时间预计 9月22日 15:00–9月23日 15:00',
      }),
      posts: Object.freeze([
        Object.freeze({
          id: '2101352781219258527',
          publishedAt: '2026-09-20T00:48:38.000+08:00',
          stage: '发卡预告',
          text: '好吧。但它也仍然会在周二到来。',
          originalText: 'OK fine. But it’s also still coming in Tuesday',
          url: 'https://x.com/thsottiaux/status/2101352781219258527',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
    Object.freeze({
      id: 'reset-2098612714704891959-1-1',
      type: 'direct_reset',
      label: '全员重置',
      status: 'confirmed',
      title: 'Codex 额度重置已完成',
      scope: '',
      createdAt: '2026-09-12T11:20:36.000+08:00',
      updatedAt: '2026-09-12T16:09:17.000+08:00',
      confirmedAt: '2026-09-12T16:09:17.000+08:00',
      occurredOn: null,
      confirmationBasis: 'source_post',
      schedule: Object.freeze({
        precision: 'deadline',
        from: '2026-09-12T15:00:00.000+08:00',
        through: '2026-09-12T15:00:00.000+08:00',
        label: '北京时间预计 9月12日 15:00 前',
      }),
      posts: Object.freeze([
        Object.freeze({
          id: '2098685367058612394',
          publishedAt: '2026-09-12T16:09:17.000+08:00',
          stage: '确认完成',
          text: '重置已全部推送完成。好梦。',
          originalText: 'Reset all propagated.',
          url: 'https://x.com/thsottiaux/status/2098685367058612394',
        }),
        Object.freeze({
          id: '2098612714704891959',
          publishedAt: '2026-09-12T11:20:36.000+08:00',
          stage: '预告',
          text: '当然，一次重置也将在今天午夜前落地。',
          originalText: 'And of course, a reset is also landing by midnight today.',
          url: 'https://x.com/thsottiaux/status/2098612714704891959',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
    Object.freeze({
      id: 'banked-2097752790177370535-1-1',
      type: 'reset_credit',
      label: '发重置卡',
      status: 'confirmed',
      title: '重置卡已发放',
      scope: '',
      createdAt: '2026-09-10T02:23:34.000+08:00',
      updatedAt: '2026-09-13T10:36:02.000+08:00',
      confirmedAt: null,
      occurredOn: null,
      confirmationBasis: 'receipt_review',
      schedule: null,
      posts: Object.freeze([
        Object.freeze({
          id: '2097752790177370535',
          publishedAt: '2026-09-10T02:23:34.000+08:00',
          stage: '发卡预告',
          text: '所有在受影响的时间窗口内使用过重置卡的人都会再获得一张重置卡，并会收到一封致歉邮件。',
          originalText: 'Everyone who used one in the affected time window is getting another one and an email to apologize.',
          url: 'https://x.com/thsottiaux/status/2097752790177370535',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
    Object.freeze({
      id: 'reset-2097043464538264003-1-1',
      type: 'direct_reset',
      label: '全员重置',
      status: 'confirmed',
      title: 'Codex 额度重置已完成',
      scope: '所有付费订阅',
      createdAt: '2026-09-08T03:24:57.000+08:00',
      updatedAt: '2026-09-08T12:05:53.000+08:00',
      confirmedAt: '2026-09-08T12:05:53.000+08:00',
      occurredOn: null,
      confirmationBasis: 'source_post',
      schedule: Object.freeze({
        precision: 'window',
        from: '2026-09-08T09:00:00.000+08:00',
        through: '2026-09-08T10:00:00.000+08:00',
        label: '北京时间预计 9月8日 09:00–10:00',
      }),
      posts: Object.freeze([
        Object.freeze({
          id: '2097174560412246215',
          publishedAt: '2026-09-08T12:05:53.000+08:00',
          stage: '确认完成',
          text: '所有人都已重置。享受与 Astra 共度的这一周。',
          originalText: 'All reset for everyone.',
          url: 'https://x.com/thsottiaux/status/2097174560412246215',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
    Object.freeze({
      id: 'banked-2095979536043401428-1-1',
      type: 'reset_credit',
      label: '发重置卡',
      status: 'confirmed',
      title: '重置卡已发放',
      scope: 'Plus、Pro、Business',
      createdAt: '2026-09-05T04:57:17.000+08:00',
      updatedAt: '2026-09-13T10:36:02.000+08:00',
      confirmedAt: null,
      occurredOn: '2026-09-05',
      confirmationBasis: 'receipt_review',
      schedule: Object.freeze({
        precision: 'deadline',
        from: '2026-09-05T15:00:00.000+08:00',
        through: '2026-09-05T15:00:00.000+08:00',
        label: '北京时间预计 9月5日 15:00 前',
      }),
      posts: Object.freeze([
        Object.freeze({
          id: '2096035437299237298',
          publishedAt: '2026-09-05T08:39:25.000+08:00',
          stage: '发卡预告',
          text: '我们今天也将为所有 Plus、Pro 和 Business 用户发放完整的重置卡。今天结束前到账。',
          originalText: 'we will do the full banked reset today too for all Plus, Pro and Business users. Lands end of day.',
          url: 'https://x.com/thsottiaux/status/2096035437299237298',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
    Object.freeze({
      id: 'banked-2095651088502591861-1-1',
      type: 'reset_credit',
      label: '发重置卡',
      status: 'confirmed',
      title: '重置卡已发放',
      scope: '',
      createdAt: '2026-09-04T07:12:09.000+08:00',
      updatedAt: '2026-09-13T10:36:02.000+08:00',
      confirmedAt: null,
      occurredOn: '2026-09-04',
      confirmationBasis: 'receipt_review',
      schedule: Object.freeze({
        precision: 'approximate',
        from: '2026-09-04T10:12:09.000+08:00',
        through: '2026-09-04T10:12:09.000+08:00',
        label: '北京时间约 9月4日 10:12',
      }),
      posts: Object.freeze([
        Object.freeze({
          id: '2095651088502591861',
          publishedAt: '2026-09-04T07:12:09.000+08:00',
          stage: '发卡预告',
          text: '从今天开始，只要你的付费 ChatGPT 套餐一天无法使用 Astra，我们就赠送一张重置卡。',
          originalText: 'We will give one banked reset for every day you don\'t have access to Astra on your paid ChatGPT plan, starting today.',
          url: 'https://x.com/thsottiaux/status/2095651088502591861',
        }),
      ]),
      url: AIHOT_CODEX_RESET_PAGE,
    }),
  ]),
})

export function isIsoDate(value) {
  return typeof value === 'string' && DATE_RE.test(value)
}

export function beijingDateFromTimestamp(value) {
  if (typeof value !== 'string') return null
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

export function todayBeijing(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function eventKind(event) {
  if (event?.status === 'announced') return 'preview'
  if (event?.type === 'reset_credit') return 'credit'
  return 'reset'
}

export function eventKindLabel(event) {
  return KIND_META[eventKind(event)].label
}

export function calendarDateForEvent(event) {
  if (isIsoDate(event?.occurredOn)) return event.occurredOn
  if (event?.schedule?.from) return beijingDateFromTimestamp(event.schedule.from)
  if (event?.confirmedAt) return beijingDateFromTimestamp(event.confirmedAt)
  return beijingDateFromTimestamp(event?.createdAt)
}

export function featuredKicker(event) {
  const latestPost = event?.posts?.[0]
  if (latestPost?.stage) return latestPost.stage
  if (event?.status === 'announced' && event.type === 'reset_credit') return '发卡预告'
  if (event?.status === 'announced') return '重置预告'
  if (event?.type === 'reset_credit') return '已发卡'
  return '已重置'
}

export function formatMonthTitle(yearMonth) {
  const [year, month] = String(yearMonth || '').split('-')
  if (!year || !month) return ''
  return `${year} 年 ${Number(month)} 月`
}

export function formatDayHeading(isoDate) {
  if (!isIsoDate(isoDate)) return ''
  const [, month, day] = isoDate.split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}

export function formatCompactDate(isoDate) {
  if (!isIsoDate(isoDate)) return ''
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export function formatBeijingPostTime(value) {
  const date = beijingDateFromTimestamp(value)
  if (!date) return ''
  const timeMatch = String(value).match(/T(\d{2}):(\d{2})/)
  const [, month, day] = date.split('-')
  if (!timeMatch) return `${Number(month)}/${Number(day)}`
  return `${Number(month)}/${Number(day)} ${timeMatch[1]}:${timeMatch[2]}`
}

export function shiftYearMonth(yearMonth, delta) {
  const [year, month] = String(yearMonth || '').split('-').map(Number)
  if (!year || !month) return yearMonth
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function yearMonthOf(isoDate) {
  return isIsoDate(isoDate) ? isoDate.slice(0, 7) : ''
}

function weekdayMondayIndex(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return weekday === 0 ? 6 : weekday - 1
}

function shiftIsoDate(isoDate, amount) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + amount))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

export function buildMonthGrid(yearMonth) {
  const start = `${yearMonth}-01`
  if (!isIsoDate(start)) return []
  const firstOffset = weekdayMondayIndex(start)
  const gridStart = shiftIsoDate(start, -firstOffset)
  const cells = []
  for (let index = 0; index < 42; index += 1) {
    const date = shiftIsoDate(gridStart, index)
    cells.push({
      date,
      day: Number(date.slice(-2)),
      inMonth: date.startsWith(yearMonth),
    })
  }
  while (cells.length > 35 && cells.slice(-7).every((cell) => !cell.inMonth)) {
    cells.splice(-7, 7)
  }
  return cells
}

export function eventsOnDate(events, isoDate) {
  return (events || []).filter((event) => calendarDateForEvent(event) === isoDate)
}

export function monthStats(events, yearMonth) {
  const counts = { reset: 0, credit: 0, preview: 0 }
  for (const event of events || []) {
    const date = calendarDateForEvent(event)
    if (!date || !date.startsWith(yearMonth)) continue
    counts[eventKind(event)] += 1
  }
  return counts
}

export function monthStatsLabel(stats) {
  return [
    `${stats.reset} 条全员重置`,
    `${stats.credit} 条发重置卡`,
    `${stats.preview} 条重置预告`,
  ].join(' · ')
}

export function pickFeaturedEvent(events, today = todayBeijing()) {
  const dated = (events || [])
    .map((event) => ({ event, date: calendarDateForEvent(event) }))
    .filter((item) => item.date)

  const upcoming = dated
    .filter((item) => item.event.status === 'announced' && item.date >= today)
    .sort((left, right) => {
      const byDate = left.date.localeCompare(right.date)
      if (byDate) return byDate
      return String(left.event.createdAt || '').localeCompare(String(right.event.createdAt || ''))
    })
  if (upcoming.length) return upcoming[0].event

  const latest = [...dated].sort((left, right) => (
    String(right.event.updatedAt || right.event.createdAt || '').localeCompare(
      String(left.event.updatedAt || left.event.createdAt || ''),
    )
  ))
  return latest[0]?.event || null
}

export function latestPost(event) {
  return event?.posts?.[0] || null
}

export function eventForPost(events, postId) {
  if (!postId) return null
  return (events || []).find((event) => event.posts?.some((post) => post.id === postId)) || null
}

/** 某日所有事件里最新一条原帖。 */
export function newestPostOnDate(events, isoDate) {
  const posts = eventsOnDate(events, isoDate)
    .flatMap((event) => event.posts || [])
    .filter(Boolean)
  if (!posts.length) return null
  return [...posts].sort((left, right) =>
    String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')),
  )[0]
}

function normalizePost(post) {
  if (!post || typeof post !== 'object') return null
  if (typeof post.id !== 'string' || typeof post.url !== 'string') return null
  if (!post.url.startsWith('https://')) return null
  return {
    id: post.id,
    publishedAt: typeof post.publishedAt === 'string' ? post.publishedAt : '',
    stage: typeof post.stage === 'string' ? post.stage : '',
    text: typeof post.text === 'string' ? post.text : '',
    originalText: typeof post.originalText === 'string' ? post.originalText : '',
    url: post.url,
  }
}

function normalizeSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return null
  if (typeof schedule.from !== 'string' || typeof schedule.through !== 'string') return null
  return {
    precision: typeof schedule.precision === 'string' ? schedule.precision : 'date',
    from: schedule.from,
    through: schedule.through,
    label: typeof schedule.label === 'string' ? schedule.label : '',
  }
}

function normalizeEvent(event) {
  if (!event || typeof event !== 'object') return null
  if (typeof event.id !== 'string') return null
  if (!EVENT_TYPES.has(event.type) || !EVENT_STATUSES.has(event.status)) return null
  const posts = Array.isArray(event.posts) ? event.posts.map(normalizePost).filter(Boolean) : []
  return {
    id: event.id,
    type: event.type,
    label: event.label === '发重置卡' ? '发重置卡' : '全员重置',
    status: event.status,
    title: typeof event.title === 'string' ? event.title : eventKindLabel(event),
    scope: typeof event.scope === 'string' ? event.scope : '',
    createdAt: typeof event.createdAt === 'string' ? event.createdAt : '',
    updatedAt: typeof event.updatedAt === 'string' ? event.updatedAt : '',
    confirmedAt: typeof event.confirmedAt === 'string' ? event.confirmedAt : null,
    occurredOn: isIsoDate(event.occurredOn) ? event.occurredOn : null,
    confirmationBasis: event.confirmationBasis === 'source_post' || event.confirmationBasis === 'receipt_review'
      ? event.confirmationBasis
      : null,
    schedule: normalizeSchedule(event.schedule),
    posts,
    url: typeof event.url === 'string' && event.url.startsWith('https://') ? event.url : AIHOT_CODEX_RESET_PAGE,
  }
}

export function parseCodexResetsPayload(raw) {
  if (!raw || typeof raw !== 'object' || raw.schemaVersion !== 1) return null
  if (!Array.isArray(raw.events)) return null
  const events = raw.events.map(normalizeEvent).filter(Boolean)
  return {
    schemaVersion: 1,
    timezone: 'Asia/Shanghai',
    checkedAt: typeof raw.checkedAt === 'string' ? raw.checkedAt : null,
    historyFrom: typeof raw.historyFrom === 'string' ? raw.historyFrom : FALLBACK_SNAPSHOT.historyFrom,
    count: events.length,
    events,
  }
}

export function homeCardModel(snapshot, today = todayBeijing()) {
  const events = snapshot?.events || []
  const featured = pickFeaturedEvent(events, today)
  const date = featured ? calendarDateForEvent(featured) : today
  const post = latestPost(featured)
  return {
    featured,
    date,
    kind: featured ? eventKind(featured) : 'preview',
    kicker: featured ? featuredKicker(featured) : 'Codex 重置',
    title: featured?.title || 'Codex 重置监控',
    quote: post?.text || '查看 Tibo 公开的额度重置、重置卡发放与原帖记录。',
    scheduleLabel: featured?.schedule?.label || '',
    sourceCheckedAt: snapshot?.checkedAt || null,
  }
}

/** 首页侧栏条：日期只出现一次。 */
export function homeStripHeadline(model, today = todayBeijing()) {
  if (!model?.date) return ''
  return model.date === today ? '今天' : formatCompactDate(model.date)
}

/** 首页侧栏条：优先展示去掉重复日期后的时间窗，否则用一句原帖摘要。 */
export function homeStripSubline(model) {
  const schedule = String(model?.scheduleLabel || '').trim()
  if (schedule) {
    const deduped = dedupeScheduleLabel(schedule, model?.date)
    if (deduped) return deduped
  }
  const quote = String(model?.quote || '').trim()
  const generic = '查看 Tibo 公开的额度重置、重置卡发放与原帖记录。'
  if (!quote || quote === generic) return ''
  return quote.length > 42 ? `${quote.slice(0, 42)}…` : quote
}

function dedupeScheduleLabel(label, isoDate) {
  let text = String(label || '')
    .replace(/^北京时间(?:预计|约)\s*/, '')
    .trim()
  const compact = formatCompactDate(isoDate)
  if (compact) {
    text = text.replace(new RegExp(`${compact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '')
  }
  return text.replace(/\s*[–-]\s*/g, ' – ').trim()
}

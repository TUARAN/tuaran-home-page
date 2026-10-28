const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 50

/** 同一秒里的发币和余额回写不算回访；隔了至少一小时再出现，才算回来过。 */
export const GUEST_RETURN_GAP_MS = 60 * 60 * 1000

const GAP = GUEST_RETURN_GAP_MS

/**
 * 五层互斥，优先级从高到低：已归并、已解锁、写过评论、回来过、只领了试用。
 * attention 是前三层里仍未归并的人，后台默认只翻这一层。
 */
export const GUEST_SEGMENT_SQL = {
  bound: 'is_bound = 1',
  unlocked: 'is_bound = 0 AND (unlock_count > 0 OR spent > 0)',
  commented: 'is_bound = 0 AND unlock_count = 0 AND spent = 0 AND comment_count > 0',
  returned: `is_bound = 0 AND unlock_count = 0 AND spent = 0 AND comment_count = 0 AND last_seen_at >= first_seen_at + ${GAP}`,
  seed: `is_bound = 0 AND unlock_count = 0 AND spent = 0 AND comment_count = 0 AND last_seen_at < first_seen_at + ${GAP}`,
  attention: `is_bound = 0 AND (unlock_count > 0 OR spent > 0 OR comment_count > 0 OR last_seen_at >= first_seen_at + ${GAP})`,
}

const GUEST_SEGMENT_ORDER = ['attention', 'unlocked', 'commented', 'returned', 'seed', 'bound', 'all']

function toNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

export function guestSegmentFromCounts({
  boundUserId = '',
  unlockCount = 0,
  spent = 0,
  commentCount = 0,
  firstSeenAt = 0,
  lastSeenAt = 0,
} = {}) {
  if (boundUserId) return 'bound'
  if (unlockCount > 0 || spent > 0) return 'unlocked'
  if (commentCount > 0) return 'commented'
  if (firstSeenAt > 0 && lastSeenAt >= firstSeenAt + GUEST_RETURN_GAP_MS) return 'returned'
  return 'seed'
}

export function normalizeGuestDirectoryRow(row) {
  const guest = {
    userId: String(row?.user_id || ''),
    gid: String(row?.user_id || '').replace(/^guest:/, ''),
    balance: toNumber(row?.balance),
    earned: toNumber(row?.earned),
    spent: toNumber(row?.spent),
    ledgerCount: toNumber(row?.ledger_count),
    unlockCount: toNumber(row?.unlock_count),
    commentCount: toNumber(row?.comment_count),
    firstSeenAt: toNumber(row?.first_seen_at),
    lastSeenAt: toNumber(row?.last_seen_at),
    boundUserId: String(row?.bound_user_id || ''),
    boundAt: toNumber(row?.bound_at),
    latestLedger: row?.latest_ledger_id
      ? {
          id: row.latest_ledger_id,
          delta: toNumber(row.latest_delta),
          reason: String(row.latest_reason || ''),
          ref: String(row.latest_ref || ''),
          createdAt: toNumber(row.latest_created_at),
        }
      : null,
  }
  guest.segment = guestSegmentFromCounts(guest)
  return guest
}

export function normalizeGuestStats(row, segments = null) {
  const unlocked = toNumber(segments?.unlocked)
  const commented = toNumber(segments?.commented)
  const returned = toNumber(segments?.returned)
  const seed = toNumber(segments?.seed)
  const bound = toNumber(segments?.bound ?? row?.bound)
  const seedBase = toNumber(segments?.seed)
  return {
    total: toNumber(row?.total),
    active: toNumber(row?.active),
    bound: toNumber(row?.bound),
    totalBalance: toNumber(row?.total_balance),
    totalEarned: toNumber(row?.total_earned),
    totalSpent: toNumber(row?.total_spent),
    unlocks: toNumber(row?.unlocks),
    comments: toNumber(row?.comments),
    segments: {
      unlocked,
      commented,
      returned,
      seed,
      bound,
      attention: unlocked + commented + returned,
    },
    conversion: seedBase > 0 ? unlocked / seedBase : null,
  }
}

function encodeCursor(row) {
  return `${toNumber(row.last_seen_at)}:${encodeURIComponent(String(row.user_id || ''))}`
}

function decodeCursor(value) {
  const raw = String(value || '')
  const separator = raw.indexOf(':')
  if (separator <= 0) return null
  const lastSeenAt = Number(raw.slice(0, separator))
  let userId = ''
  try {
    userId = decodeURIComponent(raw.slice(separator + 1))
  } catch {
    return null
  }
  if (!Number.isFinite(lastSeenAt) || !userId.startsWith('guest:')) return null
  return { lastSeenAt, userId }
}

export function normalizeGuestListStatus(value) {
  const status = String(value || '').trim()
  if (status === 'active') return 'attention'
  return GUEST_SEGMENT_ORDER.includes(status) ? status : 'attention'
}

export function normalizeGuestListQuery(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 180)
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}

export async function listGuestDirectory(db, options = {}) {
  const requestedLimit = Math.trunc(Number(options.limit || DEFAULT_PAGE_SIZE))
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(20, Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_PAGE_SIZE))
  const query = normalizeGuestListQuery(options.query ?? options.q)
  const status = normalizeGuestListStatus(options.status)
  const cursor = decodeCursor(options.cursor)
  const where = []
  const binds = []

  if (!query && status !== 'all') where.push(GUEST_SEGMENT_SQL[status])
  if (query) {
    const needle = query.toLowerCase()
    binds.push(needle, needle, needle)
    const id = binds.length - 2
    const user = binds.length - 1
    const bound = binds.length
    where.push(`(lower(user_id) = ?${id} OR instr(lower(user_id), ?${user}) > 0 OR instr(lower(bound_user_id), ?${bound}) > 0)`)
  }
  if (cursor) {
    binds.push(cursor.lastSeenAt, cursor.userId)
    where.push(`(last_seen_at, user_id) < (?${binds.length - 1}, ?${binds.length})`)
  }
  binds.push(limit + 1)

  const result = await db
    .prepare(
      `SELECT user_id, balance, earned, spent, ledger_count, unlock_count, comment_count,
              first_seen_at, last_seen_at, is_bound, bound_user_id, bound_at,
              latest_ledger_id, latest_delta, latest_reason, latest_ref, latest_created_at
       FROM guest_directory
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY last_seen_at DESC, user_id DESC
       LIMIT ?${binds.length}`
    )
    .bind(...binds)
    .all()

  const pageRows = rows(result)
  const hasMore = pageRows.length > limit
  const visibleRows = hasMore ? pageRows.slice(0, limit) : pageRows
  return {
    guests: visibleRows.map(normalizeGuestDirectoryRow),
    page: {
      limit,
      hasMore,
      nextCursor: hasMore && visibleRows.length ? encodeCursor(visibleRows[visibleRows.length - 1]) : '',
    },
  }
}

const GUEST_SEGMENT_COUNT_SQL = `SELECT
  SUM(CASE WHEN ${GUEST_SEGMENT_SQL.bound} THEN 1 ELSE 0 END) AS bound,
  SUM(CASE WHEN ${GUEST_SEGMENT_SQL.unlocked} THEN 1 ELSE 0 END) AS unlocked,
  SUM(CASE WHEN ${GUEST_SEGMENT_SQL.commented} THEN 1 ELSE 0 END) AS commented,
  SUM(CASE WHEN ${GUEST_SEGMENT_SQL.returned} THEN 1 ELSE 0 END) AS returned,
  SUM(CASE WHEN ${GUEST_SEGMENT_SQL.seed} THEN 1 ELSE 0 END) AS seed
FROM guest_directory`

export async function getGuestDirectoryStats(db) {
  const [row, segments] = await Promise.all([
    db.prepare('SELECT * FROM guest_stats WHERE id = 1').first(),
    db.prepare(GUEST_SEGMENT_COUNT_SQL).first(),
  ])
  return normalizeGuestStats(row, segments)
}

export async function getGuestDirectoryEntry(db, userId) {
  const id = String(userId || '').trim()
  if (!id.startsWith('guest:')) return null
  const row = await db
    .prepare(
      `SELECT user_id, balance, earned, spent, ledger_count, unlock_count, comment_count,
              first_seen_at, last_seen_at, is_bound, bound_user_id, bound_at,
              latest_ledger_id, latest_delta, latest_reason, latest_ref, latest_created_at
       FROM guest_directory
       WHERE user_id = ?1
       LIMIT 1`
    )
    .bind(id)
    .first()
  return row ? normalizeGuestDirectoryRow(row) : null
}

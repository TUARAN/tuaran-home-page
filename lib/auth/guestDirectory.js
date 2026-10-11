const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 50

function toNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

export function normalizeGuestDirectoryRow(row) {
  return {
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
}

export function normalizeGuestStats(row) {
  return {
    total: toNumber(row?.total),
    active: toNumber(row?.active),
    bound: toNumber(row?.bound),
    totalBalance: toNumber(row?.total_balance),
    totalEarned: toNumber(row?.total_earned),
    totalSpent: toNumber(row?.total_spent),
    unlocks: toNumber(row?.unlocks),
    comments: toNumber(row?.comments),
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

function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}

export async function listGuestDirectory(db, options = {}) {
  const requestedLimit = Math.trunc(Number(options.limit || DEFAULT_PAGE_SIZE))
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(20, Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_PAGE_SIZE))
  const status = ['active', 'bound'].includes(options.status) ? options.status : 'all'
  const cursor = decodeCursor(options.cursor)
  const where = []
  const binds = []

  if (status !== 'all') {
    binds.push(status === 'bound' ? 1 : 0)
    where.push(`is_bound = ?${binds.length}`)
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

export async function getGuestDirectoryStats(db) {
  const row = await db.prepare('SELECT * FROM guest_stats WHERE id = 1').first()
  return normalizeGuestStats(row)
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

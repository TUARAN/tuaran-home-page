import { sha256 } from './contentProof.js'

export const RANBI_PUBLIC_LEDGER_SCHEMA = 'ranbi-public-ledger/v1'

const REASON_LABELS = {
  admin: '站长调整',
  checkin: '每日签到',
  checkin_bonus: '连续签到',
  comment: '有效评论',
  guest_merge: '游客余额归入账号',
  guest_seed: '游客试用',
  image_hosting_refund: '图床退回',
  image_hosting_upload: '图床上传',
  register: '注册',
  reward_redeem: '兑换礼物',
  unlock: '解锁内容',
}

const SYSTEM_LABELS = {
  'pool:community': '社区参与池',
  'pool:owner': '站长与长期维护池',
  'pool:contributors': '内容与资源贡献池',
  'pool:ecosystem': '生态活动池',
  'pool:reserve': '长期储备池',
  'system:burn': '燃币黑洞',
}

export function reasonLabel(reason) {
  return REASON_LABELS[reason] || '其他转账'
}

/** 只公开不含登录名、邮箱、备注的说明。站长备注和游客编号留在站内。 */
export function publicDetail(reason, ref) {
  const value = String(ref || '')
  if (reason === 'unlock' && value.startsWith('unlock:')) return value.slice('unlock:'.length)
  if (reason === 'checkin' && /^checkin:\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice('checkin:'.length)
  const bonus = /^checkin_bonus:(\d{4}-\d{2}-\d{2}):(\d+)$/.exec(value)
  if (reason === 'checkin_bonus' && bonus) return `${bonus[1]} 连续 ${bonus[2]} 天`
  return ''
}

export function isSystemAccount(accountId) {
  const id = String(accountId || '')
  return id.startsWith('pool:') || id.startsWith('system:')
}

export async function publicAccount(accountId, cache = new Map()) {
  const id = String(accountId || '')
  if (cache.has(id)) return cache.get(id)
  const entry = isSystemAccount(id)
    ? { ref: id, label: SYSTEM_LABELS[id] || id, kind: 'system' }
    : await readerAccount(id)
  cache.set(id, entry)
  return entry
}

async function readerAccount(accountId) {
  const digest = await sha256(`ranbi-public-account/v1\n${accountId}`)
  const code = digest.slice(0, 12)
  return { ref: `reader:${code}`, label: `读者 ${code.slice(0, 6)}`, kind: 'reader' }
}

export function canonicalTransferLine(transfer) {
  return [
    transfer.id,
    transfer.createdAt,
    transfer.from.ref,
    transfer.to.ref,
    transfer.amount,
    transfer.reason,
    transfer.detail,
  ].join('|')
}

export function canonicalSnapshot(snapshot) {
  return [
    RANBI_PUBLIC_LEDGER_SCHEMA,
    snapshot.totalSupply,
    snapshot.accounted,
    snapshot.consistent ? 1 : 0,
    snapshot.circulating,
    snapshot.burned,
    ...snapshot.accounts.map((account) => `${account.accountId}:${account.balance}`),
    snapshot.transferCount,
    snapshot.transfersHash,
  ].join('\n')
}

export async function hashTransfers(lines) {
  return sha256(lines.join('\n'))
}

export async function hashSnapshot(snapshot) {
  return sha256(canonicalSnapshot(snapshot))
}

export function paginateNewestFirst(transfers, { page = 1, pageSize = 40 } = {}) {
  const total = transfers.length
  const size = Math.max(1, Math.min(100, Math.trunc(Number(pageSize)) || 40))
  const totalPages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(totalPages, Math.max(1, Math.trunc(Number(page)) || 1))
  const start = (current - 1) * size
  return {
    page: current,
    pageSize: size,
    total,
    totalPages,
    transfers: transfers.slice(start, start + size),
  }
}

/** `before` 是上一页最旧一笔的 id，用来把旧链接落到对应页。 */
export function pageFromBefore(transfers, before, pageSize = 40) {
  const size = Math.max(1, Math.min(100, Math.trunc(Number(pageSize)) || 40))
  const cursor = Math.trunc(Number(before) || 0)
  if (cursor <= 0 || transfers.length === 0) return 1
  const index = transfers.findIndex((transfer) => Number(transfer.id) < cursor)
  if (index < 0) return Math.max(1, Math.ceil(transfers.length / size))
  return Math.floor(index / size) + 1
}

async function toPublicTransfer(row, cache) {
  const reason = String(row.reason || '')
  return {
    id: Number(row.id),
    createdAt: Number(row.created_at || row.createdAt || 0),
    from: await publicAccount(row.from_account || row.fromAccount, cache),
    to: await publicAccount(row.to_account || row.toAccount, cache),
    amount: Number(row.amount || 0),
    reason,
    reasonLabel: reasonLabel(reason),
    detail: publicDetail(reason, row.ref),
  }
}

function supplySnapshot(supply, transferCount, transfersHash) {
  const accounts = (supply?.accounts || [])
    .filter((account) => account.type === 'pool' || account.accountId === 'system:burn')
    .map((account) => ({
      accountId: account.accountId,
      label: account.label || SYSTEM_LABELS[account.accountId] || account.accountId,
      allocation: Number(account.allocation || 0),
      balance: Number(account.balance || 0),
    }))
  return {
    schema: RANBI_PUBLIC_LEDGER_SCHEMA,
    totalSupply: Number(supply?.totalSupply || 0),
    accounted: Number(supply?.accounted || 0),
    consistent: Boolean(supply?.consistent),
    circulating: Number(supply?.circulating || 0),
    burned: Number(supply?.burned || 0),
    identities: Number(supply?.identities || 0),
    accounts,
    transferCount,
    transfersHash,
  }
}

async function readTransfers(db) {
  const rows = []
  let after = 0
  for (;;) {
    const result = await db
      .prepare(
        `SELECT id, from_account, to_account, amount, reason, ref, created_at
           FROM ranbi_transfers
          WHERE id > ?1
          ORDER BY id ASC
          LIMIT 1000`
      )
      .bind(after)
      .all()
    const batch = result?.results || []
    rows.push(...batch)
    if (batch.length < 1000) break
    after = Number(batch[batch.length - 1].id)
  }
  return rows
}

export async function loadRanbiPublicLedger(db, { before = 0, page = 0, limit = 40, scope = 'page' } = {}) {
  if (!db) return null
  const { getRanbiSupplySummary } = await import('./points.js')
  const supply = await getRanbiSupplySummary(db)
  if (!supply) return null
  const cache = new Map()
  const rows = await readTransfers(db)
  const transfers = []
  for (const row of rows) transfers.push(await toPublicTransfer(row, cache))
  const transfersHash = await hashTransfers(transfers.map(canonicalTransferLine))
  const snapshot = supplySnapshot(supply, transfers.length, transfersHash)
  const snapshotHash = await hashSnapshot(snapshot)
  const pageSize = Math.max(1, Math.min(100, Math.trunc(Number(limit) || 40)))
  const newestFirst = [...transfers].reverse()
  const requestedPage = Math.trunc(Number(page) || 0)
  const resolvedPage = requestedPage > 0 ? requestedPage : pageFromBefore(newestFirst, before, pageSize)
  const paged = scope === 'all'
    ? { page: 1, pageSize: newestFirst.length || pageSize, total: newestFirst.length, totalPages: 1, transfers: newestFirst }
    : paginateNewestFirst(newestFirst, { page: resolvedPage, pageSize })
  return {
    generatedAt: new Date().toISOString(),
    snapshotHash,
    snapshot,
    transfers: paged.transfers,
    page: paged.page,
    pageSize: paged.pageSize,
    totalPages: paged.totalPages,
  }
}

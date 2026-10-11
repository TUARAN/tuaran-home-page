/**
 * 美股永续仓位快照。
 * 新快照追加到 US_STOCK_SNAPSHOTS，按 asOf + time 排序。
 * 有账户权益时填写 equity，并把 assetBase 设为 'equity'。
 * 仓位页没有权益时 assetBase 用 'gross'，档位按五笔毛名义计算。
 * A4 是四位数资产（1,000–9,999），A6 是六位数资产（100,000–999,999）。
 * 单笔可写 note；详情表「备注」列读取该字段，空值显示空白。
 */

import { positionBook } from './usStockPosition.js'

export const LEDGER_GOAL = { from: 'A4', to: 'A6' }

export const US_STOCK_SNAPSHOTS = [
  {
    id: '2026-09-26',
    asOf: '2026-09-26',
    time: '22:34',
    venue: 'Binance',
    venueLabel: '币安',
    marginMode: '逐仓',
    assetBase: 'gross',
    equity: null,
    positions: [
      { symbol: 'TSLAUSDT', underlying: 'TSLA', name: '特斯拉', side: 'long', leverage: 3, qty: 0.44, mark: 372.08, entry: 371.8, liquidation: 253.06, breakeven: 372.18, pnl: 0.12, pnlPercent: 0.22, marginRatio: 1628.46, margin: 54.53 },
      { symbol: 'AAPLUSDT', underlying: 'AAPL', name: '苹果', side: 'long', leverage: 5, qty: 3, mark: 340.15, entry: 340.27, liquidation: 277.92, breakeven: 340.62, pnl: -0.37, pnlPercent: -0.18, marginRatio: 974.23, margin: 204.16 },
      { symbol: 'NETUSDT', underlying: 'NET', name: 'Cloudflare', side: 'long', leverage: 3, qty: 3, mark: 350.83, entry: 352.31, liquidation: 239.8, breakeven: 352.68, pnl: -4.47, pnlPercent: -1.27, marginRatio: 1612.21, margin: 352.31 },
      { symbol: 'SPCXUSDT', underlying: 'SPCX', name: 'SpaceX', side: 'long', leverage: 5, qty: 5, mark: 148.63, entry: 148.68, liquidation: 119.79, breakeven: 148.83, pnl: -0.26, pnlPercent: -0.17, marginRatio: 2853.29, margin: 148.68 },
      {
        symbol: 'TWLOUSDT',
        underlying: 'TWLO',
        name: 'Twilio',
        side: 'short',
        leverage: 3,
        qty: 0.55,
        mark: 272.71,
        entry: 278.68,
        liquidation: 364.1,
        breakeven: 278.4,
        pnl: 3.28,
        pnlPercent: 6.42,
        marginRatio: 1768.39,
        margin: 51.09,
        note: '我先买过 Twilio 现货。现货继续涨并创新高，涨幅看着过陡。转到永续后不想追那个高点，所以这笔做成空头。整本仓位仍按偏多来配。我希望空错、价格继续涨；真涨起来，我可能再追。',
      },
    ],
  },
]

export function assetTier(amount) {
  if (!Number.isFinite(amount) || amount < 1) return null
  const digits = Math.floor(amount).toString().length
  return `A${digits}`
}

export function tierBounds(tier) {
  const digits = Number(String(tier || '').replace(/^A/i, ''))
  if (!Number.isInteger(digits) || digits < 1) return null
  return {
    tier: `A${digits}`,
    digits,
    floor: 10 ** (digits - 1),
    ceiling: 10 ** digits,
  }
}

export function assetAmount(snapshot, book) {
  if (snapshot?.assetBase === 'equity' && Number.isFinite(snapshot.equity)) return snapshot.equity
  return book?.gross ?? null
}

export function progressToward(amount, fromTier = LEDGER_GOAL.from, toTier = LEDGER_GOAL.to) {
  const from = tierBounds(fromTier)
  const to = tierBounds(toTier)
  if (!from || !to || !(amount > 0) || !(to.floor > from.floor)) return null
  const span = Math.log10(to.floor) - Math.log10(from.floor)
  const ratio = (Math.log10(amount) - Math.log10(from.floor)) / span
  return {
    ratio: Math.min(1, Math.max(0, ratio)),
    multiple: to.floor / amount,
    remaining: Math.max(0, to.floor - amount),
  }
}

function snapshotKey(snapshot) {
  return `${snapshot?.asOf || ''}T${snapshot?.time || '00:00'}`
}

export function orderedSnapshots(snapshots = US_STOCK_SNAPSHOTS) {
  return [...snapshots].sort((a, b) => snapshotKey(a).localeCompare(snapshotKey(b)))
}

export function latestSnapshot(snapshots = US_STOCK_SNAPSHOTS) {
  return orderedSnapshots(snapshots).at(-1) || null
}

function diffBooks(before, after) {
  const names = new Set([
    ...(before?.rows || []).map((row) => row.underlying),
    ...(after?.rows || []).map((row) => row.underlying),
  ])
  return [...names].map((underlying) => {
    const previous = before.rows.find((row) => row.underlying === underlying) || null
    const next = after.rows.find((row) => row.underlying === underlying) || null
    const change = !previous ? 'opened' : !next ? 'closed' : previous.side !== next.side ? 'flipped' : 'held'
    return {
      underlying,
      name: next?.name || previous?.name || underlying,
      change,
      previousQty: previous ? (previous.side === 'short' ? -previous.qty : previous.qty) : null,
      nextQty: next ? (next.side === 'short' ? -next.qty : next.qty) : null,
      notionalDelta: (next?.notional || 0) - (previous?.notional || 0),
    }
  })
}

export function reviewLedger(snapshots = US_STOCK_SNAPSHOTS) {
  const books = orderedSnapshots(snapshots).map((snapshot) => {
    const book = positionBook(snapshot)
    const amount = assetAmount(snapshot, book)
    return {
      snapshot,
      book,
      amount,
      tier: assetTier(amount),
      assetBase: snapshot.assetBase === 'equity' ? 'equity' : 'gross',
    }
  })
  const latest = books.at(-1) || null
  const previous = books.length > 1 ? books.at(-2) : null
  return {
    goal: LEDGER_GOAL,
    start: tierBounds(LEDGER_GOAL.from),
    target: tierBounds(LEDGER_GOAL.to),
    books,
    latest,
    previous,
    progress: latest ? progressToward(latest.amount) : null,
    changes: previous ? diffBooks(previous.book, latest.book) : [],
  }
}

import Link from 'next/link'

import { formatUsd } from '../../../../lib/usStockBasket'
import { latestSnapshot } from '../../../../lib/usStockLedger'
import { positionBook } from '../../../../lib/usStockPosition'

function shareLabel(weight) {
  return `${(weight * 100).toFixed(2)}%`
}

function pnlClass(value) {
  if (!Number.isFinite(value) || value === 0) return 'text-[var(--site-ink)]'
  return value > 0 ? 'text-[#d94a4a]' : 'text-[#1c8c5e]'
}

function signedQty(row) {
  const text = row.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return row.side === 'short' ? `-${text}` : text
}

export default function UsStockBook({ detail = false, linked = false }) {
  const book = positionBook(latestSnapshot())
  const segments = book.rows.map((row) => {
    const body = (
      <>
        <span className="truncate text-sm font-semibold text-[var(--site-ink)]">{row.name}</span>
        <span className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--site-faint)]">
          {row.side === 'short' ? '空' : '多'} · {row.leverage}x
        </span>
        <span className="mt-1 font-mono text-base text-[var(--site-ink)]">{shareLabel(row.weight)}</span>
      </>
    )
    const className = 'flex min-w-0 flex-col justify-center border-r border-[var(--site-line)] px-3 py-3 last:border-r-0'
    if (!linked) {
      return <div key={row.symbol} style={{ flexGrow: row.weight, flexBasis: 0 }} className={className}>{body}</div>
    }
    return (
      <Link key={row.symbol} href="/web3/us-stocks" style={{ flexGrow: row.weight, flexBasis: 0 }} className={`${className} no-underline hover:bg-[var(--site-panel-strong)]`}>
        {body}
      </Link>
    )
  })

  return (
    <div>
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] sm:flex" aria-label="2026-09-26 仓位名义占比">
        {segments}
      </div>
      <ul className="space-y-2 sm:hidden">
        {book.rows.map((row) => (
          <li key={row.symbol} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.75rem] items-center gap-3">
            <span className="truncate text-sm font-semibold text-[var(--site-ink)]">{row.name}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[var(--site-line)]" aria-hidden="true">
              <span className="block h-full rounded-full bg-[var(--site-ink)]" style={{ width: shareLabel(row.weight) }} />
            </span>
            <span className="text-right font-mono text-xs text-[var(--site-ink)]">{shareLabel(row.weight)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-5 text-[var(--site-faint)]">
        {book.asOf} {book.venueLabel} USDT 永续，{book.marginMode}。每段宽度是该笔名义占五笔毛名义的比例。毛名义 {formatUsd(book.gross)}，保证金 {formatUsd(book.margin)}，浮动收益 <span className={pnlClass(book.pnl)}>{formatUsd(book.pnl)}</span>。Twilio 是空头。
      </p>
      {detail ? <PositionTable book={book} /> : null}
    </div>
  )
}

function PositionTable({ book }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
      <table className="min-w-[920px] w-full border-collapse text-left text-xs">
        <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]">
          <tr>
            {['合约', '方向', '杠杆', '数量', '标记价', '开仓均价', '名义', '占比', '保证金', '浮动收益', '强平价'].map((label) => (
              <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {book.rows.map((row) => (
            <tr key={row.symbol} className="border-t border-[var(--site-line)] font-mono text-[var(--site-ink)]">
              <td className="whitespace-nowrap px-3 py-2">{row.symbol}</td>
              <td className="px-3 py-2">{row.side === 'short' ? '空' : '多'}</td>
              <td className="px-3 py-2">{row.leverage}x</td>
              <td className="px-3 py-2">{signedQty(row)}</td>
              <td className="px-3 py-2">{formatUsd(row.mark)}</td>
              <td className="px-3 py-2">{formatUsd(row.entry)}</td>
              <td className="px-3 py-2">{formatUsd(row.notional)}</td>
              <td className="px-3 py-2">{shareLabel(row.weight)}</td>
              <td className="px-3 py-2">{formatUsd(row.margin)}</td>
              <td className={`whitespace-nowrap px-3 py-2 ${pnlClass(row.pnl)}`}>{formatUsd(row.pnl)} ({row.pnlPercent > 0 ? '+' : ''}{row.pnlPercent.toFixed(2)}%)</td>
              <td className="px-3 py-2">{formatUsd(row.liquidation)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

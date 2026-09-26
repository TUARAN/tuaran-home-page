import { formatUsd } from '../../../../lib/usStockBasket'
import { reviewLedger } from '../../../../lib/usStockLedger'

const CHANGE_LABEL = {
  opened: '新开',
  closed: '平掉',
  flipped: '多空对调',
  held: '续持',
}

function baseLabel(assetBase) {
  return assetBase === 'equity' ? '账户权益' : '毛名义'
}

export default function UsStockReview({ compact = false }) {
  const review = reviewLedger()
  const latest = review.latest
  if (!latest) return null
  const progress = review.progress
  const percent = progress ? Math.round(progress.ratio * 1000) / 10 : 0

  if (compact) {
    return (
      <p className="mt-2 text-xs leading-5 text-[var(--site-faint)]">
        资产档位从 {review.goal.from} 坐到 {review.goal.to}。当前按{baseLabel(latest.assetBase)} {formatUsd(latest.amount)} 记在 {latest.tier}，{review.goal.to} 从 {formatUsd(review.target.floor)} 起。
      </p>
    )
  }

  return (
    <section id="position-review" className="mt-6 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-faint)]">{review.goal.from} → {review.goal.to}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--site-ink)]">资产档位</h2>
        </div>
        <p className="font-mono text-sm text-[var(--site-ink)]">{latest.tier} · {formatUsd(latest.amount)}</p>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">
        {review.goal.from} 是 {formatUsd(review.start.floor)} 到 {formatUsd(review.start.ceiling - 1)}，{review.goal.to} 是 {formatUsd(review.target.floor)} 到 {formatUsd(review.target.ceiling - 1)}。这一笔按{baseLabel(latest.assetBase)}分档。到 {review.goal.to} 门槛还要 {progress.multiple.toFixed(2)} 倍。
      </p>
      <div className="mt-4" aria-label={`从 ${review.goal.from} 到 ${review.goal.to} 的对数进度`}>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--site-line)]">
          <div className="h-full rounded-full bg-[var(--site-ink)]" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--site-faint)]">
          <span>{review.goal.from} {formatUsd(review.start.floor)}</span>
          <span>A5 {formatUsd(10000)}</span>
          <span>{review.goal.to} {formatUsd(review.target.floor)}</span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]">
            <tr>
              {['日期', '场所', '口径', '资产', '档位', '毛名义', '保证金', '浮动收益', '笔数'].map((label) => (
                <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...review.books].reverse().map((entry) => (
              <tr key={entry.snapshot.id} className="border-t border-[var(--site-line)] font-mono text-[var(--site-ink)]">
                <td className="whitespace-nowrap px-3 py-2">{entry.snapshot.asOf} {entry.snapshot.time}</td>
                <td className="px-3 py-2">{entry.snapshot.venueLabel}</td>
                <td className="px-3 py-2">{baseLabel(entry.assetBase)}</td>
                <td className="px-3 py-2">{formatUsd(entry.amount)}</td>
                <td className="px-3 py-2">{entry.tier}</td>
                <td className="px-3 py-2">{formatUsd(entry.book.gross)}</td>
                <td className="px-3 py-2">{formatUsd(entry.book.margin)}</td>
                <td className="px-3 py-2">{formatUsd(entry.book.pnl)}</td>
                <td className="px-3 py-2">{entry.book.rows.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {review.changes.length ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <caption className="px-3 py-2 text-left text-[var(--site-faint)]">相对上一笔 {review.previous.snapshot.asOf}</caption>
            <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]">
              <tr>
                {['标的', '变化', '上一笔数量', '这一笔数量', '名义变化'].map((label) => (
                  <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {review.changes.map((change) => (
                <tr key={change.underlying} className="border-t border-[var(--site-line)] font-mono text-[var(--site-ink)]">
                  <td className="px-3 py-2">{change.name}</td>
                  <td className="px-3 py-2">{CHANGE_LABEL[change.change]}</td>
                  <td className="px-3 py-2">{formatQty(change.previousQty)}</td>
                  <td className="px-3 py-2">{formatQty(change.nextQty)}</td>
                  <td className="px-3 py-2">{formatUsd(change.notionalDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[var(--site-faint)]">下一笔快照追加后，这里对照数量、方向和名义。</p>
      )}
    </section>
  )
}

function formatQty(value) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

import { RANBI_POOL_ALLOCATIONS, RANBI_TOTAL_SUPPLY } from '../../../lib/points'

const POOL_COLORS = ['#b98928', '#d5a947', '#64806d', '#91a48d', '#c67c62']
const STATE_COLORS = {
  reserve: '#b98928',
  circulating: '#64806d',
  burned: '#9d5a45',
}

function formatAmount(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

function formatSnapshotTime(value) {
  if (!value) return '固定规则快照 · 实时余额待数据库连接'
  return `截至 ${new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))}`
}

function widthOf(value, total) {
  if (!total) return '0%'
  return `${Math.max(0, Math.min(100, Number(value || 0) / total * 100))}%`
}

export default function RanbiSupplySnapshot({ supply }) {
  const total = supply?.totalSupply || RANBI_TOTAL_SUPPLY
  const pools = RANBI_POOL_ALLOCATIONS.map((pool, index) => {
    const live = supply?.accounts?.find((row) => row.accountId === pool.accountId)
    const allocation = live?.allocation ?? pool.allocation
    const balance = live?.balance ?? allocation
    return {
      ...pool,
      allocation,
      balance,
      released: Math.max(0, allocation - balance),
      color: POOL_COLORS[index],
    }
  })
  const reserveBalance = pools.reduce((sum, pool) => sum + pool.balance, 0)
  const circulating = supply?.circulating || 0
  const burned = supply?.burned || 0
  const stock = Math.max(0, total - burned)
  const state = [
    { key: 'reserve', label: '分配池库存', value: reserveBalance },
    { key: 'circulating', label: '用户流通', value: circulating },
    { key: 'burned', label: '已消耗（销毁）', value: burned },
  ]

  return (
    <figure className="mb-6 overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] shadow-[0_18px_55px_color-mix(in_srgb,var(--site-shadow)_20%,transparent)]">
      <figcaption className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--site-line)] px-4 py-4 sm:px-5">
        <div>
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b6927] dark:text-amber-300">RANBI SUPPLY SNAPSHOT</p>
          <h3 className="mb-0 mt-1 text-[18px] font-semibold text-[var(--site-ink)]">燃币供应快照</h3>
        </div>
        <time dateTime={supply?.snapshotAt ? new Date(supply.snapshotAt).toISOString() : undefined} className="rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 font-mono text-[10px] text-[var(--site-muted)]">
          {formatSnapshotTime(supply?.snapshotAt)}
        </time>
      </figcaption>

      <div className="grid grid-cols-3 gap-2 border-b border-[var(--site-line)] p-4 sm:gap-3 sm:p-5">
        {[
          ['固定总量', total, '100%'],
          ['已消耗', burned, `${(burned / total * 100).toFixed(3)}%`],
          ['当前存量', stock, `${(stock / total * 100).toFixed(3)}%`],
        ].map(([label, value, ratio]) => (
          <div key={label} className="min-w-0 rounded-xl bg-[var(--site-panel)] p-2.5 sm:p-3.5">
            <p className="m-0 truncate text-[10px] text-[var(--site-muted)] sm:text-[11px]">{label}</p>
            <p className="mb-0 mt-1 truncate font-mono text-[13px] font-semibold text-[var(--site-ink)] sm:text-[19px]">{formatAmount(value)}</p>
            <p className="mb-0 mt-0.5 font-mono text-[9px] text-[var(--site-faint)] sm:text-[10px]">{ratio}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <section aria-labelledby="ranbi-allocation-title">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h4 id="ranbi-allocation-title" className="text-[13px] font-semibold text-[var(--site-ink)]">初始分配</h4>
            <span className="font-mono text-[10px] text-[var(--site-faint)]">合计 {formatAmount(total)}</span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg" role="img" aria-label={`固定总量 ${formatAmount(total)} 枚，分配到五个储备池`}>
            {pools.map((pool) => (
              <span key={pool.accountId} style={{ width: widthOf(pool.allocation, total), backgroundColor: pool.color }} title={`${pool.label}：${formatAmount(pool.allocation)}`} />
            ))}
          </div>
          <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {pools.map((pool) => (
              <div key={pool.accountId} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-[10px] sm:text-[11px]">
                <span className="flex min-w-0 items-start gap-2 leading-4 text-[var(--site-muted)]"><i className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: pool.color }} />{pool.label}</span>
                <span className="shrink-0 font-mono leading-4 text-[var(--site-ink)]">{pool.ratio}% · {formatAmount(pool.allocation)}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ranbi-state-title">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h4 id="ranbi-state-title" className="text-[13px] font-semibold text-[var(--site-ink)]">当前总量状态</h4>
            <span className="font-mono text-[10px] text-[var(--site-faint)]">库存 + 流通 + 消耗 = 总量</span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg bg-[var(--site-line)]" role="img" aria-label={`分配池库存 ${formatAmount(reserveBalance)}，用户流通 ${formatAmount(circulating)}，已消耗 ${formatAmount(burned)}`}>
            {state.map((item) => (
              <span key={item.key} style={{ width: widthOf(item.value, total), backgroundColor: STATE_COLORS[item.key] }} title={`${item.label}：${formatAmount(item.value)}`} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {state.map((item) => (
              <div key={item.key} className="rounded-lg border border-[var(--site-line)] px-3 py-2">
                <span className="flex items-center gap-2 text-[10px] text-[var(--site-muted)]"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS[item.key] }} />{item.label}</span>
                <strong className="mt-1 block truncate font-mono text-[10px] text-[var(--site-ink)] sm:text-[12px]">{formatAmount(item.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ranbi-pool-title">
          <h4 id="ranbi-pool-title" className="mb-3 text-[13px] font-semibold text-[var(--site-ink)]">各分配池库存</h4>
          <div className="space-y-3">
            {pools.map((pool) => (
              <div key={pool.accountId}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[10px]">
                  <span className="font-medium text-[var(--site-ink)]">{pool.label}</span>
                  <span className="font-mono text-[var(--site-muted)]">剩余 {formatAmount(pool.balance)} · 已释放 {formatAmount(pool.released)}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--site-line)]" aria-label={`${pool.label}剩余 ${formatAmount(pool.balance)}，已释放 ${formatAmount(pool.released)}`}>
                  <span style={{ width: widthOf(pool.balance, pool.allocation), backgroundColor: pool.color }} />
                  <span className="bg-[var(--site-panel)]" style={{ width: widthOf(pool.released, pool.allocation) }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="m-0 border-t border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 text-[10px] leading-5 text-[var(--site-faint)] sm:px-5">
        当前存量 = 固定总量 − 已消耗；已消耗指进入黑洞账户、永久退出流通的燃币。储备池“已释放”包含用户仍持有和后来已消耗的部分，不等同于消耗量。
      </p>
    </figure>
  )
}

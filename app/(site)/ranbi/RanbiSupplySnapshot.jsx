import { RANBI_POOL_ALLOCATIONS, RANBI_TOTAL_SUPPLY } from '../../../lib/points'

export const RANBI_POOL_COLORS = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777']
const STATE_COLORS = {
  reserve: '#2563eb',
  circulating: '#059669',
  burned: '#dc2626',
}

const SUMMARY_COLORS = ['#2563eb', '#dc2626', '#059669']

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
      color: RANBI_POOL_COLORS[index],
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
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">RANBI SUPPLY SNAPSHOT</p>
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
        ].map(([label, value, ratio], index) => (
          <div key={label} className="relative min-w-0 overflow-hidden rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-2.5 sm:p-3.5">
            <span className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: SUMMARY_COLORS[index] }} />
            <p className="m-0 flex items-center gap-1.5 truncate text-[10px] text-[var(--site-muted)] sm:text-[11px]">
              <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SUMMARY_COLORS[index] }} />
              {label}
            </p>
            <p className="mb-0 mt-1 truncate font-mono text-[13px] font-semibold text-[var(--site-ink)] sm:text-[19px]">{formatAmount(value)}</p>
            <p className="mb-0 mt-0.5 font-mono text-[9px] text-[var(--site-faint)] sm:text-[10px]">{ratio}</p>
          </div>
        ))}
      </div>

      <div className="space-y-7 p-4 sm:p-5">
        <section aria-labelledby="ranbi-allocation-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h4 id="ranbi-allocation-title" className="text-[13px] font-semibold text-[var(--site-ink)]">五个分配池</h4>
              <p className="mb-0 mt-1 text-[10px] text-[var(--site-faint)]">每种颜色固定代表一个池子；卡片内可直接对照初始额度、剩余和已释放</p>
            </div>
            <span className="font-mono text-[10px] text-[var(--site-faint)]">合计 {formatAmount(total)}</span>
          </div>
          <div className="flex h-9 overflow-hidden rounded-xl ring-1 ring-inset ring-black/5" role="img" aria-label={`固定总量 ${formatAmount(total)} 枚，分配到五个储备池`}>
            {pools.map((pool, index) => (
              <span
                key={pool.accountId}
                className="flex items-center justify-center border-r border-white/40 font-mono text-[10px] font-bold text-white last:border-r-0"
                style={{ width: widthOf(pool.allocation, total), backgroundColor: pool.color }}
                title={`${index + 1}. ${pool.label}：${formatAmount(pool.allocation)}`}
              >
                {index + 1}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {pools.map((pool, index) => (
              <div key={pool.accountId} className="overflow-hidden rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)]">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <i className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-bold not-italic text-white" style={{ backgroundColor: pool.color }}>{index + 1}</i>
                    <span className="truncate text-[11px] font-semibold text-[var(--site-ink)]">{pool.label}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--site-line)] px-2 py-0.5 font-mono text-[9px] font-semibold" style={{ color: pool.color }}>{pool.ratio}%</span>
                </div>
                <div className="grid grid-cols-3 border-t border-[var(--site-line)] text-[9px]">
                  <div className="px-3 py-2">
                    <span className="block text-[var(--site-faint)]">初始额度</span>
                    <strong className="mt-0.5 block truncate font-mono text-[10px] text-[var(--site-ink)]">{formatAmount(pool.allocation)}</strong>
                  </div>
                  <div className="border-x border-[var(--site-line)] px-3 py-2">
                    <span className="block text-[var(--site-faint)]">当前剩余</span>
                    <strong className="mt-0.5 block truncate font-mono text-[10px] text-[var(--site-ink)]">{formatAmount(pool.balance)}</strong>
                  </div>
                  <div className="px-3 py-2">
                    <span className="block text-[var(--site-faint)]">累计释放</span>
                    <strong className="mt-0.5 block truncate font-mono text-[10px] text-[var(--site-ink)]">{formatAmount(pool.released)}</strong>
                  </div>
                </div>
                <div className="flex h-1.5 bg-[var(--site-line)]" aria-label={`${pool.label}初始 ${formatAmount(pool.allocation)}，当前剩余 ${formatAmount(pool.balance)}，累计释放 ${formatAmount(pool.released)}`}>
                  <span style={{ width: widthOf(pool.balance, pool.allocation), backgroundColor: pool.color }} />
                  <span className="bg-[var(--site-panel-strong)]" style={{ width: widthOf(pool.released, pool.allocation) }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-1 sm:gap-2" aria-label="燃币从储备池到用户账户再到销毁账户的流转过程">
          {state.map((item, index) => (
            <div key={item.key} className="contents">
              <div className="min-w-0 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-2 py-2.5 text-center sm:px-3">
                <span className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white" style={{ backgroundColor: STATE_COLORS[item.key] }}>{index + 1}</span>
                <strong className="block text-[9px] text-[var(--site-ink)] sm:text-[11px]">{item.label}</strong>
                <span className="mt-0.5 block truncate font-mono text-[8px] text-[var(--site-muted)] sm:text-[10px]">{formatAmount(item.value)}</span>
              </div>
              {index < state.length - 1 ? (
                <svg className="h-4 w-4 self-center text-[var(--site-faint)]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10h13m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
        <p className="-mt-4 mb-0 text-center text-[9px] leading-4 text-[var(--site-faint)] sm:text-[10px]">
          储备池发放到个人账户；用户使用后，燃币进入销毁账户并永久退出流通
        </p>

        <section aria-labelledby="ranbi-state-title">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h4 id="ranbi-state-title" className="text-[13px] font-semibold text-[var(--site-ink)]">现在的 2,100 万枚在哪里</h4>
            <span className="font-mono text-[10px] text-[var(--site-faint)]">库存 + 流通 + 已销毁 = 固定总量</span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg bg-[var(--site-line)]" role="img" aria-label={`分配池库存 ${formatAmount(reserveBalance)}，用户流通 ${formatAmount(circulating)}，已消耗 ${formatAmount(burned)}`}>
            {state.map((item) => (
              <span key={item.key} style={{ width: widthOf(item.value, total), backgroundColor: STATE_COLORS[item.key] }} title={`${item.label}：${formatAmount(item.value)}`} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {state.map((item) => (
              <div key={item.key} className="relative overflow-hidden rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-2">
                <span className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: STATE_COLORS[item.key] }} />
                <span className="flex items-center gap-2 text-[10px] text-[var(--site-muted)]"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS[item.key] }} />{item.label}</span>
                <strong className="mt-1 block truncate font-mono text-[10px] text-[var(--site-ink)] sm:text-[12px]">{formatAmount(item.value)}</strong>
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

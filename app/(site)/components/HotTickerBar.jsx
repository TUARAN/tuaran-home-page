'use client'

import Link from 'next/link'

/* ─── Hot Ticker Marquee ───
 *  顶部细长流动条，置于站点导航下、首页 hero 上方，滚动时吸顶。
 *  每条都是一个独立入口（各自跳不同目的地），用来给重点动作更明显的推荐位：
 *   1. 竞猜世界杯赢燃币  2. 资源库  3. 博主联盟（推广 / 兼职） 4. 微信社群
 */
const TICKER_ITEMS = [
  { icon: '⚽', label: '竞猜世界杯 · 赢燃币', cta: '去竞猜', href: '/agent-world-cup' },
  { icon: '📚', label: '海量资源任你取', cta: '看资源', href: '/articles?tab=resources' },
  { icon: '💬', label: '加站长微信 · 交友进社群', cta: '加微信', href: '/community' },
  {
    icon: '🤝',
    label: '推广 AI 产品 / 兼职赚钱',
    cta: '博主联盟',
    href: 'https://blogger-alliance.cn/',
    external: true,
  },
]

function TickerItem({ item, focusable = true }) {
  const inner = (
    <>
      <span className="text-sm md:text-base leading-none">{item.icon}</span>
      <span className="hot-ticker-label text-[13px] md:text-[14px] font-semibold tracking-wide leading-none">
        {item.label}
      </span>
      <span className="hot-ticker-cta inline-flex items-center gap-0.5 rounded-full border px-2 py-px text-[10px] font-bold leading-none">
        {item.cta}&nbsp;&rarr;
      </span>
      <span className="hot-ticker-divider ml-3 inline-block h-1 w-1 shrink-0 rounded-full" />
    </>
  )
  const cls = 'hot-ticker-item group/item inline-flex shrink-0 items-center gap-1.5 no-underline hover:no-underline'
  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${cls}`} aria-label={item.label} tabIndex={focusable ? undefined : -1}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={cls} aria-label={item.label} tabIndex={focusable ? undefined : -1}>
      {inner}
    </Link>
  )
}

export default function HotTickerBar() {
  const groups = Array.from({ length: 4 })
  return (
    <div
      className="hot-ticker-wrapper"
      style={{
        position: 'sticky',
        top: 45,
        zIndex: 39,
      }}
    >
      <div className="hot-ticker-surface block overflow-hidden border-y">
        <div className="relative flex h-[36px] max-w-full items-center overflow-hidden md:h-[40px]">
          {/* 两侧渐隐 */}
          <div className="hot-ticker-fade hot-ticker-fade-left pointer-events-none absolute left-0 top-0 z-10 h-full w-[60px]" />
          <div className="hot-ticker-fade hot-ticker-fade-right pointer-events-none absolute right-0 top-0 z-10 h-full w-[60px]" />
          {/* 复制多组保证宽屏滚动时不露空；首帧从完整内容开始。 */}
          <div className="hot-ticker-track whitespace-nowrap">
            {groups.map((_, groupIndex) => (
              <div key={groupIndex} className="hot-ticker-group" aria-hidden={groupIndex > 0 ? 'true' : undefined}>
                {TICKER_ITEMS.map((item) => (
                  <TickerItem key={`${item.href}-${groupIndex}`} item={item} focusable={groupIndex === 0} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

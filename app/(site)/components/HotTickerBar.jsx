'use client'

import Link from 'next/link'

/* ─── Hot Ticker Marquee ───
 *  Slim scrolling bar, sticks to top of viewport on scroll.
 *  Placed below the site nav, above hero banner.
 */
export default function HotTickerBar() {
  const items = [
    { icon: '\u26BD', label: 'Agent世界杯', sub: 'FIFA 2026' },
    { icon: '\uD83C\uDFC6', label: '48队 \u00B7 104场', sub: '' },
    { icon: '\uD83D\uDCC5', label: '6.11 开幕 \u00B7 7.19 决赛', sub: '' },
    { icon: '\uD83C\uDF0D', label: '16城主办 \u00B7 北美三联', sub: '' },
    { icon: '\u26A1', label: '实时赛程 \u00B7 分组对阵', sub: '' },
    { icon: '\uD83D\uDD25', label: 'HOT 热点专题', sub: '' },
    { icon: '\u2192', label: '点击查看完整赛程', sub: '' },
  ]

  return (
    <div
      className="hot-ticker-wrapper"
      style={{
        position: 'sticky',
        top: 57,
        zIndex: 39,
        // Slight shadow for depth when overlaid on content
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      <Link
        href="/agent-world-cup"
        className="group no-underline block overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #0a0e1a 0%, #111827 40%, #0d1322 70%, #080c16 100%)',
          borderTop: '1px solid rgba(212,168,83,0.3)',
          borderBottom: '1px solid rgba(212,168,83,0.25)',
        }}
        aria-label="Agent世界杯热点入口"
      >
        {/* Scroll container */}
        <div className="relative flex items-center h-[36px] md:h-[40px]">
          {/* Left gradient fade */}
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-[60px]"
            style={{ background: 'linear-gradient(90deg, #0a0e1a 0%, transparent 100%)' }}
          />
          {/* Right gradient fade */}
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[60px]"
            style={{ background: 'linear-gradient(270deg, #0a0e1a 0%, transparent 100%)' }}
          />

          {/* Scrolling content — CSS marquee */}
          <div className="flex items-center hot-ticker-track whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 mx-3">
                <span className="text-sm md:text-base leading-none">{item.icon}</span>
                <span
                  className="text-[13px] md:text-[14px] font-semibold tracking-wide leading-none"
                  style={{ color: '#e8eaF4' }}
                >
                  {item.label}
                </span>
                {item.sub && (
                  <span
                    className="hidden sm:inline font-mono text-[10px] tracking-[0.12em] uppercase px-1.5 py-px rounded leading-none"
                    style={{
                      color: '#d4a853',
                      background: 'rgba(212,168,83,0.1)',
                      border: '1px solid rgba(212,168,83,0.18)',
                    }}
                  >
                    {item.sub}
                  </span>
                )}
                <span
                  className="ml-3 inline-block w-1 h-1 rounded-full shrink-0"
                  style={{ background: 'rgba(212,168,83,0.35)' }}
                />
              </span>
            ))}
          </div>

          {/* Static CTA on hover — appears at right edge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                color: '#d4a853',
                background: 'rgba(212,168,83,0.15)',
                border: '1px solid rgba(212,168,83,0.3)',
              }}
            >
              进入 &rarr;
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

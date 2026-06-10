import Link from 'next/link'
import Image from 'next/image'
import DaysSince from './components/DaysSince'
import SiteFooter from './components/SiteFooter'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE } from '../../lib/siteIntro'
import { getHomeFeaturedPicks, HOME_SECTION_MORE_LINKS } from '../../lib/homeHighlights'

export const dynamic = 'force-static'

const SECTION_BADGE_CLASS = {
  column:
    'border-[#d8d9cf] bg-[#f0f1ec] text-[#606350] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#b4b8a3]',
  research:
    'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  resources:
    'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
}

const SECTION_NAV_LINK_CLASS = {
  column:
    'border-[#b7baa8] bg-[#e4e6dc] text-[#2f3228] shadow-[0_4px_14px_rgba(82,69,45,0.08)] hover:border-[#9a9d8c] hover:bg-[#d8dacf] dark:border-[#4a5240] dark:bg-[#243028] dark:text-[#e2e6d4] dark:shadow-[0_4px_14px_rgba(0,0,0,0.2)] dark:hover:border-[#5c6854] dark:hover:bg-[#2c3a30]',
  research:
    'border-[#8aabd6] bg-[#d4e4f8] text-[#1a3d6b] shadow-[0_4px_14px_rgba(59,91,138,0.12)] hover:border-[#6f94c8] hover:bg-[#c2d8f2] dark:border-[#3a5580] dark:bg-[#1a2d4a] dark:text-[#c8dcf5] dark:shadow-[0_4px_14px_rgba(0,0,0,0.2)] dark:hover:border-[#4a6a98] dark:hover:bg-[#223a5c]',
  resources:
    'border-[#7ab89a] bg-[#cfe8db] text-[#1a4f38] shadow-[0_4px_14px_rgba(56,107,84,0.1)] hover:border-[#5fa882] hover:bg-[#b8dcc8] dark:border-[#2e5540] dark:bg-[#1a3028] dark:text-[#b8e0cc] dark:shadow-[0_4px_14px_rgba(0,0,0,0.2)] dark:hover:border-[#3d6a50] dark:hover:bg-[#223c30]',
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function HomeFeaturedLinkItem({ item }) {
  const className =
    'group block rounded-xl px-2 py-2 no-underline transition hover:bg-[#f0f1ec] dark:hover:bg-[#18202a]'
  const content = (
    <>
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {item.isLatest ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-[#b7baa8] bg-[#dee0d4] px-2 py-0.5 font-mono text-[10px] text-[#6b4f1d] dark:border-[#313424] dark:bg-[#1e1e18] dark:text-[#abb38a]">
            最新
          </span>
        ) : null}
        <span
          className={[
            'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-2 py-0.5 font-mono text-[10px]',
            SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column,
          ].join(' ')}
        >
          {item.sectionLabel}
        </span>
        {item.tagLabel ? (
          <span className="inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border border-[#dfe0d8] bg-white px-2 py-0.5 font-mono text-[10px] text-[#77796c] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6]">
            {item.tagLabel}
          </span>
        ) : null}
        {item.date ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-[#9b9b93] dark:text-gray-500">
            {item.date}
          </span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13.5px] font-medium leading-5 text-[#1a1814] group-hover:text-[#5a4725] dark:text-gray-100 dark:group-hover:text-[#c9ccb5]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-0.5 line-clamp-1 text-[12px] leading-5 text-[#77796c] dark:text-gray-400">
          {item.summary}
        </p>
      ) : null}
    </>
  )

  if (item.external || isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

function HomeFeaturedSection({ items }) {
  if (!items.length) return null
  return (
    <section className="rounded-[24px] border border-[#dcded6] bg-[#f9faf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0] mb-2">
            Start Here
          </p>
          <h2 className="home-section-title">推荐阅读</h2>
        </div>
        <nav
          aria-label="查看更多内容分类"
          className="flex shrink-0 flex-wrap items-center justify-end gap-2"
        >
          {HOME_SECTION_MORE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-semibold no-underline transition-all',
                'hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(82,69,45,0.12)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]',
                SECTION_NAV_LINK_CLASS[link.section] || SECTION_NAV_LINK_CLASS.column,
              ].join(' ')}
            >
              {link.label}
              <span aria-hidden="true" className="font-mono text-[12px] opacity-80">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>
      <p className="mb-4 text-[13px] leading-[1.85] text-[#6d6f65] dark:text-[#8e98a8]">
        专栏文章、专题调研与站内资料 —— 最新内容优先，其余每日轮换。
      </p>
      <div className="rounded-2xl border border-[#dfe0d8] bg-white p-3 dark:border-[#232c36] dark:bg-[#121821]">
        <div className="space-y-1">
          {items.map((item) => (
            <HomeFeaturedLinkItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const featuredPicks = getHomeFeaturedPicks()
  return (
    <div className="max-w-[1120px] w-full mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col">
      <section className="flex-1 mb-14">
        <header className="relative mb-8 overflow-hidden rounded-[28px] border border-[#d9dad2] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,240,0.92))] px-5 py-4 shadow-[0_16px_48px_rgba(91,78,53,0.06)] dark:border-[#27303a] dark:bg-[linear-gradient(135deg,rgba(20,24,31,0.96),rgba(13,17,23,0.92))] md:px-7 md:py-5">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_72%_50%,rgba(183,121,31,0.18),transparent_36%),linear-gradient(90deg,transparent,rgba(244,238,226,0.72))] dark:bg-[radial-gradient(circle_at_72%_50%,rgba(240,199,118,0.14),transparent_36%),linear-gradient(90deg,transparent,rgba(18,24,33,0.72))] lg:block" />
          <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 font-mono text-[2.6rem] font-semibold uppercase leading-none tracking-[0.16em] text-[#7c5d34]/[0.13] dark:text-white/[0.1] lg:block xl:right-14">
            2ARAN.COM
          </div>
          <div className="relative max-w-[760px] space-y-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#858779] dark:text-[#9ca5b5] mb-0">
                      涂阿燃｜安东尼 · 独立开发者
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="mb-0 max-w-[46rem] font-serif text-[1.28rem] font-semibold tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[1.56rem]">
                    {SITE_HERO_TAGLINE}
                  </h1>
                  <p className="mb-0 max-w-[44rem] font-serif text-[1rem] font-medium leading-[1.65] tracking-[0.02em] text-[#24251f] dark:text-[#e1e2dc] md:text-[1.06rem]">
                    {SITE_HERO_GOAL_PARTS.map((part, i) =>
                      typeof part === 'string' ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <span
                          key={i}
                          className="font-semibold tracking-[0.06em] bg-gradient-to-br from-[#4f4c38] via-[#355c6d] to-[#0d4a63] bg-clip-text text-transparent dark:from-[#c6c9b4] dark:via-[#93b8d4] dark:to-[#7eb0ef]"
                        >
                          {part.emphasis}
                        </span>
                      )
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-stretch gap-2.5">
                <a
                  href="https://blogger-alliance.cn/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#3a2c14] bg-[#3a2c14] px-3.5 py-2.5 no-underline shadow-[0_6px_18px_rgba(58,44,20,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#2a1f0e] hover:shadow-[0_10px_24px_rgba(58,44,20,0.2)] sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#c6c9b4] dark:bg-[#c6c9b4] dark:hover:bg-[#d5d8c4]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#a1ab76]/15 text-[#a1ab76] dark:bg-[#3a2c14]/15 dark:text-[#3a2c14]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#f4f6ef] dark:text-[#1d1a16]">
                      加入博主联盟
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-70">→</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#aaae9a] dark:text-[#5a4725]">
                      AI 产品方 ↔ 技术博主 · 品牌增长
                    </span>
                  </span>
                </a>
                <a
                  href="https://frontendnext.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#cacbc2] bg-white/75 px-3.5 py-2.5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#a1a494] hover:bg-white sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#3a4757] dark:bg-[#151c25] dark:hover:border-[#5a6a7e] dark:hover:bg-[#1a2330]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8eae1] text-[#8b5a1f] dark:bg-[#22303f] dark:text-[#989e72]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 6l8 8 8-8M4 13l8 8 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      订阅前端周看
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#6d6f65] dark:text-[#8e98a8]">
                      前端 / AI Agent / 大模型 · 技术情报站
                    </span>
                  </span>
                </a>
                <a
                  href="https://publishlab.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#cacbc2] bg-white/75 px-3.5 py-2.5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#a1a494] hover:bg-white sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#3a4757] dark:bg-[#151c25] dark:hover:border-[#5a6a7e] dark:hover:bg-[#1a2330]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8eae1] text-[#8b5a1f] dark:bg-[#22303f] dark:text-[#989e72]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 5h14v14H5zM8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      使用 PublishLab
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#6d6f65] dark:text-[#8e98a8]">
                      AI 写作 / 内容创作 / 数字出版
                    </span>
                  </span>
                </a>
              </div>
            </div>

          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_300px]">
          <main className="min-w-0 space-y-6">
            <HomeFeaturedSection items={featuredPicks} />
          </main>

          <aside className="w-full space-y-6">
            <section className="rounded-[24px] border border-[#dcdcd6] bg-[#f0f1ee] p-5 shadow-[0_8px_32px_rgba(82,69,45,0.04)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6">
              <div className="mb-5 border-b border-[#dee0db] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[116px] overflow-hidden bg-[#f0f1ee] dark:bg-[#0f1318]">
                  <Image
                    src={AVATAR_PATH}
                    alt="涂阿燃"
                    width={128}
                    height={160}
                    priority
                    sizes="116px"
                    className="h-auto w-full object-cover shadow-none"
                  />
                </div>
                <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#767869] dark:text-gray-400">
                  前端 · AI Agent · 奶爸
                </p>
                <p className="mt-1 text-[12px] tracking-[0.06em] text-[#888] dark:text-gray-500">
                  Founder @矩联科技
                </p>
                <blockquote className="mx-auto mt-3 max-w-[min(280px,100%)]">
                  <p className="font-serif text-[15px] leading-[1.9] tracking-wide text-[#262724] dark:text-gray-200">
                    选一件值得投入 <span className="font-semibold">20 年</span> 的事，
                    <span className="mt-0.5 block">每日复利，高频迭代。</span>
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#85887a] dark:text-gray-500">
                    <span aria-hidden="true" className="h-px flex-1 bg-[#c8c9bf] dark:bg-gray-700" />
                    <span>This time · with LLM</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[#c8c9bf] dark:bg-gray-700" />
                  </div>
                  <div className="mt-2.5 flex justify-center">
                    <DaysSince />
                  </div>
                </blockquote>
                <Link
                  href="/context-memory"
                  className="mt-2 inline-flex items-center rounded-full border border-[#d0d1c8] bg-white/78 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#53554d] no-underline transition hover:border-[#b4b7a9] hover:text-[#222] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062] dark:hover:text-gray-100"
                >
                  我的上下文记忆
                </Link>
              </div>
              <div className="mt-5 border-t border-[#dee0db] pt-4 dark:border-gray-800/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[#858779] dark:text-[#8e9ab0]">
                    More
                  </p>
                  <Link
                    href="/map"
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#646655] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#acaf9d]"
                  >
                    地图 →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { href: '/publications', label: '出版' },
                    { href: '/about', label: '关于' },
                    { href: '/ai-projects', label: '工具' },
                  ].map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="no-external-arrow rounded-xl border border-[#d6d7cf] bg-white/70 px-2 py-2 text-center text-[12px] font-medium text-[#52534c] no-underline transition hover:border-[#b9bbad] hover:text-[#15140f] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6] dark:hover:border-[#435062] dark:hover:text-gray-100"
                    >
                      {card.label}
                    </Link>
                  ))}
                </div>

                {/* 微信加好友 + 公众号二维码 */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#d6d7cf] bg-white/70 p-3 dark:border-[#303947] dark:bg-[#151c25]">
                  <div className="flex flex-col items-center gap-1.5">
                    <Image
                      src="/qrcodewechat3.png"
                      alt="扫码加好友二维码"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                    />
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">加好友</span>
                    <span className="font-mono text-[10px] text-[#262724] dark:text-gray-200">atar24</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Image
                      src="/qrcode_for_gh.jpg"
                      alt="公众号二维码"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                    />
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">公众号</span>
                    <span className="font-mono text-[10px] text-[#262724] dark:text-gray-200">2aran</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

      </section>

      <section>
        <SiteFooter />
      </section>
    </div>
  )
}

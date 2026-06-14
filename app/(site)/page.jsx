import Link from 'next/link'
import Image from 'next/image'

import DaysSince from './components/DaysSince'
import HomeRecommendationCard from './components/HomeRecommendationCard'
import SiteFooter from './components/SiteFooter'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE, SITE_HERO_TITLE } from '../../lib/siteIntro'
import { getHomeFeaturedPicks, HOME_SECTION_MORE_LINKS } from '../../lib/homeHighlights'

export const dynamic = 'force-static'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
}

const CLASSIC_SECTION_BADGE_CLASS = {
  column:
    'border-[#d8d9cf] bg-[#f0f1ec] text-[#606350] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#b4b8a3]',
  research:
    'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  resources:
    'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
}

const CLASSIC_HOME_SECTION_TAB_CLASS = {
  column:
    'text-[#616358] hover:bg-white hover:text-[#4a4d3f] hover:shadow-sm hover:ring-1 hover:ring-[#d8d9cf] dark:text-gray-400 dark:hover:bg-[#1e2630] dark:hover:text-[#d5d8c8] dark:hover:ring-[#303947]',
  research:
    'text-[#616358] hover:bg-white hover:text-[#3b5b8a] hover:shadow-sm hover:ring-1 hover:ring-[#cbd9ee] dark:text-gray-400 dark:hover:bg-[#152034] dark:hover:text-[#9bb6df] dark:hover:ring-[#2a3a55]',
  resources:
    'text-[#616358] hover:bg-white hover:text-[#386b54] hover:shadow-sm hover:ring-1 hover:ring-[#c9dccf] dark:text-gray-400 dark:hover:bg-[#13201a] dark:hover:text-[#9dcab1] dark:hover:ring-[#243d33]',
}

const START_PATHS = [
  {
    href: '/articles',
    label: '读文章',
    title: '从判断和长期写作开始',
    desc: '原创专栏、AI 协助调研、资料索引，按阅读价值重新组织。',
    meta: 'Column · Research · Archive',
  },
  {
    href: '/works',
    label: '看项目',
    title: '看我把想法做成系统',
    desc: '可视化页面、AI 工具、长期工程和私域工作台，保留能反复演进的作品。',
    meta: 'Systems · Tools · Interfaces',
  },
  {
    href: '/services',
    label: '聊合作',
    title: '让内容、产品和增长连起来',
    desc: '技术内容、产品调研、创作者增长和 AI 工程化协作，适合需要长期判断的项目。',
    meta: 'Consulting · Content · Growth',
  },
]

const PRODUCT_LINKS = [
  {
    href: 'https://blogger-alliance.cn/',
    label: '博主联盟',
    desc: 'AI 产品方与技术博主的连接网络',
  },
  {
    href: 'https://frontendnext.com/',
    label: '前端周看',
    desc: '前端、AI Agent 与大模型工程情报',
  },
  {
    href: 'https://publishlab.cc/',
    label: 'PublishLab',
    desc: '面向创作者的 AI 写作与出版工具',
  },
]

const CLASSIC_SITE_HERO_TAGLINE = `${SITE_HERO_TITLE}：${SITE_HERO_TAGLINE}`

const PROFILE_LINKS = [
  { href: '/context-memory', label: '上下文记忆' },
  { href: '/publications', label: '出版作品' },
  { href: '/map', label: '全站地图' },
]

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HomeFeaturedLinkItem({ item }) {
  const content = (
    <>
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        {item.isLatest ? <span className="home-badge home-badge-latest">最新</span> : null}
        <span className={SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column}>
          {item.sectionLabel}
        </span>
        {item.tagLabel ? <span className="home-badge home-badge-muted">{item.tagLabel}</span> : null}
        {item.date ? <time className="home-item-date">{item.date}</time> : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[15px] font-semibold leading-6 text-[#191813] transition-colors group-hover:text-[#6c4c1f] dark:text-[#f2f3ed] dark:group-hover:text-[#d5d8c4]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-1 line-clamp-2 text-[13px] leading-6 text-[#686a5f] dark:text-[#9ca6b4]">
          {item.summary}
        </p>
      ) : null}
    </>
  )

  const className = 'home-reading-item group no-underline'
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

function FeaturedReading({ items }) {
  if (!items.length) return null
  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">Start here</p>
          <h2 className="home-section-title">先读这几篇</h2>
        </div>
        <div className="home-section-tabs" role="group" aria-label="按分类浏览更多内容">
          {HOME_SECTION_MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="home-tab-link">
              <span>{link.label}</span>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </div>
      <div className="home-reading-list">
        {items.map((item) => (
          <HomeFeaturedLinkItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function ClassicFeaturedLinkItem({ item }) {
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
            CLASSIC_SECTION_BADGE_CLASS[item.section] || CLASSIC_SECTION_BADGE_CLASS.column,
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

function ClassicFeaturedSection({ items }) {
  if (!items.length) return null
  return (
    <section className="classic-home-surface-panel rounded-[24px] border p-5 shadow-[0_12px_40px_var(--hero-shadow)] dark:border-[#252d36] dark:bg-[#0f141b] dark:shadow-none md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
            Start Here
          </p>
          <h2 className="classic-home-section-title">推荐阅读</h2>
        </div>
        <nav
          aria-label="按分类浏览更多内容"
          className="flex w-full shrink-0 flex-col gap-1.5 pt-0.5 sm:w-auto sm:items-end"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9b8f] sm:text-right dark:text-gray-500">
            浏览更多
          </span>
          <div
            role="group"
            className="grid grid-cols-3 gap-1 rounded-lg border border-[#dde0d6] bg-[#eceee6] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:inline-flex sm:items-center dark:border-gray-800 dark:bg-[#151a22] dark:shadow-none"
          >
            {HOME_SECTION_MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'group/tab inline-flex min-h-9 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium no-underline transition-all duration-150 sm:px-3',
                  CLASSIC_HOME_SECTION_TAB_CLASS[link.section] || CLASSIC_HOME_SECTION_TAB_CLASS.column,
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fb7d8] focus-visible:ring-offset-1 dark:focus-visible:ring-[#3b5b8a]',
                  'active:scale-[0.98]',
                ].join(' ')}
              >
                <span>{link.label}</span>
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] text-[#9a9b8f] transition-transform group-hover/tab:translate-x-0.5 dark:text-gray-500"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <div className="classic-home-surface-card rounded-2xl border p-3">
        <div className="space-y-1">
          {items.map((item) => (
            <ClassicFeaturedLinkItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StartPathCard({ item }) {
  return (
    <Link href={item.href} className="home-path-card group no-underline">
      <span className="home-path-label">{item.label}</span>
      <h3>{item.title}</h3>
      <p>{item.desc}</p>
      <span className="home-path-meta">
        {item.meta}
        <ArrowIcon />
      </span>
    </Link>
  )
}

function ProductLink({ item }) {
  return (
    <a href={item.href} target="_blank" rel="noreferrer" className="home-product-link no-external-arrow group">
      <span>
        <strong>{item.label}</strong>
        <small>{item.desc}</small>
      </span>
      <ArrowIcon />
    </a>
  )
}

function HeroGoalText() {
  return (
    <>
      {SITE_HERO_GOAL_PARTS.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className="home-emphasis">
            {part.emphasis}
          </span>
        )
      )}
    </>
  )
}

function ProfileCard() {
  return (
    <section className="home-profile" aria-label="涂阿燃个人信息">
      <div className="home-profile-top">
        <div className="home-avatar-wrap">
          <Image
            src={AVATAR_PATH}
            alt="涂阿燃"
            width={160}
            height={200}
            priority
            sizes="112px"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="home-profile-name">涂阿燃</p>
          <p className="home-profile-role">前端 · AI Agent · 奶爸</p>
          <p className="home-profile-company">Founder @矩联科技</p>
        </div>
      </div>
      <blockquote>
        <p>
          选一件值得投入 <strong>20 年</strong> 的事，每日复利，高频迭代。
        </p>
        <div className="home-days">
          <DaysSince />
        </div>
      </blockquote>
      <div className="home-profile-links">
        {PROFILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="no-underline">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

function ClassicHeroGoalText() {
  return (
    <>
      {SITE_HERO_GOAL_PARTS.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <span
            key={i}
            className="bg-gradient-to-br from-[#4f4c38] via-[#355c6d] to-[#0d4a63] bg-clip-text font-semibold tracking-[0.06em] text-transparent dark:from-[#c6c9b4] dark:via-[#93b8d4] dark:to-[#7eb0ef]"
          >
            {part.emphasis}
          </span>
        )
      )}
    </>
  )
}

function ClassicHomePage({ featuredPicks }) {
  return (
    <main className="home-classic-root mx-auto flex w-full max-w-[1880px] flex-1 flex-col px-4 py-9 sm:px-6 md:py-12 lg:px-10">
      <section className="mb-14 flex-1">
        <header className="classic-home-hero relative mb-12 overflow-hidden rounded-[28px] border px-6 py-7 md:px-12 md:py-10">
          <div className="classic-home-hero-glow pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block" />
          <div className="classic-home-hero-watermark pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 font-mono text-[3.2rem] font-semibold uppercase leading-none tracking-[0.16em] lg:block xl:right-20 2xl:text-[4.4rem]">
            2ARAN.COM
          </div>
          <div className="relative max-w-[1260px] space-y-7">
            <div className="space-y-7">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.28em] text-[#858779] dark:text-[#9ca5b5] md:text-[15px]">
                      涂阿燃｜安东尼 · Agent 工程师
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="mb-0 max-w-[68rem] font-serif text-[1.72rem] font-semibold leading-[1.28] tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[2.28rem] xl:text-[2.6rem]">
                    {CLASSIC_SITE_HERO_TAGLINE}
                  </h1>
                  <p className="mb-0 max-w-[64rem] font-serif text-[1.12rem] font-medium leading-[1.65] tracking-[0.02em] text-[#24251f] dark:text-[#e1e2dc] md:text-[1.48rem]">
                    <ClassicHeroGoalText />
                    。
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-stretch gap-4">
                <a
                  href="https://blogger-alliance.cn/"
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-primary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-cta-icon-bg)', color: 'var(--hero-cta-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-cta-text)' }}>
                      加入博主联盟
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-70">→</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-cta-subtext)' }}>
                      AI 产品方 ↔ 技术博主 · 品牌增长
                    </span>
                  </span>
                </a>
                <a
                  href="https://frontendnext.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-secondary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-card-icon-bg)', color: 'var(--hero-card-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 6l8 8 8-8M4 13l8 8 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-card-title)' }}>
                      订阅前端周看
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      前端 / AI Agent / 大模型 · 技术情报站
                    </span>
                  </span>
                </a>
                <a
                  href="https://publishlab.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-secondary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-card-icon-bg)', color: 'var(--hero-card-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 5h14v14H5zM8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-card-title)' }}>
                      使用 PublishLab
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      AI 写作 / 内容创作 / 数字出版
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0 space-y-6">
            <ClassicFeaturedSection items={featuredPicks} />
          </div>

          <aside className="w-full space-y-6">
            <section className="classic-home-surface-panel rounded-[24px] border p-5 shadow-[0_8px_32px_var(--hero-shadow)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6">
              <div className="mb-5 border-b border-[#dee0db] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[152px] overflow-hidden bg-[var(--page-bg)] dark:bg-[#0f1318] xl:w-[200px]">
                  <Image
                    src={AVATAR_PATH}
                    alt="涂阿燃"
                    width={220}
                    height={220}
                    priority
                    sizes="(min-width: 1280px) 200px, 152px"
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
    </main>
  )
}

function PolishedHomePage({ featuredPicks }) {
  return (
    <main className="home-polished-root home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">2aran.com · Tuaran</p>
          <div className="home-hero-brand">
            <p className="home-hero-title" aria-hidden="true">
              {SITE_HERO_TITLE}
            </p>
            <span>{SITE_HERO_TAGLINE}</span>
          </div>
          <p className="home-hero-lead">
            <HeroGoalText />
          </p>
          <div className="home-hero-actions">
            <a href="https://blogger-alliance.cn/" target="_blank" rel="noreferrer" className="home-button home-button-primary no-external-arrow">
              进入博主联盟
            </a>
            <Link href="/services" className="home-button home-button-secondary">
              合作方式
            </Link>
          </div>
        </div>

        <HomeRecommendationCard />
      </section>

      <section className="home-paths" aria-label="站点主要入口">
        {START_PATHS.map((item) => (
          <StartPathCard key={item.href} item={item} />
        ))}
      </section>

      <div className="home-main-grid">
        <FeaturedReading items={featuredPicks} />

        <aside className="home-side-stack">
          <ProfileCard />

          <section className="home-section home-products">
            <div className="home-section-heading compact">
              <div>
                <p className="home-kicker">Products</p>
                <h2 className="home-section-title">正在经营的东西</h2>
              </div>
            </div>
            <div className="home-product-list">
              {PRODUCT_LINKS.map((item) => (
                <ProductLink key={item.href} item={item} />
              ))}
            </div>
          </section>

          <section className="home-contact-panel">
            <div>
              <p className="home-kicker">Contact</p>
              <h2>保持联系</h2>
              <p>项目合作、产品交流，添加微信；长期观察、技术判断，订阅公众号。</p>
            </div>
            <div className="home-qr-grid">
              <div>
                <Image src="/qrcodewechat3.png" alt="扫码加好友二维码" width={88} height={88} />
                <span>atar24</span>
              </div>
              <div>
                <Image src="/qrcode_for_gh.jpg" alt="公众号二维码" width={88} height={88} />
                <span>2aran</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <SiteFooter className="home-footer" />
    </main>
  )
}

export default function HomePage() {
  const featuredPicks = getHomeFeaturedPicks()

  return (
    <>
      <PolishedHomePage featuredPicks={featuredPicks} />
      <ClassicHomePage featuredPicks={featuredPicks} />
    </>
  )
}

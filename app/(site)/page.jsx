import Link from 'next/link'
import Image from 'next/image'

import DaysSince from './components/DaysSince'
import HomeRecommendationCard from './components/HomeRecommendationCard'
import { HomeHeroGoal } from './components/HomeHeroGoal'
import { T } from './components/LocaleProvider'
import SiteFooter from './components/SiteFooter'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_HERO_TAGLINE, SITE_HERO_TITLE } from '../../lib/siteIntro'
import { getHomeFeaturedPicks, HOME_SECTION_MORE_LINKS } from '../../lib/homeHighlights'

const SITE_HERO_TITLE_EN = 'Frontend & AI Engineering'
const SITE_HERO_TAGLINE_EN = 'Ship engineering · AI frontier · brand growth'

export const dynamic = 'force-static'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
}

const CLASSIC_SECTION_BADGE_CLASS = {
  column:
    'border-[#d6d0df] bg-[#f4f2f8] text-[#625d70] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#c6ceda]',
  research:
    'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  resources:
    'border-[#c7dce4] bg-[#edf6f8] text-[#3f6878] dark:border-[#263f4b] dark:bg-[#13232b] dark:text-[#9ac9d8]',
}

const CLASSIC_HOME_SECTION_TAB_CLASS = {
  column:
    'text-[#696071] hover:bg-white hover:text-[#49345f] hover:shadow-sm hover:ring-1 hover:ring-[#d6d0df] dark:text-gray-400 dark:hover:bg-[#1e2630] dark:hover:text-[#d8c5f3] dark:hover:ring-[#303947]',
  research:
    'text-[#696071] hover:bg-white hover:text-[#3b5b8a] hover:shadow-sm hover:ring-1 hover:ring-[#cbd9ee] dark:text-gray-400 dark:hover:bg-[#152034] dark:hover:text-[#9bb6df] dark:hover:ring-[#2a3a55]',
  resources:
    'text-[#696071] hover:bg-white hover:text-[#3f6878] hover:shadow-sm hover:ring-1 hover:ring-[#c7dce4] dark:text-gray-400 dark:hover:bg-[#13232b] dark:hover:text-[#9ac9d8] dark:hover:ring-[#263f4b]',
}

const START_PATHS = [
  {
    href: '/articles',
    label: '读文章',
    labelEn: 'Read',
    title: '从判断和长期写作开始',
    titleEn: 'Start with judgment & long-form writing',
    desc: '原创专栏、AI 协助调研、资料索引，按阅读价值重新组织。',
    descEn: 'Original columns, AI-assisted research and archives, reorganized by reading value.',
    meta: 'Column · Research · Archive',
  },
  {
    href: '/works',
    label: '看项目',
    labelEn: 'Projects',
    title: '看我把想法做成系统',
    titleEn: 'See ideas turned into systems',
    desc: '可视化页面、AI 工具、长期工程和私域工作台，保留能反复演进的作品。',
    descEn: 'Visual pages, AI tools, long-running projects and private workbenches that keep evolving.',
    meta: 'Systems · Tools · Interfaces',
  },
  {
    href: '/services',
    label: '聊合作',
    labelEn: 'Collaborate',
    title: '让内容、产品和增长连起来',
    titleEn: 'Connect content, product and growth',
    desc: '技术内容、产品调研、创作者增长和 AI 工程化协作，适合需要长期判断的项目。',
    descEn: 'Tech content, product research, creator growth and AI engineering — for projects that need long-term judgment.',
    meta: 'Consulting · Content · Growth',
  },
]

const PRODUCT_LINKS = [
  {
    href: 'https://blogger-alliance.cn/',
    label: '博主联盟',
    labelEn: 'Blogger Alliance',
    desc: 'AI 产品方与技术博主的连接网络',
    descEn: 'A network linking AI products and tech bloggers',
  },
  {
    href: 'https://frontendnext.com/',
    label: '前端周看',
    labelEn: 'Frontend Weekly',
    desc: '前端、AI Agent 与大模型工程情报',
    descEn: 'Intel on frontend, AI Agents and LLM engineering',
  },
  {
    href: 'https://publishlab.cc/',
    label: 'PublishLab',
    labelEn: 'PublishLab',
    desc: '面向创作者的 AI 写作与出版工具',
    descEn: 'AI writing and publishing tools for creators',
  },
]

const CLASSIC_SITE_HERO_TAGLINE = `${SITE_HERO_TITLE}：${SITE_HERO_TAGLINE}`
const CLASSIC_SITE_HERO_TAGLINE_EN = `${SITE_HERO_TITLE_EN}: ${SITE_HERO_TAGLINE_EN}`

const PROFILE_LINKS = [
  { href: '/context-memory', label: '上下文记忆', labelEn: 'Context Memory' },
  { href: '/publications', label: '出版作品', labelEn: 'Publications' },
  { href: '/map', label: '全站地图', labelEn: 'Site Map' },
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
        {item.isLatest ? <span className="home-badge home-badge-latest"><T zh="最新" en="Latest" /></span> : null}
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
          <h2 className="home-section-title"><T zh="先读这几篇" en="Start with these" /></h2>
        </div>
        <div className="home-section-tabs" role="group" aria-label="Browse more by category">
          {HOME_SECTION_MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="home-tab-link">
              <span><T zh={link.label} en={link.labelEn} /></span>
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
    'group block rounded-xl px-2 py-2 no-underline transition hover:bg-[#f4f0f8] dark:hover:bg-[#18202a]'
  const content = (
    <>
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {item.isLatest ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-[#cfc3e2] bg-[#f3eff9] px-2 py-0.5 font-mono text-[10px] text-[#72539b] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#c5afe8]">
            <T zh="最新" en="Latest" />
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
          <span className="inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border border-[#d9d4e2] bg-white px-2 py-0.5 font-mono text-[10px] text-[#625a6f] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6]">
            {item.tagLabel}
          </span>
        ) : null}
        {item.date ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-[#9b9b93] dark:text-gray-500">
            {item.date}
          </span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13.5px] font-medium leading-5 text-[#1a1814] group-hover:text-[#49345f] dark:text-gray-100 dark:group-hover:text-[#d8c5f3]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-0.5 line-clamp-1 text-[12px] leading-5 text-[#716779] dark:text-gray-400">
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
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8e8798] dark:text-[#8e9ab0]">
            Start Here
          </p>
          <h2 className="classic-home-section-title"><T zh="推荐阅读" en="Recommended reading" /></h2>
        </div>
        <nav
          aria-label="Browse more by category"
          className="flex w-full shrink-0 flex-col gap-1.5 pt-0.5 sm:w-auto sm:items-end"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#958aa1] sm:text-right dark:text-gray-500">
            <T zh="浏览更多" en="Browse more" />
          </span>
          <div
            role="group"
            className="grid grid-cols-3 gap-1 rounded-lg border border-[#ddd6e7] bg-[#eee9f3] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:inline-flex sm:items-center dark:border-gray-800 dark:bg-[#151a22] dark:shadow-none"
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
                <span><T zh={link.label} en={link.labelEn} /></span>
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
      <span className="home-path-label"><T zh={item.label} en={item.labelEn} /></span>
      <h3><T zh={item.title} en={item.titleEn} /></h3>
      <p><T zh={item.desc} en={item.descEn} /></p>
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
        <strong><T zh={item.label} en={item.labelEn} /></strong>
        <small><T zh={item.desc} en={item.descEn} /></small>
      </span>
      <ArrowIcon />
    </a>
  )
}

function ProfileCard() {
  return (
    <section className="home-profile" aria-label="Profile">
      <div className="home-profile-top">
        <div className="home-avatar-wrap">
          <Image
            src={AVATAR_PATH}
            alt="TUARAN"
            width={160}
            height={200}
            priority
            sizes="112px"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="home-profile-name"><T zh="涂阿燃" en="TUARAN" /></p>
          <p className="home-profile-role"><T zh="前端 · AI Agent · 奶爸" en="Frontend · AI Agent · Dad" /></p>
          <p className="home-profile-company"><T zh="Founder @矩联科技" en="Founder @Julian Tech" /></p>
        </div>
      </div>
      <blockquote>
        <p>
          <T
            zh="选一件值得投入 20 年 的事，每日复利，高频迭代。"
            en="Pick one thing worth 20 years, compound it daily, iterate fast."
          />
        </p>
        <div className="home-days">
          <DaysSince />
        </div>
      </blockquote>
      <div className="home-profile-links">
        {PROFILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="no-underline">
            <T zh={link.label} en={link.labelEn} />
          </Link>
        ))}
      </div>
    </section>
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
                      <T zh="涂阿燃｜安东尼 · Agent 工程师" en="TUARAN | Anthony · Agent Engineer" />
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="mb-0 max-w-[68rem] font-serif text-[1.72rem] font-semibold leading-[1.28] tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[2.28rem] xl:text-[2.6rem]">
                    <T zh={CLASSIC_SITE_HERO_TAGLINE} en={CLASSIC_SITE_HERO_TAGLINE_EN} />
                  </h1>
                  <p className="mb-0 max-w-[64rem] font-serif text-[1.12rem] font-medium leading-[1.65] tracking-[0.02em] text-[#24251f] dark:text-[#e1e2dc] md:text-[1.48rem]">
                    <HomeHeroGoal variant="classic" />
                    <T zh="。" en="." />
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
                      <T zh="加入博主联盟" en="Join Blogger Alliance" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-70">→</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-cta-subtext)' }}>
                      <T zh="AI 产品方 ↔ 技术博主 · 品牌增长" en="AI products ↔ tech bloggers · brand growth" />
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
                      <T zh="订阅前端周看" en="Subscribe to Frontend Weekly" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      <T zh="前端 / AI Agent / 大模型 · 技术情报站" en="Frontend / AI Agent / LLM · tech intel" />
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
                      <T zh="使用 PublishLab" en="Use PublishLab" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      <T zh="AI 写作 / 内容创作 / 数字出版" en="AI writing / content / digital publishing" />
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
                    alt="TUARAN"
                    width={220}
                    height={220}
                    priority
                    sizes="(min-width: 1280px) 200px, 152px"
                    className="h-auto w-full object-cover shadow-none"
                  />
                </div>
                <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7e7488] dark:text-gray-400">
                  <T zh="前端 · AI Agent · 奶爸" en="Frontend · AI Agent · Dad" />
                </p>
                <p className="mt-1 text-[12px] tracking-[0.06em] text-[#888] dark:text-gray-500">
                  <T zh="Founder @矩联科技" en="Founder @Julian Tech" />
                </p>
                <blockquote className="mx-auto mt-3 max-w-[min(280px,100%)]">
                  <p className="font-serif text-[15px] leading-[1.9] tracking-wide text-[#262724] dark:text-gray-200">
                    <T
                      zh={<>选一件值得投入 <span className="font-semibold">20 年</span> 的事，<span className="mt-0.5 block">每日复利，高频迭代。</span></>}
                      en={<>Pick one thing worth <span className="font-semibold">20 years</span>,<span className="mt-0.5 block">compound daily, iterate fast.</span></>}
                    />
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8798] dark:text-gray-500">
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d9d2e2] dark:bg-gray-700" />
                    <span>This time · with LLM</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d9d2e2] dark:bg-gray-700" />
                  </div>
                  <div className="mt-2.5 flex justify-center">
                    <DaysSince />
                  </div>
                </blockquote>
                <Link
                  href="/context-memory"
                  className="mt-2 inline-flex items-center rounded-full border border-[#d6d0df] bg-white/78 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#625d70] no-underline transition hover:border-[#b9a6c9] hover:text-[#20172f] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062] dark:hover:text-gray-100"
                >
                  <T zh="我的上下文记忆" en="My context memory" />
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
                    <T zh="地图 →" en="Map →" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { href: '/publications', label: '出版', labelEn: 'Books' },
                    { href: '/about', label: '关于', labelEn: 'About' },
                    { href: '/ai-projects', label: '工具', labelEn: 'Tools' },
                  ].map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="no-external-arrow rounded-xl border border-[#d6d7cf] bg-white/70 px-2 py-2 text-center text-[12px] font-medium text-[#52534c] no-underline transition hover:border-[#b9bbad] hover:text-[#15140f] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6] dark:hover:border-[#435062] dark:hover:text-gray-100"
                    >
                      <T zh={card.label} en={card.labelEn} />
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
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]"><T zh="加好友" en="WeChat" /></span>
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
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]"><T zh="公众号" en="WeChat OA" /></span>
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
              <T zh={SITE_HERO_TITLE} en={SITE_HERO_TITLE_EN} />
            </p>
            <span><T zh={SITE_HERO_TAGLINE} en={SITE_HERO_TAGLINE_EN} /></span>
          </div>
          <p className="home-hero-lead">
            <HomeHeroGoal variant="polished" />
          </p>
          <div className="home-hero-actions">
            <a href="https://blogger-alliance.cn/" target="_blank" rel="noreferrer" className="home-button home-button-primary no-external-arrow">
              <T zh="进入博主联盟" en="Enter Blogger Alliance" />
            </a>
            <Link href="/services" className="home-button home-button-secondary">
              <T zh="合作方式" en="Work with me" />
            </Link>
          </div>
        </div>

        <HomeRecommendationCard />
      </section>

      <section className="home-paths" aria-label="Main site entries">
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
                <h2 className="home-section-title"><T zh="正在经营的东西" en="What I'm building" /></h2>
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
              <h2><T zh="保持联系" en="Keep in touch" /></h2>
              <p>
                <T
                  zh="项目合作、产品交流，添加微信；长期观察、技术判断，订阅公众号。"
                  en="For collaboration and product talk, add me on WeChat; for long-term notes and judgment, follow the official account."
                />
              </p>
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

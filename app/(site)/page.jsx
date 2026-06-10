import Link from 'next/link'
import Image from 'next/image'
import DaysSince from './components/DaysSince'
import SiteFooter from './components/SiteFooter'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_DOMAIN, SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE } from '../../lib/siteIntro'
import { listResearch } from '../../lib/research/loader'
import { getHomeArticlePicks, getHomeResearchPicks, getHomeResourcePicks } from '../../lib/homeHighlights'

export const dynamic = 'force-static'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function buildResearchPipelineStats() {
  const entries = listResearch().filter((entry) => !entry.encrypted)
  const companies = entries.filter((entry) => entry.category === 'companies')
  const topics = entries.filter((entry) => entry.category === 'topics')
  const people = entries.filter((entry) => entry.category === 'people')
  const latestDate = entries.length ? entries[0].date : null
  return {
    total: entries.length,
    companies: companies.length,
    topics: topics.length,
    people: people.length,
    latestDate,
  }
}

function HomeFeaturedLinkItem({ item }) {
  const className =
    'group block rounded-xl px-2 py-2 no-underline transition hover:bg-[#f8f4ec] dark:hover:bg-[#18202a]'
  const content = (
    <>
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {item.isLatest ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-[#d4c4a8] bg-[#f0e6d4] px-2 py-0.5 font-mono text-[10px] text-[#6b4f1d] dark:border-[#4a3d24] dark:bg-[#2a2218] dark:text-[#e8c98a]">
            最新
          </span>
        ) : null}
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#e8dfcf] bg-[#f8f4ec] px-2 py-0.5 font-mono text-[10px] text-[#7e6d50] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#d4c3a3]">
          {item.tagLabel}
        </span>
        {item.date ? (
          <span className="shrink-0 font-mono text-[10px] text-[#aaa093] dark:text-gray-500">{item.date}</span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13.5px] font-medium leading-5 text-[#2d261d] group-hover:text-[#5a4725] dark:text-gray-100 dark:group-hover:text-[#eed8b5]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-0.5 line-clamp-1 text-[12px] leading-5 text-[#8b806c] dark:text-gray-400">
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

function HomeFeaturedLinks({ items }) {
  if (!items.length) return null
  return (
    <div className="mb-4 rounded-2xl border border-[#ece5d8] bg-white p-3 dark:border-[#232c36] dark:bg-[#121821]">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
        推荐阅读
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <HomeFeaturedLinkItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const featuredArticles = getHomeArticlePicks()
  const researchStats = buildResearchPipelineStats()
  const featuredResearch = getHomeResearchPicks()
  const featuredResources = getHomeResourcePicks()
  const resourceCards = [
    {
      href: '/classical-masterpieces',
      kicker: 'Classics',
      title: '古典名篇',
      desc: '辞赋 / 唐诗宋词 / 奏疏 / 古文 / 祭文 · 原文可检索',
      scope: 'internal',
    },
    {
      href: '/ru-shi-dao',
      kicker: 'Humanities',
      title: '人文思想',
      desc: '儒释道体系 / 神仙谱系 / 思想结构',
      scope: 'internal',
    },
    {
      href: '/china-politics',
      kicker: 'Politics',
      title: '政经资料',
      desc: '组织结构 / 行政级别 / 会议沿革 / 政经资料',
      scope: 'internal',
    },
    {
      href: '/reading',
      kicker: 'Books',
      title: '书目索引',
      desc: '正在读 / 想读 / 笔记 / 书单',
      scope: 'internal',
    },
    {
      href: '/bookmarks',
      kicker: 'Bookmarks',
      title: '资源收藏',
      desc: 'AI 工具 / 开发资源 / 教程 / 外部材料',
      scope: 'bookmarks',
    },
  ]
  return (
    <div className="max-w-[1120px] w-full mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col">
      <section className="flex-1 mb-14">
        <header className="relative mb-8 overflow-hidden rounded-[28px] border border-[#e6dfd2] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,240,0.92))] px-5 py-4 shadow-[0_16px_48px_rgba(91,78,53,0.06)] dark:border-[#27303a] dark:bg-[linear-gradient(135deg,rgba(20,24,31,0.96),rgba(13,17,23,0.92))] md:px-7 md:py-5">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_72%_50%,rgba(183,121,31,0.18),transparent_36%),linear-gradient(90deg,transparent,rgba(244,238,226,0.72))] dark:bg-[radial-gradient(circle_at_72%_50%,rgba(240,199,118,0.14),transparent_36%),linear-gradient(90deg,transparent,rgba(18,24,33,0.72))] lg:block" />
          <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 font-mono text-[2.6rem] font-semibold uppercase leading-none tracking-[0.16em] text-[#7c5d34]/[0.13] dark:text-white/[0.1] lg:block xl:right-14">
            2ARAN.COM
          </div>
          <div className="relative max-w-[760px] space-y-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#9c8f79] dark:text-[#9ca5b5] mb-0">
                      涂阿燃｜安东尼 · 独立开发者
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="mb-0 max-w-[46rem] font-serif text-[1.28rem] font-semibold tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[1.56rem]">
                    {SITE_HERO_TAGLINE}
                  </h1>
                  <p className="mb-0 max-w-[44rem] font-serif text-[1rem] font-medium leading-[1.65] tracking-[0.02em] text-[#2d281f] dark:text-[#ebe6dc] md:text-[1.06rem]">
                    {SITE_HERO_GOAL_PARTS.map((part, i) =>
                      typeof part === 'string' ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <span
                          key={i}
                          className="font-semibold tracking-[0.06em] bg-gradient-to-br from-[#7a5638] via-[#355c6d] to-[#0d4a63] bg-clip-text text-transparent dark:from-[#e8d4b4] dark:via-[#93b8d4] dark:to-[#7eb0ef]"
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
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#3a2c14] bg-[#3a2c14] px-3.5 py-2.5 no-underline shadow-[0_6px_18px_rgba(58,44,20,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#2a1f0e] hover:shadow-[0_10px_24px_rgba(58,44,20,0.2)] sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#e8d4b4] dark:bg-[#e8d4b4] dark:hover:bg-[#f5e3c4]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0c776]/15 text-[#f0c776] dark:bg-[#3a2c14]/15 dark:text-[#3a2c14]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#fdf9ef] dark:text-[#1d1a16]">
                      加入博主联盟
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-70">→</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#c8b89a] dark:text-[#5a4725]">
                      AI 产品方 ↔ 技术博主 · 品牌增长
                    </span>
                  </span>
                </a>
                <a
                  href="https://frontendnext.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#d9d0c2] bg-white/75 px-3.5 py-2.5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b9ad94] hover:bg-white sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#3a4757] dark:bg-[#151c25] dark:hover:border-[#5a6a7e] dark:hover:bg-[#1a2330]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5efe1] text-[#8b5a1f] dark:bg-[#22303f] dark:text-[#e0b572]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 6l8 8 8-8M4 13l8 8 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      订阅前端周看
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#7c7565] dark:text-[#8e98a8]">
                      前端 / AI Agent / 大模型 · 技术情报站
                    </span>
                  </span>
                </a>
                <a
                  href="https://publishlab.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#d9d0c2] bg-white/75 px-3.5 py-2.5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b9ad94] hover:bg-white sm:w-auto sm:min-w-[230px] sm:max-w-[245px] dark:border-[#3a4757] dark:bg-[#151c25] dark:hover:border-[#5a6a7e] dark:hover:bg-[#1a2330]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5efe1] text-[#8b5a1f] dark:bg-[#22303f] dark:text-[#e0b572]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 5h14v14H5zM8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[13.5px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      使用 PublishLab
                      <span className="font-mono text-[9px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-0.5 text-[11px] leading-snug text-[#7c7565] dark:text-[#8e98a8]">
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
            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                    Column
                  </p>
                  <h2 className="home-section-title">专栏</h2>
                </div>
                <Link
                  href="/articles"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  更多作品
                </Link>
              </div>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                精选文章 / 工程作品 / 观点输出。
              </p>
              <HomeFeaturedLinks items={featuredArticles} />
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                    Research
                  </p>
                  <h2 className="home-section-title">调研</h2>
                </div>
                {researchStats.latestDate ? (
                  <span className="font-mono text-[11.5px] text-[#9c8f79] dark:text-[#8e9ab0]">
                    累计 {researchStats.total} 篇 · 最近 {researchStats.latestDate}
                  </span>
                ) : null}
              </div>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                专题调研 / 公司调研 / 事项调研 / 人物调研。
              </p>
              <HomeFeaturedLinks items={featuredResearch} />
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    href: '/articles?tab=companies',
                    kicker: 'Companies',
                    title: '公司调研',
                    count: researchStats.companies,
                    desc: '开发者生态 / 内容社区 / 企业软件 / 云通信 / 新能源 / 开发工具',
                  },
                  {
                    href: '/articles?tab=topics',
                    kicker: 'Topics',
                    title: '事项调研',
                    count: researchStats.topics,
                    desc: '行业 · 技术 · 产品 · 市场 · 观点',
                  },
                  {
                    href: '/articles?tab=people',
                    kicker: 'People',
                    title: '人物调研',
                    count: researchStats.people,
                    desc: '创作者 · 企业家 · 学者 · 公共人物',
                  },
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="no-external-arrow group flex flex-col gap-2 rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_12px_30px_rgba(96,80,53,0.08)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
                        {card.kicker}
                      </p>
                      <span className="font-mono text-[11px] tracking-[0.08em] text-[#9c8f79] dark:text-[#8e9ab0]">
                        {card.count} 篇 →
                      </span>
                    </div>
                    <p className="mb-0 text-[15px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      {card.title}
                    </p>
                    <p className="mb-0 text-[12.5px] leading-5 text-[#7c7565] dark:text-[#8e98a8]">
                      {card.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                    Library
                  </p>
                  <h2 className="home-section-title">资料</h2>
                </div>
                <Link
                  href="/articles?tab=resources"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  全部资料
                </Link>
              </div>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                资料分成「站内资料」和「资源收藏」。
              </p>
              <HomeFeaturedLinks items={featuredResources} />
              <div className="space-y-4">
                {[
                  {
                    key: 'internal',
                    title: '站内资料',
                    desc: '已经整理进站内结构，可直接阅读、检索、引用。',
                  },
                  {
                    key: 'bookmarks',
                    title: '资源收藏',
                    desc: '外部材料、工具和教程入口，价值在指路与快速访问。',
                  },
                ].map((group) => (
                  <div key={group.key}>
                    <div className="mb-2 flex flex-wrap items-baseline gap-2">
                      <p className="mb-0 text-[13px] font-semibold text-[#4f4638] dark:text-gray-200">{group.title}</p>
                      <p className="mb-0 text-[12px] text-[#8b7f69] dark:text-[#7f8aa0]">{group.desc}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {resourceCards
                        .filter((card) => card.scope === group.key)
                        .map((card) => (
                          <Link
                            key={card.href}
                            href={card.href}
                            className="no-external-arrow group flex flex-col gap-2 rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_12px_30px_rgba(96,80,53,0.08)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                          >
                            <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
                              {card.kicker}
                            </p>
                            <p className="mb-0 text-[15px] font-semibold text-[#1d1a16] dark:text-gray-100">
                              {card.title}
                            </p>
                            <p className="mb-0 text-[12.5px] leading-5 text-[#7c7565] dark:text-[#8e98a8]">
                              {card.desc}
                            </p>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </main>

          <aside className="w-full space-y-6">
            <section className="rounded-[24px] border border-[#e6e0d6] bg-[#f8f5f0] p-5 shadow-[0_8px_32px_rgba(82,69,45,0.04)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6">
              <div className="mb-5 border-b border-[#e8e4dc] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[116px] overflow-hidden bg-[#f8f5f0] dark:bg-[#0f1318]">
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
                <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8f8069] dark:text-gray-400">
                  前端 · AI Agent · 奶爸
                </p>
                <p className="mt-1 text-[12px] tracking-[0.06em] text-[#888] dark:text-gray-500">
                  Founder @矩联科技
                </p>
                <blockquote className="mx-auto mt-3 max-w-[min(280px,100%)]">
                  <p className="font-serif text-[15px] leading-[1.9] tracking-wide text-[#3d362b] dark:text-gray-200">
                    选一件值得投入 <span className="font-semibold">20 年</span> 的事，
                    <span className="mt-0.5 block">每日复利，高频迭代。</span>
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#9a8f7a] dark:text-gray-500">
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d8cfbf] dark:bg-gray-700" />
                    <span>This time · with LLM</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d8cfbf] dark:bg-gray-700" />
                  </div>
                  <div className="mt-2.5 flex justify-center">
                    <DaysSince />
                  </div>
                </blockquote>
                <Link
                  href="/context-memory"
                  className="mt-2 inline-flex items-center rounded-full border border-[#ded6c8] bg-white/78 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#5f5a4d] no-underline transition hover:border-[#c9bea9] hover:text-[#222] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062] dark:hover:text-gray-100"
                >
                  我的上下文记忆
                </Link>
              </div>
              <div className="mt-5 border-t border-[#e8e4dc] pt-4 dark:border-gray-800/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9c8f79] dark:text-[#8e9ab0]">
                    More
                  </p>
                  <Link
                    href="/map"
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
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
                      className="no-external-arrow rounded-xl border border-[#e4dccf] bg-white/70 px-2 py-2 text-center text-[12px] font-medium text-[#5e574c] no-underline transition hover:border-[#cfc2ad] hover:text-[#221d16] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6] dark:hover:border-[#435062] dark:hover:text-gray-100"
                    >
                      {card.label}
                    </Link>
                  ))}
                </div>

                {/* 微信加好友 + 公众号二维码 */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#e4dccf] bg-white/70 p-3 dark:border-[#303947] dark:bg-[#151c25]">
                  <div className="flex flex-col items-center gap-1.5">
                    <Image
                      src="/qrcodewechat3.png"
                      alt="扫码加好友二维码"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                    />
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">加好友</span>
                    <span className="font-mono text-[10px] text-[#3d362b] dark:text-gray-200">atar24</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Image
                      src="/qrcode_for_gh.jpg"
                      alt="公众号二维码"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                    />
                    <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">公众号</span>
                    <span className="font-mono text-[10px] text-[#3d362b] dark:text-gray-200">2aran</span>
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

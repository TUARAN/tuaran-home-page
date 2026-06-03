import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'
import CopyIntroButton from './components/CopyIntroButton'
import LatestMoments from './components/LatestMoments'
import SiteFooter from './components/SiteFooter'
import { SITE_DOMAIN, SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE, SITE_INTRO_COPY } from '../../lib/siteIntro'
import { listResearch } from '../../lib/research/loader'

function wrapTitle(title) {
  if (!title) return ''
  if (title.includes('《') || title.includes('》')) return title
  return `《${title}》`
}

export const dynamic = 'force-static'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function getArticleLink(article) {
  if (article?.slug === 'diary-self-reflection') return '/diary'
  if (article?.href) return article.href
  return `/articles/${article.slug}`
}

function getArticleCategory(article) {
  if (article?.homeCategory) return article.homeCategory
  if (article?.slug === 'ocr-comparison-paddleocr-vl') return 'AI'
  if (article?.slug === 'content-os-blogger-matrix-alliance') return '创作'
  if (article?.slug === 'blogger-future-community') return '社区'
  if (article?.slug === 'diary-self-reflection') return '随笔'
  return '工程化'
}

function buildResearchPipelineStats() {
  const entries = listResearch().filter((entry) => !entry.encrypted)
  const companies = entries.filter((entry) => entry.category === 'companies')
  const topics = entries.filter((entry) => entry.category === 'topics')
  const latestDate = entries.length ? entries[0].date : null
  return {
    total: entries.length,
    companies: companies.length,
    topics: topics.length,
    latestDate,
  }
}

export default function HomePage() {
  const featuredArticles = articles.slice(0, 3)
  const researchStats = buildResearchPipelineStats()
  const resourceCards = [
    {
      href: '/articles?tab=resources&resource_type=classics',
      kicker: 'Classics',
      title: '古典名篇',
      desc: '辞赋 / 诗歌 / 奏疏 / 古文 / 原文索引',
      scope: 'internal',
    },
    {
      href: '/articles?tab=resources&resource_type=poetry',
      kicker: 'Poetry',
      title: '诗歌原文',
      desc: '诗词 / 辞赋 / 祭文 / 古文原文',
      scope: 'internal',
    },
    {
      href: '/articles?tab=resources&resource_type=humanities',
      kicker: 'Humanities',
      title: '人文思想',
      desc: '儒释道体系 / 神仙谱系 / 思想结构',
      scope: 'internal',
    },
    {
      href: '/articles?tab=resources&resource_type=politics',
      kicker: 'Politics',
      title: '政经资料',
      desc: '组织结构 / 行政级别 / 会议沿革 / 政经资料',
      scope: 'internal',
    },
    {
      href: '/articles?tab=resources&resource_type=books',
      kicker: 'Books',
      title: '书目索引',
      desc: '正在读 / 想读 / 笔记 / 书单',
      scope: 'internal',
    },
    {
      href: '/articles?tab=resources&resource_type=bookmarks',
      kicker: 'Bookmarks',
      title: '资源收藏',
      desc: 'AI 工具 / 开发资源 / 教程 / 外部材料',
      scope: 'bookmarks',
    },
  ]
  const communities = [
    { name: '掘金', reads: '219 万', fans: '1.3 万', href: 'https://juejin.cn/user/1521379823340792', color: '#111827', char: '掘' },
    { name: '小红书', reads: '100 万', fans: '1.1 万', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e', color: '#2563EB', char: '红' },
    { name: '知乎', reads: '35 万', fans: '350', href: 'https://www.zhihu.com/', color: '#14B8A6', char: '知' },
    { name: '51CTO', reads: '16 万', fans: '276', href: 'https://blog.51cto.com/u_15298598', color: '#F97316', char: '51' },
    {
      name: 'CSDN',
      reads: '15 万',
      fans: '1,735',
      href: 'https://blog.csdn.net/aifs2025',
      color: '#DC2626',
      char: 'C',
      detail: '主号：AI 架构 / 数字员工',
      hoverDetail: '副号：前端周刊 / 笔记',
    },
    { name: '头条', reads: '12 万', fans: '692', href: 'https://www.toutiao.com/', color: '#EF4444', char: '头' },
    { name: '公众号', reads: '1 万', fans: '2,676', href: '#qrcode-wechat-mp', color: '#22C55E', char: '信' },
    { name: '微博', reads: '6,000', fans: '400', href: 'https://weibo.com/', color: '#F59E0B', char: '微' },
  ]
  return (
    <div className="max-w-[1120px] w-full mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col">
      <section className="flex-1 mb-14">
        <header className="relative mb-8 overflow-hidden rounded-[28px] border border-[#e6dfd2] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,240,0.92))] px-5 py-4 shadow-[0_16px_48px_rgba(91,78,53,0.06)] dark:border-[#27303a] dark:bg-[linear-gradient(135deg,rgba(20,24,31,0.96),rgba(13,17,23,0.92))] md:px-7 md:py-5">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_72%_50%,rgba(183,121,31,0.18),transparent_36%),linear-gradient(90deg,transparent,rgba(244,238,226,0.72))] dark:bg-[radial-gradient(circle_at_72%_50%,rgba(240,199,118,0.14),transparent_36%),linear-gradient(90deg,transparent,rgba(18,24,33,0.72))] lg:block" />
          <div className="absolute right-5 top-5 z-10">
            <CopyIntroButton text={SITE_INTRO_COPY} />
          </div>
          <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 font-mono text-[3.9rem] font-semibold uppercase leading-none tracking-[0.16em] text-[#7c5d34]/[0.13] dark:text-white/[0.1] lg:block xl:right-14">
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
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#3a2c14] bg-[#3a2c14] px-3.5 py-2.5 no-underline shadow-[0_6px_18px_rgba(58,44,20,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#2a1f0e] hover:shadow-[0_10px_24px_rgba(58,44,20,0.2)] sm:w-auto sm:min-w-[280px] sm:max-w-[360px] dark:border-[#e8d4b4] dark:bg-[#e8d4b4] dark:hover:bg-[#f5e3c4]"
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
                  className="no-external-arrow group inline-flex w-full items-center gap-2.5 rounded-xl border border-[#d9d0c2] bg-white/75 px-3.5 py-2.5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b9ad94] hover:bg-white sm:w-auto sm:min-w-[280px] sm:max-w-[360px] dark:border-[#3a4757] dark:bg-[#151c25] dark:hover:border-[#5a6a7e] dark:hover:bg-[#1a2330]"
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
                    Works · 5% 作品层
                  </p>
                  <h2 className="home-section-title">作品层</h2>
                </div>
                <Link
                  href="/articles"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  更多作品
                </Link>
              </div>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                精选文章 / 工程作品 / 个人判断。这里放 5% 的原创层，优先呈现亲自写、亲自做、带有个人判断的内容。
              </p>
              <div className="grid gap-4">
                {featuredArticles.map((a, index) => {
                  const href = getArticleLink(a)
                  const external = isExternalHref(href)
                  const card = (
                    <>
                      <div className="aspect-[16/9] overflow-hidden rounded-xl border border-[#efe7db] bg-[#f6f1e7] dark:border-[#2a3440] dark:bg-[#10151d]">
                        <Image
                          src={a.cover}
                          alt={a.title}
                          width={336}
                          height={189}
                          priority={index === 0}
                          sizes="(min-width: 768px) 188px, 100vw"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="rounded-full border border-[#e8dfcf] bg-[#f8f4ec] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7e6d50] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#d4c3a3]">
                            #{getArticleCategory(a)}
                          </span>
                          <span className="font-mono text-[12px] tracking-[0.08em] text-[#9d9078] dark:text-[#94a0b1]">
                            {a.date}
                          </span>
                          <span className="rounded-full bg-[#f4efe5] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[#7d6c4f] dark:bg-[#18202a] dark:text-[#c8b99d]">
                            {a.badge || (external ? 'Original' : 'Essay')}
                          </span>
                        </div>
                        <h3 className="mb-2 font-serif text-[20px] font-semibold leading-8 text-[#201d19] transition-colors group-hover:text-[#5a4725] dark:text-gray-100 dark:group-hover:text-[#eed8b5]">
                          {wrapTitle(a.title)}
                        </h3>
                        <p className="mb-0 line-clamp-3 text-[14px] leading-[1.82] text-[#625b51] dark:text-gray-300">
                          {a.summary}
                        </p>
                      </div>
                    </>
                  )
                  const className =
                    'group no-external-arrow grid gap-4 rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline shadow-[0_18px_48px_rgba(112,96,68,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_20px_54px_rgba(100,79,47,0.10)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d] md:grid-cols-[188px_minmax(0,1fr)]'

                  return external ? (
                    <a
                      key={`${a.date}-${a.title}`}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={className}
                    >
                      {card}
                    </a>
                  ) : (
                    <Link key={`${a.date}-${a.title}`} href={href} className={className}>
                      {card}
                    </Link>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                    Research · 15% 调研层
                  </p>
                  <h2 className="home-section-title">调研层</h2>
                </div>
                {researchStats.latestDate ? (
                  <span className="font-mono text-[11.5px] text-[#9c8f79] dark:text-[#8e9ab0]">
                    累计 {researchStats.total} 篇 · 最近 {researchStats.latestDate}
                  </span>
                ) : null}
              </div>
              <p className="mb-2 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                我把内容按「<strong className="font-semibold text-[#5a4725] dark:text-[#e8d4b4]">80 / 15 / 5</strong>」分层：
                5% 是作品层，15% 是调研层，80% 是资料层。
              </p>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                专题调研 / 公司调研 / 事项调研。这里属于 <strong className="font-semibold text-[#5a4725] dark:text-[#e8d4b4]">15% 调研层</strong>——AI 协助采集、按模板生成，commodity 性质。
                它解决快速理解，不冒充原创判断；更基础的原文和谱系沉到下方资料库。
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                    Library · 80% 资料层
                  </p>
                  <h2 className="home-section-title">资料层</h2>
                </div>
                <Link
                  href="/articles?tab=resources"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  全部资料
                </Link>
              </div>
              <p className="mb-4 text-[13px] leading-[1.85] text-[#7c7565] dark:text-[#8e98a8]">
                资料层分成「站内资料」和「资源收藏」。站内资料是整理进站点结构的内容；资源收藏是外部材料入口和工具链接。
              </p>
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

            <section id="follow-me" className="scroll-mt-20 rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                    Follow Me
                  </p>
                  <h2 className="home-section-title">关注我</h2>
                </div>
                <span className="font-mono text-[11.5px] text-[#9c8f79] dark:text-[#8e9ab0]">
                  500+ 篇 · 400 万阅读
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {communities.map((c, idx) => (
                  <a
                    key={c.name}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                    style={{
                      '--brand': c.color,
                      '--brand-soft': `${c.color}16`,
                    }}
                    className="no-external-arrow group relative flex items-center gap-3 rounded-2xl border border-[#ebe5d8] bg-white/90 px-3 py-3 shadow-[0_4px_20px_rgba(82,69,45,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#d9cfbd] hover:shadow-[0_8px_28px_rgba(96,80,53,0.07)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                  >
                    <span
                      className="absolute right-3 top-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#d1cac0] dark:text-[#4a525c]"
                      aria-hidden="true"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e0d8] bg-[#ebe7df] font-mono text-[13px] font-bold tracking-tight text-[#6a6560] transition-all group-hover:border-transparent group-hover:bg-[color:var(--brand-soft)] group-hover:text-[color:var(--brand)] dark:border-[#2a3038] dark:bg-[#1a1f27] dark:text-[#7d8590] dark:group-hover:text-[color:var(--brand)]"
                      aria-hidden="true"
                    >
                      {c.char}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold leading-tight text-[#24211d] dark:text-gray-100">{c.name}</span>
                      <span
                        className="mt-1 whitespace-nowrap font-mono text-[10px] leading-tight text-[#b0a99e] dark:text-[#5c6370]"
                        title={`阅读 ${c.reads} · 粉丝 ${c.fans}`}
                      >
                        <span className="font-normal text-[#9c9488] dark:text-[#6d737d]">{c.reads}</span>
                        <span className="mx-1 text-[#ddd8cf] dark:text-gray-600">·</span>
                        <span className="text-[#a8a199] dark:text-[#5f6670]">{c.fans} 粉</span>
                      </span>
                      {c.detail ? (
                        <span className="mt-1 text-[10px] leading-4 text-[#aaa18f] transition-colors group-hover:text-[#7f7667] dark:text-[#66707d] dark:group-hover:text-[#a5afbc]">
                          {c.detail}
                          {c.hoverDetail ? (
                            <span className="hidden group-hover:inline"> · {c.hoverDetail}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </a>
                ))}
              </div>
              <div id="qrcode-wechat-mp" className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-[#ece5d8] bg-white/70 p-4 dark:border-[#232c36] dark:bg-[#121821]/60 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9c8f79] dark:text-[#8e9ab0]">Direct</p>
                  <p className="mb-1 flex items-baseline gap-2 text-[14px] text-[#3d362b] dark:text-gray-200">
                    <span className="text-[#888] dark:text-gray-400">微信</span>
                    <span className="font-mono font-semibold text-[#1d1a16] dark:text-gray-100">atar24</span>
                  </p>
                  <p className="mb-0 text-[12px] leading-5 text-[#85806f] dark:text-[#8a93a3]">
                    微信号与二维码如下。
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/qrcodewechat3.png"
                    alt="扫码加好友二维码"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">加好友</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/qrcode_for_gh.jpg"
                    alt="公众号二维码"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">公众号</span>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0]">
                  More
                </p>
                <Link
                  href="/map"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  站点地图 →
                </Link>
              </div>
              <h2 className="home-section-title">更多入口</h2>
              <p className="mt-1 mb-4 text-[13px] leading-6 text-[#847a67] dark:text-gray-400">
                出版作品、自用工具、马斯克与韦伯望远镜笔记，都挪到了下面这些页面。
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { href: '/publications', kicker: 'Books', title: '著作出版', desc: '《程序员成长手记》《AI Bots 通关指南》' },
                  { href: '/about', kicker: 'About', title: '关于我', desc: '履历、价值观' },
                  { href: '/ai-projects', kicker: 'Apps', title: '自用工具', desc: '吃什么 · 茉莉奶爸 · 端侧大模型 …' },
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="no-external-arrow group block rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_12px_30px_rgba(96,80,53,0.08)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                  >
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
                      {card.kicker}
                    </p>
                    <p className="mb-1 text-[15px] font-semibold text-[#1d1a16] dark:text-gray-100">
                      {card.title}
                    </p>
                    <p className="mb-0 text-[12.5px] leading-5 text-[#7c7565] dark:text-[#8e98a8]">
                      {card.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

          </main>

          <aside className="w-full">
            <section className="rounded-[24px] border border-[#e6e0d6] bg-[#f8f5f0] p-5 shadow-[0_8px_32px_rgba(82,69,45,0.04)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6 lg:sticky lg:top-24">
              <div className="mb-5 border-b border-[#e8e4dc] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[116px] overflow-hidden bg-[#f8f5f0] dark:bg-[#0f1318]">
                  <Image
                    src="/tuaranme.png"
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
                </blockquote>
                <Link
                  href="/context-memory"
                  className="mt-2 inline-flex items-center rounded-full border border-[#ded6c8] bg-white/78 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#5f5a4d] no-underline transition hover:border-[#c9bea9] hover:text-[#222] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062] dark:hover:text-gray-100"
                >
                  我的上下文记忆
                </Link>
              </div>
              <LatestMoments />
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

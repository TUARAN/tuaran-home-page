import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'
import CopyIntroButton from './components/CopyIntroButton'
import LatestMoments from './components/LatestMoments'
import SiteFooter from './components/SiteFooter'
import { SITE_DOMAIN, SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE, SITE_INTRO_COPY } from '../lib/siteIntro'
import { CATEGORY_META, COMPANY_TYPE_META, listResearch, TOPIC_TYPE_META } from '../lib/research/loader'

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

function hashString(input) {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value
}

function pickResearchHighlight() {
  const researchItems = listResearch().filter((entry) => !entry.encrypted)
  if (!researchItems.length) return null

  const seed = new Date().toISOString().slice(0, 10)
  const entry = researchItems[hashString(seed) % researchItems.length]
  const typeMeta = entry.category === 'companies'
    ? COMPANY_TYPE_META[entry.companyType]
    : TOPIC_TYPE_META[entry.topicType]
  const categoryLabel = typeMeta?.label || CATEGORY_META[entry.category]?.short || '调研'

  return {
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    href: `/articles/research/${entry.category}/${entry.slug}`,
    summary: entry.tldr || entry.summary,
    cover: entry.images?.[0]?.src || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=60',
    homeCategory: categoryLabel,
    badge: 'Research',
  }
}

export default function HomePage() {
  const researchHighlight = pickResearchHighlight()
  const featuredArticles = researchHighlight
    ? [...articles.slice(0, 2), researchHighlight]
    : articles.slice(0, 3)
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
  const identityGroups = [
    {
      label: '职业',
      tone: 'blue',
      items: [
        { label: '程序员', href: 'https://item.jd.com/14356664.html' },
        { label: '项目经理', href: '/ai-projects' },
      ],
    },
    {
      label: '创作',
      tone: 'purple',
      items: [
        { label: '技术博主', href: 'https://blogger-alliance.cn/matrix' },
        { label: '出版作者', href: 'https://publishlab.cc' },
      ],
    },
    {
      label: '家庭',
      tone: 'amber',
      items: [{ label: '茉莉奶爸', href: '/xiaomoli-dad-todo' }],
    },
    {
      label: '创业',
      tone: 'emerald',
      items: [{ label: '创立矩联科技', href: 'https://matrixlink.tech/' }],
    },
  ]

  const identityItems = identityGroups.flatMap((group) =>
    group.items.map((item) => ({
      key: `${group.label}-${typeof item === 'string' ? item : item.label}`,
      label: typeof item === 'string' ? item : item.label,
      href: typeof item === 'string' ? undefined : item.href,
      tone: group.tone,
    }))
  )

  const identityTagClassName =
    'inline-flex items-center rounded-full border border-[#ddd8cb] bg-white/88 px-3 py-1 text-[13px] text-[#5f5a4d] backdrop-blur-sm dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300'

  const remarkableThings = [
    {
      title: 'James Webb Space Telescope',
      href: 'https://science.nasa.gov/mission/webb/',
      domain: 'science.nasa.gov',
      label: '人类深空之眼',
      kicker: 'NASA · ESA · CSA · L2 Observatory',
      summary:
        '詹姆斯·韦伯空间望远镜是人类把复杂工程推到极限的代表：巨型红外望远镜折叠发射，在距离地球约 150 万公里的 L2 工作，回看早期宇宙、恒星和行星系统的形成。',
      tags: ['红外宇宙', 'L2 深空观测', 'NASA / ESA / CSA'],
      barClassName: 'bg-[linear-gradient(90deg,#0f766e_0%,#2563eb_48%,#7c3aed_100%)]',
    },
    {
      title: 'TeraFab · Tesla × xAI × SpaceX',
      href: 'https://terafab.ai/',
      domain: 'terafab.ai',
      label: '马斯克体系',
      kicker: 'Energy · Compute · Manufacturing · Space',
      summary:
        '把电动车、自动驾驶、机器人、AI 算力、先进制造和航天放在一起推进，这件事本身就很硬核。马斯克厉害的地方，是把疯狂目标拆成工程、产线、供应链和发射节奏。',
      tags: ['制造规模化', 'AI + 机器人', '地球到太空'],
      barClassName: 'bg-[linear-gradient(90deg,#f59e0b_0%,#dc2626_45%,#1e3a8a_100%)]',
    },
  ]

  return (
    <div className="max-w-[1120px] w-full mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col">
      <section className="flex-1 mb-14">
        <header className="mb-8 rounded-[28px] border border-[#e6dfd2] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,240,0.92))] px-5 py-6 shadow-[0_16px_48px_rgba(91,78,53,0.06)] dark:border-[#27303a] dark:bg-[linear-gradient(135deg,rgba(20,24,31,0.96),rgba(13,17,23,0.92))] md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#9c8f79] dark:text-[#9ca5b5] mb-0">
                    涂阿燃｜安东尼 · 独立开发者
                  </p>
                  <Link
                    href="/"
                    aria-label={`${SITE_DOMAIN} 首页`}
                    className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f4f28] no-underline transition-colors hover:text-[#3f2d17] dark:text-[#e4c58e] dark:hover:text-[#ffe1a6]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b7791f] shadow-[0_0_0_4px_rgba(183,121,31,0.13)] transition-shadow group-hover:shadow-[0_0_0_5px_rgba(183,121,31,0.18)] dark:bg-[#f0c776]" />
                    {SITE_DOMAIN}
                  </Link>
                </div>
                <CopyIntroButton text={SITE_INTRO_COPY} />
              </div>
              <div className="space-y-3">
                <h1 className="mb-0 font-serif text-[1.38rem] font-semibold tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[1.72rem]">
                  {SITE_HERO_TAGLINE}
                </h1>
                <p className="mb-0 max-w-[44rem] font-serif text-[1.05rem] font-medium leading-[1.75] tracking-[0.02em] text-[#2d281f] dark:text-[#ebe6dc] md:text-[1.12rem]">
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
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#998d76] dark:text-[#93a0b3] shrink-0">
                  Identity
                </span>
                <div className="flex flex-wrap gap-2">
                  {identityItems.map((item) =>
                    item.href ? (
                      isExternalHref(item.href) ? (
                        <a
                          key={item.key}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`${identityTagClassName} no-external-arrow opacity-85 transition-all hover:-translate-y-0.5 hover:border-[#cfc4ae] hover:bg-[#f3ede3] hover:opacity-100 dark:hover:border-[#3a4757] dark:hover:bg-[#19212b]`}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`${identityTagClassName} no-external-arrow opacity-85 transition-all hover:-translate-y-0.5 hover:border-[#cfc4ae] hover:bg-[#f3ede3] hover:opacity-100 dark:hover:border-[#3a4757] dark:hover:bg-[#19212b]`}
                        >
                          {item.label}
                        </Link>
                      )
                    ) : (
                      <span key={item.key} className={identityTagClassName}>
                        {item.label}
                      </span>
                    )
                  )}
                </div>
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
                    Highlights
                  </p>
                  <h2 className="home-section-title">推荐阅读</h2>
                </div>
                <Link
                  href="/articles"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
                >
                  更多文章
                </Link>
              </div>
              <div className="grid gap-4">
                {featuredArticles.map((a) => {
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
              <div className="mb-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                  Community
                </p>
                <h2 className="home-section-title">社区矩阵</h2>
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
              <p className="mt-4 text-[13px] leading-7 text-[#847a67] dark:text-gray-400">
                全网累计发布技术文章 <span className="font-mono font-semibold text-[#28231d] dark:text-gray-100">500+</span>，阅读量超 <span className="font-mono font-semibold text-[#28231d] dark:text-gray-100">400 万</span>。
              </p>
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                  Publications
                </p>
                <h2 className="home-section-title">著作出版</h2>
              </div>
              <div className="space-y-2 text-[15px] leading-7 text-[#666]">
              <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-[#958a75] dark:text-gray-400">已出版</p>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    cover: '/20260104094558_496.png',
                    title: '程序员成长手记',
                    meta: '2024 · 电子工业出版社',
                    href: 'https://item.jd.com/14356664.html',
                  },
                  {
                    cover: '/20260104094842_497.png',
                    title: 'AI Bots 通关指南',
                    meta: '2024 · 掘金小册',
                    href: 'https://juejin.cn/book/7351709145294176282',
                  },
                ].map((book) => (
                  <a
                    key={book.title}
                    href={book.href}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow group flex items-center gap-4 rounded-2xl border border-[#ebe4d8] bg-white p-4 shadow-[0_18px_48px_rgba(112,96,68,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_16px_34px_rgba(96,80,53,0.08)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                  >
                    <Image
                      src={book.cover}
                      alt={book.title}
                      width={120}
                      height={160}
                      className="h-[88px] w-16 rounded-sm border border-[#ece6da] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow group-hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] dark:border-gray-800"
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="font-serif text-[15px] font-semibold text-[#222] dark:text-gray-100 group-hover:text-black dark:group-hover:text-white">
                        《{book.title}》
                      </span>
                      <span className="text-[12px] text-[#888] dark:text-gray-400 mt-1">{book.meta}</span>
                    </span>
                  </a>
                ))}
              </div>
              <p className="text-[13px] text-[#888] dark:text-gray-400">
                出版中：大模型 / 智能体 / 具身智能相关书籍
              </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
              <div className="mb-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0] mb-2">
                  Remarkable
                </p>
                <h2 className="home-section-title">我认为牛逼的事</h2>
              </div>
              <div className="grid gap-4">
                {remarkableThings.map((thing) => (
                  <a
                    key={thing.href}
                    href={thing.href}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow group relative block overflow-hidden rounded-2xl border border-[#ece5d8] bg-white p-5 no-underline shadow-[0_18px_48px_rgba(112,96,68,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:shadow-[0_20px_54px_rgba(100,79,47,0.10)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
                  >
                    <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] ${thing.barClassName}`} />
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-serif text-[18px] font-semibold tracking-[0.02em] text-[#1d1a16] dark:text-gray-100">
                        {thing.title}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9d9078] dark:text-[#94a0b1]">
                        {thing.domain} ↗
                      </span>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#e8dfcf] bg-[#f8f4ec] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7e6d50] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#d4c3a3]">
                        {thing.label}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a09176] dark:text-[#8e9ab0]">
                        {thing.kicker}
                      </span>
                    </div>
                    <p className="mb-3 text-[14px] leading-7 text-[#5f5a4d] dark:text-gray-300">
                      {thing.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {thing.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#e8dfcf] bg-[#f8f4ec] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7e6d50] dark:border-[#303947] dark:bg-[#18202a] dark:text-[#d4c3a3]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            </section>

          </main>

          <aside className="w-full">
            <section className="rounded-[24px] border border-[#e6e0d6] bg-[#f8f5f0] p-5 shadow-[0_8px_32px_rgba(82,69,45,0.04)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6 lg:sticky lg:top-24">
              <div className="mb-5 border-b border-[#e8e4dc] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[148px] overflow-hidden bg-[#f8f5f0] dark:bg-[#0f1318]">
                  <Image
                    src="/tuaranme.png"
                    alt="涂阿燃"
                    width={160}
                    height={200}
                    className="h-auto w-full object-cover shadow-none"
                  />
                </div>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-gray-400">
                  前端 · AI Agent · 奶爸
                </p>
                <p className="mt-1 text-[12px] tracking-[0.06em] text-[#888] dark:text-gray-500">
                  Founder @矩联科技 · 博主联盟
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
              <div className="space-y-3 text-[14px] leading-7 text-[#666] dark:text-gray-300">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-[#888] dark:text-gray-400">微信</span>
                  <span className="font-mono text-[#222] dark:text-gray-100">atar24</span>
                </p>
                <div id="qrcode-wechat-mp" className="scroll-mt-20 flex items-center justify-between gap-2 pt-3 border-t border-[#eee] dark:border-gray-800">
                  <span className="text-[#888] dark:text-gray-400">扫码加好友</span>
                  <Image
                    src="/qrcodewechat3.png"
                    alt="扫码加好友二维码"
                    width={80}
                    height={80}
                    className="w-16 h-16 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#888] dark:text-gray-400">关注公众号</span>
                  <Image
                    src="/qrcode_for_gh.jpg"
                    alt="公众号二维码"
                    width={80}
                    height={80}
                    className="w-16 h-16 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
              </div>
            </section>

          </aside>
        </div>
      </section>

      <section className="mt-12 mb-10">
        <div className="mb-5 border-b border-[#e8dfd0] pb-3 dark:border-gray-800">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-[1.45rem] font-semibold tracking-[0.04em] text-[#221f19] dark:text-gray-100">自用应用</h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">Apps</p>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#847a67] dark:text-gray-400">
            长期维护的页面与应用，不是一次性小脚本；真正的站内小工具在
            <Link href="/ai-projects#site-tools" className="mx-1 text-[#5a4725] underline-offset-2 hover:underline dark:text-[#c8b99d]">
              AI 项目页
            </Link>
            。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/eatwhat"
            className="group block rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-[18px]" aria-hidden="true">🥢</span>
              <span className="font-semibold text-[#1d1a16] dark:text-gray-100">吃什么</span>
            </div>
            <p className="text-[13px] leading-6 text-[#666] dark:text-gray-400">
              帮你决定下一顿，分大人和宝宝两套清单。
            </p>
          </Link>

          <Link
            href="/xiaomoli-dad-todo"
            className="group block rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-[18px]" aria-hidden="true">📋</span>
              <span className="font-semibold text-[#1d1a16] dark:text-gray-100">茉莉奶爸待办</span>
            </div>
            <p className="text-[13px] leading-6 text-[#666] dark:text-gray-400">
              日常 + 习惯 + 家庭节奏的多维勾选，按日期沉淀。
            </p>
          </Link>

          <Link
            href="/web-llm"
            className="group block rounded-2xl border border-[#ece5d8] bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]"
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-[18px]" aria-hidden="true">▣</span>
              <span className="font-semibold text-[#1d1a16] dark:text-gray-100">端侧大模型</span>
            </div>
            <p className="text-[13px] leading-6 text-[#666] dark:text-gray-400">
              记录 WebGPU、Ollama、本机运行时、边缘设备与分布式智能实践。
            </p>
          </Link>
        </div>
      </section>

      <section>
        <SiteFooter />
      </section>
    </div>
  )
}

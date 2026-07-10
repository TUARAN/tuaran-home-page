import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import RanbiPaywall from '../../components/RanbiPaywall'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'speedrun-investing'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`

export const metadata = {
  title: '速通投资：从书单到资源入口',
  description:
    '把一张投资书单整理成可执行的阅读路径：价值投资、市场随机性、风险周期、财报、投资大师和金钱心理学，一页集成豆瓣、微信读书、购买检索与官方资源入口。',
  keywords: ['速通投资', '投资书单', '价值投资', '财报', '巴菲特', '查理芒格', '纳瓦尔', '涂阿燃', 'tuaran'],
  alternates: {
    canonical: `/resources/${RESOURCE_SLUG}`,
  },
}

const officialLinks = {
  '期权、期货及其他衍生品': {
    label: 'Pearson 检索',
    url: 'https://www.pearson.com/en-us/search.html?aq=Options%2C%20Futures%2C%20and%20Other%20Derivatives',
  },
  聪明的投资者: {
    label: 'HarperCollins 检索',
    url: 'https://www.harpercollins.com/search?q=The%20Intelligent%20Investor',
  },
  证券分析: {
    label: 'McGraw Hill 检索',
    url: 'https://www.mheducation.com/search.html?searchQuery=Security%20Analysis%20Graham%20Dodd',
  },
  漫步华尔街: {
    label: 'Norton 检索',
    url: 'https://wwnorton.com/search/books?search=A%20Random%20Walk%20Down%20Wall%20Street',
  },
  灰犀牛: {
    label: '作者站',
    url: 'https://www.thegreyrhino.com/',
  },
  黑天鹅: {
    label: 'Penguin 检索',
    url: 'https://www.penguinrandomhouse.com/search/?q=The%20Black%20Swan%20Nassim%20Taleb',
  },
  随机漫步的傻瓜: {
    label: 'Penguin 检索',
    url: 'https://www.penguinrandomhouse.com/search/?q=Fooled%20by%20Randomness%20Nassim%20Taleb',
  },
  纳瓦尔宝典: {
    label: '官方免费版',
    url: 'https://www.navalmanack.com/',
  },
  巴菲特致股东的信: {
    label: '伯克希尔原文',
    url: 'https://www.berkshirehathaway.com/letters/letters.html',
  },
  穷查理宝典: {
    label: 'Stripe Press',
    url: 'https://www.stripe.press/poor-charlies-almanack',
  },
  金钱心理学: {
    label: 'Harriman House',
    url: 'https://www.harriman-house.com/psychologyofmoney',
  },
  客户的游艇在哪里: {
    label: 'Wiley 检索',
    url: 'https://www.wiley.com/en-us/search?pq=Where%20Are%20the%20Customers%27%20Yachts',
  },
  周期: {
    label: 'Oaktree 书页',
    url: 'https://www.oaktreecapital.com/insights/books/mastering-the-market-cycle',
  },
  原则: {
    label: '官方站',
    url: 'https://www.principles.com/',
  },
}

function bookSearchLinks(title) {
  const q = encodeURIComponent(title)
  const links = [
    {
      label: '豆瓣',
      url: `https://search.douban.com/book/subject_search?search_text=${q}`,
    },
    {
      label: '微信读书',
      url: `https://weread.qq.com/web/search/books?keyword=${q}`,
    },
    {
      label: '京东',
      url: `https://search.jd.com/Search?keyword=${q}&enc=utf-8`,
    },
  ]

  if (officialLinks[title]) {
    links.unshift(officialLinks[title])
  }

  return links
}

const bookGroups = [
  {
    id: 'foundation',
    title: '第一层：投资底层框架',
    description: '先建立“市场是否有效、价格和价值是否偏离、长期收益从哪里来”的基本判断。',
    books: [
      {
        title: '聪明的投资者',
        author: '本杰明·格雷厄姆',
        role: '价值投资入门',
        level: '先读',
        note: '安全边际、市场先生、防御型投资者，是后面所有价值投资书的底座。',
      },
      {
        title: '证券分析',
        author: '本杰明·格雷厄姆、戴维·多德',
        role: '基本面分析',
        level: '进阶',
        note: '比《聪明的投资者》更硬，适合在能看懂财报之后回头啃。',
      },
      {
        title: '漫步华尔街',
        author: '伯顿·马尔基尔',
        role: '有效市场与指数化',
        level: '先读',
        note: '用来给价值投资降温：不是所有人都能靠主动选股跑赢市场。',
      },
      {
        title: '股息不说谎',
        author: '凯利·赖特',
        role: '股息估值',
        level: '补充',
        note: '把分红视为企业质量和估值温度计，适合搭配低波动、现金流型资产阅读。',
      },
    ],
  },
  {
    id: 'risk',
    title: '第二层：随机性、风险与周期',
    description: '理解投资世界里最容易被低估的三件事：运气、尾部风险、宏观和信用周期。',
    books: [
      {
        title: '黑天鹅',
        author: '纳西姆·尼古拉斯·塔勒布',
        role: '尾部风险',
        level: '先读',
        note: '提醒你不要把少数样本、正态分布和历史回测当成确定性。',
      },
      {
        title: '随机漫步的傻瓜',
        author: '纳西姆·尼古拉斯·塔勒布',
        role: '概率与运气',
        level: '先读',
        note: '非常适合用来拆解“短期赚钱 = 能力强”的错觉。',
      },
      {
        title: '灰犀牛',
        author: '米歇尔·渥克',
        role: '显性风险',
        level: '补充',
        note: '和黑天鹅互补：有些风险不是不可预见，而是被反复忽视。',
      },
      {
        title: '周期',
        author: '霍华德·马克斯',
        role: '市场周期',
        level: '先读',
        note: '把估值、信贷、情绪和周期位置连起来，是投资者的节奏训练。',
      },
      {
        title: '期权、期货及其他衍生品',
        author: '约翰·赫尔',
        role: '衍生品工具书',
        level: '查阅',
        note: '不是速读书，适合作为期权、期货、掉期、风险中性定价的案头手册。',
      },
    ],
  },
  {
    id: 'masters',
    title: '第三层：投资大师与长期主义',
    description: '从人物和信件里学判断力、约束感、机会成本，而不是只抄持仓。',
    books: [
      {
        title: '滚雪球',
        author: '艾丽斯·施罗德',
        role: '巴菲特传记',
        level: '先读',
        note: '理解巴菲特的性格、复利、声誉和资本配置，不只看成功神话。',
      },
      {
        title: '巴菲特致股东的信',
        author: '沃伦·巴菲特',
        role: '年度原文',
        level: '反复读',
        note: '最值得长期回看的投资原始资料之一，建议从近十年信件开始。',
      },
      {
        title: '穷查理宝典',
        author: '查理·芒格',
        role: '多元思维模型',
        level: '反复读',
        note: '重点不在金句，而在跨学科模型、逆向思维和避免愚蠢。',
      },
      {
        title: '邓普顿教你逆向投资',
        author: '劳伦·邓普顿、斯科特·菲利普斯',
        role: '逆向投资',
        level: '补充',
        note: '用来理解“极度悲观时买入”的纪律，以及全球视野里的低估机会。',
      },
      {
        title: '纳瓦尔宝典',
        author: '埃里克·乔根森整理',
        role: '财富与判断力',
        level: '先读',
        note: '严格说不是投资书，但对杠杆、复利、声誉、长期游戏讲得很浓缩。',
      },
    ],
  },
  {
    id: 'business',
    title: '第四层：企业、区域与真实世界',
    description: '把投资从“买卖价格”拉回到企业、区域、产业和现金流。',
    books: [
      {
        title: '区域经济学',
        author: '多版本教材',
        role: '空间与产业',
        level: '补充',
        note: '看城市、产业集群、人口流动、地方财政和资产价格时很有用。',
      },
      {
        title: '客户的游艇在哪里',
        author: '弗雷德·施韦德',
        role: '华尔街讽刺',
        level: '先读',
        note: '用很轻的方式提醒：金融行业的激励结构经常和客户收益不一致。',
      },
    ],
  },
  {
    id: 'psychology',
    title: '第五层：金钱心理与个人原则',
    description: '最后回到投资者自己：你如何面对波动、欲望、比较和决策系统。',
    books: [
      {
        title: '金钱心理学',
        author: '摩根·豪泽尔',
        role: '行为与财富观',
        level: '先读',
        note: '投资最大的变量经常不是知识，而是能否长期做出不伤害自己的选择。',
      },
      {
        title: '原则',
        author: '瑞·达利欧',
        role: '决策系统',
        level: '补充',
        note: '适合把投资方法扩展到个人决策、组织管理和复盘系统。',
      },
    ],
  },
]

const readingPath = [
  '如果只想速通：先读《聪明的投资者》《漫步华尔街》《随机漫步的傻瓜》《周期》《金钱心理学》。',
  '如果要做主动投资：补《证券分析》《巴菲特致股东的信》《穷查理宝典》。',
  '如果关注风险管理：读《黑天鹅》《灰犀牛》，把《期权、期货及其他衍生品》当工具书查。',
  '如果想理解投资人的长期状态：读《滚雪球》《纳瓦尔宝典》《原则》《客户的游艇在哪里》。',
]

const stats = [
  ['18', '本书'],
  ['5', '个模块'],
  ['4', '类入口'],
]

const tocItems = bookGroups.map((group) => ({
  id: group.id,
  title: group.title.replace(/^第.层：/, ''),
}))

export default function SpeedrunInvestingPage() {
  const allBooks = bookGroups.flatMap((group) => group.books)

  return (
    <>
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <PageContainer className="py-10 md:py-12">
        <header className="mb-8 border-b border-[var(--site-line)] pb-7">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--site-faint)]">
            <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">
              资源库
            </Link>
            <span aria-hidden="true">·</span>
            <span>投资书单</span>
            <span aria-hidden="true">·</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--site-accent)]">
                Investing Resource Map
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-wide text-[var(--site-ink)] md:text-4xl">
                速通投资
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--site-muted)]">
                从价值投资、有效市场、随机性、周期和财报入门，
                一路读到巴菲特、芒格、纳瓦尔、达利欧和金钱心理学。每本书都带豆瓣、微信读书、购买检索；
                能确认官方或出版方入口的，额外放在最前面。
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-3 border-l border-[var(--site-line)] pl-4">
              {stats.map(([value, label]) => (
                <div key={label}>
                  <dt className="text-[11px] text-[var(--site-faint)]">{label}</dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold text-[var(--site-ink)]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SharePageButton
              title="速通投资"
              text="把投资书单整理成一页可执行资源：价值投资、随机性、周期、财报和投资大师。"
              url={RESOURCE_URL}
            />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title="速通投资"
                summary="把投资书单整理成一页可执行资源：价值投资、随机性、周期、财报和投资大师。"
                url={`/resources/${RESOURCE_SLUG}`}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={['投资', '书单', '价值投资', '财报', '资源']}
                kindLabel="资源"
              />
            </ArticleActionsDropdown>
          </div>
        </header>

        <RanbiPaywall resourceKey={`resource:${RESOURCE_SLUG}`} unitLabel="资源">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <main>
              <section className="mb-9">
                <h2 className="font-serif text-xl font-semibold text-[var(--site-ink)]">推荐读法</h2>
                <ol className="mt-4 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)] text-sm leading-7 text-[var(--site-muted)]">
                  {readingPath.map((item, index) => (
                    <li key={item} className="grid gap-3 py-3 md:grid-cols-[42px_1fr]">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="space-y-11">
                {bookGroups.map((group) => (
                  <section key={group.id} id={group.id} className="scroll-mt-24">
                    <div className="mb-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">
                        {group.id}
                      </p>
                      <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--site-ink)]">
                        {group.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{group.description}</p>
                    </div>

                    <div className="divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
                      {group.books.map((book) => {
                        const links = bookSearchLinks(book.title)
                        return (
                          <article key={book.title} className="grid gap-3 py-5 md:grid-cols-[minmax(150px,0.7fr)_1fr]">
                            <div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--site-faint)]">
                                <span>{book.level}</span>
                                <span aria-hidden="true">/</span>
                                <span>{book.role}</span>
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-[var(--site-ink)]">{book.title}</h3>
                              <p className="mt-1 text-sm text-[var(--site-faint)]">{book.author}</p>
                            </div>
                            <div>
                              <p className="text-sm leading-7 text-[var(--site-muted)]">{book.note}</p>
                              <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
                                {links.map((link, index) => (
                                  <span key={`${book.title}-${link.label}`}>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-[var(--site-accent)] underline underline-offset-4 hover:text-[var(--site-accent-strong)]"
                                    >
                                      {link.label}
                                    </a>
                                    {index < links.length - 1 ? <span className="text-[var(--site-faint)]"> · </span> : null}
                                  </span>
                                ))}
                              </p>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <section className="mt-11 border-t border-[var(--site-line)] pt-6 text-sm leading-7 text-[var(--site-muted)]">
                <h2 className="text-base font-semibold text-[var(--site-ink)]">维护说明</h2>
                <p className="mt-2">
                  这里不提供盗版电子书下载。豆瓣用于看版本和评论，微信读书用于确认可读性，京东用于查在售版本；
                  官方/出版方链接优先放原始资料或正版页面。遇到中文译名多版本的书，建议先用豆瓣确认译者、出版社和版次。
                </p>
                <p className="mt-2">
                  当前页面收录 {allBooks.length} 个条目；后续可以继续加读书笔记、推荐阅读顺序和中文版本校勘。
                </p>
              </section>
            </main>

            <nav className="border-l border-[var(--site-line)] pl-4 text-sm lg:sticky lg:top-24" aria-label="页面目录">
              <h2 className="font-serif text-base font-semibold text-[var(--site-ink)]">目录</h2>
              <div className="mt-3 space-y-2">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </RanbiPaywall>
        <ArticleFooterCta />
      </PageContainer>
      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}

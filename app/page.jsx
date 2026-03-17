import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'
import SettingsButton from './components/SettingsButton'
import StompPanel from './components/StompPanel'

const posts = [
  {
    date: '',
    title: '博主联盟：开发者博主联盟平台，链接创作与推广',
    href: 'https://blogger-alliance.cn',
    githubHref: 'https://github.com/TUARAN/blogger-alliance',
    showExternalIcon: true,
  },
  {
    date: '',
    title: '前端周刊：每周更新国外论坛的前端热门文章',
    href: 'https://frontendweekly.cn/',
    githubHref: 'https://github.com/TUARAN/frontend-weekly-digest-cn',
    showExternalIcon: true,
  },
]

function wrapTitle(title) {
  if (!title) return ''
  if (title.includes('《') || title.includes('》')) return title
  return `《${title}》`
}

function splitProjectTitle(title) {
  if (typeof title !== 'string') return { name: '', rest: '' }
  const colonIndex = title.indexOf('：')
  if (colonIndex === -1) return { name: title, rest: '' }
  return {
    name: title.slice(0, colonIndex),
    rest: title.slice(colonIndex),
  }
}

export const dynamic = 'force-static'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function getArticleLink(article) {
  return isExternalHref(article?.href) ? article.href : `/articles/${article.slug}`
}

export default function HomePage() {
  const featuredArticles = articles.slice(0, 3)
  const maintainedDomains = [
    {
      name: '🚀 MatrixLink',
      href: 'https://matrixlink.tech',
      domain: 'matrixlink.tech',
      category: '公司官网',
      focus: '企业品牌展示与技术服务介绍',
      status: '运营中',
    },
    {
      name: '🤝 Blogger Alliance',
      href: 'https://blogger-alliance.cn',
      domain: 'blogger-alliance.cn',
      category: '社区平台',
      focus: '技术博主协作与内容联盟',
      status: '运营中',
    },
    {
      name: '🧭 Frontend Weekly',
      href: 'https://frontendweekly.cn',
      domain: 'frontendweekly.cn',
      category: '内容周刊',
      focus: '前端热点整理与海外文章翻译',
      status: '持续更新',
    },
    {
      name: '🤖 I Am Vibe Coder',
      href: 'https://iamvibecoder.cn',
      domain: 'iamvibecoder.cn',
      category: 'AI 编程',
      focus: 'AI 编程实践与开发者实验场',
      status: '运营中',
    },
    {
      name: '✍️ PublishLab',
      href: 'https://publishlab.cc',
      domain: 'publishlab.cc',
      category: '创作实验室',
      focus: 'AI 写作、内容创作与数字出版',
      status: '打磨中',
    },
  ]
  const domainStrategySteps = [
    {
      title: '先把域名分层，每个域名都绑定一个明确角色，而不是闲置',
      detail:
        '有的做产品入口（一个可访问的 AI 工具或页面），有的做内容阵地（文章、周刊、聚合页），有的做跳转分发（承接不同平台流量），这样每一个域名都在产生行为数据。',
    },
    {
      title: '然后让域名承载真实使用场景',
      detail:
        '比如你做一个简单的 AI 工具页、一个 prompt 工厂、一个博客聚合站，哪怕很轻，也要让用户能“访问、停留、使用”，一旦有 UV、有停留时长，这个域名就从“字符串”变成“资产”。',
    },
    {
      title: '再做流量绑定，而不是只做注册',
      detail:
        '把现在已有的内容矩阵（掘金、公众号、知乎）全部统一指向某几个核心域名，让所有分发最终回流到域名，这一步决定了域名的长期价值。',
    },
    {
      title: '接着做结构化扩展，而不是盲目增加数量',
      detail:
        '围绕一个主域名做子域或路径扩展，比如 tools.xxx、ai.xxx、weekly.xxx，让域名变成一个“平台结构”，而不是一个孤立入口。',
    },
    {
      title: '最后才是商业化',
      detail:
        '当域名上已经有稳定访问、内容沉淀、甚至工具使用时，它天然具备三种变现能力：广告位、工具收费、品牌合作，这时候域名本身就变成了一个可定价资产。',
    },
  ]
  const domainStrategySummary =
    '域名的价值不来自“你买了它”，而来自有没有持续的用户行为在这个地址上发生。'
  const identityGroups = [
    {
      label: '职业',
      tone: 'blue',
      items: ['程序员', '项目经理'],
    },
    {
      label: '创作',
      tone: 'purple',
      items: ['技术博主', '出版作者'],
    },
    {
      label: '家庭',
      tone: 'amber',
      items: ['茉莉奶爸'],
    },
    {
      label: '创业',
      tone: 'emerald',
      items: [{ label: '广州矩联科技创始人', href: 'https://matrixlink.tech/' }],
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

  const getIdentityTagClassName = (tone) => {
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium'
    switch (tone) {
      case 'blue':
        return `${base} border-blue-200/70 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200`
      case 'purple':
        return `${base} border-purple-200/70 bg-purple-50/80 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200`
      case 'amber':
        return `${base} border-amber-200/70 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200`
      case 'emerald':
        return `${base} border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200`
      default:
        return `${base} border-gray-200/70 bg-white/80 text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200`
    }
  }

  const getDomainStatusClassName = (status) => {
    const base = 'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium'
    switch (status) {
      case '持续更新':
        return `${base} border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200`
      case '打磨中':
        return `${base} border-amber-200/70 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200`
      default:
        return `${base} border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200`
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#eee] dark:border-gray-800 pb-2 mb-8">
        <div>
          <div>
            <div className="flex items-center gap-3 mt-1 min-w-0">
              <div className="text-sm text-[#666] dark:text-gray-300 shrink-0">
                <span className="text-sm text-[#777] dark:text-gray-400">账号集：</span>{' '}
                <a
                  href="https://juejin.cn/user/1521379823340792"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  掘金安东尼
                </a>
                {' '}｜{' '}
                <a
                  href="https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  安东尼404
                </a>
                {' '}｜{' '}
                <a
                  href="https://blog.csdn.net/aifs2025"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  安东尼与AI
                </a>
              </div>

              <span className="text-sm text-[#777] dark:text-gray-400 shrink-0">身份标签：</span>
              <div className="identity-scroll relative overflow-hidden w-[180px] sm:w-[220px] lg:w-[260px] min-w-0">
                <div className="identity-scroll-track">
                  {identityItems.map((item) => (
                    item.href ? (
                      <a
                        key={item.key}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`${getIdentityTagClassName(item.tone)} opacity-90 hover:opacity-100`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span key={item.key} className={getIdentityTagClassName(item.tone)}>
                        {item.label}
                      </span>
                    )
                  ))}
                  {identityItems.map((item) => (
                    item.href ? (
                      <a
                        key={`${item.key}-clone`}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`${getIdentityTagClassName(item.tone)} opacity-90 hover:opacity-100`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span key={`${item.key}-clone`} className={getIdentityTagClassName(item.tone)}>
                        {item.label}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-4">
              专注前端工程化与 AI 智能体系统，参与技术社区共建，记录长期主义的创作者成长。
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4 text-sm sm:self-stretch sm:justify-between sm:py-1">
          <SettingsButton />
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <main className="flex-1">
          <section className="mb-10">
            <h2>推荐阅读</h2>
            <ul className="space-y-3">
              {featuredArticles.map((a, index) => (
                <li
                  key={`${a.date}-${a.title}`}
                  className="flex items-start gap-2"
                >
                  <span className="text-[#999] text-sm mt-1">▪</span>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[#666] mr-2">{a.date} »</span>
                    <a
                      href={getArticleLink(a)}
                      target={isExternalHref(a.href) ? '_blank' : undefined}
                      rel={isExternalHref(a.href) ? 'noreferrer' : undefined}
                      className="opacity-80 hover:opacity-100"
                    >
                      {wrapTitle(a.title)}
                    </a>
                    {index === featuredArticles.length - 1 ? (
                      <Link
                        href="/articles"
                        className="ml-3 text-xs text-[#666] underline underline-offset-4 opacity-80 hover:opacity-100"
                      >
                        更多文章
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>发起项目</h2>
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.href} className="flex items-start gap-2">
                  <span className="text-[#999] text-sm mt-1">▪</span>
                  <div className="text-sm">
                    {p.date ? <span className="text-[#666] mr-2">{p.date} »</span> : null}
                    {p.githubHref ? (
                      (() => {
                        const { name, rest } = splitProjectTitle(p.title)
                        return (
                          <>
                            <a
                              href={p.githubHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 !text-black opacity-80 hover:opacity-100 underline underline-offset-4"
                              aria-label={`${name || p.title} GitHub`}
                            >
                              <span>{name || p.title}</span>
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 16 16"
                                className="w-4 h-4 shrink-0"
                                fill="currentColor"
                              >
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.58 7.58 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                              </svg>
                            </a>
                            {rest ? <span className="text-[#666]">{rest}</span> : null}
                          </>
                        )
                      })()
                    ) : (
                      <span className="opacity-80">{p.title}</span>
                    )}
                    {p.showExternalIcon ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="站点"
                        className="ml-2 inline-flex items-center gap-1 !text-black opacity-80 hover:opacity-100 no-underline hover:no-underline border-b border-transparent hover:border-current"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3.5h10c.69 0 1.25.56 1.25 1.25v7.5c0 .69-.56 1.25-1.25 1.25H3c-.69 0-1.25-.56-1.25-1.25v-7.5C1.75 4.06 2.31 3.5 3 3.5Z" />
                          <path d="M1.75 5.75h12.5" />
                          <circle cx="9.75" cy="9.25" r="2" />
                          <path d="M9.75 7.5v3.5" />
                          <path d="M8 9.25h3.5" />
                          <path d="M4.25 4.75h.01" />
                          <path d="M5.75 4.75h.01" />
                          <path d="M7.25 4.75h.01" />
                        </svg>
                        <span className="text-xs !text-[#004276] dark:!text-blue-400 leading-none">站点</span>
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2>个人介绍</h2>
            <div className="text-sm text-[#666]">
              <p>
                ▪ 已出版：
                <a
                  href="https://item.jd.com/14356664.html"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  《程序员成长手记》
                </a>
                、
                <a
                  href="https://juejin.cn/book/7351709145294176282"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  《AI Bots 通关指南》
                </a>
                ，出版中：大模型/智能体/具身智能相关书籍
              </p>
              <div className="my-4 flex flex-wrap items-center gap-3">
                <a
                  href="https://item.jd.com/14356664.html"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow block opacity-80 hover:opacity-100"
                >
                  <Image
                    src="/20260104094558_496.png"
                    alt="程序员成长手记二维码"
                    width={100}
                    height={100}
                    className="w-24 h-24 object-contain border border-[#eee] bg-white"
                  />
                </a>
                <a
                  href="https://juejin.cn/book/7351709145294176282"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow block opacity-80 hover:opacity-100"
                >
                  <Image
                    src="/20260104094842_497.png"
                    alt="AI Bots 通关指南二维码"
                    width={100}
                    height={100}
                    className="w-24 h-24 object-contain border border-[#eee] bg-white"
                  />
                </a>
              </div>
              <p>
                ▪ 掘金社区共建者/签约作者、CSDN 7级博主、头条作者、小红书万粉博主、51CTO 社区专家博主
               
              </p>
              <p> <a
                  href="https://blogger-alliance.cn/matrix"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  ▪ 全网累计发布技术文章 500 篇+，阅读量超 400 万+ 📊
                </a></p>
            </div>
          </section>

          <StompPanel />
        </main>

        <aside className="w-full md:w-64">
          <section className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">关于</h3>
            <div className="text-sm text-[#666] space-y-3 dark:text-gray-300">
              <p>主要写：编程 / 创作 / 生活记录。</p>
              <p>
                联系：微信号 <span className="font-semibold text-[#222] dark:text-gray-100">atar24</span>
              </p>
              <p>
                创立：{' '}
                <a
                  href="http://matrixlink.tech/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow text-[#004276] dark:text-blue-400 underline underline-offset-2 opacity-80 hover:opacity-100"
                >
                  矩联科技
                </a>
              </p>
              <div>
                <Image
                  src="/tuaranme.png"
                  alt="涂阿燃"
                  width={80}
                  height={80}
                  className="w-20 max-w-full border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950"
                />
              </div>
            </div>
          </section>

          <section className="border border-[#eee] bg-white p-4 mt-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">公众号</h3>
            <div className="text-sm text-[#666] space-y-3 dark:text-gray-300">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-[#666] dark:text-gray-300">扫码交个朋友🤝</span>
                  <Image
                    src="/qrcodewechat3.png"
                    alt="扫码加好友二维码"
                    width={100}
                    height={100}
                    className="w-24 max-w-full border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-[#666] dark:text-gray-300">关注公众号👀</span>
                  <Image
                    src="/qrcode_for_gh.jpg"
                    alt="公众号二维码"
                    width={100}
                    height={100}
                    className="w-24 max-w-full border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
              </div>
              <div className="text-xs font-semibold tracking-wide">
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  ✨ 高山流水觅知音，邀君并肩共前行。
                </span>
              </div>
            </div>
          </section>

          <section className="border border-[#eee] bg-white p-4 mt-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">工具箱</h3>
            <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              <li>
                ▪{' '}
                <a
                  href="https://matrix-ai-pdfs.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  <span className="inline-flex items-center gap-1">
                    安东尼学AI
                    <span aria-hidden="true">🔥🔥🔥</span>
                  </span>
                </a>
              </li>
              <li>
                ▪{' '}
                <a
                  href="https://banana-gallery.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  <span className="inline-flex items-center gap-1">
                    banana-gallery
                    <span aria-hidden="true">🔥</span>
                  </span>
                </a>
              </li>
              <li>
                ▪{' '}
                <a
                  href="https://awesome-prompt-seven.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  提示词工程
                </a>
              </li>
              <li>
                ▪{' '}
                <a
                  href="https://toolkit-hub.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100"
                >
                  代码矿工
                </a>
              </li>
            </ul>
          </section>


        </aside>
      </div>

      <footer className="mt-16 pt-8 border-t border-[#eee] dark:border-gray-800 text-[#999] text-xs">
        <section className="max-w-5xl mx-auto text-left mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#333] dark:text-gray-200">🌐 我维护的域名</h3>
            <div className="group relative inline-flex">
              <button
                type="button"
                aria-label="查看域名价值经营说明"
                className="inline-flex items-center gap-1 rounded-full border border-[#e6e6e6] bg-white px-2.5 py-1 text-xs font-medium text-[#666] opacity-90 transition hover:opacity-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] leading-none"
                >
                  i
                </span>
                <span>让域名“长出业务”，而不是“躺着等人买”</span>
              </button>
              <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-[90vw] max-w-[36rem] translate-y-1 rounded-xl border border-[#e8e8e8] bg-white p-4 text-left text-sm text-[#555] opacity-0 shadow-xl transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <div className="text-sm font-semibold text-[#333] dark:text-gray-100">
                  让域名“长出业务”，而不是“躺着等人买”
                </div>
                <ol className="mt-3 space-y-3 pl-5 text-sm leading-6 text-[#666] dark:text-gray-300">
                  {domainStrategySteps.map((step, index) => (
                    <li key={step.title}>
                      <span className="font-medium text-[#333] dark:text-gray-100">
                        {index + 1}、{step.title}
                      </span>
                      <p className="mb-0 mt-1 text-sm leading-6 text-[#666] dark:text-gray-300">
                        {step.detail}
                      </p>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-lg bg-[#f8f8f8] px-3 py-2 text-sm leading-6 text-[#444] dark:bg-gray-800 dark:text-gray-200">
                  <span className="font-semibold">一句话总结：</span>
                  {domainStrategySummary}
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#eee] bg-white/70 dark:border-gray-800 dark:bg-gray-900/70">
            <table className="min-w-full border-collapse text-left text-sm text-[#666] dark:text-gray-300">
              <thead className="bg-[#f8f8f8] text-xs uppercase tracking-wide text-[#888] dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3 font-medium">项目</th>
                  <th className="px-3 py-3 font-medium">域名</th>
                  <th className="px-3 py-3 font-medium">类型</th>
                  <th className="px-3 py-3 font-medium">定位</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {maintainedDomains.map((link) => (
                  <tr
                    key={link.href}
                    className="border-t border-[#eee] align-top dark:border-gray-800"
                  >
                    <td className="px-3 py-3 font-medium text-[#333] dark:text-gray-100">
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="no-external-arrow opacity-90 hover:opacity-100"
                      >
                        {link.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#777] dark:text-gray-400">
                      {link.domain}
                    </td>
                    <td className="px-3 py-3">{link.category}</td>
                    <td className="px-3 py-3 text-xs leading-5 text-[#777] dark:text-gray-400">
                      {link.focus}
                    </td>
                    <td className="px-3 py-3">
                      <span className={getDomainStatusClassName(link.status)}>
                        {link.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center text-center">
          <span>© 2025 涂阿燃的网络日志</span>
          <a href="/traffic" className="opacity-80 hover:opacity-100">
            流量统计
          </a>
        </p>
      </footer>
    </div>
  )
}

import { articles } from './articles/articlesData'

const posts = [
  {
    date: '2025年12月05日',
    title: '前端周刊：每周更新国外论坛的前端热门文章',
    href: 'https://fwdc.pages.dev/',
    githubHref: 'https://github.com/TUARAN/frontend-weekly-digest-cn',
    showExternalIcon: true,
  },
  {
    date: '2025年12月19日',
    title: '博主联盟：开发者博主联盟平台，链接创作与推广',
    href: 'https://blogger-alliance.pages.dev/',
    githubHref: 'https://github.com/TUARAN/blogger-alliance',
    showExternalIcon: true,
  },
  {
    date: '2025年12月23日',
    title: '矩阵先锋：多平台内容创作者数据追踪与展示平台',
    href: 'https://csdn-fans-tracker.pages.dev/dashboard',
    githubHref: 'https://github.com/TUARAN/fans-tracker',
    showExternalIcon: true,
  },
]

function wrapTitle(title) {
  if (!title) return ''
  if (title.includes('《') || title.includes('》')) return title
  return `《${title}》`
}

export const dynamic = 'force-static'

export default function HomePage() {
  const featuredArticles = articles.slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-[#eee] pb-4 mb-8">
        <div>
          <h1 className="text-[#555]">涂阿燃的网络日志</h1>
          <p className="text-sm text-[#666] mt-1">
            AKA{' '}
            <a
              href="https://juejin.cn/user/1521379823340792"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100"
            >
              掘金安东尼
            </a>{' '}
            /{' '}
            <a
              href="https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100"
            >
              安东尼404
            </a>
            {' '}/{' '}
            <a
              href="https://blog.csdn.net/aifs2025"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100"
            >
              安东尼与AI
            </a>
          </p>
          <p className="text-sm text-[#666] mt-1">
            专注前端工程化、AI 智能体与技术社区共建，记录长期主义的创作者成长。
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/TUARAN"
            target="_blank"
            rel="noreferrer"
            className=""
          >
            <span className="inline-flex items-center gap-1">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="w-4 h-4 !text-black"
                fill="currentColor"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.58 7.58 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              GitHub
            </span>
          </a>
        </nav>
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
                      href={a.href}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-80 hover:opacity-100"
                    >
                      {wrapTitle(a.title)}
                    </a>
                    {index === featuredArticles.length - 1 ? (
                      <a
                        href="/articles"
                        className="ml-3 text-xs text-[#666] underline underline-offset-4 opacity-80 hover:opacity-100"
                      >
                        更多文章
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>项目更新</h2>
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.href} className="flex items-start gap-2">
                  <span className="text-[#999] text-sm mt-1">▪</span>
                  <div className="text-sm">
                    <span className="text-[#666] mr-2">{p.date} »</span>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-80 hover:opacity-100"
                    >
                      <span className="inline-flex items-center gap-1">
                        {p.title}
                        {p.showExternalIcon ? (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            className="w-3.5 h-3.5"
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
                        ) : null}
                      </span>
                    </a>
                    {p.githubHref ? (
                      <a
                        href={p.githubHref}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                        className="ml-2 inline-flex items-center !text-black opacity-100 hover:opacity-100"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          className="w-4 h-4"
                          fill="currentColor"
                        >
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.58 7.58 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                        </svg>
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
                  className="opacity-80 hover:opacity-100"
                >
                  《程序员成长手记》
                </a>
                /
                <a
                  href="https://juejin.cn/book/7351709145294176282"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
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
                  className="block opacity-80 hover:opacity-100"
                >
                  <img
                    src="/20260104094558_496.png"
                    alt="程序员成长手记二维码"
                    width="100"
                    height="100"
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 object-contain border border-[#eee] bg-white"
                  />
                </a>
                <a
                  href="https://juejin.cn/book/7351709145294176282"
                  target="_blank"
                  rel="noreferrer"
                  className="block opacity-80 hover:opacity-100"
                >
                  <img
                    src="/20260104094842_497.png"
                    alt="AI Bots 通关指南二维码"
                    width="100"
                    height="100"
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 object-contain border border-[#eee] bg-white"
                  />
                </a>
              </div>
              <p>
                ▪ 发起
                <a
                  href="https://fwdc.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  「前端周刊」
                </a>
                、
                <a
                  href="https://blogger-alliance.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  「博主联盟」
                </a>
                等内容共创项目
              </p>
              <p>
                ▪ 作为掘金社区共建者/签约作者、51CTO 社区专家博主，
                <a
                  href="https://csdn-fans-tracker.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  全网累计发布技术文章 500 篇+，阅读量超 300 万+
                </a>
              </p>
              <p>▪ 具备程序员与科创项目经理的复合背景，关注前端工程化、智能体系统与大语言模型应用</p>
            </div>
          </section>
        </main>

        <aside className="w-full md:w-64">
          <section className="border border-[#eee] bg-white p-4">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3">关于</h3>
            <div className="text-sm text-[#666] space-y-2">
              <p>主要写：编程 / 创作 / 生活记录。</p>
              <p>
                联系：微信号：atar24
              </p>
            </div>
            <div className="mt-4">
              <img
                src="/tuaranme.png"
                alt="涂阿燃"
                width="80"
                height="80"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="w-20 max-w-full border border-[#eee] bg-white"
              />
            </div>
          </section>

          <section className="border border-[#eee] bg-white p-4 mt-6">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3">工具箱</h3>
            <ul className="text-sm text-[#666] space-y-2">
              <li>
                ▪{' '}
                <a
                  href="https://matrix-ai-pdfs.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
                >
                  <span className="inline-flex items-center gap-1">
                    安东尼学AI
                    <span aria-hidden="true">🔥</span>
                  </span>
                </a>
              </li>
              <li>
                ▪{' '}
                <a
                  href="https://banana-gallery.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100"
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
                  className="opacity-80 hover:opacity-100"
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
                  className="opacity-80 hover:opacity-100"
                >
                  代码矿工
                </a>
              </li>
            </ul>
          </section>

          <section className="border border-[#eee] bg-white p-4 mt-6">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3">公众号</h3>
            <div className="text-sm text-[#666] space-y-3">
              <p>扫码关注「前端周看」，获取最新前沿科技资讯🚀</p>
              <img
                src="/qrcode_for_gh.jpg"
                alt="公众号二维码"
                width="80"
                height="80"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="w-20 max-w-full border border-[#eee] bg-white"
              />
            </div>
          </section>
        </aside>
      </div>

      <footer className="mt-16 pt-8 border-t border-[#eee] text-center text-[#999] text-xs">
        <p className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <span>© 2025 涂阿燃的网络日志</span>
          <a href="/traffic" className="opacity-80 hover:opacity-100">
            流量统计
          </a>
        </p>
      </footer>
    </div>
  )
}

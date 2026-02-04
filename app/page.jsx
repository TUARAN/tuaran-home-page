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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#eee] dark:border-gray-800 pb-2 mb-8">
        <div>
          <p className="text-sm text-[#666] dark:text-gray-300 mt-1">
            账号：{' '}
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
          </p>
          <div className="mt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="text-xs text-[#777] dark:text-gray-400 font-medium">身份标签：</span>
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200">
                程序员
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200">
                技术博主
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200">
                项目经理
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200">
                出版作者
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200">
                茉莉奶爸
              </span>
            </div>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-2">
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
                  href="https://csdn-fans-tracker.pages.dev/"
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
            <div className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              <p>主要写：编程 / 创作 / 生活记录。</p>
              <p>
                联系：微信号：atar24
              </p>
            </div>
            <div className="mt-4">
              <Image
                src="/tuaranme.png"
                alt="涂阿燃"
                width={80}
                height={80}
                className="w-20 max-w-full border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950"
              />
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

          <section className="border border-[#eee] bg-white p-4 mt-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">公众号</h3>
            <div className="text-sm text-[#666] space-y-3 dark:text-gray-300">
              <p>扫码关注「前端周看」，获取最新前沿科技资讯🌍</p>
              <Image
                src="/qrcode_for_gh.jpg"
                alt="公众号二维码"
                width={80}
                height={80}
                className="w-20 max-w-full border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950"
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

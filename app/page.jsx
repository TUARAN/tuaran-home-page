import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'
import SettingsButton from './components/SettingsButton'

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
  return isExternalHref(article?.href) ? article.href : `/articles/${article.slug}`
}

export default function HomePage() {
  const featuredArticles = articles.slice(0, 3)
  const identityGroups = [
    {
      label: '账号',
      tone: 'rose',
      items: [
        { label: '掘金安东尼', href: 'https://juejin.cn/user/1521379823340792' },
        { label: '安东尼404', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e' },
        { label: '安东尼与AI', href: 'https://blog.csdn.net/aifs2025' },
      ],
    },
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
      items: [{ label: '技术博主', href: 'https://blogger-alliance.cn/matrix' }, '出版作者'],
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
      case 'rose':
        return `${base} border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200`
      default:
        return `${base} border-gray-200/70 bg-white/80 text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200`
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
      <section className="mb-12 md:mb-14">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-2 mb-8">
          <div>
            <div className="space-y-5">
              <div className="flex items-center gap-3 mt-1 min-w-0">
                <span className="text-sm text-[#777] dark:text-gray-400 shrink-0">身份标签：</span>
                <div className="identity-scroll relative overflow-hidden w-[260px] sm:w-[360px] lg:w-[520px] min-w-0">
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
              <div className="max-w-2xl">
                <p className="mb-0 text-sm leading-7 text-[#777] dark:text-gray-400">
                  专注前端工程化与 AI 智能体系统，参与技术社区共建，记录长期主义的创作者成长。
                </p>
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
            <h2 className="inline-block border-b border-[#eee] pb-2 dark:border-gray-700">推荐阅读</h2>
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

            <section className="mt-6">
              <h2 className="inline-block border-b border-[#eee] pb-2 dark:border-gray-700">个人介绍</h2>
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

          </main>

          <aside className="w-full md:w-64">
            <section className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">交友/合作</h3>
              <div className="text-sm text-[#666] space-y-3 dark:text-gray-300">
                <p>
                  微信号：<span className="font-semibold text-[#222] dark:text-gray-100">atar24</span>
                </p>
                <p>
                  Github：
                  <a
                    href="https://github.com/TUARAN"
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow font-semibold text-[#222] dark:text-gray-100 opacity-90 hover:opacity-100"
                  >
                    TUARAN
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
                <div className="flex items-center gap-4 flex-wrap border-t border-[#eee] pt-3 dark:border-gray-800">
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

          </aside>
        </div>
      </section>

      <section>
        <footer className="pt-2 text-[#999] text-xs">
          <p className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center text-center">
            <span>© 2025—2026 涂阿燃的网络日志</span>
            <a href="/donate" className="opacity-80 hover:opacity-100">
              Buy Me a Coffee
            </a>
            <a href="/traffic" className="opacity-80 hover:opacity-100">
              流量统计
            </a>
          </p>
        </footer>
      </section>
    </div>
  )
}

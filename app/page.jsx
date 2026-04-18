import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'

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
  const featuredArticles = articles.slice(0, 2)
  const communities = [
    { name: '掘金', reads: '219 万', fans: '1.3 万', href: 'https://juejin.cn/user/1521379823340792', color: '#111827', char: '掘' },
    { name: '小红书', reads: '100 万', fans: '1.1 万', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e', color: '#2563EB', char: '红' },
    { name: '知乎', reads: '35 万', fans: '350', href: 'https://www.zhihu.com/', color: '#14B8A6', char: '知' },
    { name: '51CTO', reads: '16 万', fans: '276', href: 'https://blog.51cto.com/u_15298598', color: '#F97316', char: '51' },
    { name: 'CSDN', reads: '15 万', fans: '1,735', href: 'https://blog.csdn.net/aifs2025', color: '#8B5CF6', char: 'C' },
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
    'inline-flex items-center rounded-full border border-[#e5e5e5] bg-transparent px-3 py-1 text-[13px] text-[#555] dark:border-gray-700 dark:text-gray-300'

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8 md:py-10 flex-1 flex flex-col">
      <section className="flex-1 mb-14">
        <header className="pb-2 mb-8">
          <div>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1 min-w-0">
                <span className="text-sm text-[#888] dark:text-gray-400 shrink-0">身份标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {identityItems.map((item) => (
                    item.href ? (
                      <a
                        key={item.key}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`${identityTagClassName} no-external-arrow opacity-80 hover:opacity-100`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span key={item.key} className={identityTagClassName}>
                        {item.label}
                      </span>
                    )
                  ))}
                </div>
              </div>
              <div className="max-w-2xl">
                <p className="mb-0 text-[15px] leading-[1.8] text-[#666] dark:text-gray-400">
                  专注前端工程化与 AI 智能体系统，参与技术社区共建，记录长期主义的创作者成长。
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          <main className="flex-1">
            <section className="mb-12">
            <h2 className="inline-block font-serif text-xl font-semibold tracking-wide text-[#222] dark:text-gray-100 border-b border-[#eee] pb-2 mb-4 dark:border-gray-700">推荐阅读</h2>
            <ul className="space-y-3">
              {featuredArticles.map((a, index) => (
                <li
                  key={`${a.date}-${a.title}`}
                  className="flex items-start gap-2"
                >
                  <span className="text-[#999] text-[15px] mt-1">▪</span>
                  <div className="flex flex-wrap items-center gap-2 text-[15px] leading-7">
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

            <section className="mb-12">
              <h2 className="inline-block font-serif text-xl font-semibold tracking-wide text-[#222] dark:text-gray-100 border-b border-[#eee] pb-2 mb-4 dark:border-gray-700">社区矩阵</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {communities.map((c, idx) => (
                  <a
                    key={c.name}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="no-external-arrow group relative flex items-center gap-3 border border-[#ececec] rounded-md px-3 py-2.5 hover:border-[#bbb] hover:shadow-sm transition-colors dark:border-gray-800 dark:hover:border-gray-600"
                  >
                    <span
                      className="absolute top-1.5 right-2 font-serif text-[10px] font-semibold tracking-wider text-[#bbb] dark:text-gray-600"
                      aria-hidden="true"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="shrink-0 w-9 h-9 rounded flex items-center justify-center text-white text-[13px] font-bold tracking-tight"
                      style={{ backgroundColor: c.color }}
                      aria-hidden="true"
                    >
                      {c.char}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold text-[#222] dark:text-gray-100 leading-tight">{c.name}</span>
                      <span
                        className="text-[11px] text-[#888] dark:text-gray-400 mt-1 leading-tight whitespace-nowrap"
                        title={`阅读 ${c.reads} · 粉丝 ${c.fans}`}
                      >
                        <span className="font-semibold text-[#333] dark:text-gray-200">{c.reads}</span>
                        <span className="mx-1 text-[#ccc] dark:text-gray-600">·</span>
                        <span className="text-[#555] dark:text-gray-300">{c.fans} 粉</span>
                      </span>
                    </span>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-[13px] text-[#888] dark:text-gray-400">
                全网累计发布技术文章 <span className="font-semibold text-[#222] dark:text-gray-100">500 篇+</span>，阅读量超 <span className="font-semibold text-[#222] dark:text-gray-100">400 万+</span>
              </p>
            </section>

            <section className="mb-12">
              <h2 className="inline-block font-serif text-xl font-semibold tracking-wide text-[#222] dark:text-gray-100 border-b border-[#eee] pb-2 mb-4 dark:border-gray-700">著作出版</h2>
              <div className="text-[15px] leading-7 text-[#666] space-y-2">
              <p className="text-[#888] dark:text-gray-400 text-[13px] mb-3">已出版</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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
                    className="no-external-arrow group flex items-center gap-4"
                  >
                    <Image
                      src={book.cover}
                      alt={book.title}
                      width={120}
                      height={160}
                      className="w-16 h-[88px] object-cover rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#ececec] dark:border-gray-800 group-hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-shadow"
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

          </main>

          <aside className="w-full md:w-64">
            <section className="md:border-l md:border-[#ececec] md:pl-6 md:dark:border-gray-800">
              <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-[#eee] dark:border-gray-800">
                <Image
                  src="/tuaranme.png"
                  alt="涂阿燃"
                  width={160}
                  height={160}
                  className="w-32 h-32 rounded-2xl border border-[#e5e5e5] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 object-contain"
                />
                <p className="font-serif text-[15px] font-semibold text-[#222] dark:text-gray-100 mt-3">
                  涂阿燃
                </p>
                <p className="text-[12px] text-[#888] dark:text-gray-400 mt-0.5 tracking-wide">
                  TUARAN · 独立开发者
                </p>
              </div>
              <div className="text-[14px] leading-7 text-[#666] dark:text-gray-300 space-y-3">
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
                <p className="font-serif text-[13px] italic text-[#999] dark:text-gray-500 pt-2 text-center border-t border-[#eee] dark:border-gray-800 mt-4">
                  高山流水觅知音
                  <br />
                  邀君并肩共前行
                </p>
              </div>
            </section>

          </aside>
        </div>
      </section>

      <section>
        <footer className="pt-4 border-t border-[#eee] dark:border-gray-800 text-[#999] text-xs">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
            <span>© 2025—2026 涂阿燃的网络日志</span>
            <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">·</span>
            <a href="/donate" className="opacity-80 hover:opacity-100 hover:text-[#666] dark:hover:text-gray-300 transition-colors">
              Buy Me a Coffee
            </a>
            <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">·</span>
            <a href="/traffic" className="opacity-80 hover:opacity-100 hover:text-[#666] dark:hover:text-gray-300 transition-colors">
              流量统计
            </a>
            <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">·</span>
            <a
              href="https://vibecafe.ai/@tuaran"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100 hover:text-[#666] dark:hover:text-gray-300 transition-colors"
            >
              VibeUsage
            </a>
          </p>
        </footer>
      </section>
    </div>
  )
}

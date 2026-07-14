import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '原创内容导航',
  description:
    '2aran.com 原创内容导航：精选文章、专题分析、日记、作品、出版作品和外部创作平台索引。',
  keywords: ['原创内容', '2aran.com', '涂阿燃', '技术博客', '专题分析', '精选文章'],
  alternates: { canonical: '/originals' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const originalGroups = [
  {
    title: '精选文章',
    desc: '个人判断、工程实践、创作者增长和长期写作沉淀。',
    href: '/articles?tab=posts',
    items: ['前端与 AI 工程化', '产品与项目复盘', '个人判断与方法论'],
  },
  {
    title: '分析与观察',
    desc: '围绕公司、人物、技术、市场和行业议题形成的作者分析。',
    href: '/articles?tab=research',
    items: ['公司观察', '专题分析', '人物内容'],
  },
  {
    title: '浮生日记',
    desc: '阶段性想法、生活片段、年中年终总结和长期记录。',
    href: '/diary',
    items: ['个人日志', '阶段复盘', '内容创作记录'],
  },
  {
    title: '作品与系统',
    desc: '站内工具、产品实验、AI 工程页面和长期项目展示。',
    href: '/works',
    items: ['作品展厅', '站内工具', 'AI 与自动化实验'],
  },
]

const externalProfiles = [
  ['掘金', 'https://juejin.cn/user/1521379823340792'],
  ['GitHub', 'https://github.com/TUARAN'],
  ['小红书', 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e'],
  ['CSDN', 'https://blog.csdn.net/aifs2025'],
  ['51CTO', 'https://blog.51cto.com/u_15298598'],
]

export default function OriginalsPage() {
  return (
    <PageContainer className="py-12">
      <header className="border-b border-[var(--site-line)] pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          Original Content
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[44px]">
          原创内容导航
        </h1>
        <p className="mt-4 max-w-[780px] text-[15px] leading-8 text-[var(--site-muted)]">
          本页把 2aran.com 的原创内容入口集中起来：文章、分析、日记、作品和外部创作账号。
          站内内容主要由涂阿燃持续整理、写作和维护；引用、转载或资料归档会在页面中尽量标注来源。
        </p>
      </header>

      <section className="grid gap-4 py-10 md:grid-cols-2">
        {originalGroups.map((group) => (
          <Link
            key={group.title}
            href={group.href}
            className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(55,45,28,0.10)]"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a5b1e] dark:text-amber-300">
              2aran.com
            </p>
            <h2 className="mt-2 font-serif text-[26px] text-[var(--site-ink)]">{group.title}</h2>
            <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">{group.desc}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="rounded-full border border-[var(--site-line)] bg-white/70 px-2.5 py-1 text-[12px] text-[var(--site-muted)] dark:bg-gray-900/50">
                  {item}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-8 border-t border-[var(--site-line)] py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
            Authorship
          </p>
          <h2 className="mt-2 font-serif text-[28px] text-[var(--site-ink)]">原创与引用说明</h2>
          <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
            本站的观点文章、专题分析、日记和项目说明由站长选题、组织、判断并最终确认。资料库、古典文本、外部收藏、
            书目和链接归档中会包含第三方来源，相关页面会尽量保留原始出处、链接或说明。
          </p>
        </div>
        <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
          <h3 className="font-serif text-[23px] text-[var(--site-ink)]">外部创作账号</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {externalProfiles.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow rounded-lg border border-[var(--site-line)] bg-white/70 px-4 py-3 text-sm font-medium text-[var(--site-ink)] no-underline transition hover:border-[#caa86a] dark:bg-gray-900/50"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="font-serif text-[26px] text-[#5f4617] dark:text-amber-100">从这里继续阅读</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/articles" className="rounded-full bg-[#7a5b1e] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[#6a4f19] dark:bg-amber-700 dark:hover:bg-amber-600">
            知识库
          </Link>
          <Link href="/map" className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            全站地图
          </Link>
          <Link href="/about" className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            关于站长
          </Link>
        </div>
      </section>
    </PageContainer>
  )
}

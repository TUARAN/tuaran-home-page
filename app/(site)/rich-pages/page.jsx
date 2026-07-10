import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import { ENGINEERING_WORK_CATEGORIES, ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/rich-pages'

export const metadata = {
  title: '多维页面',
  description:
    '涂阿燃的多维页面专页：把调研、宣发、内容展示和可交互工具做成同一个可阅读、可操作、可传播的页面系统。',
  alternates: {
    canonical: '/rich-pages',
  },
  openGraph: {
    type: 'website',
    siteName: '2aran.com',
    title: '多维页面',
    description: '过去、现在、未来：可交互调研、可交互宣发、可交互内容展示的页面方法论与案例库。',
    url: PAGE_URL,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '多维页面',
    description: '把调研、宣发和内容展示做成可交互页面系统。',
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

const QUICK_NOTES = [
  ['适合什么', '调研报告、产品宣发、数据专题、工具合集、长期更新的内容项目。'],
  ['比文章多什么', '筛选、对比、证据回看、下载、加入社群、使用工具或继续阅读。'],
  ['判断标准', '不是堆更多信息，而是让读者更快找到路径，并能进入下一步。'],
]

function categoryLabel(categoryId) {
  return ENGINEERING_WORK_CATEGORIES.find((category) => category.id === categoryId)?.title || '多维页面'
}

export default function RichPagesPage() {
  const featuredWorks = ENGINEERING_WORKS.slice(0, 6)

  return (
    <main className="min-h-screen bg-[#f2f3ec] text-[#181b18] dark:bg-[#0c1114] dark:text-gray-100">
      <PageContainer className="py-10 md:py-14">
        <header className="border-b border-[#d6d9c9] pb-8 dark:border-[#24313a]">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#667063] dark:text-[#91a0a9]">
            <Link href="/articles" className="underline-offset-4 hover:underline">
              知识库
            </Link>
            <span>/</span>
            <span>多维页面</span>
          </div>

          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase text-[#1f6f78] dark:text-[#76c6d0]">
              Rich Pages
            </p>
            <h1 className="max-w-4xl font-serif text-[34px] font-semibold leading-tight text-[#151812] md:text-[52px] dark:text-white">
              多维页面，是能阅读、能筛选、能操作的内容页。
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#4f5751] dark:text-[#b5c0c8]">
              把调研、数据、工具和行动入口放在一起。读者不只看结论，还能筛选资料、对比口径、回看证据，直接进入下一步。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/articles?tab=works"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f6f78] no-underline hover:text-[#164f56] dark:text-[#76c6d0] dark:hover:text-[#a2e3ea]"
              >
                查看完整索引 <IconArrowRight size={16} aria-hidden="true" />
              </Link>
              <SharePageButton title="多维页面" text="可阅读、可筛选、可操作的内容页。" url={PAGE_URL} size="sm" />
            </div>
          </div>
        </header>

        <section id="cases" className="py-8 md:py-10">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase text-[#1f6f78] dark:text-[#76c6d0]">
                Cases
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#181b18] dark:text-gray-100 md:text-3xl">
                已经落地的页面
              </h2>
            </div>
            <Link
              href="/articles?tab=works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f6f78] no-underline hover:text-[#164f56] dark:text-[#76c6d0] dark:hover:text-[#a2e3ea]"
            >
              查看索引 <IconArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="border-y border-[#d6d9c9] dark:border-[#24313a]">
            {featuredWorks.map((work) => (
              <Link
                key={work.id}
                href={work.href}
                className="group grid gap-3 border-b border-[#d6d9c9] py-5 text-[#181b18] no-underline transition last:border-b-0 hover:bg-[#ecefe4] dark:border-[#24313a] dark:text-gray-100 dark:hover:bg-[#111a20] md:grid-cols-[170px_minmax(0,1fr)_96px] md:items-start"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#667063] dark:text-[#91a0a9] md:block md:space-y-1">
                  <span className="text-[#1f6f78] dark:text-[#76c6d0]">{categoryLabel(work.category)}</span>
                  <span className="font-mono md:block">{work.date}</span>
                </div>

                <div>
                  <h3 className="m-0 text-xl font-semibold leading-snug text-[#171b17] group-hover:text-[#1f6f78] dark:text-white dark:group-hover:text-[#76c6d0]">
                    {work.title}
                  </h3>
                  <p className="m-0 mt-2 line-clamp-2 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{work.summary}</p>
                </div>

                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b5228] dark:text-[#d8b772] md:justify-end">
                  进入 <IconArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-[#d6d9c9] py-8 dark:border-[#24313a]">
          <div className="grid gap-5 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0] md:grid-cols-3">
            {QUICK_NOTES.map(([title, desc]) => (
              <div key={title}>
                <h3 className="m-0 text-base font-semibold text-[#171b17] dark:text-white">{title}</h3>
                <p className="m-0 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  )
}

import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import { ENGINEERING_WORK_CATEGORIES, ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

export const metadata = {
  title: '工程作品',
  description:
    '涂阿燃自研的可视化、富数据调研与长期写作工程。每一件都带交互、带数据、带工程量 —— 不是单纯 Markdown 文章，而是不可被 AI 复制的原创判断与实现。',
  alternates: {
    canonical: '/works',
  },
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.replace(/-/g, ' / ')
}

function getWorksByCategory(categoryId) {
  return ENGINEERING_WORKS.filter((work) => work.category === categoryId)
}

export default function WorksPage() {
  const uncategorizedWorks = ENGINEERING_WORKS.filter(
    (work) => !ENGINEERING_WORK_CATEGORIES.some((category) => category.id === work.category)
  )
  const sections = [
    ...ENGINEERING_WORK_CATEGORIES.map((category) => ({
      ...category,
      works: getWorksByCategory(category.id),
    })),
    ...(uncategorizedWorks.length
      ? [
          {
            id: 'uncategorized',
            title: '其他作品',
            description: '尚未归入固定类型的工程页面。',
            works: uncategorizedWorks,
          },
        ]
      : []),
  ].filter((section) => section.works.length > 0)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-4 border-b border-[#e8dfd0] pb-6 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            Engineering Works
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold leading-tight text-[#221f19] dark:text-gray-100 sm:text-[32px]">
            工程作品
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#5d554a] dark:text-gray-400">
            带交互、带数据、带工程量的页面。这些不是单纯 Markdown 文章 ——
            是一份份从数据、视觉、交互到结论都自己构建的富页面，每一件都需要工程实现 +
            原创判断，单靠 AI 生成不出来。
          </p>
        </div>
        <SharePageButton
          title="涂阿燃 · 工程作品"
          text="自研可视化、富数据调研与长期写作工程"
          url="https://2aran.com/works"
          size="md"
        />
      </header>

      <nav
        aria-label="工程作品分类"
        className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-b border-[#eee5d6] pb-4 text-[12px] dark:border-gray-800"
      >
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`#${section.id}`}
            className="font-medium text-[#7a6f5d] underline-offset-4 hover:text-[#8b5a1f] hover:underline dark:text-gray-400 dark:hover:text-[#f0c776]"
          >
            {section.title}
            <span className="ml-1 font-mono text-[10px] text-[#a59a86] dark:text-gray-600">
              {section.works.length}
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-8 space-y-10">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.id}
            id={section.id}
            className="grid scroll-mt-24 gap-4 border-t border-[#e8dfd0] pt-5 dark:border-gray-800 md:grid-cols-[180px_1fr]"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9d8f76] dark:text-gray-500">
                {String(sectionIndex + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-1 font-serif text-[21px] font-semibold leading-tight text-[#221f19] dark:text-gray-100">
                {section.title}
              </h2>
              <p className="mt-2 text-[12px] leading-6 text-[#7a6f5d] dark:text-gray-500">
                {section.description}
              </p>
            </div>

            <div className="divide-y divide-[#eee5d6] border-y border-[#eee5d6] dark:divide-gray-800 dark:border-gray-800">
              {section.works.map((work) => (
                <article
                  key={work.id}
                  className="group grid gap-2 py-4 transition-colors hover:bg-[#faf4e8]/70 dark:hover:bg-gray-900/60 sm:grid-cols-[96px_1fr_auto] sm:items-start"
                >
                  <div className="font-mono text-[10px] leading-5 text-[#9d8f76] dark:text-gray-500 sm:pt-0.5">
                    <span className="block tabular-nums">{formatDate(work.date)}</span>
                    <span className="block">{work.kind || '原创工程'}</span>
                  </div>

                  <div className="min-w-0 sm:pr-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="font-serif text-[18px] font-semibold leading-snug text-[#221f19] dark:text-gray-100">
                        <Link
                          href={work.href}
                          className="no-underline transition hover:text-[#8b5a1f] dark:hover:text-[#f0c776]"
                        >
                          {work.title}
                        </Link>
                      </h3>
                      {work.badge ? (
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9a6a2a] dark:text-[#f0c776]">
                          {work.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-[#5d554a] dark:text-gray-400">
                      {work.summary}
                    </p>
                  </div>

                  <Link
                    href={work.href}
                    className="self-start text-[12px] font-medium text-[#8b5a1f] no-underline underline-offset-4 transition hover:underline dark:text-[#f0c776]"
                  >
                    进入 →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      <footer className="mt-12 border-t border-[#e8dfd0] pt-6 text-[12px] leading-6 text-[#7a6f5d] dark:border-gray-800 dark:text-gray-500">
        <p>
          站点的核心层 —— 工程量 + 原创判断 + 数据可视化 + 交互体验组合在一起，是<strong className="text-[#5d503f] dark:text-gray-300"> 不可被 AI 复制 </strong>的部分。
        </p>
        <p className="mt-3 text-[11px] text-[#8f8069] dark:text-gray-600">
          如果你只想看 Markdown 形式的文章和调研，请到{' '}
          <Link href="/articles" className="underline underline-offset-2">/articles</Link>。
        </p>
      </footer>
    </main>
  )
}

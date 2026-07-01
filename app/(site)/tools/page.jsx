import Link from 'next/link'

import {
  FEATURED_TOOL_ITEMS,
  TOOL_STATUS_META,
  TOOL_TYPE_META,
  getToolItemsByType,
} from '../../../lib/toolItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '工具库 · 2aran.com',
  description: '涂阿燃维护的站内工具、浏览器插件、AI 工程实验、开发者工具链与可复用工作流入口。',
  keywords: ['工具库', '站内工具', 'AI 工具', '浏览器插件', '开发工具', '2aran'],
  alternates: {
    canonical: '/tools',
  },
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function ToolStatus({ status }) {
  const tone =
    status === 'live'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === 'external'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300'
        : status === 'experiment'
          ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300'
          : 'border-[#ddd7ca] bg-[#f8f4ea] text-[#7b5a1c] dark:border-[#3c3528] dark:bg-[#211c13] dark:text-[#d9b66f]'

  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {TOOL_STATUS_META[status] || status}
    </span>
  )
}

function ToolCard({ item, featured = false }) {
  const content = (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={featured ? 'mb-1 text-[22px] font-bold leading-snug' : 'mb-1 text-[18px] font-bold leading-snug'}>
            {item.title}
          </h3>
          <p className="mb-0 text-[13px] leading-6 text-[#68665e] dark:text-[#a4adba]">
            {item.summary}
          </p>
        </div>
        <ToolStatus status={item.status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#ded8ca] bg-white/70 px-2.5 py-1 text-[11px] text-[#68645a] dark:border-[#303947] dark:bg-[#101721] dark:text-[#aab4c2]"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1d1b15] dark:text-gray-100">
        打开工具
        <span aria-hidden="true">→</span>
      </span>
    </>
  )

  const className = [
    'group block h-full rounded-xl border no-underline transition-all hover:-translate-y-0.5',
    featured
      ? 'border-[#d9ceb9] bg-[#fffdf7] p-5 shadow-[0_18px_45px_rgba(78,62,32,0.10)] hover:border-[#c1aa7c] dark:border-[#2b3440] dark:bg-[#101720] dark:shadow-none dark:hover:border-[#4b5c70]'
      : 'border-[#ded8ca] bg-white/70 p-4 hover:border-[#c1aa7c] hover:bg-white dark:border-[#252e38] dark:bg-[#101720]/72 dark:hover:border-[#455365]',
  ].join(' ')

  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

export default function ToolsPage() {
  const sections = TOOL_TYPE_META.map((type) => ({
    ...type,
    items: getToolItemsByType(type.id),
  })).filter((section) => section.items.length > 0)

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="border-b border-[#d8d1c4] pb-9 dark:border-[#27313d]">
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a6422] dark:text-[#d4ae66]">
            Tools
          </p>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <h1 className="mb-4 font-serif text-[44px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[56px]">
                工具库
              </h1>
              <p className="mb-0 max-w-3xl text-[17px] leading-8 text-[#67645b] dark:text-[#a7b0be]">
                这里放可直接使用、可下载或可复用的工具入口：浏览器插件、AI 工程实验、开发者工具链和内容工作流。资料、原文和收藏继续留在资源库。
              </p>
            </div>
            <div className="rounded-xl border border-[#d8d1c4] bg-white/70 p-4 text-sm leading-7 text-[#625f55] dark:border-[#26313d] dark:bg-[#101720] dark:text-[#a7b0be]">
              <strong className="mb-1 block text-[#1b1a15] dark:text-white">收录原则</strong>
              读者打开后能用、能下载、能复用，或者能快速找到一组高价值工具。
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a877d] dark:text-[#7e8a9b]">
              Featured
            </p>
            <h2 className="mb-0 text-[24px] font-bold">优先推荐</h2>
          </div>
          <span className="rounded-full border border-[#d8d1c4] bg-white/65 px-3 py-1 text-[12px] text-[#69665c] dark:border-[#26313d] dark:bg-[#101720] dark:text-[#9ca7b6]">
            {FEATURED_TOOL_ITEMS.length} 个入口
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURED_TOOL_ITEMS.map((item) => (
            <ToolCard key={item.id} item={item} featured />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} className="border-t border-[#d8d1c4] pt-8 dark:border-[#27313d]">
              <div className="mb-5 grid gap-2 md:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a6422] dark:text-[#d4ae66]">
                    {section.titleEn}
                  </p>
                  <h2 className="mb-0 text-[22px] font-bold">{section.title}</h2>
                </div>
                <p className="mb-0 max-w-2xl text-[14px] leading-7 text-[#69665c] dark:text-[#9ca7b6]">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((item) => (
                  <ToolCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

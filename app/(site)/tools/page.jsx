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
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${tone}`}>
      {TOOL_STATUS_META[status] || status}
    </span>
  )
}

function ToolLink({ item, className = '', children }) {
  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

function FeaturedTools({ items }) {
  return (
    <div className="border-y border-[#d8d1c4] py-3 dark:border-[#27313d]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="mb-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6422] dark:text-[#d4ae66]">
          Featured
        </p>
        <span className="text-[12px] text-[#7a766b] dark:text-[#8f9aaa]">{items.length} 个优先入口</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <ToolLink
            key={item.id}
            item={item}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8d1c4] bg-white/55 px-3 py-1.5 text-[13px] font-semibold text-[#242119] no-underline transition hover:border-[#bda77b] hover:bg-white dark:border-[#26313d] dark:bg-[#101720]/70 dark:text-gray-100 dark:hover:border-[#4b5c70]"
          >
            <span>{item.title}</span>
            <span className="text-[#8a877d] dark:text-[#7e8a9b]">→</span>
          </ToolLink>
        ))}
      </div>
    </div>
  )
}

function ToolRow({ item }) {
  const content = (
    <>
      <div className="min-w-0 md:pr-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="mb-0 text-[15px] font-bold leading-snug text-[#1d1a16] dark:text-white">
            {item.title}
          </h3>
          {item.featured ? (
            <span className="rounded-full bg-[#efe7d6] px-2 py-0.5 text-[10px] font-semibold text-[#76551b] dark:bg-[#2a2419] dark:text-[#d9b66f]">
              推荐
            </span>
          ) : null}
          <span className="md:hidden">
            <ToolStatus status={item.status} />
          </span>
          <span className="ml-auto text-[13px] font-semibold text-[#8a6422] transition group-hover:text-[#3a2c14] dark:text-[#d4ae66] dark:group-hover:text-[#f2d8a5] md:hidden">
            打开 →
          </span>
        </div>
        <p className="mb-0 overflow-hidden text-[13px] leading-6 text-[#68665e] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-[#a4adba] md:block md:overflow-visible md:[-webkit-line-clamp:unset]">
          {item.summary}
        </p>
      </div>
      <div className="hidden min-w-0 flex-wrap items-center gap-2 md:mt-0 md:flex md:justify-end">
        <ToolStatus status={item.status} />
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#ded8ca] bg-white/55 px-2 py-0.5 text-[11px] text-[#68645a] dark:border-[#303947] dark:bg-[#101721] dark:text-[#aab4c2]"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="ml-auto text-[13px] font-semibold text-[#8a6422] transition group-hover:text-[#3a2c14] dark:text-[#d4ae66] dark:group-hover:text-[#f2d8a5] md:ml-1">
          打开 →
        </span>
      </div>
    </>
  )

  return (
    <ToolLink
      item={item}
      className="group grid gap-1 px-3.5 py-3 no-underline transition hover:bg-[#fffdf7] dark:hover:bg-[#121b26] md:grid-cols-[minmax(0,1fr)_minmax(280px,auto)] md:items-center"
    >
      {content}
    </ToolLink>
  )
}

export default function ToolsPage() {
  const sections = TOOL_TYPE_META.map((type) => ({
    ...type,
    items: getToolItemsByType(type.id),
  })).filter((section) => section.items.length > 0)

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1100px] px-4 pb-4 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              Tools
            </p>
            <h1 className="mb-3 font-serif text-[38px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[48px]">
              工具库
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              这里集中放可直接使用、可下载或可复用的工具入口。优先展示能打开就用的站内工具、插件、AI 工程实验和开发者工作流。
            </p>
          </div>
          <FeaturedTools items={FEATURED_TOOL_ITEMS} />
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.id} className="grid gap-3 border-t border-[#d8d1c4] pt-6 dark:border-[#27313d] lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="sticky top-[calc(var(--site-header-height)+16px)]">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a6422] dark:text-[#d4ae66]">
                    {section.titleEn}
                  </p>
                  <div className="flex items-baseline gap-2 lg:block">
                    <h2 className="mb-0 text-[20px] font-bold">{section.title}</h2>
                    <span className="text-[12px] text-[#8a877d] dark:text-[#7e8a9b] lg:mt-1 lg:block">
                      {section.items.length} 个
                    </span>
                  </div>
                  <p className="mb-0 mt-2 text-[13px] leading-6 text-[#69665c] dark:text-[#9ca7b6]">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#ded8ca] bg-white/60 divide-y divide-[#e8e1d5] dark:border-[#252e38] dark:bg-[#101720]/72 dark:divide-[#252e38]">
                {section.items.map((item) => (
                  <ToolRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

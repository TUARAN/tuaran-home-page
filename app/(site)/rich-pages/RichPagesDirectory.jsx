'use client'

import Image from 'next/image'
import Link from 'next/link'

import ShowcaseDirectory from '../components/ShowcaseDirectory'

const VISUALS = {
  'learning-tool': {
    eyebrow: 'LEARN', icon: 'books',
    image: '/images/directory-covers/interactive/learning-tool.webp',
    cover: 'from-[#dce2ff] via-[#edf0ff] to-[#d4dcfa] text-[#434c85] dark:from-[#222a50] dark:via-[#1b2444] dark:to-[#30335e] dark:text-[#c9d0ff]',
  },
  'ai-engineering': {
    eyebrow: 'BUILD', icon: 'brain',
    image: '/images/directory-covers/interactive/ai-engineering.webp',
    cover: 'from-[#d8ecfb] via-[#e9f4fc] to-[#cce5f5] text-[#315e7d] dark:from-[#142e46] dark:via-[#172a3e] dark:to-[#214462] dark:text-[#b8dafa]',
  },
  'data-visualization': {
    eyebrow: 'EXPLORE', icon: 'chart',
    image: '/images/directory-covers/interactive/data-visualization.webp',
    cover: 'from-[#d5f0f1] via-[#e9f7f6] to-[#c7e9ed] text-[#315f68] dark:from-[#153b44] dark:via-[#163039] dark:to-[#22515b] dark:text-[#b8e5e8]',
  },
  'engineering-research': {
    eyebrow: 'ANALYZE', icon: 'tools',
    image: '/images/directory-covers/interactive/engineering-research.webp',
    cover: 'from-[#dee7f6] via-[#edf1f9] to-[#d2ddf1] text-[#42577b] dark:from-[#202e4a] dark:via-[#1b2940] dark:to-[#304268] dark:text-[#c3d0ed]',
  },
  'long-term-project': {
    eyebrow: 'CREATE', icon: 'sparkles',
    image: '/images/directory-covers/interactive/long-term-project.webp',
    cover: 'from-[#e7def6] via-[#f2edfa] to-[#ded2ef] text-[#604e83] dark:from-[#302546] dark:via-[#29223d] dark:to-[#473258] dark:text-[#d9c6ef]',
  },
  'life-system': {
    eyebrow: 'LIFE', icon: 'clock',
    image: '/images/directory-covers/interactive/life-system.webp',
    cover: 'from-[#d9efef] via-[#ecf7f5] to-[#cce8e7] text-[#3b6667] dark:from-[#173c3e] dark:via-[#183337] dark:to-[#285255] dark:text-[#c0e5e2]',
  },
}

const CONFIG = {
  eyebrow: 'Rich Pages',
  title: '互动专题',
  description: '可阅读、可筛选、可操作的内容作品。进入一个主题，直接探索数据、判断关系或使用工具。',
  countLabel: '个作品',
  filterAriaLabel: '筛选作品',
  searchPlaceholder: '搜索作品、主题或标签',
  resultTitle: '全部作品',
  categoryTabs: true,
  categoryTabsAriaLabel: '互动专题类别',
  actionLabel: '打开作品',
  analyticsSurface: 'interactive_directory',
  analyticsEvent: 'entry_click',
  destinationKind: 'interactive',
  gridColumns: 4,
  share: {
    title: '互动专题',
    text: '可阅读、可筛选、可操作的内容作品。',
    url: 'https://2aran.com/rich-pages',
  },
}

export default function RichPagesDirectory({ works, categories }) {
  const items = works.map((work, index) => ({
    ...work,
    coverImage: work.coverImage || VISUALS[work.category]?.image,
    coverImageAlt: `${work.categoryLabel}分类视觉：${work.title}`,
    coverImagePriority: index < 4,
    showStudioCoverImage: true,
    coverLabel: work.kind,
    meta: [work.date, work.categoryLabel],
    badgeLabel: work.badge,
  }))

  return (
    <ShowcaseDirectory
      items={items}
      categories={categories}
      visuals={VISUALS}
      config={CONFIG}
      featured={
        <Link
          href="/resources/big-interaction-whitepaper"
          className="group grid overflow-hidden rounded-2xl border border-emerald-300/70 bg-[#102c25] text-white no-underline transition hover:border-emerald-200 hover:shadow-[0_14px_32px_rgba(17,63,41,0.18)] dark:border-emerald-700 sm:grid-cols-[minmax(0,1fr)_190px]"
          data-analytics-event="entry_click"
          data-analytics-surface="interactive_directory"
          data-analytics-destination-kind="resource"
          data-analytics-destination-id="big-interaction-whitepaper"
        >
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#b9f3a3]">精选阅读 · 电子读本</span>
            <h2 className="mb-0 mt-3 text-[23px] font-black leading-tight tracking-tight sm:text-[28px]">大互动理论</h2>
            <p className="mb-0 mt-3 max-w-xl text-[13px] leading-6 text-[#d2e6d8] sm:text-[14px]">五章读懂主动交流、反馈、互动质量、七日实践与必要的边界。</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-[#c7f7ab]">开始阅读 <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
          </div>
          <div className="relative hidden min-h-[190px] overflow-hidden sm:block">
            <Image src="/resources/big-interaction-whitepaper/04.jpg" alt="大互动理论三层递进原始图版" fill sizes="190px" className="object-cover object-top opacity-85 transition duration-300 group-hover:scale-105" />
          </div>
        </Link>
      }
    />
  )
}

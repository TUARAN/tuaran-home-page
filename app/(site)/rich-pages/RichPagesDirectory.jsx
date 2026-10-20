'use client'

import ShowcaseDirectory from '../components/ShowcaseDirectory'

const VISUALS = {
  'learning-tool': {
    eyebrow: 'LEARN', icon: 'books',
    image: '/images/rich-pages/categories/learning-tool.webp',
    imageTint: '#7777dc',
    cover: 'from-[#dce2ff] via-[#edf0ff] to-[#d4dcfa] text-[#434c85] dark:from-[#222a50] dark:via-[#1b2444] dark:to-[#30335e] dark:text-[#c9d0ff]',
  },
  'ai-engineering': {
    eyebrow: 'BUILD', icon: 'brain',
    image: '/images/rich-pages/categories/ai-engineering.webp',
    imageTint: '#318ac7',
    cover: 'from-[#d8ecfb] via-[#e9f4fc] to-[#cce5f5] text-[#315e7d] dark:from-[#142e46] dark:via-[#172a3e] dark:to-[#214462] dark:text-[#b8dafa]',
  },
  'data-visualization': {
    eyebrow: 'EXPLORE', icon: 'chart',
    image: '/images/rich-pages/categories/data-visualization.webp',
    imageTint: '#299eae',
    cover: 'from-[#d5f0f1] via-[#e9f7f6] to-[#c7e9ed] text-[#315f68] dark:from-[#153b44] dark:via-[#163039] dark:to-[#22515b] dark:text-[#b8e5e8]',
  },
  'engineering-research': {
    eyebrow: 'ANALYZE', icon: 'tools',
    image: '/images/rich-pages/categories/engineering-research.webp',
    imageTint: '#6276ad',
    cover: 'from-[#dee7f6] via-[#edf1f9] to-[#d2ddf1] text-[#42577b] dark:from-[#202e4a] dark:via-[#1b2940] dark:to-[#304268] dark:text-[#c3d0ed]',
  },
  'long-term-project': {
    eyebrow: 'CREATE', icon: 'sparkles',
    image: '/images/rich-pages/categories/long-term-project.webp',
    imageTint: '#8b70b8',
    cover: 'from-[#e7def6] via-[#f2edfa] to-[#ded2ef] text-[#604e83] dark:from-[#302546] dark:via-[#29223d] dark:to-[#473258] dark:text-[#d9c6ef]',
  },
  'life-system': {
    eyebrow: 'LIFE', icon: 'clock',
    image: '/images/rich-pages/categories/life-system.webp',
    imageTint: '#4c9a9b',
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
    />
  )
}

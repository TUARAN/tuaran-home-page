'use client'

import ShowcaseDirectory from '../components/ShowcaseDirectory'

const VISUALS = {
  'learning-tool': {
    eyebrow: 'LEARN', icon: 'books',
    cover: 'from-[#d8e8ff] via-[#eef4ff] to-[#f8e9ff] text-[#365275] dark:from-[#182b46] dark:via-[#172235] dark:to-[#2a213c] dark:text-[#bdd4f3]',
  },
  'ai-engineering': {
    eyebrow: 'BUILD', icon: 'brain',
    cover: 'from-[#17191e] via-[#252a33] to-[#3d4654] text-white dark:from-black dark:via-[#10151d] dark:to-[#252e3a]',
  },
  'data-visualization': {
    eyebrow: 'EXPLORE', icon: 'chart',
    cover: 'from-[#d9eee7] via-[#eef4df] to-[#f5e7bd] text-[#315c55] dark:from-[#12322f] dark:via-[#233328] dark:to-[#3d321d] dark:text-[#b8ddd2]',
  },
  'engineering-research': {
    eyebrow: 'ANALYZE', icon: 'tools',
    cover: 'from-[#eadfd2] via-[#f6eee5] to-[#e5e0d6] text-[#6e4a31] dark:from-[#39251b] dark:via-[#2b2521] dark:to-[#242622] dark:text-[#e3c3a8]',
  },
  'long-term-project': {
    eyebrow: 'CREATE', icon: 'sparkles',
    cover: 'from-[#eee5ca] via-[#f8f2df] to-[#e2d3b4] text-[#6d5828] dark:from-[#352c17] dark:via-[#272418] dark:to-[#3c3020] dark:text-[#e5cf92]',
  },
  'life-system': {
    eyebrow: 'LIFE', icon: 'clock',
    cover: 'from-[#f3dcd6] via-[#f8ece4] to-[#e8e0cc] text-[#7b4d43] dark:from-[#3b211f] dark:via-[#302522] dark:to-[#363021] dark:text-[#e8bbb0]',
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
  actionLabel: '打开作品',
  analyticsSurface: 'interactive_directory',
  analyticsEvent: 'entry_click',
  destinationKind: 'interactive',
  share: {
    title: '互动专题',
    text: '可阅读、可筛选、可操作的内容作品。',
    url: 'https://2aran.com/rich-pages',
  },
}

const SECONDARY_FILTER = {
  field: 'presentation',
  label: '呈现',
  ariaLabel: '按呈现方式筛选',
  options: [
    { value: 'site', label: '站点型' },
    { value: 'feature', label: '沉浸型' },
  ],
}

export default function RichPagesDirectory({ works, categories }) {
  const items = works.map((work) => ({
    ...work,
    coverLabel: work.kind,
    meta: [work.date, work.categoryLabel],
    badgeLabel: work.badge,
    footerLabel: work.presentationLabel,
  }))

  return (
    <ShowcaseDirectory
      items={items}
      categories={categories}
      visuals={VISUALS}
      config={CONFIG}
      secondaryFilter={SECONDARY_FILTER}
    />
  )
}

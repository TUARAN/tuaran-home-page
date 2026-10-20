'use client'

import ShowcaseDirectory from '../components/ShowcaseDirectory'

const CATEGORIES = [
  { id: 'reading', title: '资料与原文' },
  { id: 'learning', title: '学习与开发' },
  { id: 'media', title: '视觉与影音' },
  { id: 'collections', title: '收藏与订阅' },
  { id: 'downloads', title: '工具与下载' },
]

const VISUALS = {
  reading: { eyebrow: 'READ', icon: 'books', image: '/images/directory-covers/resources/reading.webp', cover: 'from-[#e8e0d0] via-[#f4efe3] to-[#dbd0ba] text-[#69543a] dark:from-[#383126] dark:via-[#2b2924] dark:to-[#453a2b] dark:text-[#eddbb6]' },
  learning: { eyebrow: 'LEARN', icon: 'brain', image: '/images/directory-covers/resources/learning.webp', cover: 'from-[#dbe8ed] via-[#eef4f4] to-[#cbdfe4] text-[#386677] dark:from-[#1b3540] dark:via-[#1a2b35] dark:to-[#294754] dark:text-[#bfdee8]' },
  media: { eyebrow: 'EXPLORE', icon: 'sparkles', image: '/images/directory-covers/resources/media.webp', cover: 'from-[#eaddf2] via-[#f4ecf6] to-[#ddcfeb] text-[#705780] dark:from-[#34263e] dark:via-[#2b2537] dark:to-[#493450] dark:text-[#e4ceef]' },
  collections: { eyebrow: 'SAVE', icon: 'list', image: '/images/directory-covers/resources/collections.webp', cover: 'from-[#dcebdc] via-[#eff4e9] to-[#d2e3d0] text-[#466a48] dark:from-[#213b2d] dark:via-[#203329] dark:to-[#30513b] dark:text-[#c7e2c8]' },
  downloads: { eyebrow: 'GET', icon: 'download', image: '/images/directory-covers/resources/downloads.webp', cover: 'from-[#e3e9f3] via-[#f0f3f8] to-[#d7e0ee] text-[#425a7b] dark:from-[#26344b] dark:via-[#202c3e] dark:to-[#344662] dark:text-[#d1def3]' },
}

const CONFIG = {
  eyebrow: 'Resources',
  title: '资源',
  description: '按用途浏览资料原文、学习索引、视觉影音、收藏订阅和可领取的工具。搜索标题与关键词，直接打开需要的资源。',
  countLabel: '项资源',
  filterAriaLabel: '筛选资源',
  searchPlaceholder: '搜索资源、主题或标签',
  resultTitle: '全部资源',
  categoryTabs: true,
  categoryTabsAriaLabel: '资源类别',
  actionLabel: '打开资源',
  analyticsSurface: 'resource_directory',
  analyticsEvent: 'entry_click',
  destinationKind: 'resource',
  gridColumns: 4,
  share: {
    title: '资源',
    text: '资料、学习、下载与收藏，集中查找和使用。',
    url: 'https://2aran.com/resources',
  },
}

function resourceCategory(item) {
  const href = item.href || ''
  const type = item.resourceType || ''
  if (/^\/(bookmarks|frontend-weekly)/.test(href) || href === '/resources/rss' || ['rss', 'twitter', 'youtube'].includes(type)) return 'collections'
  if (/(extension|desktop|protal-todo-assistant|codex-model-switcher)/.test(href) || type === 'tool') return 'downloads'
  if (['film-media', 'ai-music', 'visual-assets'].includes(type) || /(nano-banana-gallery|wallpapers|niu-lai-movie|ai-music)/.test(href)) return 'media'
  if (type === 'ai-dev' || /\/(ai-learning-library|edge-agent-development|codex-learning-resource-map-yichen)$/.test(href)) return 'learning'
  return 'reading'
}

export default function ResourcesDirectory({ resources }) {
  const items = resources.map((resource, index) => {
    const category = resourceCategory(resource)
    const categoryLabel = CATEGORIES.find((entry) => entry.id === category).title
    return {
      ...resource,
      id: resource.id || `resource:${resource.href}`,
      category,
      categoryLabel,
      coverImage: VISUALS[category].image,
      coverImageAlt: `${categoryLabel}分类视觉：${resource.title}`,
      coverImagePriority: index < 4,
      showStudioCoverImage: true,
      coverLabel: resource.tagLabel?.replace(/^资源库 · /, '') || categoryLabel,
      summary: resource.summary || categoryLabel,
      meta: [resource.date, categoryLabel].filter(Boolean),
      footerLabel: resource.delivery === 'download' ? '可领取 / 下载' : '查看详情',
    }
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title, 'zh-CN'))

  return <ShowcaseDirectory items={items} categories={CATEGORIES} visuals={VISUALS} config={CONFIG} />
}

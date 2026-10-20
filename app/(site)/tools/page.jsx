import {
  getToolDeliveryGroup,
  getToolItemsByDate,
  TOOL_STATUS_META,
  TOOL_TYPE_META,
} from '../../../lib/site/toolItems'
import ShowcaseDirectory from '../components/ShowcaseDirectory'

export const dynamic = 'force-static'

export const metadata = {
  title: '工具与下载',
  description: '涂阿燃维护的在线工具、浏览器扩展、桌面应用、AI 工程实验与开发者工作流入口。',
  keywords: ['工具集', '下载中心', '工具库', '站内工具', 'AI 工具', '浏览器插件', '桌面应用', '开发工具', '2aran'],
  alternates: {
    canonical: '/tools',
  },
}

function statusTone(status) {
  return (
    status === 'live'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === 'external'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300'
        : status === 'experiment'
          ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300'
          : 'border-[#ddd7ca] bg-[#f8f4ea] text-[#7b5a1c] dark:border-[#3c3528] dark:bg-[#211c13] dark:text-[#d9b66f]'
  )
}

const VISUALS = {
  utility: {
    eyebrow: 'USE', icon: 'world',
    image: '/images/tools/categories/direct.webp',
    cover: 'from-[#d8f0ec] via-[#eaf7f4] to-[#c9e9e5] text-[#366b68] dark:from-[#173d3e] dark:via-[#193438] dark:to-[#285252] dark:text-[#bce5df]',
  },
  'x-platform': {
    eyebrow: 'X / TWITTER', icon: 'x',
    image: '/images/tools/categories/x-platform.webp',
    cover: 'from-[#dce8f8] via-[#ecf2fb] to-[#cdddf3] text-[#3c5c85] dark:from-[#1b3152] dark:via-[#1a2b44] dark:to-[#29486b] dark:text-[#c2d7f2]',
  },
  analysis: {
    eyebrow: 'ANALYZE', icon: 'activity',
    image: '/images/tools/categories/analysis.webp',
    cover: 'from-[#e1e5f6] via-[#f0f1fa] to-[#d5dcf0] text-[#4e5885] dark:from-[#282e50] dark:via-[#222943] dark:to-[#3b4268] dark:text-[#ccd3f0]',
  },
  'ai-dev': {
    eyebrow: 'BUILD', icon: 'code',
    image: '/images/tools/categories/ai-dev.webp',
    cover: 'from-[#e9e1f6] via-[#f4eefb] to-[#ddd1f0] text-[#665287] dark:from-[#34264e] dark:via-[#2d2543] dark:to-[#493461] dark:text-[#decaf1]',
  },
}

const CONFIG = {
  eyebrow: 'Tools',
  title: '工具与下载',
  description: '按用途找到合适的工具，再按使用方式缩小范围。网页、浏览器扩展和桌面应用统一收录。',
  countLabel: '个工具',
  filterAriaLabel: '筛选工具',
  searchPlaceholder: '搜索工具、用途或标签',
  resultTitle: '全部工具',
  categoryTabs: true,
  categoryTabsLabel: '用途',
  categoryTabsAriaLabel: '工具类别',
  actionLabel: '打开工具',
  layout: 'catalog',
  analyticsSurface: 'tool_directory',
  analyticsEvent: 'tool_start',
  destinationKind: 'tool',
}

const DELIVERY_FILTER = {
  field: 'deliveryGroup',
  label: '使用方式',
  ariaLabel: '按使用方式筛选工具',
  expanded: true,
  hashValues: {
    online: 'online',
    downloads: 'all',
    extensions: 'browser-extension',
    'browser-extensions': 'browser-extension',
    desktop: 'desktop-app',
    'desktop-apps': 'desktop-app',
  },
  options: [
    { value: 'online', label: '网页' },
    { value: 'browser-extension', label: '浏览器扩展' },
    { value: 'desktop-app', label: '桌面应用' },
    { value: 'external', label: '外部网站' },
  ],
}

export default function ToolsPage() {
  const categoryLabels = Object.fromEntries(TOOL_TYPE_META.map((type) => [type.id, type.title]))
  const items = getToolItemsByDate()
    .map((item, index) => ({
      ...item,
      category: item.type,
      deliveryGroup: getToolDeliveryGroup(item),
      categoryLabel: categoryLabels[item.type] || '工具',
      coverImage: VISUALS[item.type]?.image,
      coverImageAlt: `${categoryLabels[item.type] || '工具'}分类视觉：${item.title}`,
      coverImagePriority: index < 4,
      showCatalogCoverImage: true,
      coverLabel: categoryLabels[item.type] || '工具',
      meta: [categoryLabels[item.type] || '工具'],
      badgeLabel: TOOL_STATUS_META[item.status] || item.status,
      badgeTone: statusTone(item.status),
      vipLabel: item.vip ? 'VIP 工具' : null,
      footerLabel: item.tags.slice(0, 2).join(' · '),
      metricLabel: item.downloadType === 'extension'
        ? '浏览器扩展'
        : item.downloadType === 'desktop'
          ? '桌面应用'
          : /^https?:\/\//.test(item.href) ? '站外服务' : '网页使用',
    }))

  return (
    <ShowcaseDirectory
      items={items}
      categories={TOOL_TYPE_META}
      visuals={VISUALS}
      config={CONFIG}
      secondaryFilter={DELIVERY_FILTER}
    />
  )
}

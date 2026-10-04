import ShowcaseDirectory from '../components/ShowcaseDirectory'
import {
  DOWNLOAD_ITEMS,
  DOWNLOAD_TYPE_META,
} from '../../../lib/downloadItems'
import { getWorkStatusLabel } from '../../../lib/workItems'

export const dynamic = 'force-static'

const PAGE_PATH = '/downloads'
const PAGE_URL = `https://2aran.com${PAGE_PATH}`
const title = '下载中心 · 2aran.com'
const description = '涂阿燃维护的浏览器扩展与桌面客户端，按类型集中领取、安装。'

export const metadata = {
  title,
  description,
  keywords: ['下载中心', '浏览器扩展', 'Chrome 插件', '桌面应用', 'macOS', 'Windows', '2aran'],
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title,
    description,
    url: PAGE_URL,
    type: 'website',
  },
}

function statusTone(status) {
  return status === 'shipped'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
}

const VISUALS = {
  extension: {
    eyebrow: 'INSTALL',
    icon: 'download',
    image: '/images/downloads/categories/extension.webp',
    cover: 'from-[#d8e8ff] via-[#f4efff] to-[#d8f6ea] text-[#285d75] dark:from-[#14273e] dark:via-[#2c2143] dark:to-[#15382f] dark:text-[#cae8e0]',
  },
  desktop: {
    eyebrow: 'DESKTOP',
    icon: 'cpu',
    image: '/images/downloads/categories/desktop.webp',
    cover: 'from-[#ffe1d7] via-[#edf3ff] to-[#d5eee8] text-[#625072] dark:from-[#46201b] dark:via-[#1c2940] dark:to-[#16362f] dark:text-[#efd4ca]',
  },
}

const CONFIG = {
  eyebrow: 'Download Center',
  title: '下载中心',
  description: '扩展和客户端集中在这里领取。按类型筛选，点进对应页面查看版本、安装方式和领取说明。',
  countLabel: '个下载',
  filterAriaLabel: '筛选下载',
  searchPlaceholder: '搜索下载、平台或标签',
  resultTitle: '全部下载',
  categoryTabs: true,
  categoryTabsAriaLabel: '下载类别',
  actionLabel: '打开下载页',
  layout: 'catalog',
  analyticsSurface: 'download_directory',
  analyticsEvent: 'download_entry_click',
  destinationKind: 'download',
  share: {
    title,
    text: description,
    url: PAGE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '下载中心',
  description,
  url: PAGE_URL,
  inLanguage: 'zh-CN',
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: DOWNLOAD_ITEMS.length,
    itemListElement: DOWNLOAD_ITEMS
      .slice()
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: item.href.startsWith('http') ? item.href : `https://2aran.com${item.href}`,
        description: item.summary,
      })),
  },
}

export default function DownloadsPage() {
  const categoryLabels = Object.fromEntries(DOWNLOAD_TYPE_META.map((type) => [type.id, type.title]))
  const items = [...DOWNLOAD_ITEMS]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map((item, index) => {
      const platformLabel = item.platforms?.join(' / ') || item.domains?.join(' / ') || '查看详情'
      const categoryLabel = categoryLabels[item.type] || '下载'

      return {
        ...item,
        category: item.type,
        categoryLabel,
        coverImage: VISUALS[item.type]?.image,
        coverImageAlt: `${categoryLabel}分类视觉：${item.title}`,
        coverImagePriority: index < 4,
        showCatalogCoverImage: true,
        coverLabel: categoryLabel,
        meta: [item.role],
        badgeLabel: getWorkStatusLabel(item.status),
        badgeTone: statusTone(item.status),
        footerLabel: item.tags.slice(0, 2).join(' · '),
        metricLabel: platformLabel,
      }
    })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ShowcaseDirectory
        items={items}
        categories={DOWNLOAD_TYPE_META}
        visuals={VISUALS}
        config={CONFIG}
      />
    </>
  )
}

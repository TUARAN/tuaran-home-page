import {
  TOOL_ITEMS,
  TOOL_STATUS_META,
  TOOL_TYPE_META,
} from '../../../lib/toolItems'
import ShowcaseDirectory from '../components/ShowcaseDirectory'

export const dynamic = 'force-static'

export const metadata = {
  title: '工具库',
  description: '涂阿燃维护的站内工具、浏览器插件、AI 工程实验、开发者工具链与可复用工作流入口。',
  keywords: ['工具库', '站内工具', 'AI 工具', '浏览器插件', '开发工具', '2aran'],
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
  direct: {
    eyebrow: 'USE', icon: 'world',
    cover: 'from-[#dcece8] via-[#edf4eb] to-[#f2e7cf] text-[#315c56] dark:from-[#14312f] dark:via-[#1e2c29] dark:to-[#332b1d] dark:text-[#b7d9d1]',
  },
  extension: {
    eyebrow: 'INSTALL', icon: 'download',
    cover: 'from-[#e2e6f2] via-[#f1f1f7] to-[#e8dff1] text-[#4f5876] dark:from-[#1a2438] dark:via-[#202535] dark:to-[#30243c] dark:text-[#c5cbea]',
  },
  'x-platform': {
    eyebrow: 'X / TWITTER', icon: 'x',
    cover: 'from-[#dfe7ec] via-[#f1f3f4] to-[#dce2e5] text-[#313a40] dark:from-[#11161a] dark:via-[#1a2025] dark:to-[#272d31] dark:text-[#d5dde1]',
  },
  analysis: {
    eyebrow: 'ANALYZE', icon: 'activity',
    cover: 'from-[#e8ddd2] via-[#f4ebe1] to-[#ead8ce] text-[#704a36] dark:from-[#38241c] dark:via-[#30251f] dark:to-[#3c2924] dark:text-[#e2bfa9]',
  },
  'ai-system': {
    eyebrow: 'CONNECT', icon: 'cpu',
    cover: 'from-[#dce5f0] via-[#ecf0ee] to-[#e1eadc] text-[#405b6d] dark:from-[#172a3c] dark:via-[#1d2b2c] dark:to-[#263522] dark:text-[#b9d0de]',
  },
  'ai-dev': {
    eyebrow: 'BUILD', icon: 'code',
    cover: 'from-[#17191e] via-[#252a33] to-[#3d4654] text-white dark:from-black dark:via-[#10151d] dark:to-[#252e3a]',
  },
  index: {
    eyebrow: 'DISCOVER', icon: 'list',
    cover: 'from-[#eee5ca] via-[#f6f1df] to-[#e5dcc5] text-[#69582f] dark:from-[#332b18] dark:via-[#292719] dark:to-[#38311f] dark:text-[#e0cc94]',
  },
}

const CONFIG = {
  eyebrow: 'Tools',
  title: '工具库',
  description: '可以直接使用、安装或接入工作流的工具。按用途筛选，找到后立即开始。',
  countLabel: '个工具',
  filterAriaLabel: '筛选工具',
  searchPlaceholder: '搜索工具、用途或标签',
  resultTitle: '全部工具',
  actionLabel: '打开工具',
  analyticsSurface: 'tool_directory',
  analyticsEvent: 'tool_start',
  destinationKind: 'tool',
}

export default function ToolsPage() {
  const categoryLabels = Object.fromEntries(TOOL_TYPE_META.map((type) => [type.id, type.title]))
  const items = [...TOOL_ITEMS]
    .sort((a, b) => b.priority - a.priority)
    .map((item) => ({
      ...item,
      category: item.type,
      categoryLabel: categoryLabels[item.type] || '工具',
      coverLabel: categoryLabels[item.type] || '工具',
      meta: [categoryLabels[item.type] || '工具'],
      badgeLabel: TOOL_STATUS_META[item.status] || item.status,
      badgeTone: statusTone(item.status),
      footerLabel: item.tags.slice(0, 2).join(' · '),
      metricLabel: /^https?:\/\//.test(item.href) ? '外部打开' : '站内使用',
    }))

  return (
    <ShowcaseDirectory
      items={items}
      categories={TOOL_TYPE_META}
      visuals={VISUALS}
      config={CONFIG}
    />
  )
}

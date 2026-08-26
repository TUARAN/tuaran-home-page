import ShowcaseDirectory from '../components/ShowcaseDirectory'
import {
  WORK_ITEMS,
  WORK_STATUS_META,
  WORK_TYPE_META,
} from '../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '作品展厅',
  description:
    '涂阿燃的数字作品展厅：长期运行的对外产品、工程项目与代表性 AI 工程成果。',
  alternates: {
    canonical: '/works',
  },
}

function statusTone(status) {
  return (
    status === 'operating'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
      : status === 'shipped'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300'
        : status === 'building'
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
          : status === 'experiment'
            ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300'
            : 'border-[#ddd7ca] bg-[#f8f4ea] text-[#766c5d] dark:border-[#3c3528] dark:bg-[#211c13] dark:text-[#c9bdab]'
  )
}

const VISUALS = {
  product: {
    eyebrow: 'PRODUCT', icon: 'world',
    cover: 'from-[#dcece8] via-[#edf4eb] to-[#f2e7cf] text-[#315c56] dark:from-[#14312f] dark:via-[#1e2c29] dark:to-[#332b1d] dark:text-[#b7d9d1]',
  },
  'ai-engineering': {
    eyebrow: 'AI ENGINEERING', icon: 'cpu',
    cover: 'from-[#dce5f0] via-[#ecf0ee] to-[#e1eadc] text-[#405b6d] dark:from-[#172a3c] dark:via-[#1d2b2c] dark:to-[#263522] dark:text-[#b9d0de]',
  },
}

const CONFIG = {
  eyebrow: 'Works',
  title: '作品展厅',
  description: '长期运行的产品与代表性 AI 工程成果。按类型筛选，查看正在运营、持续打磨和已经交付的作品。',
  countLabel: '件作品',
  filterAriaLabel: '筛选作品',
  searchPlaceholder: '搜索作品、方向或标签',
  resultTitle: '全部作品',
  actionLabel: '打开作品',
  analyticsSurface: 'work_directory',
  analyticsEvent: 'work_open',
  destinationKind: 'work',
}

export default function WorksPage() {
  const categoryLabels = Object.fromEntries(WORK_TYPE_META.map((type) => [type.id, type.title]))
  const items = [...WORK_ITEMS]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map((item) => ({
      ...item,
      category: item.type,
      categoryLabel: categoryLabels[item.type] || '作品',
      coverLabel: item.role || categoryLabels[item.type] || '作品',
      meta: [categoryLabels[item.type] || '作品', item.role].filter(Boolean),
      badgeLabel: WORK_STATUS_META[item.status] || item.status,
      badgeTone: statusTone(item.status),
      footerLabel: item.tags?.slice(0, 2).join(' · ') || item.domains?.[0] || '',
      metricLabel: /^https?:\/\//.test(item.href) ? '外部访问' : '站内作品',
    }))

  return (
    <ShowcaseDirectory
      items={items}
      categories={WORK_TYPE_META}
      visuals={VISUALS}
      config={CONFIG}
    />
  )
}

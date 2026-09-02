import ShowcaseDirectory from '../components/ShowcaseDirectory'
import {
  AI_EXPERIMENT_WORK_ITEMS,
  PRODUCT_WORK_ITEMS,
  WORK_STATUS_META,
} from '../../../lib/workItems'
import { SECONDARY_SITES } from '../../../lib/secondarySites'
import {
  TOOL_ITEMS,
  TOOL_STATUS_META,
  TOOL_TYPE_META,
} from '../../../lib/toolItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '产品集',
  description:
    '2aran 产品集：独立产品、站内工具、工程作品与实验集中在一处查看。',
  keywords: ['2aran', '产品', '工具', '作品', '独立开发'],
  alternates: {
    canonical: '/works',
  },
}

const PORTFOLIO_TYPE_META = [
  {
    id: 'product',
    title: '独立产品',
    description: '拥有独立用户场景、业务流程、数据或运行节奏，保留自己的域名与产品边界。',
  },
  {
    id: 'tool',
    title: '站内工具',
    description: '解决单一明确任务，直接在 2aran.com 使用，共享主站的入口与维护体系。',
  },
  {
    id: 'work',
    title: '作品与实验',
    description: '已经交付的工程成果、开源贡献与用于验证想法的交互实验。',
  },
]

function statusTone(status) {
  return (
    ['operating', 'live'].includes(status)
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
      : ['shipped', 'external'].includes(status)
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
    eyebrow: 'INDEPENDENT PRODUCT', icon: 'world',
    cover: 'from-[#dcece8] via-[#edf4eb] to-[#f2e7cf] text-[#315c56] dark:from-[#14312f] dark:via-[#1e2c29] dark:to-[#332b1d] dark:text-[#b7d9d1]',
  },
  tool: {
    eyebrow: 'BUILT-IN TOOL', icon: 'tools',
    cover: 'from-[#e2e6f2] via-[#f1f1f7] to-[#e8dff1] text-[#4f5876] dark:from-[#1a2438] dark:via-[#202535] dark:to-[#30243c] dark:text-[#c5cbea]',
  },
  work: {
    eyebrow: 'WORK & EXPERIMENT', icon: 'cpu',
    cover: 'from-[#17191e] via-[#252a33] to-[#3d4654] text-white dark:from-black dark:via-[#10151d] dark:to-[#252e3a]',
  },
}

const CONFIG = {
  eyebrow: '2aran Portfolio',
  title: '产品集',
  description: '独立产品、站内工具、工程作品与实验集中在这里。产品保留必要的独立性，轻量工具默认在主站生长。',
  countLabel: '项',
  filterAriaLabel: '筛选产品集',
  searchPlaceholder: '搜索产品、工具、作品或标签',
  resultTitle: '全部作品',
  actionLabel: '打开',
  analyticsSurface: 'portfolio_directory',
  analyticsEvent: 'portfolio_open',
  destinationKind: 'portfolio',
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function buildProductItems() {
  const secondaryById = new Map(SECONDARY_SITES.map((site) => [site.id, site]))
  const registeredIds = new Set(PRODUCT_WORK_ITEMS.map((item) => item.id))
  const primaryProducts = PRODUCT_WORK_ITEMS.map((item) => {
    const secondary = secondaryById.get(item.id)
    const domains = unique([...(item.domains || []), secondary?.domain])
    return {
      ...item,
      category: 'product',
      categoryLabel: '独立产品',
      coverLabel: item.role || '独立产品',
      meta: ['独立产品', item.role].filter(Boolean),
      badgeLabel: WORK_STATUS_META[item.status] || item.status,
      badgeTone: statusTone(item.status),
      footerLabel: domains.join(' · '),
      metricLabel: secondary ? '二级域名' : (/^https?:\/\//.test(item.href) ? '独立入口' : '主站入口'),
      tags: unique([...(item.tags || []), ...(secondary?.tags || [])]),
    }
  })
  const secondaryProducts = SECONDARY_SITES
    .filter((site) => !registeredIds.has(site.id))
    .map((site) => ({
      id: site.id,
      title: site.label,
      href: site.href,
      category: 'product',
      categoryLabel: '独立产品',
      coverLabel: site.category,
      meta: ['独立产品', site.category],
      status: 'operating',
      badgeLabel: '运营中',
      badgeTone: statusTone('operating'),
      summary: site.desc,
      tags: site.tags || [],
      footerLabel: site.domain,
      metricLabel: '二级域名',
      priority: 90,
    }))
  return [...primaryProducts, ...secondaryProducts]
}

function buildToolItems() {
  const typeLabels = Object.fromEntries(TOOL_TYPE_META.map((type) => [type.id, type.title]))
  return TOOL_ITEMS
    .filter((item) => !/^https?:\/\//.test(item.href))
    .map((item) => ({
      ...item,
      category: 'tool',
      categoryLabel: '站内工具',
      coverLabel: typeLabels[item.type] || '站内工具',
      meta: ['站内工具', typeLabels[item.type]].filter(Boolean),
      badgeLabel: TOOL_STATUS_META[item.status] || item.status,
      badgeTone: statusTone(item.status),
      footerLabel: item.tags?.slice(0, 2).join(' · ') || '2aran.com',
      metricLabel: '站内使用',
    }))
}

function buildWorkItems() {
  return AI_EXPERIMENT_WORK_ITEMS.map((item) => ({
    ...item,
    category: 'work',
    categoryLabel: '作品与实验',
    coverLabel: item.role || '工程作品',
    meta: ['作品与实验', item.role].filter(Boolean),
    badgeLabel: WORK_STATUS_META[item.status] || item.status,
    badgeTone: statusTone(item.status),
    footerLabel: item.tags?.slice(0, 2).join(' · ') || item.domains?.[0] || '',
    metricLabel: /^https?:\/\//.test(item.href) ? '查看成果' : '站内体验',
  }))
}

export default function WorksPage() {
  const items = [
    ...buildProductItems(),
    ...buildToolItems(),
    ...buildWorkItems(),
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return (
    <ShowcaseDirectory
      items={items}
      categories={PORTFOLIO_TYPE_META}
      visuals={VISUALS}
      config={CONFIG}
    />
  )
}

import {
  TOOL_STATUS_META,
  TOOL_TYPE_META,
  getToolItemsByType,
} from '../../../lib/toolItems'
import GroupedDirectoryPage from '../components/GroupedDirectoryPage'

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

export default function ToolsPage() {
  const sections = TOOL_TYPE_META.map((type) => ({
    ...type,
    items: getToolItemsByType(type.id).map((item) => {
      const statusBadge = {
        label: TOOL_STATUS_META[item.status] || item.status,
        className: statusTone(item.status),
      }
      return {
        ...item,
        mobileBadge: statusBadge,
        badges: [
          statusBadge,
          ...item.tags.slice(0, 3).map((tag) => ({ label: tag, mono: false })),
        ],
      }
    }),
  })).filter((section) => section.items.length > 0)

  return (
    <GroupedDirectoryPage
      eyebrow="Tools"
      title="工具库"
      description={<p className="mb-0"><strong>人与动物的本质区别是制造和使用工具。</strong></p>}
      sections={sections}
    />
  )
}

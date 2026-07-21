import {
  IconArchive,
  IconArrowUpRight,
  IconCalendarEvent,
  IconCircleCheck,
} from '@tabler/icons-react'

import { ACTIVITY_ARCHIVES, getActivityArchiveStats } from '../../../../lib/activityArchives'
import { CANONICAL_HOST } from '../../../../lib/adminRoutes'
import { AdminPage, Section, StatCard, StatusPill } from '../../components/ui'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' }).format(
    new Date(`${value}T00:00:00+08:00`)
  )
}

export default function ArchiveManagementConsole() {
  const stats = getActivityArchiveStats()

  return (
    <AdminPage
      title="存档管理"
      description="统一记录已结束活动的页面去向、入口下线范围和保留资产。新活动结束后按同一流程登记，避免历史页面继续占用主站推荐位和自动化资源。"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="活动存档" value={stats.total} sub="注册表中的全部活动" icon="archive" />
        <StatCard label="已完成归档" value={stats.archived} sub="公开入口已撤下" icon="archive" tone="success" />
        <StatCard label="保留资产" value={stats.preservedAssets} sub="页面、数据与跳转等" icon="database" tone="info" />
      </div>

      <Section
        title="活动归档台账"
        description="归档页面保持只读可追溯；原活动地址负责跳转，不再作为主站活跃内容分发。"
      >
        <div className="space-y-4">
          {ACTIVITY_ARCHIVES.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#e1e3da] bg-[#fafbf7] p-4 dark:border-[#263142] dark:bg-[#111821] md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h3>
                    <StatusPill tone="neutral" size="sm">已归档</StatusPill>
                    <span className="text-xs text-[#82847a] dark:text-gray-500">{item.type}</span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#67695d] dark:text-gray-400">{item.summary}</p>
                </div>
                <a
                  href={`https://${CANONICAL_HOST}${item.archivePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#caccc0] px-3 py-2 text-xs font-medium text-[#45473f] transition hover:bg-white dark:border-[#34414f] dark:text-gray-300 dark:hover:bg-[#18212c]"
                >
                  查看归档页 <IconArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>

              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[#e7e8e1] bg-white px-3 py-2.5 dark:border-[#263142] dark:bg-[#0f141c]">
                  <p className="text-[#929489] dark:text-gray-500">活动周期</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[#3f413a] dark:text-gray-300"><IconCalendarEvent size={14} />{formatDate(item.startedAt)} – {formatDate(item.endedAt)}</p>
                </div>
                <div className="rounded-lg border border-[#e7e8e1] bg-white px-3 py-2.5 dark:border-[#263142] dark:bg-[#0f141c]">
                  <p className="text-[#929489] dark:text-gray-500">归档时间</p>
                  <p className="mt-1 text-[#3f413a] dark:text-gray-300">{formatDate(item.archivedAt)}</p>
                </div>
                <div className="rounded-lg border border-[#e7e8e1] bg-white px-3 py-2.5 dark:border-[#263142] dark:bg-[#0f141c]">
                  <p className="text-[#929489] dark:text-gray-500">原路径</p>
                  <code className="mt-1 block text-[#3f413a] dark:text-gray-300">{item.originalPath}</code>
                </div>
                <div className="rounded-lg border border-[#e7e8e1] bg-white px-3 py-2.5 dark:border-[#263142] dark:bg-[#0f141c]">
                  <p className="text-[#929489] dark:text-gray-500">归档路径</p>
                  <code className="mt-1 block text-[#3f413a] dark:text-gray-300">{item.archivePath}</code>
                </div>
              </div>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#45473f] dark:text-gray-300"><IconCircleCheck size={15} className="text-emerald-600" />保留资产</p>
                  <ul className="space-y-1.5 text-xs leading-5 text-[#67695d] dark:text-gray-400">
                    {item.preservedAssets.map((asset) => <li key={asset}>· {asset}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#45473f] dark:text-gray-300"><IconArchive size={15} />已撤下 / 停用</p>
                  <ul className="space-y-1.5 text-xs leading-5 text-[#67695d] dark:text-gray-400">
                    {item.retiredSurfaces.map((surface) => <li key={surface}>· {surface}</li>)}
                  </ul>
                </div>
              </div>

              <p className="mt-4 border-t border-[#e7e8e1] pt-3 text-xs leading-5 text-[#82847a] dark:border-[#263142] dark:text-gray-500">{item.notes}</p>
            </article>
          ))}
        </div>
      </Section>
    </AdminPage>
  )
}

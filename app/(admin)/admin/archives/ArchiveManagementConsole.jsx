import {
  IconArrowUpRight,
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
            <article key={item.id} className="border-b border-[#e7e8e1] pb-4 last:border-0 last:pb-0 dark:border-[#263142]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h3>
                <StatusPill tone="neutral" size="sm">已归档</StatusPill>
                <span className="text-[11px] text-[#82847a] dark:text-gray-500">{item.type}</span>
                <a
                  href={`https://${CANONICAL_HOST}${item.archivePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-[#45473f] hover:underline dark:text-gray-300"
                >
                  查看归档页 <IconArrowUpRight size={13} aria-hidden="true" />
                </a>
              </div>

              <p className="mt-1 max-w-4xl text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.summary}</p>

              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-[#82847a] dark:text-gray-500">
                <span>周期 {formatDate(item.startedAt)} – {formatDate(item.endedAt)}</span>
                <span>归档 {formatDate(item.archivedAt)}</span>
                <span>原路径 {item.originalPath}</span>
                <span>归档路径 {item.archivePath}</span>
              </div>

              <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] leading-5 text-[#67695d] dark:text-gray-400 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span>
                  <b className="font-semibold text-emerald-700 dark:text-emerald-300">保留</b>
                  ：{item.preservedAssets.join(' · ')}
                </span>
                <span>
                  <b className="font-semibold text-[#8a5a3c] dark:text-[#cfa992]">撤下</b>
                  ：{item.retiredSurfaces.join(' · ')}
                </span>
              </div>

              {item.notes ? (
                <p className="mt-1.5 text-[11.5px] leading-5 text-[#82847a] dark:text-gray-500">{item.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      </Section>
    </AdminPage>
  )
}

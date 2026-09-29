import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage, Section, StatCard } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import report from '../../../../ai-context/site-health-audit.md?raw'

export const metadata = {
  title: '站点体检',
  description: '站点流量、错误率、缓存、数据库负载与修复建议记录，仅站长可见。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function AdminSiteHealthPage() {
  return (
    <AdminPageGate
      label="站点体检"
      returnTo="/admin/site-health"
      description="流量、错误率、缓存和数据库负载的只读检查记录，仅站长本人可见。"
    >
      <AdminPage
        title="站点体检"
        description="集中记录运行质量检查、问题定位、建议修复和复测口径；故障公告仍在独立页面维护。"
        actions={(
          <>
            <AdminButton href="/admin/design" size="sm">UI 设计</AdminButton>
            <AdminButton href="/admin/site-status" size="sm">故障公告</AdminButton>
            <AdminButton href="/admin/db" size="sm">数据健康</AdminButton>
            <AdminButton href="/admin/planning" size="sm">规划与待办</AdminButton>
          </>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="主域真实请求" value="1.55M" sub="最近 30 天 · 已排除内部请求" icon="analytics" tone="info" />
          <StatCard label="真实 4xx" value="11.75%" sub="404 为主要组成" icon="audit" tone="warning" />
          <StatCard label="真实 5xx" value="0.85%" sub="需补日志并按路由治理" icon="ops" tone="danger" />
          <StatCard label="缓存命中" value="12.9%" sub="动态接口占比较高" icon="database" tone="warning" />
        </div>

        <Section
          className="mt-5"
          title="2026-09-29 检查与建议修复"
          description="记录来源：ai-context/site-health-audit.md。任务状态只读，修改文档后随部署同步。"
        >
          <div
            className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_table]:min-w-[640px]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report.replace(/^# .+\n/, '')) }}
          />
        </Section>
      </AdminPage>
    </AdminPageGate>
  )
}

import AdminPageGate from '../../components/AdminPageGate'
import AdminSubnav from '../../components/AdminSubnav'
import { AdminPage, Section, StatCard } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import report from '../../../../ai-context/site-health-audit.md?raw'
import DbAdminClient from '../db/DbConsole'
import SiteStatusConsole from '../site-status/SiteStatusConsole'
import BloggerEyeConsole from '../blogger-eye/BloggerEyeConsole'

export const runtime = 'edge'

export const metadata = {
  title: '运行中心',
  description: '站点体检、数据健康、可用性探测与故障公告。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const TABS = [
  { id: 'audit', label: '站点体检', href: '/admin/site-health' },
  { id: 'data', label: '数据健康', href: '/admin/site-health?tab=data' },
  { id: 'probe', label: '可用性探测', href: '/admin/site-health?tab=probe' },
  { id: 'incidents', label: '故障公告', href: '/admin/site-health?tab=incidents' },
]

export default async function AdminSiteHealthPage({ searchParams }) {
  const params = await searchParams
  const activeTab = TABS.some((tab) => tab.id === params?.tab) ? params.tab : 'audit'
  return (
    <AdminPageGate
      label="运行中心"
      returnTo="/admin/site-health"
      description="站点运行质量、数据状态、主动探测和故障处置的统一入口，仅站长本人可见。"
    >
      <AdminPage
        title="运行中心"
        description="从运行审计、数据状态和主动探测发现问题，并在同一处完成故障公告。"
      >
        <AdminSubnav label="运行中心视图" items={TABS} activeId={activeTab} />

        {activeTab === 'audit' ? <>
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
        </> : null}
        {activeTab === 'data' ? <DbAdminClient embedded /> : null}
        {activeTab === 'probe' ? <BloggerEyeConsole embedded /> : null}
        {activeTab === 'incidents' ? <SiteStatusConsole embedded /> : null}
      </AdminPage>
    </AdminPageGate>
  )
}

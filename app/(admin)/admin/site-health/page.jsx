import AdminPageGate from '../../components/AdminPageGate'
import AdminSubnav from '../../components/AdminSubnav'
import { AdminPage, Section, StatCard } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import report from '../../../../docs/context/site-health-audit.md?raw'
import SiteStatusConsole from '../site-status/SiteStatusConsole'
import BloggerEyeConsole from '../blogger-eye/BloggerEyeConsole'
import ExceptionMonitorClient from './ExceptionMonitorClient'
import CloudflareUsageClient from './CloudflareUsageClient'
import usageIncidents from '../../../../docs/context/cloudflare-usage-incidents.md?raw'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export const metadata = {
  title: '运行中心',
  description: '异常监控、站点体检、可用性探测与故障公告。',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const TABS = [
  { id: 'exceptions', label: '异常监控', href: '/admin/site-health?tab=exceptions' },
  { id: 'audit', label: '站点体检', href: '/admin/site-health?tab=audit' },
  { id: 'probe', label: '可用性探测', href: '/admin/site-health?tab=probe' },
  { id: 'incidents', label: '故障公告', href: '/admin/site-health?tab=incidents' },
  { id: 'usage', label: '用量监控', href: '/admin/site-health?tab=usage' },
]

export default async function AdminSiteHealthPage({ searchParams }) {
  const params = await searchParams
  if (params?.tab === 'data') redirect('/admin/db')
  const activeTab = TABS.some((tab) => tab.id === params?.tab) ? params.tab : 'exceptions'
  return (
    <AdminPageGate
      label="运行中心"
      returnTo="/admin/site-health"
      description="站点异常告警、运行质量、主动探测和故障处置的统一入口，仅站长本人可见。"
    >
      <AdminPage
        title="运行中心"
        description="集中查看异常告警、各板块处理方式和主动探测，并在同一处完成故障公告。"
      >
        <AdminSubnav label="运行中心视图" items={TABS} activeId={activeTab} />

        {activeTab === 'exceptions' ? <ExceptionMonitorClient /> : null}
        {activeTab === 'audit' ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="主域真实请求" value="1.55M" sub="最近 30 天 · 已排除内部请求" icon="analytics" tone="info" />
            <StatCard label="真实 4xx" value="11.75%" sub="404 为主要组成" icon="audit" tone="warning" />
            <StatCard label="真实 5xx" value="0.85%" sub="需补日志并按路由治理" icon="ops" tone="danger" />
            <StatCard label="缓存命中" value="12.9%" sub="动态接口占比较高" icon="database" tone="warning" />
          </div>

          <Section
            className="mt-5"
            title="站点体检记录与建议"
            description="记录来源：docs/context/site-health-audit.md。任务状态只读，修改文档后随部署同步。"
          >
            <div
              className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_table]:min-w-[640px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.replace(/^# .+\n/, '')) }}
            />
          </Section>
        </> : null}
        {activeTab === 'probe' ? <BloggerEyeConsole embedded /> : null}
        {activeTab === 'incidents' ? <SiteStatusConsole embedded /> : null}
        {activeTab === 'usage' ? <>
          <CloudflareUsageClient />
          <Section className="mt-5" title="故障与优化记录" description="已核实的原因、处理策略和部署后验证。">
            <div className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMarkdown(usageIncidents.replace(/^# .+\n/, '')) }} />
          </Section>
        </> : null}
      </AdminPage>
    </AdminPageGate>
  )
}

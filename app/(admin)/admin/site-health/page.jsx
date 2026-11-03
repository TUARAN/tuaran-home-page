import AdminPageGate from '../../components/AdminPageGate'
import OperationsDirectory from '../../components/OperationsDirectory'
import { AdminPage, Section, StatCard } from '../../components/ui'
import { renderMarkdown } from '../../../../lib/research/markdown'
import report from '../../../../docs/context/site-health-audit.md?raw'
import SiteStatusConsole from '../site-status/SiteStatusConsole'
import BloggerEyeConsole from '../blogger-eye/BloggerEyeConsole'
import ExceptionMonitorClient from './ExceptionMonitorClient'
import CloudflareUsageClient from './CloudflareUsageClient'
import usageIncidents from '../../../../docs/context/cloudflare-usage-incidents.md?raw'
import { findOperationsEntry, siteHealthTabFromSearch } from '../../../../lib/admin/adminRoutes'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

function entryFor(searchParams) {
  const tab = siteHealthTabFromSearch(searchParams?.tab ? `tab=${searchParams.tab}` : '')
  return findOperationsEntry(`/admin/site-health?tab=${tab}`)
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const entry = entryFor(params)
  return {
    title: entry?.label || '异常监控',
    description: entry?.desc || '异常监控、可用性探测、故障公告、用量监控与站点体检。',
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
}

export default async function AdminSiteHealthPage({ searchParams }) {
  const params = await searchParams
  if (params?.tab === 'data') redirect('/admin/db')
  const entry = entryFor(params)
  const activeHref = entry?.href || '/admin/site-health?tab=exceptions'
  const tab = siteHealthTabFromSearch(activeHref)

  return (
    <AdminPageGate
      label={entry?.label || '异常监控'}
      returnTo={activeHref}
      description="站点异常、探测、故障公告、用量和检查记录的站长入口，仅站长本人可见。"
    >
      <AdminPage title={entry?.label || '异常监控'} description={entry?.desc || ''}>
        <OperationsDirectory activeHref={activeHref} />

        {tab === 'exceptions' ? <ExceptionMonitorClient /> : null}
        {tab === 'audit' ? <>
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
        {tab === 'probe' ? <BloggerEyeConsole embedded /> : null}
        {tab === 'incidents' ? <SiteStatusConsole embedded /> : null}
        {tab === 'usage' ? <>
          <CloudflareUsageClient />
          <Section className="mt-5" title="故障与优化记录" description="已核实的原因、处理策略和部署后验证。">
            <div className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert [&>:first-child]:mt-0 [&>:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderMarkdown(usageIncidents.replace(/^# .+\n/, '')) }} />
          </Section>
        </> : null}
      </AdminPage>
    </AdminPageGate>
  )
}

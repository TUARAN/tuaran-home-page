'use client'

import { useSearchParams } from 'next/navigation'

import { AdminButton, AdminPage, Section } from '../../../components/ui'
import DistributionMonitor from './DistributionMonitor'
import PluginPicker, { ARCHIVED_PLUGIN_PLATFORMS } from './PluginPicker'

const X_CONSOLE = 'https://x.2aran.com/x-workbench/ops'

function ArchivedPluginRedirect({ platform }) {
  const label = platform === 'juejin' ? '掘金大互动智能体' : '小红书大互动智能体'
  return (
    <AdminPage title="插件监控" description="已归档插件不再占用监控顶栏。先到插件台查看说明，跨平台分发请启用 AI 分发大师。">
      <PluginPicker selected="" />
      <Section title={`${label} · 已归档`} description="独立监控入口已收回。历史说明与启用入口在插件台；新监控看 AI 分发大师。">
        <p className="m-0 text-[14px] leading-6 text-[#4e5b50] dark:text-gray-300">
          {label}已合入 AI 分发大师。若要继续分发到该平台，请先在插件台领取或启用 AI 分发大师，再打开其监控。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminButton href="/admin/community-actions?tab=extension" variant="primary">打开插件台</AdminButton>
          <AdminButton href="/admin/community-actions/monitor?platform=ai-distributor">查看 AI 分发大师监控</AdminButton>
        </div>
      </Section>
    </AdminPage>
  )
}

function XMonitorMoved() {
  return (
    <AdminPage title="插件监控" description="X 大互动智能体的状态、排班与动作明细已移到 X 站后台。">
      <PluginPicker selected="x" />
      <Section title="X 大互动智能体 · 已在 X 站" description="首页访客看状态与日历，站长在 X 站后台管排班、启停与明细。">
        <p className="m-0 text-[14px] leading-6 text-[#4e5b50] dark:text-gray-300">
          后台的 X 监控页已下线，避免和 X 站重复维护。插件状态、任务排班、远程启停、动作明细统一在 X 站「插件与排班」。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminButton href={X_CONSOLE} variant="primary">打开 X 站插件后台</AdminButton>
          <AdminButton href="/admin/community-actions?tab=extension" variant="ghost">返回插件台</AdminButton>
        </div>
      </Section>
    </AdminPage>
  )
}

export default function PluginMonitorClient() {
  const params = useSearchParams()
  const platform = params.get('platform') || 'ai-distributor'
  if (platform === 'x') return <XMonitorMoved />
  if (ARCHIVED_PLUGIN_PLATFORMS.has(platform)) return <ArchivedPluginRedirect platform={platform} />
  return <DistributionMonitor />
}

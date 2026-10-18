'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../../components/ui'

const MODE_LABEL = { timeline: '时间线回复', notifications: '通知回复', 'likes-posts': '首页点赞', 'likes-replies': '评论点赞', poster: '定时发帖', 'mutual-unfollow': '清理未回关', 'mutual-followBack': '回关粉丝', 'mutual-targetFollow': '关注候选' }
const PHASE = { running: ['运行中', 'info'], paused: ['已暂停', 'warning'], stopping: ['停止中', 'warning'], idle: ['空闲', 'neutral'], unknown: ['状态未知', 'warning'], offline: ['离线', 'danger'] }
const RESULT = { success: ['成功', 'success'], failed: ['失败', 'danger'], skipped: ['跳过', 'neutral'], limited: ['受限', 'warning'] }
const time = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'

export default function XMonitorClient() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/community-actions/x-monitor', { cache: 'no-store', credentials: 'same-origin' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
      setData(payload)
      setError('')
    } catch (issue) { setError(issue.message || '监控读取失败') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 15000); return () => window.clearInterval(timer) }, [refresh])

  const devices = data?.devices || []
  const events = data?.events || []
  const online = devices.filter((device) => device.online).length
  const running = devices.filter((device) => device.phase === 'running').length
  const problems = devices.filter((device) => ['offline', 'unknown', 'paused', 'stopping'].includes(device.phase)).length

  return <AdminPage title="X 高频互动助手监控" description="每 15 秒刷新。在线表示 5 分钟内有心跳；运行状态来自插件本地任务快照，动作结果来自确认回执。" actions={<><AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton><AdminButton onClick={refresh} size="sm" variant="primary">刷新</AdminButton></>}>
    <p className="mb-3 text-xs text-[#7a7c70] dark:text-gray-400">服务端读取时间：{time(data?.now)}</p>
    {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">读取失败：{error}。显示的可能是旧数据。</p> : null}
    {data?.migrationRequired ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">请先执行迁移 0115_x_extension_runtime.sql；动作回执仍可继续接收。</p> : null}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="插件在线" value={loading ? '—' : online} sub="5 分钟内收到心跳" tone={online ? 'info' : 'neutral'} />
      <StatCard label="声明运行" value={loading ? '—' : running} sub="任务快照显示正在运行" tone="info" />
      <StatCard label="需关注" value={loading ? '—' : problems} sub="离线、未知、暂停或停止中" tone={problems ? 'warning' : 'neutral'} />
      <StatCard label="最近动作" value={loading ? '—' : events.length} sub="近 7 天，最多 300 条" />
    </div>
    <Section title="设备与任务" description="插件在线但没有运行任务时显示空闲；旧版插件没有任务快照时显示状态未知。">
      {devices.length ? <div className="grid gap-3">{devices.map((device) => {
        const [label, tone] = PHASE[device.phase] || PHASE.unknown
        return <article key={device.id} className="rounded-xl border border-[#e4e6dc] p-4 dark:border-[#263142]">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="m-0 text-base font-semibold">{device.accountHandle ? `@${device.accountHandle}` : '未识别账号'}</h2><p className="mb-0 mt-1 text-xs text-[#7a7c70]">设备 {device.id.slice(0, 12)}… · v{device.extensionVersion || '未知'}</p></div><StatusPill tone={tone}>{label}</StatusPill></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-[#7a7c70]">最近心跳</dt><dd className="m-0">{time(device.lastSeenAt)}</dd></div><div><dt className="text-[#7a7c70]">最近动作</dt><dd className="m-0">{device.lastAction ? `${time(device.lastAction.occurred_at)} · ${device.lastAction.taskLabel}` : '近 7 天无回执'}</dd></div><div><dt className="text-[#7a7c70]">最近异常</dt><dd className="m-0">{device.lastFailure ? `${time(device.lastFailure.occurred_at)} · ${device.lastFailure.taskLabel} · ${device.lastFailure.error_code || device.lastFailure.result}` : '近 7 天无失败或受限回执'}</dd></div></dl>
          <div className="mt-4 flex flex-wrap gap-2">{device.tasks.length ? device.tasks.map((task) => <StatusPill key={task.mode} tone={task.phase === 'running' ? 'info' : 'warning'}>{MODE_LABEL[task.mode] || task.mode} · {PHASE[task.phase]?.[0] || task.phase}</StatusPill>) : <span className="text-sm text-[#7a7c70]">{device.telemetry ? '没有运行任务' : '插件尚未上报任务状态'}</span>}</div>
          {device.phase === 'running' && (!device.lastAction || data.now - Number(device.lastAction.occurred_at) > 30 * 60 * 1000) ? <p className="mb-0 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">任务声明运行中，但近 30 分钟没有确认动作。可能在等待任务间隔，也可能卡住；请检查插件任务页。</p> : null}
          <p className="mb-0 mt-3 text-xs text-[#7a7c70]">今日确认：成功 {device.today.success} · 失败 {device.today.failed} · 跳过 {device.today.skipped} · 受限 {device.today.limited}。成功数不能证明当前正在运行。</p>
        </article>
      })}</div> : <EmptyState title="还没有 X 插件设备" description="在插件中配置回执密钥并保持浏览器运行；首次上报后才会出现。" />}
    </Section>
    <Section title="状态怎么判断" description="无法收到插件本地消息时，后台不能直接判断 Chrome 是否关闭、密钥错误还是网络断开。" className="mt-5">
      <ul className="m-0 grid gap-2 pl-5 text-sm leading-6 text-[#5f6156] dark:text-gray-300"><li>离线：超过 5 分钟没有心跳；检查浏览器、扩展是否启用、回执密钥与网络。</li><li>状态未知：有心跳但没有新版插件运行快照；更新插件并刷新 X 页面。</li><li>空闲或暂停：插件可连接，当前没有正在执行的任务；可在插件里启动或恢复。</li><li>运行中：插件声明任务正在运行；结合最近动作和异常判断是否有实际进展。</li></ul>
    </Section>
    <Section title="最近动作与异常" description="近 7 天的回执，展示最近 300 条。没有动作时不能单独判定故障，需结合任务快照。" className="mt-5">
      {events.length ? <div className="max-h-[32rem] overflow-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr><th className="py-2">时间</th><th>账号</th><th>任务</th><th>结果</th><th>错误码</th></tr></thead><tbody>{events.map((event) => { const [label, tone] = RESULT[event.result] || [event.result, 'neutral']; return <tr key={event.id} className="border-t border-[#e4e6dc]"><td className="py-2">{time(event.occurredAt)}</td><td>{event.accountHandle ? `@${event.accountHandle}` : '—'}</td><td>{event.taskLabel}</td><td><StatusPill tone={tone} size="sm">{label}</StatusPill></td><td>{event.errorCode || '—'}</td></tr> })}</tbody></table></div> : <EmptyState title="近 7 天没有回执" description="任务是否运行请看上方状态；动作执行并确认后才会产生回执。" />}
    </Section>
  </AdminPage>
}

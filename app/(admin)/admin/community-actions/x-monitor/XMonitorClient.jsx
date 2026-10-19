'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminButton, AdminPage, AdminPagination, EmptyState, Section, StatusPill } from '../../../components/ui'
import XMonitorTrend from './XMonitorTrend'

const MODE_LABEL = { timeline: '时间线回复', notifications: '通知回复', 'likes-posts': '首页点赞', 'likes-replies': '评论点赞', poster: '定时发帖', 'mutual-unfollow': '清理未回关', 'mutual-followBack': '回关粉丝', 'mutual-targetFollow': '关注候选' }
const PHASE = { running: ['运行中', 'info'], paused: ['已暂停', 'warning'], stopping: ['停止中', 'warning'], idle: ['空闲', 'neutral'], unknown: ['状态未知', 'warning'], offline: ['离线', 'danger'] }
const RESULT = { success: ['成功', 'success'], failed: ['失败', 'danger'], skipped: ['跳过', 'neutral'], limited: ['受限', 'warning'] }
const LIVE_POLL_INTERVAL_MS = 30_000
const FULL_REFRESH_INTERVAL_MS = 30 * 60_000
const time = (value) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'
const todayInShanghai = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const adjacentDate = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)

function Metric({ label, value, detail, tone = 'default' }) {
  const color = tone === 'success' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-[#232920] dark:text-gray-100'
  return <div className="min-w-0 px-4 py-3">
    <dt className="text-[12px] text-[#697268] dark:text-gray-400">{label}</dt>
    <dd className={`m-0 mt-1 text-[1.65rem] font-semibold tabular-nums leading-none ${color}`}>{value}</dd>
    <p className="mb-0 mt-1.5 text-[11px] text-[#81897f] dark:text-gray-500">{detail}</p>
  </div>
}

function DeviceRow({ device, now }) {
  const [label, tone] = PHASE[device.phase] || PHASE.unknown
  const quiet = device.phase === 'running' && (!device.lastAction || now - Number(device.lastAction.occurred_at) > 30 * 60 * 1000)
  return <details className="group border-t border-[#e5e9e2] first:border-t-0 dark:border-[#263142]">
    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 hover:bg-[#f7faf6] dark:hover:bg-[#141d26] sm:flex-nowrap">
      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#273228] dark:text-gray-100">{device.accountHandle ? `@${device.accountHandle}` : '未识别账号'}</span><span className="mt-0.5 block text-[12px] text-[#7a8479] dark:text-gray-400">插件实例 {device.id.slice(0, 12)}… · v{device.extensionVersion || '未知'}</span></span>
      <span className="text-[12px] text-[#697268] dark:text-gray-400">心跳 {time(device.lastSeenAt)}</span>
      <StatusPill size="sm" tone={tone}>{label}</StatusPill>
      <span aria-hidden="true" className="text-[#899187] transition group-open:rotate-180">⌄</span>
    </summary>
    <div className="border-t border-[#e5e9e2] bg-[#fafbf8] px-4 py-4 text-[13px] dark:border-[#263142] dark:bg-[#101820]">
      <div className="flex flex-wrap gap-2">{device.tasks.length ? device.tasks.map((task) => <StatusPill key={task.mode} size="sm" tone={task.phase === 'running' ? 'info' : 'warning'}>{MODE_LABEL[task.mode] || task.mode} · {PHASE[task.phase]?.[0] || task.phase}</StatusPill>) : <span className="text-[#697268] dark:text-gray-400">{device.telemetry ? '当前没有运行任务' : '插件尚未上报任务状态'}</span>}</div>
      <dl className="mb-0 mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-[#7a8479] dark:text-gray-400">最近确认动作</dt><dd className="m-0 mt-1">{device.lastAction ? `${time(device.lastAction.occurred_at)} · ${device.lastAction.taskLabel}` : '近 7 天无回执'}</dd></div><div><dt className="text-[#7a8479] dark:text-gray-400">最近失败或受限</dt><dd className="m-0 mt-1">{device.lastFailure ? `${time(device.lastFailure.occurred_at)} · ${device.lastFailure.taskLabel} · ${device.lastFailure.error_code || device.lastFailure.result}` : '近 7 天无异常回执'}</dd></div></dl>
      {quiet ? <p className="mb-0 mt-3 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">任务声明运行中，但近 30 分钟没有确认动作。可检查插件任务页是否在等待或受阻。</p> : null}
    </div>
  </details>
}

export default function XMonitorClient() {
  const [selectedDate, setSelectedDate] = useState(todayInShanghai)
  const [offset, setOffset] = useState(0)
  const [reportOffset, setReportOffset] = useState(0)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showOlderDevices, setShowOlderDevices] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const lastFullRefreshAt = useRef(0)

  const refresh = useCallback(async (showLoading = false, liveOnly = false) => {
    if (document.hidden && !showLoading) return
    const id = ++requestId.current
    if (showLoading) setLoading(true)
    if (!liveOnly) lastFullRefreshAt.current = Date.now()
    try {
      const query = new URLSearchParams({ date: selectedDate, offset: String(offset), reportOffset: String(reportOffset) })
      if (liveOnly) query.set('view', 'live')
      const response = await fetch(`/api/admin/community-actions/x-monitor?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
      if (id !== requestId.current) return
      if (liveOnly) {
        setData((current) => current ? { ...current, now: payload.now, devices: payload.devices, migrationRequired: payload.migrationRequired } : current)
      } else {
        setData(payload)
      }
      setError('')
    } catch (issue) {
      if (id === requestId.current) setError(issue.message || '监控读取失败')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [selectedDate, offset, reportOffset])

  useEffect(() => {
    lastFullRefreshAt.current = 0
    refresh(true)
    const poll = () => {
      if (document.hidden) return
      refresh(false, Date.now() - lastFullRefreshAt.current < FULL_REFRESH_INTERVAL_MS)
    }
    const timer = window.setInterval(poll, LIVE_POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', poll); requestId.current += 1 }
  }, [refresh])

  const changeDate = (date) => { if (date) { setSelectedDate(date); setOffset(0); setReportOffset(0); setShowAllTasks(false) } }
  const visibleData = data?.selectedDate === selectedDate ? data : null
  const devices = visibleData?.devices || []
  const recentDevices = devices.slice(0, 3)
  const olderDevices = devices.slice(3)
  const tasks = visibleData?.tasks || []
  const activeTasks = tasks.filter((task) => task.success + task.failed + task.skipped + task.limited > 0)
  const shownTasks = showAllTasks ? tasks : activeTasks
  const reports = visibleData?.reportOffset === reportOffset ? visibleData.dailyReports : []
  const events = visibleData?.offset === offset ? visibleData.events : []
  const online = devices.filter((device) => device.online).length
  const running = devices.filter((device) => device.phase === 'running').length
  const successes = tasks.reduce((sum, task) => sum + task.success, 0)
  const issues = tasks.reduce((sum, task) => sum + task.failed + task.limited, 0)
  const minDate = visibleData?.minDate || adjacentDate(todayInShanghai(), -365)
  const maxDate = visibleData?.maxDate || todayInShanghai()

  return <AdminPage title="X 插件监控" description="运行状态、确认动作和插件每日报告集中查看。实时状态每 30 秒更新，历史统计每 30 分钟更新；页面隐藏时暂停刷新。" actions={<><AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton><AdminButton onClick={() => refresh(true)} size="sm" variant="primary" disabled={loading}>刷新数据</AdminButton></>}>
    {error ? <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">读取失败：{error}。请刷新重试。</p> : null}
    {visibleData?.migrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0115_x_extension_runtime.sql；动作回执仍可继续接收。</p> : null}
    {visibleData?.countsMigrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0117_community_action_daily_counts.sql；历史统计暂不可用，实时状态仍可查看。</p> : null}

    <Section title="实时运行" description="按最近心跳显示插件实例；重装后若本地存储被清除，会生成新的实例 ID。在线表示 5 分钟内收到心跳。" actions={<span className="text-[12px] text-[#7a8479] dark:text-gray-400">更新于 {time(visibleData?.now)}</span>}>
      <dl className="-mx-4 -mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5"><Metric label="在线实例" value={loading && !visibleData ? '—' : online} detail="5 分钟内有心跳" /><Metric label="运行中" value={loading && !visibleData ? '—' : running} detail="插件声明的任务状态" tone="success" /><Metric label="较早记录" value={loading && !visibleData ? '—' : olderDevices.length} detail="默认收起，可按需展开" /></dl>
      {devices.length ? <div className="-mx-4 -mb-4 md:-mx-5">{recentDevices.map((device) => <DeviceRow key={device.id} device={device} now={visibleData.now} />)}{olderDevices.length ? <><button type="button" onClick={() => setShowOlderDevices((value) => !value)} aria-expanded={showOlderDevices} className="w-full border-t border-[#e5e9e2] px-4 py-3 text-left text-[12px] font-medium text-[#48634b] hover:bg-[#f7faf6] dark:border-[#263142] dark:text-emerald-300 dark:hover:bg-[#141d26]">{showOlderDevices ? '收起较早记录' : `查看较早记录（${olderDevices.length} 条）`}</button>{showOlderDevices ? olderDevices.map((device) => <DeviceRow key={device.id} device={device} now={visibleData.now} />) : null}</> : null}</div> : <div className="pt-4"><EmptyState title={loading ? '正在读取插件实例' : '还没有 X 插件实例'} description={loading ? '请稍候。' : '在插件中配置回执密钥并保持浏览器运行；首次上报后会出现。'} /></div>}
      <p className="mb-0 mt-4 text-[12px] leading-5 text-[#7a8479] dark:text-gray-400">离线请检查浏览器、扩展、密钥与网络；有心跳但状态未知时，请更新插件并刷新 X 页面。</p>
    </Section>

    <Section title="按日期查看" description="确认回执与插件本地报告来源不同，均按北京时间日期筛选。" className="mt-5" actions={<div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, -1))} disabled={selectedDate <= minDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="前一天">←</button><input type="date" aria-label="选择统计日期" value={selectedDate} min={minDate} max={maxDate} onChange={(event) => changeDate(event.target.value)} className="rounded-md border border-[#d7dfd5] bg-white px-2.5 py-1.5 text-[13px] text-[#273228] dark:border-[#354438] dark:bg-[#101820] dark:text-gray-100" /><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, 1))} disabled={selectedDate >= maxDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="后一天">→</button><AdminButton size="sm" variant="ghost" onClick={() => changeDate(todayInShanghai())} disabled={selectedDate === maxDate}>今天</AdminButton></div>}>
      <dl className="-mx-4 -mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5"><Metric label="确认成功" value={loading && !visibleData ? '—' : successes} detail="回执去重后的动作" tone="success" /><Metric label="失败 / 受限" value={loading && !visibleData ? '—' : issues} detail="需要查看明细" tone={issues ? 'warning' : 'default'} /><Metric label="已上传报告" value={loading && !visibleData ? '—' : visibleData?.reportTotal || 0} detail="按设备与账号保存" /></dl>
      {visibleData ? <XMonitorTrend days={visibleData.trend || []} tasks={tasks} onDateChange={changeDate} /> : null}
      <div className="mt-5 flex items-center justify-between gap-3"><div><h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">任务结果</h3><p className="mb-0 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">确认回执按任务聚合；默认隐藏没有动作的任务。</p></div>{activeTasks.length && activeTasks.length < tasks.length ? <button type="button" onClick={() => setShowAllTasks((value) => !value)} className="shrink-0 text-[12px] font-medium text-emerald-700 hover:underline dark:text-emerald-300">{showAllTasks ? '隐藏空任务' : `显示全部 ${tasks.length} 项`}</button> : null}</div>
      {shownTasks.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">任务</th><th className="py-2 text-right font-medium">成功</th><th className="py-2 text-right font-medium">失败</th><th className="py-2 text-right font-medium">跳过</th><th className="py-2 text-right font-medium">受限</th></tr></thead><tbody>{shownTasks.map((task) => <tr key={task.task} className="border-t border-[#e5e9e2] dark:border-[#263142]"><th scope="row" className="py-2.5 font-medium text-[#273228] dark:text-gray-100">{task.label}</th><td className="py-2.5 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{task.success}</td><td className="py-2.5 text-right tabular-nums">{task.failed}</td><td className="py-2.5 text-right tabular-nums">{task.skipped}</td><td className="py-2.5 text-right tabular-nums">{task.limited}</td></tr>)}</tbody></table></div> : <div className="mt-3"><EmptyState title={loading ? '正在读取任务结果' : '这一天没有确认动作'} description={loading ? '请稍候。' : '选择其他日期，或等待插件上报动作回执。'} /></div>}
    </Section>

    <Section title="插件每日报告" description="插件在本地统计成功动作，点击插件里的「上传报告」后更新；与确认回执是两份独立记录。" className="mt-5">
      {visibleData?.dailyMigrationRequired ? <p role="alert" className="text-[12px] text-amber-700 dark:text-amber-300">请先应用数据库迁移 0112_x_extension_daily_reports.sql。</p> : null}
      {reports.length ? <div className="-mx-4 -my-4 divide-y divide-[#e5e9e2] dark:divide-[#263142] md:-mx-5">{reports.map((report) => <div key={`${report.deviceId}:${report.accountHandle}`} className="grid gap-2 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-center md:px-5"><div className="min-w-0"><p className="m-0 truncate text-[13px] font-semibold text-[#273228] dark:text-gray-100">{report.accountHandle ? `@${report.accountHandle}` : '账号未识别'}</p><p className="mb-0 mt-0.5 text-[11px] text-[#7a8479] dark:text-gray-400">设备 {report.deviceId.slice(0, 12)}… · 上传于 {time(report.uploadedAt)}</p></div><div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums text-[#4e5b50] dark:text-gray-300"><span>评论 <strong>{report.comments}</strong></span><span>点赞 <strong>{report.likes}</strong></span><span>关注 <strong>{report.follows}</strong></span><span>取关 <strong>{report.unfollows}</strong></span><span>回关 <strong>{report.followBacks}</strong></span></div></div>)}</div> : <EmptyState title={loading ? '正在读取每日报告' : '这一天没有上传的报告'} description={loading ? '请稍候。' : '在 X 插件主面板选择日期并点击「上传报告」。'} />}
      <AdminPagination total={visibleData?.reportTotal || 0} offset={reportOffset} limit={visibleData?.reportLimit || 20} loading={loading} onOffsetChange={setReportOffset} />
    </Section>

    <Section title="动作明细" description="所选日期的确认回执；不保存正文、Cookie 或模型密钥。" className="mt-5">
      {events.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">时间</th><th className="font-medium">账号</th><th className="font-medium">任务</th><th className="font-medium">结果</th><th className="font-medium">错误码</th></tr></thead><tbody>{events.map((event) => { const [label, tone] = RESULT[event.result] || [event.result, 'neutral']; return <tr key={event.id} className="border-t border-[#e5e9e2] dark:border-[#263142]"><td className="whitespace-nowrap py-2.5">{time(event.occurredAt)}</td><td>{event.accountHandle ? `@${event.accountHandle}` : '—'}</td><td>{event.taskLabel}</td><td><StatusPill tone={tone} size="sm">{label}</StatusPill></td><td className="text-[#7a8479] dark:text-gray-400">{event.errorCode || '—'}</td></tr> })}</tbody></table></div> : <EmptyState title={loading ? '正在读取动作明细' : '这一天没有动作明细'} description={loading ? '请稍候。' : '选择其他日期，或等待插件确认动作后上报。'} />}
      <AdminPagination total={visibleData?.eventTotal || 0} offset={offset} limit={visibleData?.limit || 20} loading={loading} onOffsetChange={setOffset} />
    </Section>
  </AdminPage>
}

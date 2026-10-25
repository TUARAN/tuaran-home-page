'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminButton, AdminPage, AdminPagination, EmptyState, Section, StatusPill } from '../../../components/ui'
import PluginMonitorTrend from './PluginMonitorTrend'

const MODE_LABEL = { timeline: '评论帖子', notifications: '评论通知', 'likes-posts': '点赞帖子', 'likes-replies': '点赞评论', poster: '定时发帖', 'mutual-unfollow': '清理未回关', 'mutual-followBack': '回关粉丝', 'mutual-targetFollow': '关注候选' }
const PHASE = { running: ['运行中', 'info'], paused: ['已暂停', 'warning'], stopping: ['停止中', 'warning'], idle: ['空闲', 'neutral'], online: ['有心跳', 'info'], unknown: ['状态未知', 'warning'], offline: ['离线', 'danger'] }
const TASK_PHASE = { running: ['执行中', 'info'], waiting: ['等待中', 'warning'], paused: ['等待中', 'warning'], stopping: ['停止中', 'warning'], idle: ['未启动', 'neutral'], unknown: ['待确认', 'warning'] }
const GROUP_PHASE = { running: ['有任务执行', 'info'], waiting: ['有任务等待', 'warning'], stopping: ['停止中', 'warning'], idle: ['未启动', 'neutral'], unknown: ['待确认', 'warning'] }
const COMMAND_LABEL = { 'flow-start': '全流程启动', 'flow-pause': '暂停全部', 'task-start': '启动任务', 'task-stop': '停止任务' }
const COMMAND_STATUS = { pending: ['排队中', 'warning'], claimed: ['已下发', 'info'], done: ['已完成', 'success'], failed: ['失败', 'danger'], expired: ['已过期', 'neutral'] }
const RESULT = { success: ['成功', 'success'], failed: ['失败', 'danger'], skipped: ['跳过', 'neutral'], limited: ['受限', 'warning'] }
const PLATFORMS = [{ id: 'x', label: 'X' }, { id: 'xhs', label: '小红书' }, { id: 'juejin', label: '掘金' }]
const LIVE_POLL_INTERVAL_MS = 15_000
const FULL_REFRESH_INTERVAL_MS = 30 * 60_000
const time = (value) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'
const clock = (value) => value ? new Date(value).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : ''
const todayInShanghai = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const adjacentDate = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
const waitCopy = (waitUntil, now) => {
  const remaining = Number(waitUntil) - Number(now)
  if (!(remaining > 0)) return ''
  const total = Math.ceil(remaining / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

function Metric({ label, value, detail, tone = 'default' }) {
  const color = tone === 'success' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-[#232920] dark:text-gray-100'
  return <div className="min-w-0 px-4 py-3">
    <dt className="text-[12px] text-[#697268] dark:text-gray-400">{label}</dt>
    <dd className={`m-0 mt-1 text-[1.65rem] font-semibold tabular-nums leading-none ${color}`}>{value}</dd>
    <p className="mb-0 mt-1.5 text-[11px] text-[#81897f] dark:text-gray-500">{detail}</p>
  </div>
}

function DeviceRow({ device, now, platform, onCommand, busyKey }) {
  const [label, tone] = PHASE[device.phase] || PHASE.unknown
  const quiet = device.phase === 'running' && (!device.lastAction || now - Number(device.lastAction.occurred_at) > 30 * 60 * 1000)
  const groups = Array.isArray(device.groups) ? device.groups : []
  const commands = Array.isArray(device.commands) ? device.commands : []
  const canControl = platform === 'x' && device.online && device.telemetry
  const send = (command, mode = '') => onCommand?.({ deviceId: device.id, command, mode })
  return <details className="group border-t border-[#e5e9e2] first:border-t-0 dark:border-[#263142]" open={platform === 'x' && Boolean(device.telemetry)}>
    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 hover:bg-[#f7faf6] dark:hover:bg-[#141d26] sm:flex-nowrap">
      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#273228] dark:text-gray-100">{device.accountHandle ? `@${device.accountHandle}` : '未识别账号'}</span><span className="mt-0.5 block text-[12px] text-[#7a8479] dark:text-gray-400">插件实例 {device.id.slice(0, 12)}… · v{device.extensionVersion || '未知'}</span></span>
      <span className="text-[12px] text-[#697268] dark:text-gray-400">心跳 {time(device.lastSeenAt)}</span>
      <StatusPill size="sm" tone={tone}>{label}</StatusPill>
      <span aria-hidden="true" className="text-[#899187] transition group-open:rotate-180">⌄</span>
    </summary>
    <div className="border-t border-[#e5e9e2] bg-[#fafbf8] px-4 py-4 text-[13px] dark:border-[#263142] dark:bg-[#101820]">
      {platform === 'x' ? <>
        {canControl ? <div className="mb-4 flex flex-wrap gap-2">
          <AdminButton size="sm" variant="primary" disabled={Boolean(busyKey)} onClick={() => send('flow-start')}>全流程启动</AdminButton>
          <AdminButton size="sm" disabled={Boolean(busyKey)} onClick={() => send('flow-pause')}>暂停全部</AdminButton>
          <span className="self-center text-[11px] text-[#7a8479] dark:text-gray-400">指令随下次心跳下发（通常 1 分钟内），执行后回写结果。</span>
        </div> : null}
        {groups.length ? <div className="overflow-hidden rounded-2xl border border-[#d7e3f4] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)] dark:border-[#263142] dark:bg-[#0d141c]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8eef5] px-4 py-3 dark:border-[#263142]">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">Task Deck</p>
              <p className="mb-0 mt-1 text-[12px] text-[#536471] dark:text-gray-400">四类功能状态与插件面板「详情」对齐；等待中会显示原因与倒计时。</p>
            </div>
            <div className="flex gap-1" aria-hidden="true">{groups.flatMap((group) => group.tasks).map((task) => <i key={task.mode} className={`block h-2 w-2 rounded-full ${task.phase === 'running' ? 'bg-emerald-400' : task.phase === 'waiting' ? 'bg-amber-400' : task.phase === 'stopping' || task.phase === 'unknown' ? 'bg-rose-300' : 'bg-slate-300'}`} title={`${task.label} · ${(TASK_PHASE[task.phase] || TASK_PHASE.idle)[0]}`} />)}</div>
          </div>
          <div className="grid gap-0 sm:grid-cols-2">
            {groups.map((group) => {
              const [groupLabel, groupTone] = GROUP_PHASE[group.phase] || GROUP_PHASE.idle
              return <section key={group.id} className="border-t border-[#e8eef5] px-4 py-3 sm:border-r sm:odd:border-r dark:border-[#263142] sm:[&:nth-child(2n)]:border-r-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="m-0 text-[13px] font-semibold text-[#0f1419] dark:text-gray-100">{group.label}</h3>
                  <StatusPill size="sm" tone={groupTone}>{groupLabel}</StatusPill>
                </div>
                <ul className="m-0 space-y-2 p-0 list-none">
                  {group.tasks.map((task) => {
                    const [taskLabel, taskTone] = TASK_PHASE[task.phase] || TASK_PHASE.idle
                    const countdown = waitCopy(task.waitUntil, now)
                    const detail = task.detail || (task.phase === 'waiting' ? '任务已启动，正在等待下一轮或冷却结束' : task.phase === 'idle' ? '当前没有运行记录' : task.phase === 'unknown' ? '超过 90 秒没有状态更新' : task.phase === 'stopping' ? '正在结束当前任务' : '任务正在执行')
                    const taskBusy = busyKey === `${device.id}:task-start:${task.mode}` || busyKey === `${device.id}:task-stop:${task.mode}`
                    return <li key={task.mode} className="rounded-xl border border-[#eef3f8] bg-[#f8fbff] px-3 py-2.5 dark:border-[#263142] dark:bg-[#101820]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-[12px] text-[#0f1419] dark:text-gray-100">{task.label || MODE_LABEL[task.mode] || task.mode}</strong>
                            <StatusPill size="sm" tone={taskTone}>{taskLabel}</StatusPill>
                            {countdown ? <span className="text-[11px] tabular-nums text-amber-700 dark:text-amber-300">{countdown}</span> : null}
                          </div>
                          <p className="mb-0 mt-1 text-[11px] leading-5 text-[#536471] dark:text-gray-400">{detail}{task.updatedAt ? ` · 最近更新 ${clock(task.updatedAt)}` : ''}</p>
                        </div>
                        {canControl ? <div className="flex shrink-0 gap-1">
                          <button type="button" disabled={Boolean(busyKey)} onClick={() => send('task-start', task.mode)} className="rounded-md border border-[#cfe3f5] px-2 py-1 text-[11px] font-semibold text-[#1d9bf0] disabled:opacity-40 dark:border-[#354438]">启动</button>
                          <button type="button" disabled={Boolean(busyKey)} onClick={() => send('task-stop', task.mode)} className="rounded-md border border-[#f0d0d3] px-2 py-1 text-[11px] font-semibold text-[#f4212e] disabled:opacity-40 dark:border-[#354438]">{taskBusy ? '…' : '停止'}</button>
                        </div> : null}
                      </div>
                    </li>
                  })}
                </ul>
              </section>
            })}
          </div>
        </div> : <p className="m-0 text-[#697268] dark:text-gray-400">{device.telemetry ? '当前没有任务状态快照' : '插件尚未上报任务状态；请更新到支持远程操控的版本并配置回执密钥。'}</p>}
        {commands.length ? <div className="mt-4">
          <h4 className="m-0 text-[12px] font-semibold text-[#273228] dark:text-gray-100">最近指令回执</h4>
          <ul className="mt-2 space-y-1.5 p-0 list-none">
            {commands.slice(0, 5).map((item) => {
              const [statusLabel, statusTone] = COMMAND_STATUS[item.status] || COMMAND_STATUS.pending
              return <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#e5e9e2] bg-white px-3 py-2 text-[12px] dark:border-[#263142] dark:bg-[#0d141c]">
                <span className="font-medium text-[#273228] dark:text-gray-100">{COMMAND_LABEL[item.command] || item.command}{item.modeLabel ? ` · ${item.modeLabel}` : ''}</span>
                <StatusPill size="sm" tone={statusTone}>{statusLabel}</StatusPill>
                <span className="text-[#7a8479] dark:text-gray-400">{time(item.finishedAt || item.claimedAt || item.createdAt)}</span>
                {item.result ? <span className="w-full text-[#536471] dark:text-gray-400">{item.result}</span> : null}
              </li>
            })}
          </ul>
        </div> : null}
      </> : <p className="m-0 text-[#697268] dark:text-gray-400">此平台上报设备心跳和动作回执，暂无任务运行阶段数据。</p>}
      <dl className="mb-0 mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-[#7a8479] dark:text-gray-400">最近确认动作</dt><dd className="m-0 mt-1">{device.lastAction ? `${time(device.lastAction.occurred_at)} · ${device.lastAction.taskLabel}` : '近 7 天无回执'}</dd></div><div><dt className="text-[#7a8479] dark:text-gray-400">最近失败或受限</dt><dd className="m-0 mt-1">{device.lastFailure ? `${time(device.lastFailure.occurred_at)} · ${device.lastFailure.taskLabel} · ${device.lastFailure.error_code || device.lastFailure.result}` : '近 7 天无异常回执'}</dd></div></dl>
      {quiet ? <p className="mb-0 mt-3 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">任务声明运行中，但近 30 分钟没有确认动作。可检查插件任务页是否在等待或受阻。</p> : null}
    </div>
  </details>
}

export default function PluginMonitorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedPlatform = searchParams.get('platform') || 'x'
  const platform = PLATFORMS.some((item) => item.id === requestedPlatform) ? requestedPlatform : 'x'
  const [selectedDate, setSelectedDate] = useState(todayInShanghai)
  const [offset, setOffset] = useState(0)
  const [reportOffset, setReportOffset] = useState(0)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showOlderDevices, setShowOlderDevices] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [commandNote, setCommandNote] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const lastFullRefreshAt = useRef(0)

  const refresh = useCallback(async (showLoading = false, liveOnly = false) => {
    if (document.hidden && !showLoading) return
    const id = ++requestId.current
    if (showLoading) setLoading(true)
    if (!liveOnly) lastFullRefreshAt.current = Date.now()
    try {
      const query = new URLSearchParams({ platform, date: selectedDate, offset: String(offset), reportOffset: String(reportOffset) })
      if (liveOnly) query.set('view', 'live')
      const response = await fetch(`/api/admin/community-actions/monitor?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null
      if (!response.ok) throw new Error(payload?.error === 'MIGRATION_REQUIRED' ? '数据库迁移尚未应用' : payload?.error === 'MONITOR_READ_FAILED' ? '监控接口暂时不可用' : payload?.error || `监控接口返回 HTTP ${response.status}`)
      if (!payload || typeof payload !== 'object') throw new Error('监控接口返回了非 JSON 数据')
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
  }, [platform, selectedDate, offset, reportOffset])

  const sendCommand = useCallback(async ({ deviceId, command, mode = '' }) => {
    const key = `${deviceId}:${command}:${mode || ''}`
    setBusyKey(key)
    setCommandNote('')
    try {
      const response = await fetch('/api/admin/community-actions/monitor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceId, command, mode }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error === 'MIGRATION_REQUIRED' ? '请先执行迁移 0120_x_extension_commands.sql' : payload?.error || `指令下发失败（HTTP ${response.status}）`)
      }
      setCommandNote(`${COMMAND_LABEL[command] || command}${mode ? ` · ${MODE_LABEL[mode] || mode}` : ''} 已排队，等待插件心跳执行`)
      await refresh(false, true)
    } catch (issue) {
      setCommandNote(issue.message || '指令下发失败')
    } finally {
      setBusyKey('')
    }
  }, [refresh])

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
  const changePlatform = (nextPlatform) => {
    if (nextPlatform === platform) return
    setOffset(0)
    setReportOffset(0)
    setShowAllTasks(false)
    setShowOlderDevices(false)
    router.replace(`/admin/community-actions/monitor?platform=${nextPlatform}`, { scroll: false })
  }
  const visibleData = data?.platform === platform && data?.selectedDate === selectedDate ? data : null
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
  const recentActionDevices = devices.filter((device) => device.lastAction).length
  const successes = tasks.reduce((sum, task) => sum + task.success, 0)
  const issues = tasks.reduce((sum, task) => sum + task.failed + task.limited, 0)
  const dailyTotal = tasks.reduce((sum, task) => sum + task.success + task.failed + task.skipped + task.limited, 0)
  const minDate = visibleData?.minDate || adjacentDate(todayInShanghai(), -365)
  const maxDate = visibleData?.maxDate || todayInShanghai()

  return <AdminPage title="插件监控" description="按平台查看设备心跳、四类功能实时状态、远程启停、确认回执与趋势。X 状态约每 1 分钟心跳同步，任务变更会立即上报；页面每 15 秒刷新，隐藏时暂停。" actions={<><AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton><AdminButton onClick={() => refresh(true)} size="sm" variant="primary" disabled={loading}>刷新数据</AdminButton></>}>
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="选择插件平台">{PLATFORMS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={platform === item.id} onClick={() => changePlatform(item.id)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${platform === item.id ? 'border-[#37624b] bg-[#37624b] text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#101820]' : 'border-[#d7dfd5] text-[#4e5b50] hover:border-[#77977e] dark:border-[#354438] dark:text-gray-300'}`}>{item.label}</button>)}</div>
    {error ? <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">读取失败：{error}。请刷新重试。</p> : null}
    {commandNote ? <p role="status" className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">{commandNote}</p> : null}
    {platform === 'x' && visibleData?.migrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0115_x_extension_runtime.sql；动作回执仍可继续接收。</p> : null}
    {visibleData?.countsMigrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 {platform === 'x' ? '0117_community_action_daily_counts.sql' : '0118_community_action_all_platform_counts.sql'}；历史统计暂不可用，实时状态与回执明细仍可查看。</p> : null}

    <Section title="设备状态" description="按最近心跳显示插件实例；X 平台同步四类功能状态，并可远程全流程启动 / 暂停或单项启停。在线表示 5 分钟内收到心跳。" actions={<span className="text-[12px] text-[#7a8479] dark:text-gray-400">更新于 {time(visibleData?.now)}</span>}>
      <dl className="-mx-4 -mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5"><Metric label="在线实例" value={loading && !visibleData ? '—' : online} detail="5 分钟内有心跳" /><Metric label={platform === 'x' ? '运行中' : '近 7 天有回执'} value={loading && !visibleData ? '—' : platform === 'x' ? running : recentActionDevices} detail={platform === 'x' ? '插件声明的任务状态' : '有确认动作的实例'} tone="success" /><Metric label="较早记录" value={loading && !visibleData ? '—' : olderDevices.length} detail="默认收起，可按需展开" /></dl>
      {devices.length ? <div className="-mx-4 -mb-4 md:-mx-5">{recentDevices.map((device) => <DeviceRow key={device.id} device={device} now={visibleData.now} platform={platform} onCommand={sendCommand} busyKey={busyKey} />)}{olderDevices.length ? <><button type="button" onClick={() => setShowOlderDevices((value) => !value)} aria-expanded={showOlderDevices} className="w-full border-t border-[#e5e9e2] px-4 py-3 text-left text-[12px] font-medium text-[#48634b] hover:bg-[#f7faf6] dark:border-[#263142] dark:text-emerald-300 dark:hover:bg-[#141d26]">{showOlderDevices ? '收起较早记录' : `查看较早记录（${olderDevices.length} 条）`}</button>{showOlderDevices ? olderDevices.map((device) => <DeviceRow key={device.id} device={device} now={visibleData.now} platform={platform} onCommand={sendCommand} busyKey={busyKey} />) : null}</> : null}</div> : <div className="pt-4"><EmptyState title={loading ? '正在读取插件实例' : '还没有插件实例'} description={loading ? '请稍候。' : '在插件中配置回执密钥并保持浏览器运行；首次上报后会出现。'} /></div>}
      <p className="mb-0 mt-4 text-[12px] leading-5 text-[#7a8479] dark:text-gray-400">离线请检查浏览器、扩展、密钥与网络。{platform === 'x' ? '远程指令依赖插件心跳；请先执行迁移 0120_x_extension_commands.sql，并更新到支持远程操控的本地扩展。' : '此平台目前只上报心跳和动作回执。'}</p>
    </Section>

    <Section title="最近 14 天动作趋势" description="按北京时间统计确认回执。点击柱形，查看该日期的单日明细。" className="mt-5">
      {data?.platform === platform && !data.countsMigrationRequired ? <PluginMonitorTrend days={data.trend || []} tasks={data.tasks || []} selectedDate={selectedDate} onDateChange={changeDate} /> : <EmptyState title={data?.platform === platform && data.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取动作趋势' : '暂无趋势数据'} description={data?.platform === platform && data.countsMigrationRequired ? '应用页面提示的数据库迁移后查看趋势。' : loading ? '请稍候。' : '请刷新重试。'} />}
    </Section>

    <Section title={`${selectedDate} · 单日明细`} description={platform === 'x' ? '以下统计、任务结果和回执均属于所选北京时间日期；自动同步日报单独列出。' : '以下统计、任务结果和回执均属于所选北京时间日期。'} className="mt-5" actions={<div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, -1))} disabled={selectedDate <= minDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="前一天">←</button><input type="date" aria-label="选择单日明细日期" value={selectedDate} min={minDate} max={maxDate} onChange={(event) => changeDate(event.target.value)} className="rounded-md border border-[#d7dfd5] bg-white px-2.5 py-1.5 text-[13px] text-[#273228] dark:border-[#354438] dark:bg-[#101820] dark:text-gray-100" /><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, 1))} disabled={selectedDate >= maxDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="后一天">→</button><AdminButton size="sm" variant="ghost" onClick={() => changeDate(todayInShanghai())} disabled={selectedDate === maxDate}>今天</AdminButton></div>}>
      <dl className="-mx-4 -mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5"><Metric label="确认成功" value={!visibleData || visibleData.countsMigrationRequired ? '—' : successes} detail="回执去重后的动作" tone="success" /><Metric label="失败 / 受限" value={!visibleData || visibleData.countsMigrationRequired ? '—' : issues} detail="需要查看明细" tone={issues ? 'warning' : 'default'} /><Metric label="回执总数" value={!visibleData || visibleData.countsMigrationRequired ? '—' : dailyTotal} detail="含成功、失败、受限和跳过" /></dl>
      <div className="mt-5 flex items-center justify-between gap-3"><div><h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">任务结果</h3><p className="mb-0 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">确认回执按任务聚合；默认隐藏没有动作的任务。</p></div>{activeTasks.length && activeTasks.length < tasks.length ? <button type="button" onClick={() => setShowAllTasks((value) => !value)} className="shrink-0 text-[12px] font-medium text-emerald-700 hover:underline dark:text-emerald-300">{showAllTasks ? '隐藏空任务' : `显示全部 ${tasks.length} 项`}</button> : null}</div>
      {shownTasks.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">任务</th><th className="py-2 text-right font-medium">成功</th><th className="py-2 text-right font-medium">失败</th><th className="py-2 text-right font-medium">跳过</th><th className="py-2 text-right font-medium">受限</th></tr></thead><tbody>{shownTasks.map((task) => <tr key={task.task} className="border-t border-[#e5e9e2] dark:border-[#263142]"><th scope="row" className="py-2.5 font-medium text-[#273228] dark:text-gray-100">{task.label}</th><td className="py-2.5 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{task.success}</td><td className="py-2.5 text-right tabular-nums">{task.failed}</td><td className="py-2.5 text-right tabular-nums">{task.skipped}</td><td className="py-2.5 text-right tabular-nums">{task.limited}</td></tr>)}</tbody></table></div> : <div className="mt-3"><EmptyState title={visibleData?.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取任务结果' : '这一天没有确认动作'} description={visibleData?.countsMigrationRequired ? '动作回执仍可在下方查看；请先应用数据库迁移。' : loading ? '请稍候。' : '选择其他日期，或等待插件上报动作回执。'} /></div>}
    </Section>

    {platform === 'x' ? <Section title={`${selectedDate} · 自动同步日报`} description="插件本地确认成功的动作计数，经心跳与每日 09:00 定时任务自动写入；与确认回执是两份独立记录。" className="mt-5">
      {visibleData?.dailyMigrationRequired ? <p role="alert" className="mb-3 text-[12px] text-amber-700 dark:text-amber-300">请先应用数据库迁移 0112_x_extension_daily_reports.sql。</p> : null}
      {reports.length ? <div className="overflow-hidden rounded-2xl border border-[#d7e3f4] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)] dark:border-[#263142] dark:bg-[#0d141c]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e8eef5] px-4 py-3 dark:border-[#263142]">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">Daily Sync</p>
            <p className="mb-0 mt-1 text-[12px] text-[#536471] dark:text-gray-400">与插件面板「每日报告」同一套计数；无需手动上传或拉取。</p>
          </div>
          <StatusPill size="sm" tone="info">自动</StatusPill>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          {reports.map((report) => (
            <article key={`${report.deviceId}:${report.accountHandle}`} className="border-t border-[#e8eef5] px-4 py-3 sm:border-r sm:odd:border-r dark:border-[#263142] sm:[&:nth-child(2n)]:border-r-0">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-[13px] font-semibold text-[#0f1419] dark:text-gray-100">{report.accountHandle ? `@${report.accountHandle}` : '账号未识别'}</h3>
                  <p className="mb-0 mt-0.5 text-[11px] text-[#536471] dark:text-gray-400">设备 {report.deviceId.slice(0, 12)}… · 同步于 {time(report.uploadedAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  ['评论', report.comments],
                  ['点赞', report.likes],
                  ['关注', report.follows],
                  ['取关', report.unfollows],
                  ['回关', report.followBacks],
                  ['发帖', report.posts]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#eef3f8] bg-[#f8fbff] px-2 py-2 text-center dark:border-[#263142] dark:bg-[#101820]">
                    <p className="m-0 text-[10px] text-[#536471] dark:text-gray-400">{label}</p>
                    <p className="mb-0 mt-0.5 text-[14px] font-semibold tabular-nums text-[#0f1419] dark:text-gray-100">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div> : <EmptyState title={loading ? '正在读取每日报告' : '这一天还没有同步报告'} description={loading ? '请稍候。' : '配置回执密钥并保持浏览器运行后，插件会按心跳与每日 09:00 自动同步。'} />}
      <AdminPagination total={visibleData?.reportTotal || 0} offset={reportOffset} limit={visibleData?.reportLimit || 20} loading={loading} onOffsetChange={setReportOffset} />
    </Section> : null}

    <Section title={`${selectedDate} · 动作明细`} description="所选日期的确认回执；不保存正文、Cookie 或模型密钥。" className="mt-5">
      {events.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">时间</th><th className="font-medium">账号</th><th className="font-medium">任务</th><th className="font-medium">结果</th><th className="font-medium">错误码</th><th className="font-medium">目标</th></tr></thead><tbody>{events.map((event) => { const [label, tone] = RESULT[event.result] || [event.result, 'neutral']; return <tr key={event.id} className="border-t border-[#e5e9e2] dark:border-[#263142]"><td className="whitespace-nowrap py-2.5">{time(event.occurredAt)}</td><td>{event.accountHandle ? `@${event.accountHandle}` : '—'}</td><td>{event.taskLabel}</td><td><StatusPill tone={tone} size="sm">{label}</StatusPill></td><td className="text-[#7a8479] dark:text-gray-400">{event.errorCode || '—'}</td><td className="max-w-[16rem] truncate text-[#7a8479] dark:text-gray-400" title={event.targetId || ''}>{event.targetId || '—'}</td></tr> })}</tbody></table></div> : <EmptyState title={loading ? '正在读取动作明细' : '这一天没有动作明细'} description={loading ? '请稍候。' : '选择其他日期，或等待插件确认动作后上报。'} />}
      <AdminPagination total={visibleData?.eventTotal || 0} offset={offset} limit={visibleData?.limit || 20} loading={loading} onOffsetChange={setOffset} />
    </Section>
  </AdminPage>
}

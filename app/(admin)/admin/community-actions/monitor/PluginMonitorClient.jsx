'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X_RUNTIME_MODE_LABELS } from '../../../../../lib/community/xExtensionMonitorShared'
import { AdminButton, AdminPage, AdminPagination, EmptyState, Section, StatusPill } from '../../../components/ui'
import PluginMonitorTrend from './PluginMonitorTrend'
import XPluginStatusDeck from './XPluginStatusDeck'

const MODE_LABEL = X_RUNTIME_MODE_LABELS
const PHASE = { running: ['运行中', 'info'], paused: ['等待中', 'warning'], stopping: ['等待中', 'warning'], idle: ['已停止', 'neutral'], online: ['有心跳', 'info'], unknown: ['需处理', 'warning'], offline: ['离线', 'danger'] }
const COMMAND_LABEL = { 'flow-start': '全流程启动', 'flow-pause': '暂停全部', 'task-start': '启动任务', 'task-stop': '停止任务', 'ext-update': '远程更新插件' }
const RESULT = { success: ['成功', 'success'], failed: ['失败', 'danger'], skipped: ['跳过', 'neutral'], limited: ['受限', 'warning'] }
const PLATFORMS = [{ id: 'x', label: 'X' }, { id: 'xhs', label: '小红书' }, { id: 'juejin', label: '掘金' }]
const DEFAULT_X_ACCOUNT = 'tarsixseveneig1'
const LIVE_POLL_INTERVAL_MS = 10_000
const FULL_REFRESH_INTERVAL_MS = 60_000
const time = (value) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'
const todayInShanghai = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const adjacentDate = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
const cleanAccount = (value) => String(value || '').replace(/^@+/u, '').trim()
const resolveAccount = (platform, value) => {
  const handle = cleanAccount(value)
  if (platform === 'x') return handle || DEFAULT_X_ACCOUNT
  return handle
}

function Metric({ label, value, detail, tone = 'default' }) {
  const color = tone === 'success' ? 'text-emerald-700 dark:text-emerald-300' : tone === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-[#232920] dark:text-gray-100'
  return <div className="min-w-0 px-4 py-3">
    <dt className="text-[12px] text-[#697268] dark:text-gray-400">{label}</dt>
    <dd className={`m-0 mt-1 text-[1.65rem] font-semibold tabular-nums leading-none ${color}`}>{value}</dd>
    <p className="mb-0 mt-1.5 text-[11px] text-[#81897f] dark:text-gray-500">{detail}</p>
  </div>
}

function SimpleDeviceRow({ device }) {
  const [label, tone] = PHASE[device.phase] || PHASE.unknown
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5e9e2] px-4 py-3.5 first:border-t-0 dark:border-[#263142]">
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[14px] font-semibold text-[#273228] dark:text-gray-100">{device.accountHandle ? `@${device.accountHandle}` : '未识别账号'}</span>
      <span className="mt-0.5 block text-[12px] text-[#7a8479] dark:text-gray-400">插件实例 {device.id.slice(0, 12)}… · v{device.extensionVersion || '未知'}</span>
    </span>
    <span className="text-[12px] text-[#697268] dark:text-gray-400">心跳 {time(device.lastSeenAt)}</span>
    <StatusPill size="sm" tone={tone}>{label}</StatusPill>
  </div>
}

export default function PluginMonitorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedPlatform = searchParams.get('platform') || 'x'
  const platform = PLATFORMS.some((item) => item.id === requestedPlatform) ? requestedPlatform : 'x'
  const account = resolveAccount(platform, searchParams.get('account'))
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

  const writeQuery = useCallback((next = {}) => {
    const query = new URLSearchParams()
    const nextPlatform = next.platform || platform
    const nextAccount = resolveAccount(nextPlatform, next.account !== undefined ? next.account : account)
    if (nextPlatform !== 'x') query.set('platform', nextPlatform)
    if (nextAccount) query.set('account', nextAccount)
    const suffix = query.toString()
    router.replace(`/admin/community-actions/monitor${suffix ? `?${suffix}` : ''}`, { scroll: false })
  }, [account, platform, router])

  const refresh = useCallback(async (showLoading = false, liveOnly = false) => {
    if (document.hidden && !showLoading) return
    const id = ++requestId.current
    if (showLoading) setLoading(true)
    if (!liveOnly) lastFullRefreshAt.current = Date.now()
    try {
      const query = new URLSearchParams({ platform, date: selectedDate, offset: String(offset), reportOffset: String(reportOffset) })
      if (account) query.set('account', account)
      if (liveOnly) query.set('view', 'live')
      const response = await fetch(`/api/admin/community-actions/monitor?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null
      if (!response.ok) throw new Error(payload?.error === 'MIGRATION_REQUIRED' ? '数据库迁移尚未应用' : payload?.error === 'MONITOR_READ_FAILED' ? '监控接口暂时不可用' : payload?.error || `监控接口返回 HTTP ${response.status}`)
      if (!payload || typeof payload !== 'object') throw new Error('监控接口返回了非 JSON 数据')
      if (id !== requestId.current) return
      if (liveOnly) {
        setData((current) => current ? { ...current, now: payload.now, devices: payload.devices, accounts: payload.accounts || current.accounts, accountHandle: payload.accountHandle ?? current.accountHandle, latestExtensionVersion: payload.latestExtensionVersion || current.latestExtensionVersion, migrationRequired: payload.migrationRequired } : current)
      } else {
        setData(payload)
      }
      setError('')
    } catch (issue) {
      if (id === requestId.current) setError(issue.message || '监控读取失败')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [account, platform, selectedDate, offset, reportOffset])

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
    writeQuery({ platform: nextPlatform, account: nextPlatform === 'x' ? DEFAULT_X_ACCOUNT : '' })
  }
  const changeAccount = (nextAccount) => {
    const handle = resolveAccount(platform, nextAccount)
    if (handle === account) return
    setOffset(0)
    setReportOffset(0)
    setShowAllTasks(false)
    setShowOlderDevices(false)
    writeQuery({ account: handle })
  }
  const visibleData = data?.platform === platform && data?.selectedDate === selectedDate && (account === '__all__' ? !data?.accountHandle : data?.accountHandle === account) ? data : null
  const accountOptions = [...new Set([...(visibleData?.accounts || (data?.platform === platform ? data.accounts : []) || []), account].filter((item) => item && item !== '__all__'))]
  const accountTabs = [{ value: platform === 'x' ? '__all__' : '', label: '全部账号' }, ...accountOptions.map((handle) => ({ value: handle, label: `@${handle}` }))]
  const deviceAccount = account === '__all__' ? '' : account
  const devices = (visibleData?.devices || []).filter((device) => !deviceAccount || device.accountHandle?.toLowerCase() === deviceAccount.toLowerCase())
  const recentDevices = devices.slice(0, 3)
  const olderDevices = devices.slice(3)
  const tasks = visibleData?.tasks || []
  const activeTasks = tasks.filter((task) => task.success + task.failed + task.skipped + task.limited > 0)
  const shownTasks = showAllTasks ? tasks : activeTasks
  const reports = visibleData?.reportOffset === reportOffset ? visibleData.dailyReports : []
  const events = visibleData?.offset === offset ? visibleData.events : []
  const online = devices.filter((device) => device.online).length
  const running = devices.filter((device) => device.phase === 'running').length
  const updateable = devices.filter((device) => device.online && device.updateAvailable).length
  const recentActionDevices = devices.filter((device) => device.lastAction).length
  const successes = tasks.reduce((sum, task) => sum + task.success, 0)
  const issues = tasks.reduce((sum, task) => sum + task.failed + task.limited, 0)
  const dailyTotal = tasks.reduce((sum, task) => sum + task.success + task.failed + task.skipped + task.limited, 0)
  const minDate = visibleData?.minDate || adjacentDate(todayInShanghai(), -365)
  const maxDate = visibleData?.maxDate || todayInShanghai()
  const accountLabel = account && account !== '__all__' ? `@${account}` : '全部账号'
  const latestVersion = visibleData?.latestExtensionVersion || data?.latestExtensionVersion
  const pageDescription = platform === 'x'
    ? '状态监控对齐本地排班台（约 10 秒刷新）；数据板块含今日统计与趋势（约 1 分钟刷新）。'
    : '按平台和账号查看设备心跳与动作回执。页面约 10 秒刷新状态，约 1 分钟刷新统计。'

  const accountSwitcher = accountTabs.length > 1 ? (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="选择插件账号">
      {accountTabs.map((item) => (
        <button key={item.value || '__all__'} type="button" role="tab" aria-selected={account === item.value} onClick={() => changeAccount(item.value)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${account === item.value ? 'border-[#37624b] bg-[#37624b] text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#101820]' : 'border-[#d7dfd5] text-[#4e5b50] hover:border-[#77977e] dark:border-[#354438] dark:text-gray-300'}`}>
          {item.label}
        </button>
      ))}
    </div>
  ) : null

  const dataSections = (
    <>
      <Section title="最近 14 天动作趋势" description={`${accountLabel} · 按北京时间统计确认回执。点击柱形，查看该日期的单日明细。`} className="mt-5">
        {visibleData && !visibleData.countsMigrationRequired ? <PluginMonitorTrend days={visibleData.trend || []} tasks={visibleData.tasks || []} selectedDate={selectedDate} onDateChange={changeDate} /> : <EmptyState title={visibleData?.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取动作趋势' : '暂无趋势数据'} description={visibleData?.countsMigrationRequired ? '应用页面提示的数据库迁移后查看趋势。' : loading ? '请稍候。' : '请刷新重试。'} />}
      </Section>

      <Section title={`${selectedDate} · 单日明细`} description={`${accountLabel} · ${platform === 'x' ? '以下统计、任务结果和回执均属于所选北京时间日期；自动同步日报单独列出。' : '以下统计、任务结果和回执均属于所选北京时间日期。'}`} className="mt-5" actions={<div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, -1))} disabled={selectedDate <= minDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="前一天">←</button><input type="date" aria-label="选择单日明细日期" value={selectedDate} min={minDate} max={maxDate} onChange={(event) => changeDate(event.target.value)} className="rounded-md border border-[#d7dfd5] bg-white px-2.5 py-1.5 text-[13px] text-[#273228] dark:border-[#354438] dark:bg-[#101820] dark:text-gray-100" /><button type="button" onClick={() => changeDate(adjacentDate(selectedDate, 1))} disabled={selectedDate >= maxDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="后一天">→</button><AdminButton size="sm" variant="ghost" onClick={() => changeDate(todayInShanghai())} disabled={selectedDate === maxDate}>今天</AdminButton></div>}>
        <dl className="-mx-4 -mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5"><Metric label="确认成功" value={!visibleData || visibleData.countsMigrationRequired ? '—' : successes} detail="回执去重后的动作" tone="success" /><Metric label="失败 / 受限" value={!visibleData || visibleData.countsMigrationRequired ? '—' : issues} detail="需要查看明细" tone={issues ? 'warning' : 'default'} /><Metric label="回执总数" value={!visibleData || visibleData.countsMigrationRequired ? '—' : dailyTotal} detail="含成功、失败、受限和跳过" /></dl>
        <div className="mt-5 flex items-center justify-between gap-3"><div><h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">任务结果</h3><p className="mb-0 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">确认回执按任务聚合；默认隐藏没有动作的任务。</p></div>{activeTasks.length && activeTasks.length < tasks.length ? <button type="button" onClick={() => setShowAllTasks((value) => !value)} className="shrink-0 text-[12px] font-medium text-emerald-700 hover:underline dark:text-emerald-300">{showAllTasks ? '隐藏空任务' : `显示全部 ${tasks.length} 项`}</button> : null}</div>
        {shownTasks.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">任务</th><th className="py-2 text-right font-medium">成功</th><th className="py-2 text-right font-medium">失败</th><th className="py-2 text-right font-medium">跳过</th><th className="py-2 text-right font-medium">受限</th></tr></thead><tbody>{shownTasks.map((task) => <tr key={task.task} className="border-t border-[#e5e9e2] dark:border-[#263142]"><th scope="row" className="py-2.5 font-medium text-[#273228] dark:text-gray-100">{task.label}</th><td className="py-2.5 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{task.success}</td><td className="py-2.5 text-right tabular-nums">{task.failed}</td><td className="py-2.5 text-right tabular-nums">{task.skipped}</td><td className="py-2.5 text-right tabular-nums">{task.limited}</td></tr>)}</tbody></table></div> : <div className="mt-3"><EmptyState title={visibleData?.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取任务结果' : '这一天没有确认动作'} description={visibleData?.countsMigrationRequired ? '动作回执仍可在下方查看；请先应用数据库迁移。' : loading ? '请稍候。' : '选择其他日期，或等待插件上报动作回执。'} /></div>}
      </Section>

      {platform === 'x' ? <Section title={`${selectedDate} · 自动同步日报`} description={`${accountLabel} · 插件本地确认成功的动作计数，经心跳与每日 09:00 定时任务自动写入；与确认回执是两份独立记录。`} className="mt-5">
        {visibleData?.dailyMigrationRequired ? <p role="alert" className="mb-3 text-[12px] text-amber-700 dark:text-amber-300">日报表结构待升级：请应用 0126_x_extension_daily_report_prunes.sql 与 0127_x_extension_daily_report_comment_splits.sql（旧迁移 0112 / 0119 也需已执行）。未升级前仍可读合计，评论拆分为 0。</p> : null}
        {reports.length ? <div className="overflow-hidden rounded-2xl border border-[#d7e3f4] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)] dark:border-[#263142] dark:bg-[#0d141c]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8eef5] px-4 py-3 dark:border-[#263142]">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">Daily Sync</p>
              <p className="mb-0 mt-1 text-[12px] text-[#536471] dark:text-gray-400">与插件面板「每日报告」同一套计数；评论拆成评论首页 / 评论回复 / 评论大V。</p>
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
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-5">
                  {[
                    ['评论合计', report.comments],
                    ['评论首页', report.timelineComments],
                    ['评论回复', report.notificationComments],
                    ['评论大V', report.kolComments],
                    ['点赞', report.likes],
                    ['关注（含回关）', report.follows + report.followBacks],
                    ['取关', report.unfollows],
                    ['其中回关', report.followBacks],
                    ['发帖', report.posts],
                    ['删帖', report.prunes]
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

      <Section title={`${selectedDate} · 动作明细`} description={`${accountLabel} · 所选日期的确认回执；不保存正文、Cookie 或模型密钥。`} className="mt-5">
        {events.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-[13px]"><thead className="text-[12px] text-[#7a8479] dark:text-gray-400"><tr><th className="py-2 font-medium">时间</th><th className="font-medium">任务</th><th className="font-medium">结果</th><th className="font-medium">错误码</th><th className="font-medium">目标</th></tr></thead><tbody>{events.map((event) => { const [label, tone] = RESULT[event.result] || [event.result, 'neutral']; return <tr key={event.id} className="border-t border-[#e5e9e2] dark:border-[#263142]"><td className="whitespace-nowrap py-2.5">{time(event.occurredAt)}</td><td>{event.taskLabel}</td><td><StatusPill tone={tone} size="sm">{label}</StatusPill></td><td className="text-[#7a8479] dark:text-gray-400">{event.errorCode || '—'}</td><td className="max-w-[16rem] truncate text-[#7a8479] dark:text-gray-400" title={event.targetId || ''}>{event.targetId || '—'}</td></tr> })}</tbody></table></div> : <EmptyState title={loading ? '正在读取动作明细' : '这一天没有动作明细'} description={loading ? '请稍候。' : '选择其他日期，或等待插件确认动作后上报。'} />}
        <AdminPagination total={visibleData?.eventTotal || 0} offset={offset} limit={visibleData?.limit || 20} loading={loading} onOffsetChange={setOffset} />
      </Section>
    </>
  )

  return <AdminPage title="插件监控" description={pageDescription} actions={<><AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton><AdminButton onClick={() => refresh(true)} size="sm" variant="primary" disabled={loading}>刷新数据</AdminButton></>}>
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="选择插件平台">{PLATFORMS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={platform === item.id} onClick={() => changePlatform(item.id)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${platform === item.id ? 'border-[#37624b] bg-[#37624b] text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#101820]' : 'border-[#d7dfd5] text-[#4e5b50] hover:border-[#77977e] dark:border-[#354438] dark:text-gray-300'}`}>{item.label}</button>)}</div>
    </div>
    {error ? <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">读取失败：{error}。请刷新重试。</p> : null}
    {commandNote ? <p role="status" className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">{commandNote}</p> : null}
    {platform === 'x' && visibleData?.migrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0115_x_extension_runtime.sql；动作回执仍可继续接收。</p> : null}
    {visibleData?.countsMigrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 {platform === 'x' ? '0117_community_action_daily_counts.sql' : '0118_community_action_all_platform_counts.sql'}；历史统计暂不可用，实时状态与回执明细仍可查看。</p> : null}

    {platform === 'x' ? (
      <>
        <Section title="状态监控" description={`对齐本地十二项排班（含评论首页 / 评论回复 / 评论大V）：优先级 1～10 分，分值越大越重要。约 10 秒刷新；站点最新版 v${latestVersion || '—'}，落后实例可远程更新。`} actions={<span className="text-[12px] text-[#7a8479] dark:text-gray-400">更新于 {time(visibleData?.now)}</span>}>
          {accountSwitcher}
          <dl className={`-mx-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-4 md:-mx-5 ${accountTabs.length > 1 ? '' : '-mt-4'}`}>
            <Metric label="在线实例" value={loading && !visibleData ? '—' : online} detail="5 分钟内有心跳" />
            <Metric label="运行中" value={loading && !visibleData ? '—' : running} detail="排班或任务声明运行中" tone="success" />
            <Metric label="可更新" value={loading && !visibleData ? '—' : updateable} detail={`对照站点 v${latestVersion || '—'}`} tone={updateable ? 'warning' : 'default'} />
            <Metric label="较早记录" value={loading && !visibleData ? '—' : olderDevices.length} detail="默认收起，可按需展开" />
          </dl>
          {devices.length ? (
            <div className="-mx-4 -mb-4 md:-mx-5">
              {recentDevices.map((device) => (
                <XPluginStatusDeck key={device.id} device={device} now={visibleData.now} latestExtensionVersion={latestVersion} onCommand={sendCommand} busyKey={busyKey} />
              ))}
              {olderDevices.length ? (
                <>
                  <button type="button" onClick={() => setShowOlderDevices((value) => !value)} aria-expanded={showOlderDevices} className="w-full border-t border-[#e5e9e2] px-4 py-3 text-left text-[12px] font-medium text-[#48634b] hover:bg-[#f7faf6] dark:border-[#263142] dark:text-emerald-300 dark:hover:bg-[#141d26]">
                    {showOlderDevices ? '收起较早记录' : `查看较早记录（${olderDevices.length} 条）`}
                  </button>
                  {showOlderDevices ? olderDevices.map((device) => (
                    <XPluginStatusDeck key={device.id} device={device} now={visibleData.now} latestExtensionVersion={latestVersion} onCommand={sendCommand} busyKey={busyKey} />
                  )) : null}
                </>
              ) : null}
            </div>
          ) : (
            <div className="pt-4"><EmptyState title={loading ? '正在读取插件实例' : '该账号还没有插件实例'} description={loading ? '请稍候。' : '在插件中配置回执密钥并保持浏览器运行；首次上报后会出现。'} /></div>
          )}
          <p className="mb-0 mt-4 text-[12px] leading-5 text-[#7a8479] dark:text-gray-400">每台实例顶部固定显示「插件版本」条。落后时可远程更新；已是最新也会显示状态，不会再把入口藏起来。远程启停与更新都依赖心跳（通常 1 分钟内）。</p>
        </Section>

        <div className="mt-8 border-t border-[#e5e9e2] pt-6 dark:border-[#263142]">
          <div className="mb-4">
            <h2 className="m-0 text-[1.15rem] font-semibold text-[#273228] dark:text-gray-100">数据</h2>
            <p className="mb-0 mt-1 text-[13px] text-[#697268] dark:text-gray-400">{accountLabel} · 今日统计、趋势、自动同步日报与动作明细；约 1 分钟全量刷新。</p>
          </div>
          {dataSections}
        </div>
      </>
    ) : (
      <>
        <Section title="设备状态" description="上方账号切换同时控制实例、趋势和单日明细。在线表示 5 分钟内有心跳。" actions={<span className="text-[12px] text-[#7a8479] dark:text-gray-400">更新于 {time(visibleData?.now)}</span>}>
          {accountSwitcher}
          <dl className={`-mx-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-b border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3 md:-mx-5 ${accountTabs.length > 1 ? '' : '-mt-4'}`}>
            <Metric label="在线实例" value={loading && !visibleData ? '—' : online} detail="5 分钟内有心跳" />
            <Metric label="近 7 天有回执" value={loading && !visibleData ? '—' : recentActionDevices} detail="有确认动作的实例" tone="success" />
            <Metric label="较早记录" value={loading && !visibleData ? '—' : olderDevices.length} detail="默认收起，可按需展开" />
          </dl>
          {devices.length ? (
            <div className="-mx-4 -mb-4 md:-mx-5">
              {recentDevices.map((device) => <SimpleDeviceRow key={device.id} device={device} />)}
              {olderDevices.length ? (
                <>
                  <button type="button" onClick={() => setShowOlderDevices((value) => !value)} aria-expanded={showOlderDevices} className="w-full border-t border-[#e5e9e2] px-4 py-3 text-left text-[12px] font-medium text-[#48634b] hover:bg-[#f7faf6] dark:border-[#263142] dark:text-emerald-300 dark:hover:bg-[#141d26]">
                    {showOlderDevices ? '收起较早记录' : `查看较早记录（${olderDevices.length} 条）`}
                  </button>
                  {showOlderDevices ? olderDevices.map((device) => <SimpleDeviceRow key={device.id} device={device} />) : null}
                </>
              ) : null}
            </div>
          ) : (
            <div className="pt-4"><EmptyState title={loading ? '正在读取插件实例' : '该账号还没有插件实例'} description={loading ? '请稍候。' : '在插件中配置回执密钥并保持浏览器运行；首次上报后会出现。'} /></div>
          )}
          <p className="mb-0 mt-4 text-[12px] leading-5 text-[#7a8479] dark:text-gray-400">此平台目前只上报心跳和动作回执。</p>
        </Section>
        {dataSections}
      </>
    )}
  </AdminPage>
}

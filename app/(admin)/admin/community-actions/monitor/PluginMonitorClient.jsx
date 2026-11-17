'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  describeXPluginSituation,
  selectXPluginSituationDevices,
  summarizeXTodayByCategory,
  X_RUNTIME_MODE_LABELS,
} from '../../../../../lib/community/xExtensionMonitorShared'
import { AdminButton, AdminPage, AdminPagination, EmptyState, Section, StatusPill } from '../../../components/ui'
import PluginMonitorTrend from './PluginMonitorTrend'
import XPluginStatusDeck from './XPluginStatusDeck'
import DistributionMonitor from './DistributionMonitor'
import PluginPicker, { ARCHIVED_PLUGIN_PLATFORMS } from './PluginPicker'

const MODE_LABEL = X_RUNTIME_MODE_LABELS
const COMMAND_LABEL = { 'flow-start': '全流程启动', 'flow-pause': '暂停全部', 'task-start': '启动任务', 'task-stop': '停止任务', 'ext-update': '远程更新插件', 'schedule-set': '排班' }
const RESULT = { success: ['成功', 'success'], failed: ['失败', 'danger'], skipped: ['跳过', 'neutral'], limited: ['受限', 'warning'] }
const DEFAULT_X_ACCOUNT = '__all__'
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

function ArchivedPluginRedirect({ platform }) {
  const label = platform === 'juejin' ? '掘金助手' : '小红书助手'
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
          <AdminButton href="/admin/community-actions/monitor?platform=x" variant="ghost">查看 X 综合监控</AdminButton>
        </div>
      </Section>
    </AdminPage>
  )
}

export default function PluginMonitorClient() {
  const params = useSearchParams()
  const platform = params.get('platform') || 'x'
  if (platform === 'ai-distributor') return <DistributionMonitor />
  if (ARCHIVED_PLUGIN_PLATFORMS.has(platform)) return <ArchivedPluginRedirect platform={platform} />
  return <XPluginMonitorClient />
}

function XPluginMonitorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = 'x'
  const account = resolveAccount(platform, searchParams.get('account'))
  const [selectedDate, setSelectedDate] = useState(todayInShanghai)
  const [offset, setOffset] = useState(0)
  const [reportOffset, setReportOffset] = useState(0)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [todayCategory, setTodayCategory] = useState('reply')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [commandNote, setCommandNote] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const writeQuery = useCallback((next = {}) => {
    const query = new URLSearchParams()
    const nextPlatform = next.platform || platform
    const nextAccount = resolveAccount(nextPlatform, next.account !== undefined ? next.account : account)
    if (nextPlatform !== 'x') query.set('platform', nextPlatform)
    if (nextAccount && nextAccount !== DEFAULT_X_ACCOUNT) query.set('account', nextAccount)
    const suffix = query.toString()
    router.replace(`/admin/community-actions/monitor${suffix ? `?${suffix}` : ''}`, { scroll: false })
  }, [account, platform, router])

  const refresh = useCallback(async (showLoading = false) => {
    const id = ++requestId.current
    if (showLoading) setLoading(true)
    try {
      const query = new URLSearchParams({ platform, date: selectedDate, offset: String(offset), reportOffset: String(reportOffset) })
      if (account) query.set('account', account)
      const response = await fetch(`/api/admin/community-actions/monitor?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null
      if (!response.ok) throw new Error(payload?.error === 'MIGRATION_REQUIRED' ? '数据库迁移尚未应用' : payload?.error === 'MONITOR_READ_FAILED' ? '监控接口暂时不可用' : payload?.error || `监控接口返回 HTTP ${response.status}`)
      if (!payload || typeof payload !== 'object') throw new Error('监控接口返回了非 JSON 数据')
      if (id !== requestId.current) return
      setData(payload)
      setError('')
    } catch (issue) {
      if (id === requestId.current) setError(issue.message || '监控读取失败')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [account, platform, selectedDate, offset, reportOffset])

  const sendCommand = useCallback(async ({ deviceId, command, mode = '', payload = null }) => {
    const key = `${deviceId}:${command}:${mode || ''}`
    setBusyKey(key)
    setCommandNote('')
    try {
      const response = await fetch('/api/admin/community-actions/monitor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceId, command, mode, ...(payload ? { payload } : {}) }),
        signal: AbortSignal.timeout(15000),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.error === 'MIGRATION_REQUIRED' ? '请先执行迁移 0120_x_extension_commands.sql' : body?.error || `指令下发失败（HTTP ${response.status}）`)
      }
      if (command === 'schedule-set') setCommandNote('排班已排队，等待插件写入本机')
      else if (command !== 'ext-update') setCommandNote(`${COMMAND_LABEL[command] || command}${mode ? ` · ${MODE_LABEL[mode] || mode}` : ''} 已排队，等待插件心跳执行`)
      void refresh(false)
      return { ...body, ok: true }
    } catch (issue) {
      if (command !== 'ext-update') setCommandNote(issue.message || '指令下发失败')
      return { ok: false, error: issue.message || '指令下发失败' }
    } finally {
      setBusyKey('')
    }
  }, [refresh])

  useEffect(() => {
    refresh(true)
    return () => { requestId.current += 1 }
  }, [refresh])

  const changeDate = (date) => { if (date) { setSelectedDate(date); setOffset(0); setReportOffset(0); setShowAllTasks(false) } }
  const changeAccount = (nextAccount) => {
    const handle = resolveAccount(platform, nextAccount)
    if (handle === account) return
    setOffset(0)
    setReportOffset(0)
    setShowAllTasks(false)
    writeQuery({ account: handle })
  }

  const visibleData = data?.platform === platform && data?.selectedDate === selectedDate && (account === '__all__' ? !data?.accountHandle : data?.accountHandle === account) ? data : null
  const accountOptions = [...new Set([...(visibleData?.accounts || (data?.platform === platform ? data.accounts : []) || []), account].filter((item) => item && item !== '__all__'))]
  const accountTabs = [{ value: '__all__', label: '全部账号' }, ...accountOptions.map((handle) => ({ value: handle, label: `@${handle}` }))]
  const deviceAccount = account === '__all__' ? '' : account
  const devices = (visibleData?.devices || []).filter((device) => !deviceAccount || device.accountHandle?.toLowerCase() === deviceAccount.toLowerCase())
  const fieldDevices = selectXPluginSituationDevices(devices)
  const tasks = visibleData?.tasks || []
  const todayCategories = summarizeXTodayByCategory(tasks)
  const activeToday = todayCategories.find((item) => item.id === todayCategory) || todayCategories[0]
  const activeTasks = tasks.filter((task) => task.success + task.failed + task.skipped + task.limited > 0)
  const shownTasks = showAllTasks ? tasks : activeTasks
  const reports = visibleData?.reportOffset === reportOffset ? visibleData.dailyReports : []
  const events = visibleData?.offset === offset ? visibleData.events : []
  const online = fieldDevices.filter((device) => device.online).length
  const running = fieldDevices.filter((device) => device.phase === 'running').length
  const updateable = fieldDevices.filter((device) => device.online && device.updateAvailable).length
  const successes = tasks.reduce((sum, task) => sum + task.success, 0)
  const issues = tasks.reduce((sum, task) => sum + task.failed + task.limited, 0)
  const dailyTotal = tasks.reduce((sum, task) => sum + task.success + task.failed + task.skipped + task.limited, 0)
  const minDate = visibleData?.minDate || adjacentDate(todayInShanghai(), -365)
  const maxDate = visibleData?.maxDate || todayInShanghai()
  const accountLabel = account && account !== '__all__' ? `@${account}` : '全部账号'
  const latestVersion = visibleData?.latestExtensionVersion || data?.latestExtensionVersion
  const situationLines = !visibleData
    ? [{ id: 'loading', line: '正在读取这个账号的插件状态。' }]
    : fieldDevices.length
      ? fieldDevices.map((device) => ({ id: device.id, line: describeXPluginSituation(device, visibleData.now || Date.now()) }))
      : [{ id: 'empty', line: account && account !== '__all__' ? `@${account}还没有上报过插件实例，现在看不到任务状态。` : '还没有上报过插件实例，现在看不到任务状态。' }]

  const accountSwitcher = (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="选择插件账号">
      {accountTabs.map((item) => (
        <button key={item.value || '__all__'} type="button" role="tab" aria-selected={account === item.value} onClick={() => changeAccount(item.value)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${account === item.value ? 'border-[#37624b] bg-[#37624b] text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#101820]' : 'border-[#d7dfd5] text-[#4e5b50] hover:border-[#77977e] dark:border-[#354438] dark:text-gray-300'}`}>
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <AdminPage
      title="插件监控"
      description="X 综合页对齐本地面板：今日、现场与按需明细。打开时拉取一次，之后手动刷新；适合半天集中看一次。"
      actions={(
        <>
          <AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton>
          <AdminButton onClick={() => refresh(true)} size="sm" variant="primary" disabled={loading}>刷新数据</AdminButton>
        </>
      )}
    >
      <PluginPicker selected={platform} />
      {error ? <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">读取失败：{error}。请刷新重试。</p> : null}
      {commandNote ? <p role="status" className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">{commandNote}</p> : null}
      {visibleData?.migrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0115_x_extension_runtime.sql；动作回执仍可继续接收。</p> : null}
      {visibleData?.countsMigrationRequired ? <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">请先执行迁移 0117_community_action_daily_counts.sql；历史统计暂不可用，实时状态与回执明细仍可查看。</p> : null}

      <Section
        title="综合"
        description={`${accountLabel} · 打开拉一次；远程启停与更新仍在下方现场卡。`}
        actions={<span className="text-[12px] text-[#7a8479] dark:text-gray-400">更新于 {time(visibleData?.now)}</span>}
      >
        {accountSwitcher}

        <div className="mb-4 rounded-2xl border border-[#cfe3d4] bg-[#f4faf5] px-4 py-3 dark:border-[#244238] dark:bg-[#10251f]">
          {situationLines.map((item) => (
            <p key={item.id} className="m-0 text-[15px] font-medium leading-7 text-[#1f3a2c] dark:text-emerald-100">{item.line}</p>
          ))}
          <p className="mb-0 mt-1 text-[12px] leading-5 text-[#5f7a68] dark:text-emerald-200/80">同一账号只看当前安装；被替换的离线旧实例不再展示。</p>
        </div>

        <dl className="-mx-4 grid grid-cols-2 divide-x divide-[#e5e9e2] border-y border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-4 md:-mx-5">
          <Metric label="在线实例" value={loading && !visibleData ? '—' : online} detail="5 分钟内有心跳" />
          <Metric label="运行中" value={loading && !visibleData ? '—' : running} detail="有任务正在执行" tone="success" />
          <Metric label="可更新" value={loading && !visibleData ? '—' : updateable} detail={`对照站点 v${latestVersion || '—'}`} tone={updateable ? 'warning' : 'default'} />
          <Metric label="今日确认成功" value={loading && !visibleData ? '—' : (visibleData?.countsMigrationRequired ? '—' : successes)} detail={selectedDate === todayInShanghai() ? '今天回执去重' : `${selectedDate} 成功数`} tone="success" />
        </dl>
      </Section>

      <Section
        title={selectedDate === todayInShanghai() ? '01 今日' : `01 ${selectedDate}`}
        description={`${accountLabel} · 六类合计对齐本地面板「今日大互动」；数字来自确认回执${selectedDate === todayInShanghai() ? '' : '（当前为明细所选日期）'}。`}
        className="mt-5"
      >
        {visibleData?.countsMigrationRequired ? (
          <EmptyState title="每日统计尚未就绪" description="应用页面提示的数据库迁移后查看今日分类。" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="tablist" aria-label="今日类别">
              {todayCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={activeToday?.id === category.id}
                  onClick={() => setTodayCategory(category.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${activeToday?.id === category.id ? 'border-[#4caf2a] bg-[rgba(76,175,42,0.1)] text-[#1f3a2c] dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-[#d7dfd5] bg-white text-[#4e5b50] hover:border-[#9fbf95] dark:border-[#354438] dark:bg-[#101820] dark:text-gray-300'}`}
                >
                  <span className="block text-[12px] font-medium">{category.label}</span>
                  <span className="mt-1 block text-[1.35rem] font-semibold tabular-nums leading-none">{loading && !visibleData ? '—' : category.success}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={`${activeToday?.label || ''}类任务`}>
              {(activeToday?.items || []).map((item) => (
                <div key={item.mode} className="min-w-[7.5rem] flex-1 rounded-xl border border-[#e5eee4] bg-[#fbfdfb] px-3 py-2 dark:border-[#263142] dark:bg-[#0d141c]">
                  <p className="m-0 text-[12px] text-[#697268] dark:text-gray-400">{item.label}</p>
                  <p className="mb-0 mt-1 text-[15px] font-semibold tabular-nums text-[#273228] dark:text-gray-100">{item.success}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section
        title="02 现场"
        description="远程启停、更新与排班台留在这里。每个账号只留当前安装；需要完整排班时再展开。"
        className="mt-5"
      >
        {fieldDevices.length ? (
          <div className="-mx-4 -mb-4 md:-mx-5">
            {fieldDevices.map((device) => (
              <XPluginStatusDeck key={device.id} compact device={device} now={visibleData.now} latestExtensionVersion={latestVersion} onCommand={sendCommand} busyKey={busyKey} />
            ))}
          </div>
        ) : (
          <EmptyState title={loading ? '正在读取插件实例' : '该账号还没有插件实例'} description={loading ? '请稍候。' : '在插件中配置回执密钥并保持浏览器运行；首次上报后会出现。'} />
        )}
      </Section>

      <Section
        title="03 明细与历史"
        description="趋势、单日任务表、自动同步日报与动作明细默认收起。"
        className="mt-5"
        actions={(
          <AdminButton size="sm" variant="ghost" onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen}>
            {detailsOpen ? '收起明细' : '展开明细'}
          </AdminButton>
        )}
      >
        {!detailsOpen ? (
          <p className="m-0 text-[13px] leading-6 text-[#697268] dark:text-gray-400">半天集中处理时再展开即可；不会自动轮询刷新。</p>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">最近 14 天动作趋势</h3>
              <p className="mb-3 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">{accountLabel} · 按北京时间统计确认回执。点击柱形，查看该日期的单日明细。</p>
              {visibleData && !visibleData.countsMigrationRequired ? <PluginMonitorTrend days={visibleData.trend || []} tasks={visibleData.tasks || []} selectedDate={selectedDate} onDateChange={changeDate} /> : <EmptyState title={visibleData?.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取动作趋势' : '暂无趋势数据'} description={visibleData?.countsMigrationRequired ? '应用页面提示的数据库迁移后查看趋势。' : loading ? '请稍候。' : '请刷新重试。'} />}
            </div>

            <div className="mb-5 border-t border-[#e5e9e2] pt-5 dark:border-[#263142]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">{selectedDate} · 单日明细</h3>
                  <p className="mb-0 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">{accountLabel} · 统计、任务结果和回执均属于所选北京时间日期。</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => changeDate(adjacentDate(selectedDate, -1))} disabled={selectedDate <= minDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="前一天">←</button>
                  <input type="date" aria-label="选择单日明细日期" value={selectedDate} min={minDate} max={maxDate} onChange={(event) => changeDate(event.target.value)} className="rounded-md border border-[#d7dfd5] bg-white px-2.5 py-1.5 text-[13px] text-[#273228] dark:border-[#354438] dark:bg-[#101820] dark:text-gray-100" />
                  <button type="button" onClick={() => changeDate(adjacentDate(selectedDate, 1))} disabled={selectedDate >= maxDate} className="rounded-md border border-[#d7dfd5] px-2.5 py-1.5 text-[12px] disabled:opacity-40 dark:border-[#354438]" aria-label="后一天">→</button>
                  <AdminButton size="sm" variant="ghost" onClick={() => changeDate(todayInShanghai())} disabled={selectedDate === maxDate}>今天</AdminButton>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 divide-x divide-[#e5e9e2] rounded-xl border border-[#e5e9e2] dark:divide-[#263142] dark:border-[#263142] sm:grid-cols-3">
                <Metric label="确认成功" value={!visibleData || visibleData.countsMigrationRequired ? '—' : successes} detail="回执去重后的动作" tone="success" />
                <Metric label="失败 / 受限" value={!visibleData || visibleData.countsMigrationRequired ? '—' : issues} detail="需要查看明细" tone={issues ? 'warning' : 'default'} />
                <Metric label="回执总数" value={!visibleData || visibleData.countsMigrationRequired ? '—' : dailyTotal} detail="含成功、失败、受限和跳过" />
              </dl>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">任务结果</h4>
                  <p className="mb-0 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">确认回执按任务聚合；默认隐藏没有动作的任务。</p>
                </div>
                {activeTasks.length && activeTasks.length < tasks.length ? <button type="button" onClick={() => setShowAllTasks((value) => !value)} className="shrink-0 text-[12px] font-medium text-emerald-700 hover:underline dark:text-emerald-300">{showAllTasks ? '隐藏空任务' : `显示全部 ${tasks.length} 项`}</button> : null}
              </div>
              {shownTasks.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-[13px]">
                    <thead className="text-[12px] text-[#7a8479] dark:text-gray-400">
                      <tr><th className="py-2 font-medium">任务</th><th className="py-2 text-right font-medium">成功</th><th className="py-2 text-right font-medium">失败</th><th className="py-2 text-right font-medium">跳过</th><th className="py-2 text-right font-medium">受限</th></tr>
                    </thead>
                    <tbody>
                      {shownTasks.map((task) => (
                        <tr key={task.task} className="border-t border-[#e5e9e2] dark:border-[#263142]">
                          <th scope="row" className="py-2.5 font-medium text-[#273228] dark:text-gray-100">{task.label}</th>
                          <td className="py-2.5 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{task.success}</td>
                          <td className="py-2.5 text-right tabular-nums">{task.failed}</td>
                          <td className="py-2.5 text-right tabular-nums">{task.skipped}</td>
                          <td className="py-2.5 text-right tabular-nums">{task.limited}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3"><EmptyState title={visibleData?.countsMigrationRequired ? '每日统计尚未就绪' : loading ? '正在读取任务结果' : '这一天没有确认动作'} description={visibleData?.countsMigrationRequired ? '动作回执仍可在下方查看；请先应用数据库迁移。' : loading ? '请稍候。' : '选择其他日期，或等待插件上报动作回执。'} /></div>
              )}
            </div>

            <div className="mb-5 border-t border-[#e5e9e2] pt-5 dark:border-[#263142]">
              <h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">{selectedDate} · 自动同步日报</h3>
              <p className="mb-3 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">{accountLabel} · 与插件面板「每日报告」同一套计数；和确认回执是两份独立记录。</p>
              {visibleData?.dailyMigrationRequired ? <p role="alert" className="mb-3 text-[12px] text-amber-700 dark:text-amber-300">日报表结构待升级：请应用 0126、0127 和 0128 迁移（旧迁移 0112 / 0119 也需已执行）。未升级的字段暂显示 0。</p> : null}
              {reports.length ? (
                <div className="overflow-hidden rounded-2xl border border-[#cfe3d4] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)] dark:border-[#244238] dark:bg-[#0d141c]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#e5eee4] px-4 py-3 dark:border-[#263142]">
                    <div>
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4caf2a]">Daily Sync</p>
                      <p className="mb-0 mt-1 text-[12px] text-[#536471] dark:text-gray-400">评论拆成评论首页 / 评论回复 / 评论大V。</p>
                    </div>
                    <StatusPill size="sm" tone="info">自动</StatusPill>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-2">
                    {reports.map((report) => (
                      <article key={`${report.deviceId}:${report.accountHandle}`} className="border-t border-[#e5eee4] px-4 py-3 sm:border-r sm:odd:border-r dark:border-[#263142] sm:[&:nth-child(2n)]:border-r-0">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="m-0 truncate text-[13px] font-semibold text-[#0f1419] dark:text-gray-100">{report.accountHandle ? `@${report.accountHandle}` : '账号未识别'}</h4>
                            <p className="mb-0 mt-0.5 text-[11px] text-[#536471] dark:text-gray-400">设备 {report.deviceId.slice(0, 12)}… · 同步于 {time(report.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
                            ['删帖', report.prunes],
                            ['删评论', report.replyPrunes],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-[#eef5ee] bg-[#f7fbf7] px-2 py-2 text-center dark:border-[#263142] dark:bg-[#101820]">
                              <p className="m-0 text-[10px] text-[#536471] dark:text-gray-400">{label}</p>
                              <p className="mb-0 mt-0.5 text-[14px] font-semibold tabular-nums text-[#0f1419] dark:text-gray-100">{value}</p>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState title={loading ? '正在读取每日报告' : '这一天还没有同步报告'} description={loading ? '请稍候。' : '配置回执密钥并保持浏览器运行后，插件会按心跳与每日 09:00 自动同步。'} />
              )}
              <AdminPagination total={visibleData?.reportTotal || 0} offset={reportOffset} limit={visibleData?.reportLimit || 20} loading={loading} onOffsetChange={setReportOffset} />
            </div>

            <div className="border-t border-[#e5e9e2] pt-5 dark:border-[#263142]">
              <h3 className="m-0 text-[14px] font-semibold text-[#273228] dark:text-gray-100">{selectedDate} · 动作明细</h3>
              <p className="mb-3 mt-0.5 text-[12px] text-[#7a8479] dark:text-gray-400">{accountLabel} · 所选日期的确认回执；不保存正文、Cookie 或模型密钥。</p>
              {events.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead className="text-[12px] text-[#7a8479] dark:text-gray-400">
                      <tr><th className="py-2 font-medium">时间</th><th className="font-medium">任务</th><th className="font-medium">结果</th><th className="font-medium">错误码</th><th className="font-medium">目标</th></tr>
                    </thead>
                    <tbody>
                      {events.map((event) => {
                        const [label, tone] = RESULT[event.result] || [event.result, 'neutral']
                        return (
                          <tr key={event.id} className="border-t border-[#e5e9e2] dark:border-[#263142]">
                            <td className="whitespace-nowrap py-2.5">{time(event.occurredAt)}</td>
                            <td>{event.taskLabel}</td>
                            <td><StatusPill tone={tone} size="sm">{label}</StatusPill></td>
                            <td className="text-[#7a8479] dark:text-gray-400">{event.errorCode || '—'}</td>
                            <td className="max-w-[16rem] truncate text-[#7a8479] dark:text-gray-400" title={event.targetId || ''}>{event.targetId || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title={loading ? '正在读取动作明细' : '这一天没有动作明细'} description={loading ? '请稍候。' : '选择其他日期，或等待插件确认动作后上报。'} />
              )}
              <AdminPagination total={visibleData?.eventTotal || 0} offset={offset} limit={visibleData?.limit || 20} loading={loading} onOffsetChange={setOffset} />
            </div>
          </>
        )}
      </Section>
    </AdminPage>
  )
}

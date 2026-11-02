'use client'
import { useCallback, useEffect, useState } from 'react'
import { AdminButton, AdminPage, EmptyState, Section, StatusPill } from '../../../components/ui'
import PluginPicker from './PluginPicker'
const TARGETS = { twitter: 'X', juejin: '掘金', xiaohongshu: '小红书', zhihu: '知乎', weibo: '微博', wechat: '公众号', csdn: 'CSDN', segmentfault: '思否', cnblogs: '博客园', tencentcloud: '腾讯云', aliyun: '阿里云', huaweicloud: '华为云' }
const STATUS = { pending: '等待处理', running: '正在填写', prepared: '已准备 · 待检查', manual: '需手动完成', failed: '失败', interrupted: '已中断', stopped: '已停止', idle: '空闲', generating: 'AI 生成中', updating: '更新中', stopping: '停止中', success: '已确认', claimed: '执行中', expired: '已过期' }
const COMMAND = { 'stop-batch': '停止批次', 'stop-all': '停止全部任务', 'disable-checkin': '关闭自动签到', 'ext-update': '加载本地新版' }
const TYPE = { opinion: '观点', article: '文章', booklet: '电子书', project: '项目' }
const time = value => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(Date.now())
const commandStatus = command => ({ pending: '待领取', claimed: '执行中', success: '已确认完成', failed: '执行失败', expired: '已过期' }[command.status] || command.status)
export default function DistributionMonitor() {
  const [date, setDate] = useState(today), [target, setTarget] = useState(''), [device, setDevice] = useState('')
  const [data, setData] = useState(null), [error, setError] = useState(''), [note, setNote] = useState(''), [busy, setBusy] = useState('')
  const refresh = useCallback(async signal => {
    const response = await fetch(`/api/admin/plugins/monitor?${new URLSearchParams({ date, target })}`, { cache: 'no-store', signal })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error === 'MIGRATION_REQUIRED' ? '监控数据表尚未就绪，请执行迁移 0129_plugin_monitor.sql' : payload.error || '读取失败')
    if (!signal?.aborted) { setData({ ...payload, filterDate: date, filterTarget: target }); setError('') }
  }, [date, target])
  useEffect(() => {
    const controller = new AbortController()
    const run = () => refresh(controller.signal).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    run(); const timer = setInterval(() => { if (!document.hidden) run() }, 10000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [refresh])
  const current = data?.filterDate === date && data?.filterTarget === target ? data : null
  const devices = (current?.devices || []).filter(d => !device || d.deviceId === device)
  async function command(instance, action, argument = '') {
    if (busy) return
    setBusy(`${instance.deviceId}:${action}:${argument}`); setNote('')
    try {
      const response = await fetch('/api/admin/plugins/monitor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pluginId: 'ai-distributor', deviceId: instance.deviceId, command: action, argument }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '下发失败')
      setNote(`${COMMAND[action]}已排队，等待此设备心跳领取；实际结果请看指令回执。`)
      await refresh()
    } catch (e) { setNote(`未能完成：${e.message}`) }
    finally { setBusy('') }
  }
  const count = outcome => (current?.counts || []).filter(c => c.outcome === outcome && c.kind === 'distribution' && (!device || c.device_id === device)).reduce((sum, c) => sum + c.count, 0)
  return <AdminPage title="插件监控" description="AI 分发大师 · 设备、分发批次、平台工具与远程指令。每 10 秒刷新视图；心跳约每分钟或状态变化时上报。" actions={<><AdminButton href="/admin/community-actions?tab=extension" size="sm">返回插件台</AdminButton><AdminButton onClick={() => refresh().catch(e => setError(e.message))} size="sm">刷新</AdminButton></>}>
    <PluginPicker selected="ai-distributor" />
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {note && <p role="status" className="mb-4 rounded-xl bg-sky-50 p-4 text-sky-900">{note}</p>}
    <div className="mb-5 flex flex-wrap gap-4 text-sm"><label>日期 <input type="date" aria-label="统计日期" value={date} max={today()} onChange={e => setDate(e.target.value)} className="rounded border p-2 dark:bg-slate-900" /></label><label>目标平台 <select aria-label="目标平台" value={target} onChange={e => setTarget(e.target.value)} className="rounded border p-2 dark:bg-slate-900"><option value="">全部平台</option>{Object.entries(TARGETS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>设备 <select aria-label="插件设备" value={device} onChange={e => setDevice(e.target.value)} className="rounded border p-2 dark:bg-slate-900"><option value="">全部设备</option>{(current?.devices || []).map(d => <option key={d.deviceId} value={d.deviceId}>{d.deviceId.slice(0, 12)}</option>)}</select></label></div>
    <Section title="设备与版本" description="在线表示 5 分钟内收到心跳。离线时停止提供远程操作；指令 2 分钟内未完成会过期。">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['在线设备', devices.filter(d => d.online).length], ['已上报准备', count('prepared')], ['需手动完成', count('manual')], ['准备失败', count('failed')]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{current ? value : '—'}</p></div>)}</div>
      <p className="text-xs text-slate-500">准备数量按所选日期和目标平台汇总所选设备，表示已填写并回读，不代表发布成功。正文、草稿、页面 URL 和模型密钥不上报。</p>
      {!devices.length && <EmptyState title={current ? '尚无符合条件的设备' : '正在读取设备'} description="在分发大师「设置 → 后台监控」填写站长回执密钥并开启同步；首次心跳后出现。" />}
      <div className="mt-5 space-y-5">{devices.map(d => {
        const s = d.snapshot, update = s.localUpdate, filteredBatches = s.batches.filter(b => !target || b.targets.some(t => t.platformId === target))
        return <article key={d.deviceId} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">设备 {d.deviceId.slice(0, 12)}…</h3><p className="mt-1 text-xs text-slate-500">运行 v{d.version} · 心跳 {time(d.lastSeenAt)}</p></div><StatusPill tone={d.online ? 'success' : 'neutral'}>{d.online ? STATUS[s.phase] || s.phase : '离线 · 最后状态仅供参考'}</StatusPill></div>
          <p className="mt-3 text-sm">本地目录版本 v{update.version} · {({ unknown: '尚未检测', latest: '目录与运行版本一致', updated: '已加载', available: '本地新版可加载', waiting: '任务结束后更新', applying: '正在加载', failed: '检测失败' })[update.phase]}</p>
          <div className="my-4 flex flex-wrap gap-2">{['stop-all', 'disable-checkin', 'ext-update'].map(action => <AdminButton key={action} size="sm" disabled={!d.online || !!busy || (action === 'ext-update' && (!['available', 'waiting'].includes(update.phase) || update.version === d.version))} onClick={() => command(d, action)}>{COMMAND[action]}</AdminButton>)}</div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><strong>平台工具</strong><p className="mt-2">自动签到：{s.tools.autoCheckin ? '已开启' : '已关闭'} · 最近签到：{s.tools.checkinDay || '尚无记录'} · 笔记管理：{s.tools.managerRunning ? '运行中' : '空闲'}</p></div>
          <h4 className="mb-3 mt-5 font-semibold">分发批次</h4>
          {!filteredBatches.length && <p className="text-sm text-slate-500">暂无匹配的批次。</p>}
          {filteredBatches.map(b => <details key={b.id} className="mb-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700" open={b.targets.some(t => t.status === 'running')}><summary className="cursor-pointer text-sm">{TYPE[b.type]} · {b.id.slice(0, 8)} · {b.targets.filter(t => !['pending', 'running'].includes(t.status)).length}/{b.targets.length} · {time(b.createdAt)}</summary><div className="mt-3 space-y-2">{b.targets.filter(t => !target || t.platformId === target).map(t => <p key={t.id} className="flex justify-between text-sm"><span>{TARGETS[t.platformId]}</span><span>{STATUS[t.status]}</span></p>)}<AdminButton size="sm" disabled={!d.online || !!busy || !b.targets.some(t => ['pending', 'running'].includes(t.status))} onClick={() => command(d, 'stop-batch', b.id)}>停止此批次</AdminButton></div></details>)}
          <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold">指令回执（最近 24 小时）</summary><div className="mt-3 space-y-2">{!d.commands.length && <p className="text-sm text-slate-500">暂无指令</p>}{d.commands.map(c => <p key={c.id} className="text-sm">{time(c.created_at)} · {COMMAND[c.command]} · {commandStatus(c)}{c.result ? ` · ${({ stopped: '已确认停止', loaded: '已确认加载目标版本', failed: '本机执行失败', interrupted: '本机执行中断', expired: '已过期' })[c.result] || c.result}` : ''}</p>)}</div></details>
        </article>
      })}</div>
    </Section>
    <Section title={`${date} · 平台任务回执`} description="最近 200 条已上报结果；准备、签到与笔记管理分别记录。日期和目标平台筛选同时生效。" className="mt-5"><div className="space-y-2">{!(current?.events || []).filter(e => !device || e.device_id === device).length && <p className="text-sm text-slate-500">暂无结果</p>}{(current?.events || []).filter(e => !device || e.device_id === device).map(e => <p key={`${e.device_id}:${e.id}`} className="border-b border-slate-100 py-2 text-sm dark:border-slate-800">{time(e.occurred_at)} · {e.device_id.slice(0, 8)} · {({ distribution: '分发', checkin: '签到', manager: '笔记管理' })[e.kind]} · {TARGETS[e.platform_id] || '—'} · {STATUS[e.outcome]}{e.kind === 'manager' ? ` · 设为公开 ${e.public_count} 篇 / 仅自己可见 ${e.private_count} 篇` : ''}</p>)}</div></Section>
  </AdminPage>
}

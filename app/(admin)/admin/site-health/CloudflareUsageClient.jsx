'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const number = (value) => new Intl.NumberFormat('zh-CN').format(Number(value) || 0)
const pct = (value, limit) => ((Number(value) || 0) / Math.max(1, Number(limit) || 1)) * 100
const pctText = (value, limit) => `${pct(value, limit).toFixed(1)}%`
const jsonHeaders = { Accept: 'application/json' }

async function readJson(response) {
  const text = (await response.text()).trim()
  if (!text.startsWith('{') && !text.startsWith('[')) {
    throw new Error(text.startsWith('<')
      ? `HTTP ${response.status}，接口返回了网页而不是 JSON`
      : `HTTP ${response.status || '未知'}`)
  }
  let result
  try {
    result = JSON.parse(text)
  } catch {
    throw new Error(`HTTP ${response.status}，响应不是 JSON`)
  }
  if (!response.ok || !result?.ok) throw new Error(result?.error || result?.detail || result?.title || `HTTP ${response.status}`)
  return result
}

function toneForRatio(ratio) {
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.95) return 'danger'
  if (ratio >= 0.8) return 'warning'
  if (ratio >= 0.7) return 'caution'
  return 'ok'
}

const TONE_CLASS = {
  danger: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100',
  warning: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  caution: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100',
  ok: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-[#10161f] dark:text-slate-100',
}

const BAR_CLASS = {
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  caution: 'bg-amber-400',
  ok: 'bg-emerald-500',
}

export default function CloudflareUsageClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [backfillDate, setBackfillDate] = useState('')

  async function load(cached = false) {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cloudflare-usage${cached ? '?cached=1' : ''}`, { cache: 'no-store', headers: jsonHeaders })
      setData(await readJson(response))
      setError('')
    } catch (cause) { setError(String(cause?.message || cause)) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    setBackfillDate(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10))
    load()
  }, [])

  async function refresh(date = '') {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/cloudflare-usage${date ? `?date=${encodeURIComponent(date)}` : ''}`, { method: 'POST', headers: jsonHeaders })
      const result = await readJson(response)
      await load(true)
      if (date) setSelectedDate(date)
      if (Number(result?.notified) > 0) setError('')
    } catch (cause) { setError(String(cause?.message || cause)) }
    finally { setRefreshing(false) }
  }

  const history = data?.history || []
  const latest = history.find((row) => row.date === selectedDate) || history[0]
  const pressureDates = data?.pressureDates || []
  const currentAlerts = useMemo(() => {
    if (!latest) return []
    const rows = [
      { metric: 'workers', label: 'Workers 调用', value: latest.workers?.total, limit: latest.limits?.workersRequests },
      { metric: 'd1-read', label: 'D1 读取行数', value: latest.d1?.rowsRead, limit: latest.limits?.d1RowsRead },
      { metric: 'd1-write', label: 'D1 写入行数', value: latest.d1?.rowsWritten, limit: latest.limits?.d1RowsWritten },
    ]
    return rows
      .map((row) => ({ ...row, ratio: pct(row.value, row.limit) / 100 }))
      .filter((row) => row.ratio >= 0.8)
      .sort((a, b) => b.ratio - a.ratio)
  }, [latest])
  const worstTone = currentAlerts[0] ? toneForRatio(currentAlerts[0].ratio) : 'ok'

  return <div className="space-y-5">
    <section className={`rounded-2xl border px-4 py-4 ${TONE_CLASS[worstTone === 'ok' ? 'ok' : worstTone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[13px] font-semibold tracking-wide">免费额度预警</p>
          <p className="mt-1 text-sm leading-6 opacity-90">
            达到参考额度的 80% / 95% / 100% 时，会写入站长消息中心（自动化监控），同一 UTC 日同一指标同一档位只提醒一次。
            定时任务约每 3 小时采集今日并检查；打开本页也会在快照超过 15 分钟时刷新。
          </p>
          {pressureDates.length ? (
            <p className="mt-2 text-sm">
              近 7 个有快照的 UTC 日里，已有 <b>{pressureDates.length}</b> 天触达 80%：{pressureDates.join('、')}
            </p>
          ) : (
            <p className="mt-2 text-sm opacity-80">近几日快照尚未触达 80% 预警线。</p>
          )}
        </div>
        <Link href="/admin/site-health?tab=exceptions" className="rounded-lg border border-current/20 px-3 py-2 text-sm font-medium underline-offset-2 hover:underline">
          打开异常监控
        </Link>
      </div>
      {currentAlerts.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {currentAlerts.map((alert) => (
            <li key={alert.metric} className="rounded-xl border border-current/15 bg-black/5 px-3 py-2 text-sm dark:bg-white/5">
              <div className="font-medium">{alert.label}</div>
              <div className="mt-1 tabular-nums">{pctText(alert.value, alert.limit)} · {number(alert.value)}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">Cloudflare UTC 自然日；每天北京时间 08:20 归档前一天，今日约每 3 小时自动采样并在 80% 时通知站长。</p>
      <div className="flex gap-2">
        {history.length ? <select aria-label="选择用量日期" value={latest?.date || ''} onChange={(event) => setSelectedDate(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600">{history.map((row) => <option key={row.date} value={row.date}>{row.date} UTC</option>)}</select> : null}
        <button type="button" onClick={() => refresh()} disabled={refreshing} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">{refreshing ? '采集中…' : '立即采集今日'}</button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor="usage-backfill-date">补采历史日期</label>
      <input id="usage-backfill-date" type="date" value={backfillDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBackfillDate(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-600" />
      <button type="button" onClick={() => refresh(backfillDate)} disabled={refreshing || !backfillDate} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600">补采该日</button>
    </div>
    {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">采集失败：{error}</p> : null}
    {data?.refreshError ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">今日实时数据暂不可用：{data.refreshError}。历史快照仍可查看；请核对 Cloudflare Token 的账号和区域 Analytics 读取权限。</p> : null}
    {loading && !data ? <p className="text-sm text-slate-500">正在读取用量…</p> : null}
    {!loading && !latest ? <p className="text-sm text-slate-500">尚无每日快照。配置 CLOUDFLARE_ANALYTICS_TOKEN、CLOUDFLARE_ZONE_ID 和 CONTENT_FEED 后可采集。</p> : null}
    {latest ? <>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label={`Workers 调用 · ${latest.date}`} value={latest.workers.total} limit={latest.limits.workersRequests} />
        <Metric label="D1 读取行数" value={latest.d1.rowsRead} limit={latest.limits.d1RowsRead} />
        <Metric label="D1 写入行数" value={latest.d1.rowsWritten} limit={latest.limits.d1RowsWritten} />
      </div>
      <p className="text-xs text-slate-500">最后采集：{new Date(latest.collectedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}。阈值为 Cloudflare Free 套餐参考值；若账户套餐不同，请以 Cloudflare 账单为准。额度耗尽后 D1/Functions 会失败，预警必须在 80% 就发出。</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="Workers / Pages Functions 调用来源" rows={latest.workers.scripts.slice(0, 12)} label="脚本" getName={(row) => row.name} getCount={(row) => row.requests} />
        <Table title="入口请求最多的路径" rows={latest.topPaths.slice(0, 12)} label="路径" getName={(row) => row.path} getCount={(row) => row.requests} getDetail={(row) => Object.entries(row.statuses || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([status, value]) => `${status}: ${number(value)}`).join(' · ')} />
      </div>
      <p className="text-xs text-slate-500">路径是区域入口请求量，包含缓存命中和 Functions 额度耗尽后的请求；它与 Workers 调用数不是同一指标。D1 查询次数：读 {number(latest.d1.readQueries)}，写 {number(latest.d1.writeQueries)}。</p>
      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-3 font-semibold">每日趋势 · 最近 14 天</h3>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr><th className="py-2">UTC 日期</th><th>Workers</th><th>D1 读</th><th>D1 写</th><th>压力</th><th>最高请求路径</th></tr></thead><tbody>{history.map((row) => {
          const workersPct = pct(row.workers.total, row.limits.workersRequests)
          const readPct = pct(row.d1.rowsRead, row.limits.d1RowsRead)
          const writePct = pct(row.d1.rowsWritten, row.limits.d1RowsWritten)
          const peak = Math.max(workersPct, readPct, writePct)
          const pressure = peak >= 100 ? '已耗尽' : peak >= 95 ? '危急' : peak >= 80 ? '预警' : '正常'
          return <tr key={row.date} className={`border-t border-slate-200 dark:border-slate-700 ${peak >= 80 ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}`}>
            <td className="py-2">{row.date}</td>
            <td className="tabular-nums">{number(row.workers.total)} <span className="text-xs text-slate-500">{workersPct.toFixed(0)}%</span></td>
            <td className="tabular-nums">{number(row.d1.rowsRead)} <span className="text-xs text-slate-500">{readPct.toFixed(0)}%</span></td>
            <td className="tabular-nums">{number(row.d1.rowsWritten)} <span className="text-xs text-slate-500">{writePct.toFixed(0)}%</span></td>
            <td>{pressure}</td>
            <td className="max-w-52 truncate" title={row.topPaths[0]?.path}>{row.topPaths[0]?.path || '—'}</td>
          </tr>
        })}</tbody></table></div>
      </section>
    </> : null}
  </div>
}

function Metric({ label, value, limit }) {
  const ratio = (Number(value) || 0) / Math.max(1, Number(limit) || 1)
  const tone = toneForRatio(ratio)
  const width = Math.min(100, Math.max(0, ratio * 100))
  return <div className={`rounded-xl border p-4 ${TONE_CLASS[tone]}`}>
    <div className="text-sm opacity-80">{label}</div>
    <div className="mt-2 text-2xl font-semibold tabular-nums">{number(value)}</div>
    <div className="mt-1 text-xs opacity-80">参考额度 {number(limit)} · {pctText(value, limit)}</div>
    <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div className={`h-full rounded-full ${BAR_CLASS[tone]}`} style={{ width: `${width}%` }} />
      <span className="pointer-events-none absolute inset-y-0 left-[80%] w-px bg-black/35 dark:bg-white/40" title="80% 预警" />
      <span className="pointer-events-none absolute inset-y-0 left-[95%] w-px bg-black/50 dark:bg-white/55" title="95% 危急" />
    </div>
    <div className="mt-1 flex justify-between text-[10px] opacity-60"><span>0</span><span>80%</span><span>95%</span><span>100%</span></div>
  </div>
}

function Table({ title, rows, label, getName, getCount, getDetail }) {
  return <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
    <h3 className="mb-2 font-semibold">{title}</h3>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">{label}</th><th className="text-right">请求数</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${getName(row)}-${index}`} className="border-t border-slate-200 dark:border-slate-700"><td className="max-w-64 py-2" title={getName(row)}><div className="truncate">{getName(row)}</div>{getDetail ? <div className="text-xs text-slate-500">{getDetail(row)}</div> : null}</td><td className="text-right tabular-nums">{number(getCount(row))}</td></tr>)}</tbody></table></div>
  </section>
}

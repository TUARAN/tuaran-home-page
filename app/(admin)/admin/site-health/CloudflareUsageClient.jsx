'use client'

import { useEffect, useState } from 'react'

const number = (value) => new Intl.NumberFormat('zh-CN').format(Number(value) || 0)
const pct = (value, limit) => `${((Number(value) || 0) / limit * 100).toFixed(1)}%`

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
      const response = await fetch(`/api/admin/cloudflare-usage${cached ? '?cached=1' : ''}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`)
      setData(result)
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
      const response = await fetch(`/api/admin/cloudflare-usage${date ? `?date=${encodeURIComponent(date)}` : ''}`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`)
      await load(true)
      if (date) setSelectedDate(date)
    } catch (cause) { setError(String(cause?.message || cause)) }
    finally { setRefreshing(false) }
  }

  const history = data?.history || []
  const latest = history.find((row) => row.date === selectedDate) || history[0]
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">Cloudflare UTC 自然日；每天北京时间 08:20 归档前一天，今日数据约每 15 分钟刷新。</p>
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
      <p className="text-xs text-slate-500">最后采集：{new Date(latest.collectedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}。阈值为 Cloudflare Free 套餐参考值；若账户套餐不同，请以 Cloudflare 账单为准。</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="Workers / Pages Functions 调用来源" rows={latest.workers.scripts.slice(0, 12)} label="脚本" getName={(row) => row.name} getCount={(row) => row.requests} />
        <Table title="入口请求最多的路径" rows={latest.topPaths.slice(0, 12)} label="路径" getName={(row) => row.path} getCount={(row) => row.requests} getDetail={(row) => Object.entries(row.statuses || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([status, value]) => `${status}: ${number(value)}`).join(' · ')} />
      </div>
      <p className="text-xs text-slate-500">路径是区域入口请求量，包含缓存命中和 Functions 额度耗尽后的请求；它与 Workers 调用数不是同一指标。D1 查询次数：读 {number(latest.d1.readQueries)}，写 {number(latest.d1.writeQueries)}。</p>
      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-3 font-semibold">每日趋势 · 最近 14 天</h3>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr><th className="py-2">UTC 日期</th><th>Workers 调用</th><th>D1 读取行数</th><th>D1 写入行数</th><th>最高请求路径</th></tr></thead><tbody>{history.map((row) => <tr key={row.date} className="border-t border-slate-200 dark:border-slate-700"><td className="py-2">{row.date}</td><td>{number(row.workers.total)}</td><td>{number(row.d1.rowsRead)}</td><td>{number(row.d1.rowsWritten)}</td><td className="max-w-52 truncate" title={row.topPaths[0]?.path}>{row.topPaths[0]?.path || '—'}</td></tr>)}</tbody></table></div>
      </section>
    </> : null}
  </div>
}

function Metric({ label, value, limit }) {
  const ratio = (Number(value) || 0) / limit
  return <div className={`rounded-xl border p-4 ${ratio >= 0.9 ? 'border-red-400 bg-red-50 dark:bg-red-950' : ratio >= 0.7 ? 'border-amber-400 bg-amber-50 dark:bg-amber-950' : 'border-slate-200 dark:border-slate-700'}`}>
    <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
    <div className="mt-2 text-2xl font-semibold">{number(value)}</div>
    <div className="mt-1 text-xs">参考额度 {number(limit)} · {pct(value, limit)}</div>
  </div>
}

function Table({ title, rows, label, getName, getCount, getDetail }) {
  return <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
    <h3 className="mb-2 font-semibold">{title}</h3>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">{label}</th><th className="text-right">请求数</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${getName(row)}-${index}`} className="border-t border-slate-200 dark:border-slate-700"><td className="max-w-64 py-2" title={getName(row)}><div className="truncate">{getName(row)}</div>{getDetail ? <div className="text-xs text-slate-500">{getDetail(row)}</div> : null}</td><td className="text-right tabular-nums">{number(getCount(row))}</td></tr>)}</tbody></table></div>
  </section>
}

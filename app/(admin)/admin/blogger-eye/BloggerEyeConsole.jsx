'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  IconActivityHeartbeat,
  IconClockHour4,
  IconCloud,
  IconDownload,
  IconPlayerPlay,
  IconServer,
  IconWorld,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, Section, StatCard, StatusPill } from '../../components/ui'

const STORAGE_KEY = 'admin:blogger-eye:cloud:v2'
const LEGACY_STORAGE_KEY = 'admin:blogger-eye:v1'
const API_URL = '/api/admin/blogger-eye'

function Field({ label, hint, children }) {
  return (
    <label className="block text-[12px] font-semibold text-[#53554d] dark:text-gray-300">
      <span>{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint ? <span className="mt-1 block text-[10px] font-normal leading-5 text-[#858779] dark:text-[#8e9ab0]">{hint}</span> : null}
    </label>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-[#caccc0] bg-[#fafaf6] px-3 text-[12px] text-[#15140f] outline-none transition focus:border-[#6f7166] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-100 dark:focus:border-[#718096]'

export default function BloggerEyeConsole() {
  const [service, setService] = useState({ state: 'checking', message: '检测中', colo: 'unknown' })
  const [allowedHosts, setAllowedHosts] = useState([])
  const [runners, setRunners] = useState({ ready: false, count: 0, items: [] })
  const [regionalResults, setRegionalResults] = useState([])
  const [scheduler, setScheduler] = useState({ ready: false, history: [] })
  const [targetUrl, setTargetUrl] = useState('https://2aran.com')
  const [metrics, setMetrics] = useState({ ip: '未检测', region: '未知', status: '等待中', duration: '—' })
  const [preview, setPreview] = useState('云端访问后的页面文本预览会显示在这里。')
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)

  const addLog = useCallback((ok, detail, source = 'Cloudflare Edge') => {
    setLogs((items) => [{
      id: crypto.randomUUID(),
      at: new Date(),
      ok,
      detail,
      source,
    }, ...items].slice(0, 80))
  }, [])

  const checkCloud = useCallback(async (writeLog = true) => {
    setService((current) => ({ ...current, state: 'checking', message: '检测中' }))
    try {
      const response = await fetch(API_URL, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || '云端服务未就绪')
      setAllowedHosts(Array.isArray(data.allowedHosts) ? data.allowedHosts : [])
      setRunners(data.runners || { ready: false, count: 0, items: [] })
      setScheduler(data.scheduler || { ready: false, history: [] })
      setService({ state: 'online', message: '云端已连接', colo: data.colo || 'unknown' })
      setMetrics((current) => ({ ...current, region: data.colo || '未知' }))
      if (writeLog) addLog(true, `Cloudflare Edge 已连接 · ${data.colo || '未知节点'}`)
    } catch (error) {
      setService({ state: 'offline', message: '云端不可用', detail: error.message, colo: 'unknown' })
      if (writeLog) addLog(false, error.message)
    }
  }, [addLog])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
      const legacy = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY) || 'null')
      const savedTarget = saved?.targetUrl || legacy?.targetUrl
      if (typeof savedTarget === 'string' && savedTarget.trim()) setTargetUrl(savedTarget)
    } catch {}
    void checkCloud(false)
  }, [checkCloud])

  async function request(action, payload = {}) {
    const response = await fetch(API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    })
    let data
    try {
      data = await response.json()
    } catch {
      throw new Error('云端服务返回了无效响应')
    }
    if (!response.ok || !data.ok) throw new Error(data.error || '云端请求失败')
    return data
  }

  function saveTarget() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ targetUrl: targetUrl.trim() }))
    addLog(true, '目标链接已保存到当前浏览器')
  }

  async function detectCloudIp() {
    setBusy(true)
    try {
      const result = await request('ip')
      setMetrics((current) => ({
        ...current,
        ip: result.ip?.ip || '未知',
        region: result.colo || current.region,
        duration: `${result.ip?.durationMs ?? 0}ms`,
      }))
      addLog(true, `云端出口 IP ${result.ip?.ip || '未知'} · ${result.colo || '未知节点'}`)
    } catch (error) {
      addLog(false, error.message)
    } finally {
      setBusy(false)
    }
  }

  async function visit() {
    if (!targetUrl.trim()) {
      addLog(false, '请先填写目标链接')
      return
    }
    setBusy(true)
    try {
      const result = await request('visit', { url: targetUrl.trim() })
      const duration = `${result.visit.durationMs ?? 0}ms`
      const status = `HTTP ${result.visit.status || '未知'}`
      setMetrics({
        ip: result.ip?.ip || '未取得',
        region: result.colo || '未知',
        status,
        duration,
      })
      setPreview(result.visit.preview || '访问成功，但没有可预览的文本内容。')
      addLog(
        true,
        `${status} · ${duration} · ${result.visit.effectiveUrl}${result.visit.previewTruncated ? ' · 预览已截断' : ''}`,
      )
    } catch (error) {
      setMetrics((current) => ({ ...current, status: '失败' }))
      setPreview(error.message)
      addLog(false, error.message)
    } finally {
      setBusy(false)
    }
  }

  async function runRegionalChecks() {
    if (!targetUrl.trim()) {
      addLog(false, '请先填写目标链接')
      return
    }
    setBusy(true)
    setRegionalResults([])
    try {
      const result = await request('regional', { url: targetUrl.trim() })
      const items = Array.isArray(result.results) ? result.results : []
      setRegionalResults(items)
      for (const item of items) {
        addLog(
          item.ok,
          item.ok
            ? `IP ${item.ip || '未知'} · HTTP ${item.status || '未知'} · ${item.durationMs || 0}ms`
            : item.error || '地区检查失败',
          item.label || item.id,
        )
      }
    } catch (error) {
      addLog(false, error.message, '地区 Runner')
    } finally {
      setBusy(false)
    }
  }

  function downloadLogs() {
    if (!logs.length) return
    const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['time', 'status', 'source', 'detail'],
      ...logs.map((log) => [log.at.toISOString(), log.ok ? 'success' : 'failed', log.source, log.detail]),
    ]
    const blob = new Blob([`\ufeff${rows.map((row) => row.map(cell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `blogger-eye-cloud-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const serviceTone = service.state === 'online' ? 'success' : service.state === 'offline' ? 'danger' : 'neutral'

  return (
    <AdminPage
      title="小眼睛"
      description="通过受控的云端节点检查已授权网站，不依赖本机常驻服务。"
      actions={<StatusPill tone={serviceTone}>{service.message}</StatusPill>}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="云端出口 IP" value={metrics.ip} />
        <StatCard label="执行节点" value={metrics.region} />
        <StatCard label="最近访问" value={metrics.status} />
        <StatCard label="响应耗时" value={metrics.duration} />
      </div>

      <div className="space-y-6">
        <Section
          title="云端执行节点"
          description="请求由 Cloudflare Edge 发出；浏览器无需本地网络权限，也无需启动 macOS 常驻服务。"
          actions={<AdminButton type="button" size="sm" disabled={busy} onClick={() => void checkCloud(true)}><IconActivityHeartbeat size={15} />检测云端</AdminButton>}
        >
          {service.detail ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] leading-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {service.detail}
            </div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-lg border border-[#dedfd5] bg-[#fafaf6] px-3 py-2.5 dark:border-[#2d3744] dark:bg-[#0e131c]">
              <p className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">运行方式</p>
              <p className="mt-1 flex items-center gap-2 text-[12px] font-semibold text-[#15140f] dark:text-gray-100"><IconCloud size={15} />Cloudflare Edge · {service.colo || 'unknown'}</p>
            </div>
            <div className="rounded-lg border border-[#dedfd5] bg-[#fafaf6] px-3 py-2.5 dark:border-[#2d3744] dark:bg-[#0e131c]">
              <p className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">授权域名</p>
              <p className="mt-1 break-all text-[12px] font-semibold text-[#15140f] dark:text-gray-100">{allowedHosts.length ? allowedHosts.join(' · ') : '等待云端返回配置'}</p>
            </div>
          </div>
        </Section>

        <Section title="授权网站检查" description="仅允许访问后台配置的 HTTPS 域名；每次重定向都会重新校验目标。">
          <Field label="目标链接" hint="新增域名需在 Cloudflare 环境变量 BLOGGER_EYE_ALLOWED_HOSTS 中登记。">
            <input className={inputClass} type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://2aran.com" autoComplete="off" />
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton type="button" variant="primary" disabled={busy || service.state !== 'online'} onClick={() => void visit()}><IconPlayerPlay size={15} />云端访问</AdminButton>
            <AdminButton type="button" disabled={busy || service.state !== 'online'} onClick={() => void detectCloudIp()}><IconServer size={15} />检测出口 IP</AdminButton>
            <AdminButton type="button" size="sm" variant="ghost" onClick={saveTarget}>保存目标</AdminButton>
          </div>
        </Section>

        <Section
          title="多地区测试"
          description="地区 Runner 按同一授权白名单执行检查，并汇总真实出口 IP、状态码和耗时。"
          actions={runners.ready ? <AdminButton type="button" size="sm" disabled={busy} onClick={() => void runRegionalChecks()}><IconWorld size={15} />运行 {runners.count} 个地区</AdminButton> : null}
        >
          {!runners.ready ? (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-[#caccc0] bg-[#fafaf6] px-4 py-4 dark:border-[#364252] dark:bg-[#0e131c]">
              <IconWorld className="mt-0.5 shrink-0 text-[#6f7166] dark:text-[#8e9ab0]" size={20} />
              <div>
                <p className="text-[12px] font-semibold text-[#15140f] dark:text-gray-100">自有地区 Runner 尚未绑定</p>
                <p className="mt-1 text-[11px] leading-5 text-[#77796d] dark:text-[#8e9ab0]">手动多地区测试需要自有 Runner。后台定时检查可独立使用 Globalping 免费节点，运行记录见下方。</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {runners.items.map((runner) => {
                const result = regionalResults.find((item) => item.id === runner.id)
                return (
                  <div key={runner.id} className="rounded-lg border border-[#dedfd5] bg-[#fafaf6] px-3 py-3 dark:border-[#2d3744] dark:bg-[#0e131c]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-[#15140f] dark:text-gray-100">{runner.label}</p>
                      <StatusPill tone={!result ? 'neutral' : result.ok ? 'success' : 'danger'}>{!result ? '等待' : result.ok ? '成功' : '失败'}</StatusPill>
                    </div>
                    <p className="mt-2 font-mono text-[10px] leading-5 text-[#77796d] dark:text-[#8e9ab0]">
                      {!result ? runner.id : result.ok ? `${result.ip || '未知 IP'} · HTTP ${result.status || '未知'} · ${result.durationMs || 0}ms` : result.error}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <Section
          title="后台定时检查"
          description="每 20 分钟按地区轮换访问；支持 Globalping 免费探测节点或自有 Runner，按实际回显 IP 判断是否变化。"
          actions={<StatusPill tone={scheduler.ready ? 'success' : 'neutral'}>{scheduler.ready ? scheduler.schedule : '待部署'}</StatusPill>}
        >
          {scheduler.lastRun?.mode === 'cloudflare-fixed-egress' ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              最近一次仍为 Cloudflare 直连，固定跨 Zone 标识不能证明出口轮换。启用免费探测节点或多个自有 Runner 后，等待新的运行记录。
            </div>
          ) : null}
          {scheduler.lastRun?.mode === 'globalping' ? (
            <p className="mb-4 text-[11px] leading-5 text-[#77796d] dark:text-[#8e9ab0]">Globalping 免费节点按地区轮换。出口 IP 取自同一探针访问目标域名 /cdn-cgi/trace 的回显；公共节点可能离线、限流或重复使用 IP，轮换状态以实测为准。</p>
          ) : null}
          {!scheduler.ready ? (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-[#caccc0] bg-[#fafaf6] px-4 py-4 dark:border-[#364252] dark:bg-[#0e131c]">
              <IconClockHour4 className="mt-0.5 shrink-0 text-[#6f7166] dark:text-[#8e9ab0]" size={20} />
              <div>
                <p className="text-[12px] font-semibold text-[#15140f] dark:text-gray-100">定时记录尚未就绪</p>
                <p className="mt-1 text-[11px] leading-5 text-[#77796d] dark:text-[#8e9ab0]">{scheduler.error || '等待 D1 迁移和独立 Worker 部署。'}</p>
              </div>
            </div>
          ) : scheduler.history?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[11px]">
                <thead className="border-b border-[#dedfd5] font-mono text-[10px] text-[#858779] dark:border-[#2d3744] dark:text-[#8e9ab0]">
                  <tr><th className="px-2 py-2">时间</th><th className="px-2 py-2">节点</th><th className="px-2 py-2">出口 IP</th><th className="px-2 py-2">轮换</th><th className="px-2 py-2">结果</th><th className="px-2 py-2">耗时</th></tr>
                </thead>
                <tbody className="divide-y divide-[#e6e7df] dark:divide-[#26313e]">
                  {scheduler.history.map((run) => (
                    <tr key={run.id}>
                      <td className="whitespace-nowrap px-2 py-2.5 font-mono text-[#77796d] dark:text-gray-400">{new Date(run.scheduledAt).toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-[#53554d] dark:text-gray-300">{run.runnerLabel || run.runnerId || 'Cloudflare Edge'}</td>
                      <td className="px-2 py-2.5 font-mono text-[#53554d] dark:text-gray-300">{run.exitIp || '—'}</td>
                      <td className="px-2 py-2.5"><StatusPill tone={run.ipChanged === true ? 'success' : run.ipChanged === false ? 'neutral' : 'neutral'}>{run.ipChanged === true ? '已变化' : run.ipChanged === false ? '未变化' : '首次/未知'}</StatusPill></td>
                      <td className="px-2 py-2.5"><StatusPill tone={run.error ? 'danger' : run.httpStatus >= 200 && run.httpStatus < 400 ? 'success' : 'neutral'}>{run.error ? '失败' : `HTTP ${run.httpStatus || '—'}`}</StatusPill></td>
                      <td className="whitespace-nowrap px-2 py-2.5 font-mono text-[#77796d] dark:text-gray-400">{run.durationMs || 0}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-[12px] text-[#929487]">定时任务已就绪，等待首次运行。</p>
          )}
        </Section>

        <Section title="访问结果" description="正文预览最多读取 64 KiB；二进制响应只显示类型。">
          <pre className="min-h-64 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#dedfd5] bg-[#0e131c] p-3 font-mono text-[11px] leading-6 text-[#cbd5e1] dark:border-[#2d3744]">{preview}</pre>
        </Section>

        <Section
          title="运行日志"
          description={`当前保留 ${logs.length} 条云端操作记录。`}
          actions={<div className="flex gap-2"><AdminButton type="button" size="sm" disabled={!logs.length} onClick={downloadLogs}><IconDownload size={14} />下载 CSV</AdminButton><AdminButton type="button" size="sm" variant="ghost" onClick={() => setLogs([])}>清空</AdminButton></div>}
        >
          {logs.length ? (
            <ol className="max-h-80 divide-y divide-[#e6e7df] overflow-auto dark:divide-[#26313e]">
              {logs.map((log) => (
                <li key={log.id} className="grid gap-1 py-2.5 text-[11px] sm:grid-cols-[48px_72px_minmax(120px,.45fr)_minmax(0,1fr)]">
                  <span className={log.ok ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-semibold text-rose-700 dark:text-rose-400'}>{log.ok ? '成功' : '失败'}</span>
                  <time className="font-mono text-[#929487]">{log.at.toLocaleTimeString()}</time>
                  <span className="break-all font-mono text-[#77796d] dark:text-gray-400">{log.source}</span>
                  <span className="break-all text-[#53554d] dark:text-gray-300">{log.detail}</span>
                </li>
              ))}
            </ol>
          ) : <p className="py-8 text-center text-[12px] text-[#929487]">检测和访问操作会记录在这里。</p>}
        </Section>
      </div>
    </AdminPage>
  )
}

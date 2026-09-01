'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconActivityHeartbeat,
  IconDownload,
  IconEye,
  IconPlayerPlay,
  IconRefresh,
  IconServer,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, Section, StatCard, StatusPill } from '../../components/ui'
import { bloggerEyeConnectionFailure, queryBloggerEyeLoopbackPermission } from '../../../../lib/bloggerEyeBrowser.mjs'

const STORAGE_KEY = 'admin:blogger-eye:v1'
const DEFAULT_SERVICE_URL = 'http://127.0.0.1:5177'
const EMPTY_CONFIG = {
  apiUrl: '',
  tradeNo: '',
  secret: '',
  num: '5',
  maxAttempts: '5',
  protocol: '1',
  province: '',
  city: '',
  tunnel: '',
}

function normalizeProxy(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
}

function parseProxies(value) {
  return [...new Set(String(value || '').split(/\r?\n/).map(normalizeProxy).filter(Boolean))]
}

function maskProxy(value) {
  return String(value || '').replace(/(\/\/)([^/@:]+):([^/@]+)@/, '$1***:***@') || '直连'
}

function safeServiceUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return ''
    return url.origin
  } catch {
    return ''
  }
}

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
  const [serviceUrl, setServiceUrl] = useState(DEFAULT_SERVICE_URL)
  const [service, setService] = useState({ state: 'checking', message: '检测中' })
  const [targetUrl, setTargetUrl] = useState('')
  const [proxyText, setProxyText] = useState('')
  const [config, setConfig] = useState(EMPTY_CONFIG)
  const [metrics, setMetrics] = useState({ ip: '未检测', mode: '直连', status: '等待中', proxy: '' })
  const [preview, setPreview] = useState('访问后的页面文本预览会显示在这里。')
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)
  const [permissionState, setPermissionState] = useState('unknown')
  const proxies = useMemo(() => parseProxies(proxyText), [proxyText])

  const addLog = useCallback((ok, detail, proxy = '') => {
    setLogs((items) => [{ id: `${Date.now()}-${Math.random()}`, at: new Date(), ok, detail, proxy: maskProxy(proxy) }, ...items].slice(0, 80))
  }, [])

  const checkService = useCallback(async (value, writeLog = true, requestPermission = false) => {
    const base = safeServiceUrl(value)
    if (!base) {
      setService({ state: 'offline', message: '地址无效' })
      return
    }
    const permission = await queryBloggerEyeLoopbackPermission(window.navigator.permissions)
    setPermissionState(permission.state)
    if (permission.state === 'denied') {
      const failure = bloggerEyeConnectionFailure(permission.state)
      setService({ state: failure.state, message: failure.message, detail: failure.detail })
      if (writeLog) addLog(false, failure.detail)
      return
    }
    if (permission.state === 'prompt' && !requestPermission) {
      setService({
        state: 'permission',
        message: '待授权',
        detail: '点击“授权并连接”，并在 Chrome 提示中允许本站访问本机服务。',
      })
      return
    }
    setService({ state: 'checking', message: '检测中' })
    try {
      const response = await fetch(`${base}/api/health`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || '服务未就绪')
      setService({ state: 'online', message: '已连接' })
      setPermissionState('granted')
      if (writeLog) addLog(true, `已连接本机服务 ${base}`)
    } catch {
      const latestPermission = await queryBloggerEyeLoopbackPermission(window.navigator.permissions)
      setPermissionState(latestPermission.state)
      const failure = bloggerEyeConnectionFailure(latestPermission.state)
      setService({ state: failure.state, message: failure.message, detail: failure.detail })
      if (writeLog) addLog(false, failure.detail)
    }
  }, [addLog])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      const nextServiceUrl = safeServiceUrl(saved.serviceUrl) || DEFAULT_SERVICE_URL
      setServiceUrl(nextServiceUrl)
      setTargetUrl(typeof saved.targetUrl === 'string' ? saved.targetUrl : '')
      setProxyText(typeof saved.proxyText === 'string' ? saved.proxyText : '')
      setConfig({ ...EMPTY_CONFIG, ...(saved.config && typeof saved.config === 'object' ? saved.config : {}) })
      void checkService(nextServiceUrl, false)
    } catch {
      void checkService(DEFAULT_SERVICE_URL, false)
    }
  }, [checkService])

  useEffect(() => {
    if (service.state !== 'offline') return undefined
    const timer = window.setInterval(() => void checkService(serviceUrl, false), 10_000)
    return () => window.clearInterval(timer)
  }, [checkService, service.state, serviceUrl])

  function saveLocal() {
    const normalizedServiceUrl = safeServiceUrl(serviceUrl)
    if (!normalizedServiceUrl) {
      addLog(false, '本机服务地址只允许 http://localhost 或 http://127.0.0.1')
      return false
    }
    const saved = { serviceUrl: normalizedServiceUrl, targetUrl, proxyText: proxies.join('\n'), config }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    setServiceUrl(normalizedServiceUrl)
    setProxyText(saved.proxyText)
    addLog(true, '配置已保存到当前浏览器；未上传到站点服务器')
    return true
  }

  async function request(path, options = {}) {
    const base = safeServiceUrl(serviceUrl)
    if (!base) throw new Error('本机服务地址无效')
    const response = await fetch(`${base}${path}`, {
      method: options.method || 'GET',
      cache: 'no-store',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    let data
    try { data = await response.json() } catch { throw new Error('本机服务返回了无效响应') }
    if (!response.ok || data.ok === false) throw new Error(data.error || data.visit?.error || '请求失败')
    return data
  }

  async function detect(proxy = '') {
    setBusy(true)
    try {
      const result = await request('/api/ip', { method: 'POST', body: { proxy } })
      setMetrics((current) => ({ ...current, ip: result.ip, mode: proxy ? '代理' : '直连', proxy }))
      addLog(true, `出口 IP ${result.ip}`, proxy)
    } catch (error) {
      addLog(false, error.message, proxy)
    } finally {
      setBusy(false)
    }
  }

  async function visit(proxy = '', manageBusy = true) {
    if (!targetUrl.trim()) {
      addLog(false, '请先填写目标链接')
      return false
    }
    if (manageBusy) setBusy(true)
    try {
      const result = await request('/api/visit', { method: 'POST', body: { url: targetUrl.trim(), proxy } })
      const status = `${result.visit.status || '未知'} · ${Number(result.visit.timeTotal || 0).toFixed(2)}s`
      setMetrics({ ip: result.ip?.ip || '未知', mode: proxy ? '代理' : '直连', status, proxy })
      setPreview(result.visit.preview || '访问成功，但没有可预览的文本内容。')
      addLog(true, `IP ${result.ip?.ip || '未知'} · HTTP ${result.visit.status} · ${result.visit.effectiveUrl}`, proxy)
      return true
    } catch (error) {
      setMetrics((current) => ({ ...current, status: '失败', proxy }))
      setPreview(error.message)
      addLog(false, error.message, proxy)
      return false
    } finally {
      if (manageBusy) setBusy(false)
    }
  }

  async function rotate() {
    if (!proxies.length) {
      addLog(false, '代理池为空')
      return
    }
    setBusy(true)
    for (const proxy of proxies) await visit(proxy, false)
    setBusy(false)
  }

  async function extract(visitAfterExtract = false) {
    setBusy(true)
    try {
      if (visitAfterExtract && !targetUrl.trim()) throw new Error('请先填写目标链接')
      const path = visitAfterExtract ? '/api/91http/extract-visit' : '/api/91http/extract'
      const body = visitAfterExtract
        ? { url: targetUrl.trim(), config, maxAttempts: config.maxAttempts }
        : config
      const result = await request(path, { method: 'POST', body })
      if (visitAfterExtract) {
        setProxyText((current) => [...new Set([...parseProxies(current), result.proxy])].join('\n'))
        setMetrics({
          ip: result.ip?.ip || '未知',
          mode: '91HTTP',
          status: `${result.visit.status || '未知'} · ${Number(result.visit.timeTotal || 0).toFixed(2)}s`,
          proxy: result.proxy,
        })
        setPreview(result.visit.preview || '访问成功，但没有可预览的文本内容。')
        for (const attempt of result.attempts || []) {
          addLog(attempt.ok, attempt.ok ? `第 ${attempt.index} 次成功 · HTTP ${attempt.visit?.status}` : `第 ${attempt.index} 次失败 · ${attempt.error || attempt.visit?.error || '未知错误'}`, attempt.proxy)
        }
      } else {
        const merged = [...new Set([...proxies, ...(result.proxies || [])])]
        setProxyText(merged.join('\n'))
        addLog(true, `从 91HTTP 提取 ${result.proxies.length} 条代理，代理池共 ${merged.length} 条`)
      }
    } catch (error) {
      setPreview(error.message)
      addLog(false, error.message, '91HTTP')
    } finally {
      setBusy(false)
    }
  }

  function downloadLogs() {
    if (!logs.length) return
    const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [['time', 'status', 'proxy', 'detail'], ...logs.map((log) => [log.at.toISOString(), log.ok ? 'success' : 'failed', log.proxy, log.detail])]
    const blob = new Blob([`\ufeff${rows.map((row) => row.map(cell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `blogger-eye-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const serviceTone = service.state === 'online'
    ? 'success'
    : service.state === 'permission'
      ? 'warning'
      : ['offline', 'denied'].includes(service.state)
        ? 'danger'
        : 'neutral'
  const connectionButtonLabel = service.state === 'permission'
    ? '授权并连接'
    : service.state === 'online'
      ? '检测连接'
      : '重新连接'

  return (
    <AdminPage
      title="小眼睛"
      description="从后台连接仅监听本机的 Node 服务，用直连、代理池或 91HTTP 出口访问同一个目标链接。"
      actions={<StatusPill tone={serviceTone}>{service.message}</StatusPill>}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="当前出口 IP" value={metrics.ip} />
        <StatCard label="当前模式" value={metrics.mode} />
        <StatCard label="最近访问" value={metrics.status} />
        <StatCard label="代理池" value={`${proxies.length} 条`} />
      </div>

      <div className="space-y-6">
        <Section
          title="本机服务"
          description="服务由 macOS 自动管理并随登录启动，只绑定 127.0.0.1；无需单独打开终端。"
          actions={<AdminButton type="button" size="sm" disabled={busy} onClick={() => void checkService(serviceUrl, true, true)}><IconActivityHeartbeat size={15} />{connectionButtonLabel}</AdminButton>}
        >
          {service.detail ? (
            <div className={`mb-4 rounded-lg border px-3 py-2.5 text-[11px] leading-5 ${service.state === 'permission' ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'}`}>
              {service.detail}
            </div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.7fr)] lg:items-end">
            <Field label="服务地址" hint="只接受 localhost / 127.0.0.1；修改端口时同步设置 BLOGGER_EYE_PORT。">
              <input className={inputClass} value={serviceUrl} onChange={(event) => setServiceUrl(event.target.value)} spellCheck={false} />
            </Field>
            <div className="rounded-lg border border-[#dedfd5] bg-[#fafaf6] px-3 py-2.5 dark:border-[#2d3744] dark:bg-[#0e131c]">
              <p className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">运行方式</p>
              <p className="mt-1 text-[12px] font-semibold text-[#15140f] dark:text-gray-100">macOS 登录后自动启动 · 异常退出自动恢复{permissionState === 'granted' ? ' · 浏览器已授权' : ''}</p>
            </div>
          </div>
        </Section>

        <Section title="访问控制" description="目标链接保存在当前浏览器；请求由本机 curl 发出。">
          <Field label="目标链接">
            <input className={inputClass} type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://example.com" autoComplete="off" />
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton type="button" variant="primary" disabled={busy} onClick={() => void visit()}><IconPlayerPlay size={15} />直连访问</AdminButton>
            <AdminButton type="button" disabled={busy || !proxies.length} onClick={() => void visit(proxies[0])}><IconEye size={15} />首个代理访问</AdminButton>
            <AdminButton type="button" disabled={busy || !proxies.length} onClick={() => void rotate()}><IconRefresh size={15} />自动轮换全部</AdminButton>
            <AdminButton type="button" disabled={busy || !config.tunnel} onClick={() => void visit(config.tunnel)}>隧道访问</AdminButton>
            <AdminButton type="button" disabled={busy} onClick={() => void detect()}><IconServer size={15} />检测直连 IP</AdminButton>
          </div>
        </Section>

        <Section
          title="91HTTP 接入"
          description="可填写订单号与 Secret，或粘贴 91HTTP 后台生成的完整 API 链接。凭据仅在明确保存后写入当前浏览器。"
          actions={<AdminButton type="button" size="sm" onClick={saveLocal}>保存本机配置</AdminButton>}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="完整 API 链接" hint="可选；设置后优先于 trade_no / secret。">
              <input className={inputClass} type="password" value={config.apiUrl} onChange={(event) => setConfig((current) => ({ ...current, apiUrl: event.target.value }))} autoComplete="off" />
            </Field>
            <Field label="trade_no"><input className={inputClass} value={config.tradeNo} onChange={(event) => setConfig((current) => ({ ...current, tradeNo: event.target.value }))} autoComplete="off" /></Field>
            <Field label="secret"><input className={inputClass} type="password" value={config.secret} onChange={(event) => setConfig((current) => ({ ...current, secret: event.target.value }))} autoComplete="off" /></Field>
            <Field label="提取数量"><input className={inputClass} type="number" min="1" max="200" value={config.num} onChange={(event) => setConfig((current) => ({ ...current, num: event.target.value }))} /></Field>
            <Field label="提取并访问次数"><input className={inputClass} type="number" min="1" max="50" value={config.maxAttempts} onChange={(event) => setConfig((current) => ({ ...current, maxAttempts: event.target.value }))} /></Field>
            <Field label="协议">
              <select className={inputClass} value={config.protocol} onChange={(event) => setConfig((current) => ({ ...current, protocol: event.target.value }))}><option value="1">HTTP</option><option value="2">SOCKS5</option></select>
            </Field>
            <Field label="省份"><input className={inputClass} value={config.province} onChange={(event) => setConfig((current) => ({ ...current, province: event.target.value }))} placeholder="可选" /></Field>
            <Field label="城市"><input className={inputClass} value={config.city} onChange={(event) => setConfig((current) => ({ ...current, city: event.target.value }))} placeholder="可选" /></Field>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Field label="91HTTP 隧道代理"><input className={inputClass} type="password" value={config.tunnel} onChange={(event) => setConfig((current) => ({ ...current, tunnel: event.target.value }))} placeholder="http://user:pass@host:port" autoComplete="off" /></Field>
            <div className="flex flex-wrap gap-2">
              <AdminButton type="button" disabled={busy} onClick={() => void extract(false)}>提取到代理池</AdminButton>
              <AdminButton type="button" variant="primary" disabled={busy} onClick={() => void extract(true)}>提取并访问</AdminButton>
            </div>
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="代理池" description="每行一个 HTTP / HTTPS / SOCKS4 / SOCKS5 代理；账号密码显示时会脱敏。">
            <textarea
              className="min-h-64 w-full resize-y rounded-lg border border-[#caccc0] bg-[#fafaf6] p-3 font-mono text-[12px] leading-6 text-[#15140f] outline-none focus:border-[#6f7166] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-100"
              value={proxyText}
              onChange={(event) => setProxyText(event.target.value)}
              spellCheck={false}
              placeholder={'http://127.0.0.1:7890\nsocks5://127.0.0.1:9050\nuser:pass@1.2.3.4:8080'}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminButton type="button" size="sm" onClick={saveLocal}>保存代理池</AdminButton>
              <AdminButton type="button" size="sm" disabled={busy || !proxies.length} onClick={() => void detect(proxies[0])}>检测首个代理</AdminButton>
              <AdminButton type="button" size="sm" variant="ghost" onClick={() => setProxyText('')}>清空</AdminButton>
            </div>
          </Section>

          <Section title="访问结果" description={metrics.proxy ? `当前代理：${maskProxy(metrics.proxy)}` : '当前为直连模式'}>
            <pre className="min-h-64 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#dedfd5] bg-[#0e131c] p-3 font-mono text-[11px] leading-6 text-[#cbd5e1] dark:border-[#2d3744]">{preview}</pre>
          </Section>
        </div>

        <Section
          title="运行日志"
          description={`当前保留 ${logs.length} 条本机操作记录。`}
          actions={<div className="flex gap-2"><AdminButton type="button" size="sm" disabled={!logs.length} onClick={downloadLogs}><IconDownload size={14} />下载 CSV</AdminButton><AdminButton type="button" size="sm" variant="ghost" onClick={() => setLogs([])}>清空</AdminButton></div>}
        >
          {logs.length ? (
            <ol className="max-h-80 divide-y divide-[#e6e7df] overflow-auto dark:divide-[#26313e]">
              {logs.map((log) => (
                <li key={log.id} className="grid gap-1 py-2.5 text-[11px] sm:grid-cols-[48px_72px_minmax(120px,.45fr)_minmax(0,1fr)]">
                  <span className={log.ok ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-semibold text-rose-700 dark:text-rose-400'}>{log.ok ? '成功' : '失败'}</span>
                  <time className="font-mono text-[#929487]">{log.at.toLocaleTimeString()}</time>
                  <span className="break-all font-mono text-[#77796d] dark:text-gray-400">{log.proxy}</span>
                  <span className="break-all text-[#53554d] dark:text-gray-300">{log.detail}</span>
                </li>
              ))}
            </ol>
          ) : <p className="py-8 text-center text-[12px] text-[#929487]">检测、提取与访问操作会记录在这里。</p>}
        </Section>
      </div>
    </AdminPage>
  )
}

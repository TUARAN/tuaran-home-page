'use client'

import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = '2aran:multi-ip:proxy-list'

function normalizeProxy(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^(?:https?|socks5):\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed}`
}

function parseProxies(value) {
  return [...new Set(value.split(/\r?\n/).map(normalizeProxy).filter(Boolean))]
}

function Metric({ label, value, tone = 'default' }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#d8e1e9] bg-white p-4 dark:border-[#283642] dark:bg-[#111a22]">
      <span className="text-xs font-semibold text-[#758291] dark:text-gray-500">{label}</span>
      <strong className={`mt-2 block break-all text-lg ${tone === 'ok' ? 'text-[#087466] dark:text-emerald-400' : tone === 'error' ? 'text-red-600' : ''}`}>{value}</strong>
    </div>
  )
}

export default function MultiIpTool() {
  const [browserIp, setBrowserIp] = useState({ status: 'idle', value: '未检测' })
  const [edgeIp, setEdgeIp] = useState({ status: 'idle', value: '未检测', note: '' })
  const [proxyText, setProxyText] = useState('')
  const [logs, setLogs] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProxyText(window.localStorage.getItem(STORAGE_KEY) || '')
  }, [])

  const proxies = useMemo(() => parseProxies(proxyText), [proxyText])
  const protocols = useMemo(() => proxies.reduce((counts, proxy) => {
    const protocol = proxy.split(':')[0].toUpperCase()
    counts[protocol] = (counts[protocol] || 0) + 1
    return counts
  }, {}), [proxies])

  function addLog(ok, detail) {
    setLogs((items) => [{ id: `${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), ok, detail }, ...items].slice(0, 30))
  }

  async function detectBrowserIp() {
    setBrowserIp({ status: 'loading', value: '检测中…' })
    try {
      const response = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ip) throw new Error('公网 IP 服务没有返回结果')
      setBrowserIp({ status: 'ok', value: data.ip })
      addLog(true, `浏览器公网出口：${data.ip}`)
    } catch (error) {
      setBrowserIp({ status: 'error', value: '检测失败' })
      addLog(false, `浏览器出口检测失败：${error.message || error}`)
    }
  }

  async function detectEdgeIp() {
    setEdgeIp({ status: 'loading', value: '检测中…', note: '' })
    try {
      const response = await fetch('/api/network/ip', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ip) throw new Error(data.error || '边缘函数没有返回结果')
      setEdgeIp({ status: 'ok', value: data.ip, note: data.note || '' })
      addLog(true, `Cloudflare 边缘出口：${data.ip}`)
    } catch (error) {
      setEdgeIp({ status: 'error', value: '检测失败', note: '' })
      addLog(false, `Cloudflare 出口检测失败：${error.message || error}`)
    }
  }

  function saveProxyList() {
    const normalized = proxies.join('\n')
    window.localStorage.setItem(STORAGE_KEY, normalized)
    setProxyText(normalized)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
    addLog(true, `已在当前浏览器保存 ${proxies.length} 条代理配置`)
  }

  function exportProxyList() {
    if (!proxies.length) {
      addLog(false, '代理池为空，无法导出')
      return
    }
    const blob = new Blob([`${proxies.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `proxy-pool-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    addLog(true, `已导出 ${proxies.length} 条代理配置`)
  }

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="浏览器公网出口" value={browserIp.value} tone={browserIp.status === 'ok' ? 'ok' : browserIp.status === 'error' ? 'error' : 'default'} />
        <Metric label="Cloudflare 边缘出口" value={edgeIp.value} tone={edgeIp.status === 'ok' ? 'ok' : edgeIp.status === 'error' ? 'error' : 'default'} />
        <Metric label="本地代理池" value={`${proxies.length} 条`} />
      </section>

      <section className="rounded-lg border border-[#d8e1e9] bg-white p-4 shadow-sm dark:border-[#283642] dark:bg-[#111a22]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8ee] pb-3 dark:border-[#283642]">
          <div>
            <h2 className="text-sm font-bold">出口检测</h2>
            <p className="mt-1 text-xs text-[#758291] dark:text-gray-500">对比你的浏览器网络与本站 Cloudflare Function 的公网出口。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={detectBrowserIp} disabled={browserIp.status === 'loading'} className="rounded-md border border-[#d0dae3] bg-white px-3 py-2 text-sm font-semibold transition hover:border-[#0b7668] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900">检测浏览器 IP</button>
            <button type="button" onClick={detectEdgeIp} disabled={edgeIp.status === 'loading'} className="rounded-md bg-[#0b7668] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#085f55] disabled:opacity-60">检测边缘 IP</button>
          </div>
        </div>
        {edgeIp.note ? <p className="mt-3 rounded-md bg-[#f3f8f6] px-3 py-2 text-xs text-[#557069] dark:bg-emerald-950/20 dark:text-emerald-300">{edgeIp.note}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-[#d8e1e9] bg-white p-4 shadow-sm dark:border-[#283642] dark:bg-[#111a22]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8ee] pb-3 dark:border-[#283642]">
            <div>
              <h2 className="text-sm font-bold">代理池配置器</h2>
              <p className="mt-1 text-xs text-[#758291] dark:text-gray-500">每行一个 HTTP / HTTPS / SOCKS5 代理，自动去重并补全协议。</p>
            </div>
            <span className="text-xs text-[#758291]">{Object.entries(protocols).map(([name, count]) => `${name} ${count}`).join(' · ') || '暂无配置'}</span>
          </div>
          <textarea
            value={proxyText}
            onChange={(event) => setProxyText(event.target.value)}
            spellCheck={false}
            placeholder={'http://127.0.0.1:7890\nsocks5://127.0.0.1:9050\nuser:pass@1.2.3.4:8080'}
            className="min-h-64 w-full resize-y rounded-md border border-[#d5dfe7] bg-[#f6f8fa] p-3 font-mono text-xs leading-6 outline-none transition focus:border-[#0b7668] focus:ring-2 focus:ring-emerald-100 dark:border-[#30404d] dark:bg-[#0d151c] dark:focus:ring-emerald-950"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={saveProxyList} className="rounded-md bg-[#0b7668] px-3 py-2 text-sm font-semibold text-white hover:bg-[#085f55]">{saved ? '已保存' : '保存到当前浏览器'}</button>
            <button type="button" onClick={exportProxyList} className="rounded-md border border-[#d0dae3] px-3 py-2 text-sm font-semibold hover:border-[#0b7668] dark:border-gray-700">导出 TXT</button>
            <button type="button" onClick={() => { setProxyText(''); window.localStorage.removeItem(STORAGE_KEY); addLog(true, '已清空本地代理配置') }} className="rounded-md border border-[#d0dae3] px-3 py-2 text-sm text-[#667085] hover:border-red-300 hover:text-red-600 dark:border-gray-700">清空</button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#87929e]">代理地址可能包含账号密码。只有点击保存后才会写入当前浏览器 localStorage；本站服务器不会接收这些配置。</p>
        </div>

        <div className="grid content-start gap-4">
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">Cloudflare 运行限制</h2>
            <p className="mt-2 text-xs leading-6 text-amber-800/80 dark:text-amber-200/70">
              浏览器和 Cloudflare Workers 不能调用本机 HTTP/SOCKS 代理，也不能执行 <code>curl --proxy</code>。代理检测、轮换访问与 91HTTP 提取需要运行源项目的 <code>local-node</code> 分支，或连接你自己的 Node/VPS 后端。
            </p>
            <a href="https://github.com/TUARAN/blogger-eye-platform/tree/local-node" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-md border border-amber-300 bg-white/70 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-white dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">查看完整本地版 ↗</a>
          </section>

          <section className="rounded-lg border border-[#d8e1e9] bg-white p-4 shadow-sm dark:border-[#283642] dark:bg-[#111a22]">
            <div className="mb-3 flex items-center justify-between border-b border-[#e2e8ee] pb-3 dark:border-[#283642]">
              <h2 className="text-sm font-bold">运行日志</h2>
              <button type="button" onClick={() => setLogs([])} className="text-xs text-[#758291] hover:text-red-600">清空</button>
            </div>
            {logs.length ? (
              <ol className="max-h-56 space-y-2 overflow-auto text-xs">
                {logs.map((log) => <li key={log.id} className="grid grid-cols-[auto_auto_1fr] gap-2"><span className={log.ok ? 'text-emerald-600' : 'text-red-600'}>{log.ok ? '成功' : '失败'}</span><time className="text-[#98a2ad]">{log.time}</time><span className="break-all text-[#5e6b78] dark:text-gray-400">{log.detail}</span></li>)}
              </ol>
            ) : <p className="py-8 text-center text-xs text-[#98a2ad]">检测与配置操作会记录在这里。</p>}
          </section>
        </div>
      </section>
    </div>
  )
}

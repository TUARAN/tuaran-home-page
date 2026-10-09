'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconArrowRight, IconDownload, IconLoader2, IconX } from '@tabler/icons-react'

function fileNameFromResponse(response, fallback) {
  const disposition = response.headers.get('content-disposition') || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return fallback
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallback
}

async function errorPayload(response) {
  try {
    return await response.json()
  } catch {
    return { error: `HTTP_${response.status}` }
  }
}

function errorMessage(data) {
  switch (data?.error) {
    case 'INSUFFICIENT_BALANCE': {
      const cost = Number(data.cost || 0)
      const balance = Number(data.balance || 0)
      const need = Number(data.need ?? Math.max(0, cost - balance))
      return `燃币不足：领取需要 ${cost} 枚，当前 ${balance} 枚，还差 ${need} 枚。`
    }
    case 'USER_BLOCKED':
      return '当前账号暂时无法领取这个工具包。'
    case 'FILE_NOT_FOUND':
      return '插件安装包尚未部署完成，请稍后再试。'
    case 'DELIVERY_NOT_FOUND':
      return '下载配置不存在，请联系站长处理。'
    case 'GUEST_UNAVAILABLE':
      return '无法建立访客身份，请刷新页面后重试。'
    default:
      return '下载暂时失败，请稍后重试。'
  }
}

export default function ExtensionDownloadButton({ href, version, className = '' }) {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  async function download() {
    if (loading) return
    setLoading(true)
    setNotice('')
    try {
      const response = await fetch(href, { credentials: 'same-origin', cache: 'no-store' })
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || contentType.includes('application/json')) {
        setNotice(errorMessage(await errorPayload(response)))
        return
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = fileNameFromResponse(response, `x-reply-clipboard-extension-v${version}.zip`)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setNotice(`已开始下载 v${version} ZIP。`)
    } catch {
      setNotice('网络连接失败，请检查网络后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(37,99,235,0.45)] disabled:cursor-wait disabled:opacity-70 ${className}`}
      >
        {loading ? <IconLoader2 size={18} className="animate-spin" aria-hidden="true" /> : <IconDownload size={18} stroke={2} aria-hidden="true" />}
        {loading ? '正在准备 ZIP…' : `下载 Chrome 插件 v${version}`}
        {!loading ? <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /> : null}
      </button>
      {notice ? (
        <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex max-w-lg items-center gap-3 rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm font-medium text-slate-800 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
            <span>{notice}</span>
            {notice.startsWith('燃币不足') ? <Link href="/ranbi#earn" className="shrink-0 font-bold text-blue-600 underline dark:text-blue-300">获取燃币</Link> : null}
            <button type="button" onClick={() => setNotice('')} aria-label="关闭下载提示" className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><IconX size={16} /></button>
          </div>
        </div>
      ) : null}
    </>
  )
}

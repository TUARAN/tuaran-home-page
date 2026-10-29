'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { IconArrowRight, IconDownload, IconLoader2, IconLock, IconX } from '@tabler/icons-react'

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
    case 'INVALID_PASSWORD':
    case 'PASSWORD_REQUIRED':
      return '邀请码不正确，请联系站长确认。'
    case 'INVITE_BOUND':
      return '此邀请码已激活为设备码，无法再次下载。请联系站长重置或换发新人码。'
    case 'INVITE_REVOKED':
      return '此邀请码已作废，请联系站长换发。'
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
  const passwordId = useId()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  async function download(event) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setNotice('')
    try {
      const response = await fetch(href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
        cache: 'no-store',
      })
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
      setOpen(false)
      setPassword('')
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
        onClick={() => { setNotice(''); setOpen(true) }}
        className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(37,99,235,0.45)] disabled:cursor-wait disabled:opacity-70 ${className}`}
      >
        <IconLock size={18} stroke={2} aria-hidden="true" />
        {`获取邀请码并下载 v${version}`}
        <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="输入插件邀请码">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭" className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><IconX size={20} /></button>
            <h2 className="m-0 pr-8 text-xl font-bold">联系站长获取邀请码</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">扫描微信二维码，备注「X高频互动助手」。输入邀请码即可下载；ZIP 会内置回执密钥，安装后自动写入本机。</p>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <Image src="/qrcode-wechat.jpg" alt="站长微信二维码" width={108} height={146} className="h-28 w-24 rounded-lg object-contain" unoptimized />
              <div className="text-sm"><p className="m-0 font-bold">站长微信：atar24</p><p className="mb-0 mt-2 text-slate-600 dark:text-slate-300">扫码添加后索取插件邀请码。</p></div>
            </div>
            <form onSubmit={download} className="mt-5 space-y-3">
              <label htmlFor={passwordId} className="block text-sm font-semibold">邀请码</label>
              <input id={passwordId} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder="输入站长提供的邀请码" />
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconDownload size={18} />}{loading ? '正在验证并下载…' : '验证并下载 ZIP'}</button>
              {notice ? <p role="alert" className="m-0 text-sm text-rose-600">{notice}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
      {notice && !open ? (
        <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex max-w-lg items-center gap-3 rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm font-medium text-slate-800 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="关闭下载提示" className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><IconX size={16} /></button>
          </div>
        </div>
      ) : null}
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AdminPage } from '../../components/ui'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isVideo(item) {
  return item.contentType?.startsWith('video/')
}

export default function NsfwConsole() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [attested, setAttested] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingId, setPendingId] = useState('')
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/nsfw', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json()
      if (data?.status === 'ok') {
        setItems(Array.isArray(data.items) ? data.items : [])
        setStatus('ok')
        setMessage('')
      } else {
        setStatus(data?.status || 'error')
        setMessage(data?.message || data?.error || '读取私有媒体库失败')
      }
    } catch (error) {
      setStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpload(event) {
    event.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMessage('请选择一个媒体文件。')
    if (!attested) return setMessage('请先确认内容权利与合规声明。')

    setUploading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('title', title)
      form.set('attested', 'true')
      const res = await fetch('/api/admin/nsfw', { method: 'POST', credentials: 'same-origin', body: form })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      if (data.item) setItems((current) => [data.item, ...current])
      setTitle('')
      setAttested(false)
      if (fileRef.current) fileRef.current.value = ''
      setMessage('已安全上传到私有媒体桶。')
    } catch (error) {
      setMessage(`上传失败：${error?.message || error}`)
    } finally {
      setUploading(false)
    }
  }

  async function updateItem(item, patch) {
    setPendingId(item.id)
    setMessage('')
    try {
      const res = await fetch('/api/admin/nsfw', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...patch }),
      })
      const data = await res.json()
      if (!res.ok || !data?.item) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems((current) => current.map((entry) => (entry.id === item.id ? data.item : entry)))
    } catch (error) {
      setMessage(`更新失败：${error?.message || error}`)
    } finally {
      setPendingId('')
    }
  }

  async function removeItem(item) {
    if (!confirm(`永久删除「${item.title || item.fileName}」？R2 原文件也会一并删除。`)) return
    setPendingId(item.id)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/nsfw?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (error) {
      setMessage(`删除失败：${error?.message || error}`)
    } finally {
      setPendingId('')
    }
  }

  return (
    <AdminPage
      title="NSFW 私有媒体库"
      maxWidth="1180px"
      description="内容只存入独立的私有 R2 桶；列表、预览和下载均须通过 owner-only 后台接口，不会生成公开 URL。"
    >
      <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        仅上传你拥有合法权利、涉及成年人且在适用地区合法的内容。严禁未成年人性内容、非自愿私密内容、侵权内容及任何违法内容。
      </div>

      <form onSubmit={handleUpload} className="mb-7 rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">上传到私有桶</h2>
        <p className="mt-1 text-xs leading-5 text-[#67695d] dark:text-gray-400">支持 JPG、PNG、WebP、AVIF、GIF、MP4、WebM，单文件最大 50 MB。</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[#53554d] dark:text-gray-300">
            <span className="mb-1 block">标题（可选）</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100" placeholder="仅作后台识别" />
          </label>
          <label className="text-sm text-[#53554d] dark:text-gray-300">
            <span className="mb-1 block">媒体文件</span>
            <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} className="w-full text-sm" />
          </label>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#53554d] dark:text-gray-300">
          <input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />
          <span>我确认该内容不涉及未成年人，已获必要授权，并符合适用法律与 Cloudflare 服务条款。</span>
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={uploading || !attested} className="rounded-lg bg-[#15140f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#323029] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]">
            {uploading ? '上传中…' : '上传私有媒体'}
          </button>
          {message ? <span className="text-sm text-[#67695d] dark:text-gray-400">{message}</span> : null}
        </div>
      </form>

      {status === 'loading' ? (
        <p className="text-sm text-[#67695d] dark:text-gray-400">加载私有媒体库…</p>
      ) : status === 'unavailable' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {message} 请在 Cloudflare Pages 的生产与预览环境中添加名为 <code>NSFW_MEDIA</code> 的 R2 binding，并确保该桶未启用 r2.dev 或任何公开自定义域；随后应用 <code>0044_nsfw_private_media.sql</code>。
        </div>
      ) : status === 'error' ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d5d7cd] px-4 py-8 text-center text-sm text-[#67695d] dark:border-[#252e39] dark:text-gray-400">还没有上传私有媒体。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const pending = pendingId === item.id
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-[#d5d7cd] bg-white dark:border-[#252e39] dark:bg-[#10161f]">
                <div className="aspect-[16/10] bg-[#edefe7] dark:bg-[#151c25]">
                  {isVideo(item) ? (
                    <video src={item.previewUrl} controls preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt="" className="h-full w-full object-contain" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[#15140f] dark:text-gray-100">{item.title || item.fileName || item.id}</p>
                  <p className="mt-1 text-xs text-[#67695d] dark:text-gray-400">{item.contentType} · {formatSize(item.sizeBytes)} · {formatTime(item.createdAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={pending} onClick={() => updateItem(item, { status: item.status === 'active' ? 'archived' : 'active' })} className="rounded-md border border-[#caccc0] px-2 py-1 text-xs text-[#53554d] disabled:opacity-50 dark:border-[#2d3744] dark:text-gray-300">
                      {item.status === 'active' ? '归档' : '恢复'}
                    </button>
                    <a href={item.previewUrl} target="_blank" rel="noreferrer" className="rounded-md border border-[#caccc0] px-2 py-1 text-xs text-[#53554d] dark:border-[#2d3744] dark:text-gray-300">单独预览</a>
                    <button type="button" disabled={pending} onClick={() => removeItem(item)} className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">删除</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </AdminPage>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const CATEGORIES = [
  { value: 'misc', label: '综合 Misc' },
  { value: 'nature', label: '自然 Nature' },
  { value: 'abstract', label: '抽象 Abstract' },
  { value: 'minimal', label: '极简 Minimal' },
  { value: 'city', label: '城市 City' },
  { value: 'anime', label: '二次元 Anime' },
]

function formatSize(bytes) {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function WallpaperConsole() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [category, setCategory] = useState('misc')
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/wallpapers', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (data?.status === 'ok') {
        setItems(Array.isArray(data.wallpapers) ? data.wallpapers : [])
        setStatus('ok')
      } else if (data?.status === 'unavailable') {
        setStatus('unavailable')
        setMessage(data.message || '存储未就绪')
      } else {
        setStatus('error')
        setMessage(data?.message || data?.error || '读取失败')
      }
    } catch (err) {
      setStatus('error')
      setMessage(String(err?.message || err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function readImageSize(file) {
    if (typeof createImageBitmap !== 'function') return { width: null, height: null }
    try {
      const bitmap = await createImageBitmap(file)
      const size = { width: bitmap.width, height: bitmap.height }
      bitmap.close?.()
      return size
    } catch {
      return { width: null, height: null }
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMessage('请选择一张图片')
      return
    }
    setUploading(true)
    setMessage('')
    try {
      const { width, height } = await readImageSize(file)
      const form = new FormData()
      form.set('file', file)
      form.set('title', title)
      form.set('titleEn', titleEn)
      form.set('category', category)
      if (width) form.set('width', String(width))
      if (height) form.set('height', String(height))

      const res = await fetch('/api/admin/wallpapers', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setMessage(`上传失败：${data?.error || res.status}${data?.detail ? ' · ' + data.detail : ''}`)
      } else {
        setMessage('上传成功')
        setTitle('')
        setTitleEn('')
        if (fileRef.current) fileRef.current.value = ''
        if (data.wallpaper) setItems((list) => [data.wallpaper, ...list])
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除这张壁纸？R2 文件与记录都会删除。')) return
    try {
      const res = await fetch(`/api/admin/wallpapers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setItems((list) => list.filter((w) => w.id !== id))
      } else {
        setMessage(`删除失败：${data?.error || res.status}`)
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  async function togglePublished(w) {
    try {
      const res = await fetch('/api/admin/wallpapers', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: w.id, published: w.published ? 0 : 1 }),
      })
      const data = await res.json()
      if (res.ok && data?.wallpaper) {
        setItems((list) => list.map((item) => (item.id === w.id ? data.wallpaper : item)))
      } else {
        setMessage(`更新失败：${data?.error || res.status}`)
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">壁纸资源管理台</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        文件存 Cloudflare R2 的 downloads/ 目录，元数据存 D1（wallpapers 表）。支持 JPG/PNG/WebP/AVIF/GIF，单文件 ≤ 25MB。
      </p>

      <form
        onSubmit={handleUpload}
        className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-300">中文标题</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：晨雾山谷"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-300">English title</span>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Misty Valley"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-300">分类</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-300">图片文件</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="w-full text-sm"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {uploading ? '上传中…' : '上传壁纸'}
          </button>
          {message ? (
            <span className="text-sm text-neutral-600 dark:text-neutral-300">{message}</span>
          ) : null}
        </div>
      </form>

      <div className="mt-8">
        {status === 'loading' ? (
          <p className="text-sm text-neutral-500">加载中…</p>
        ) : status === 'unavailable' ? (
          <p className="text-sm text-amber-600">{message || '存储未就绪'}</p>
        ) : status === 'error' ? (
          <p className="text-sm text-red-500">{message || '读取失败'}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">还没有上传任何壁纸。</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => (
              <div
                key={w.id}
                className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
              >
                <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.url}
                    alt={w.title || w.fileName}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3 text-sm">
                  <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                    {w.title || w.fileName || w.id}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {w.category}
                    {w.width && w.height ? ` · ${w.width}×${w.height}` : ''} · {formatSize(w.sizeBytes)} · ↓{w.downloads}
                  </p>
                  {!w.url ? (
                    <p className="mt-1 text-xs text-amber-600">未配置 R2_PUBLIC_BASE，无法预览/下载</p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublished(w)}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                    >
                      {w.published ? '下架' : '上架'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 dark:border-red-800"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IconCopy,
  IconLink,
  IconMarkdown,
  IconPhotoUp,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'

import { useSessionAccount } from '../../components/SessionProvider'

const COST = 5
const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 160) }
  }
}

function formatSize(bytes) {
  const n = Number(bytes || 0)
  if (!n) return ''
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(Number(ts)))
  } catch {
    return ''
  }
}

function imageMarkdown(image) {
  return `![${image.fileName || 'image'}](${image.url})`
}

function imageHtml(image) {
  const alt = String(image.fileName || 'image').replace(/"/g, '&quot;')
  return `<img src="${image.url}" alt="${alt}" />`
}

function imageShareUrl(image) {
  return image?.shareUrl || image?.sharePath || image?.url || ''
}

function readImageSize(file) {
  return new Promise((resolve) => {
    if (!file || typeof Image === 'undefined') {
      resolve({ width: null, height: null })
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth || null
      const height = img.naturalHeight || null
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: null, height: null })
    }
    img.src = url
  })
}

export default function ImageHostingTool() {
  const fileInputRef = useRef(null)
  const { user, loading: userLoading } = useSessionAccount()
  const [images, setImages] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const isAuthed = !!user

  const latest = images[0] || null
  const canUpload = isAuthed && selectedFile && !uploading

  const selectedMeta = useMemo(() => {
    if (!selectedFile) return ''
    return [selectedFile.type, formatSize(selectedFile.size)].filter(Boolean).join(' · ')
  }, [selectedFile])

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/points/me', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (res.ok && data?.authed) setBalance(Number(data.balance || 0))
    } catch {}
  }, [])

  const refreshImages = useCallback(async () => {
    if (!isAuthed) {
      setImages([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/image-hosting', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP_${res.status}`)
      setImages(Array.isArray(data?.images) ? data.images : [])
    } catch (err) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  useEffect(() => {
    if (!userLoading && isAuthed) {
      refreshImages()
      refreshBalance()
    }
    if (!userLoading && !isAuthed) {
      setImages([])
      setBalance(null)
    }
  }, [isAuthed, refreshBalance, refreshImages, userLoading])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function login() {
    window.location.href = `/login?returnTo=${encodeURIComponent('/tools/image-hosting')}`
  }

  function chooseFile(file) {
    setError('')
    setMessage('')
    setCopied('')
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('图片不能超过 10 MB')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleInputChange(event) {
    chooseFile(event.target.files?.[0])
  }

  async function upload() {
    if (!selectedFile || uploading) return
    setUploading(true)
    setError('')
    setMessage('')
    setCopied('')

    try {
      const { width, height } = await readImageSize(selectedFile)
      const form = new FormData()
      form.set('file', selectedFile)
      if (width) form.set('width', String(width))
      if (height) form.set('height', String(height))

      const res = await fetch('/api/image-hosting', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const data = await safeJson(res)
      if (!res.ok || !data?.image) {
        if (data?.error === 'INSUFFICIENT_BALANCE') {
          throw new Error(`燃币不足，还差 ${data.need || COST} 枚`)
        }
        if (data?.error === 'MIGRATION_REQUIRED') {
          throw new Error('图床表还没有应用迁移')
        }
        throw new Error(data?.message || data?.error || `HTTP_${res.status}`)
      }

      setImages((list) => [data.image, ...list.filter((item) => item.id !== data.image.id)])
      setBalance(Number(data.balance || 0))
      setMessage(`已上传，消耗 ${data.cost || COST} 燃币`)
      setSelectedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err?.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  async function copyText(key, text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setError('复制失败')
    }
  }

  async function removeImage(image) {
    if (!image?.id || deletingId) return
    setDeletingId(image.id)
    setError('')
    try {
      const res = await fetch(`/api/image-hosting?id=${encodeURIComponent(image.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setImages((list) => list.filter((item) => item.id !== image.id))
    } catch (err) {
      setError(err?.message || '删除失败')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-4 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-b border-[#d8d1c4] pb-5 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              Ranbi Tool
            </p>
            <h1 className="mb-3 font-serif text-[36px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[46px]">
              图床
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              上传图片后生成公开分享页，朋友打开能看图，也能回到 2aran 使用图床。仅登录用户可用，每张图片消耗 {COST} 燃币。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100">
              🔥 {balance == null ? '-' : balance} 燃币
            </span>
            {!userLoading && !isAuthed ? (
              <button
                type="button"
                onClick={login}
                className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
              >
                登录使用
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div
            className="rounded-lg border border-[#ded8ca] bg-white/68 p-4 dark:border-[#252e38] dark:bg-[#101720]/78"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              chooseFile(event.dataTransfer.files?.[0])
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="mb-0 text-[15px] font-bold">上传</h2>
              <span className="text-[12px] text-[#797469] dark:text-[#9da7b5]">PNG/JPG/WebP/GIF</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleInputChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isAuthed}
              className="flex min-h-[150px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#cfc5b6] bg-[#fffdf8] px-4 text-center transition hover:border-[#b89143] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#33404e] dark:bg-[#0b1118] dark:hover:border-[#607086]"
            >
              <IconPhotoUp size={34} className="text-[#8a6422] dark:text-[#d4ae66]" />
              <span className="text-[14px] font-semibold text-[#28241d] dark:text-gray-100">
                {selectedFile ? selectedFile.name : isAuthed ? '点击选择或拖入图片' : '登录后上传图片'}
              </span>
              <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
                {selectedMeta || '单张不超过 10 MB'}
              </span>
            </button>
            {previewUrl ? (
              <div className="mt-3 overflow-hidden rounded-md border border-[#ded8ca] bg-white dark:border-[#252e38] dark:bg-[#0b1118]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="待上传图片预览" className="max-h-[260px] w-full object-contain" />
              </div>
            ) : null}
            <button
              type="button"
              onClick={upload}
              disabled={!canUpload}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8a6422] px-4 text-[14px] font-bold text-white transition hover:bg-[#6f5019] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d4ae66] dark:text-[#14100a]"
            >
              <IconUpload size={18} />
              {uploading ? '上传中…' : `上传并消耗 ${COST} 燃币`}
            </button>
          </div>

          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          {latest ? (
            <div className="rounded-lg border border-[#ded8ca] bg-white/68 p-4 dark:border-[#252e38] dark:bg-[#101720]/78">
              <h2 className="mb-3 text-[15px] font-bold">最近链接</h2>
              <div className="grid gap-2">
                <a
                  href={imageShareUrl(latest)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#25221b] px-3 text-[13px] font-semibold text-white no-underline transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
                >
                  <IconLink size={17} />
                  打开分享页
                </a>
                <button
                  type="button"
                  onClick={() => copyText(`share:${latest.id}`, imageShareUrl(latest))}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                >
                  <IconLink size={17} />
                  {copied === `share:${latest.id}` ? '已复制分享页' : '复制分享页'}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(`url:${latest.id}`, latest.url)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                >
                  <IconCopy size={17} />
                  {copied === `url:${latest.id}` ? '已复制直链' : '复制图片直链'}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(`md:${latest.id}`, imageMarkdown(latest))}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                >
                  <IconMarkdown size={17} />
                  {copied === `md:${latest.id}` ? '已复制 Markdown' : '复制 Markdown'}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(`html:${latest.id}`, imageHtml(latest))}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                >
                  <IconCopy size={17} />
                  {copied === `html:${latest.id}` ? '已复制 HTML' : '复制 HTML'}
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="min-h-[620px] rounded-lg border border-[#ded8ca] bg-white/68 dark:border-[#252e38] dark:bg-[#101720]/78">
          <div className="flex h-12 items-center justify-between border-b border-[#e7dfd1] px-4 dark:border-[#252e38]">
            <h2 className="mb-0 text-[15px] font-bold">上传记录</h2>
            <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">{images.length} 张</span>
          </div>

          {!isAuthed && !userLoading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <IconPhotoUp size={42} className="mb-3 text-[#8a6422] dark:text-[#d4ae66]" />
              <p className="mb-3 text-[15px] font-semibold text-[#28241d] dark:text-gray-100">
                登录后使用图床
              </p>
              <button
                type="button"
                onClick={login}
                className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
              >
                去登录
              </button>
            </div>
          ) : loading ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#7a766b] dark:text-[#9da7b5]">
              正在加载…
            </p>
          ) : images.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#7a766b] dark:text-[#9da7b5]">
              还没有上传记录。
            </p>
          ) : (
            <div className="grid gap-0 divide-y divide-[#e7dfd1] dark:divide-[#252e38]">
              {images.map((image) => (
                <article key={image.id} className="grid gap-3 p-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <a
                    href={imageShareUrl(image)}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow block overflow-hidden rounded-md border border-[#ded8ca] bg-white dark:border-[#252e38] dark:bg-[#0b1118]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.fileName || 'image'} loading="lazy" className="h-[104px] w-full object-cover" />
                  </a>
                  <div className="min-w-0">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                      <p className="mb-0 min-w-0 flex-1 truncate text-[14px] font-semibold text-[#28241d] dark:text-gray-100">
                        {image.fileName || image.id}
                      </p>
                      <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
                        {formatTime(image.createdAt)}
                      </span>
                    </div>
                    <p className="mb-2 break-all font-mono text-[11px] leading-5 text-[#7a766b] dark:text-[#9da7b5]">
                      {imageShareUrl(image)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#ded8ca] px-2 py-0.5 text-[11px] text-[#68645a] dark:border-[#303947] dark:text-[#aab4c2]">
                        {formatSize(image.sizeBytes)}
                        {image.width && image.height ? ` · ${image.width}×${image.height}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(`share:${image.id}`, imageShareUrl(image))}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white/70 px-2.5 text-[12px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                      >
                        <IconLink size={15} />
                        {copied === `share:${image.id}` ? '已复制' : '分享页'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(`url:${image.id}`, image.url)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white/70 px-2.5 text-[12px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                      >
                        <IconCopy size={15} />
                        图片直链
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(`md:${image.id}`, imageMarkdown(image))}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white/70 px-2.5 text-[12px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                      >
                        <IconMarkdown size={15} />
                        Markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        disabled={deletingId === image.id}
                        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30"
                      >
                        <IconTrash size={15} />
                        {deletingId === image.id ? '删除中' : '删除'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

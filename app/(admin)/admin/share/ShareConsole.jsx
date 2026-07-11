'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { decryptPayload, encryptPayload } from '../../../../lib/longCompass/crypto'
import { SHARED_NOTE_MAX_CONTENT_LENGTH } from '../../../../lib/shareContent'
import { AdminPage } from '../../components/ui'

const LEGACY_SHARE_PASSWORD = '123123'
const MAX_EMBEDDED_IMAGE_BYTES = 600 * 1024
const EMBEDDABLE_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function buildShareUrl(slug, password) {
  if (typeof window === 'undefined') return ''
  const base = `${window.location.origin}/share/${slug}`
  if (!password) return base
  return `${base}#${encodeURIComponent(password)}`
}

function imageAltFromFileName(name) {
  return String(name || '图片')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[\[\]\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || '图片'
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

function normalizeEnvelope(envelope) {
  if (!envelope) return null
  if (typeof envelope === 'object') return envelope
  if (typeof envelope !== 'string') return null
  try {
    return JSON.parse(envelope)
  } catch {
    return null
  }
}

async function resolveLegacyContent(item) {
  if (item?.content) return item
  const envelope = normalizeEnvelope(item?.envelope)
  if (!envelope) return { ...item, legacyContentStatus: 'missing-envelope' }
  try {
    const decoded = await decryptPayload(envelope, LEGACY_SHARE_PASSWORD)
    const legacyContent =
      typeof decoded?.content === 'string' ? decoded.content : JSON.stringify(decoded, null, 2)
    return {
      ...item,
      legacyContent,
      legacyContentStatus: legacyContent ? 'decrypted' : 'empty',
    }
  } catch {
    return { ...item, legacyContentStatus: 'decrypt-failed' }
  }
}

export default function ShareAdminClient({ embedded = false }) {
  const [items, setItems] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  // 创建表单
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdSlug, setCreatedSlug] = useState('')
  const [createdPassword, setCreatedPassword] = useState('')
  const [embeddingImage, setEmbeddingImage] = useState(false)
  const imageInputRef = useRef(null)

  // 删除中状态
  const [pendingSlug, setPendingSlug] = useState('')

  const refresh = useCallback(async () => {
    setListError('')
    try {
      const res = await fetch('/api/admin/share', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      const rows = Array.isArray(data?.items) ? data.items : []
      setItems(await Promise.all(rows.map(resolveLegacyContent)))
    } catch (e) {
      setListError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreate(e) {
    e.preventDefault()
    if (!content.trim() || !password) {
      setCreateError('内容和密码都不能为空')
      return
    }
    if (password.length < 6) {
      setCreateError('密码至少 6 位')
      return
    }
    if (content.length > SHARED_NOTE_MAX_CONTENT_LENGTH) {
      setCreateError(`内容过大，最多 ${Math.floor(SHARED_NOTE_MAX_CONTENT_LENGTH / 1000)} 万字符`)
      return
    }
    setSubmitting(true)
    setCreateError('')
    setCreatedSlug('')
    try {
      // 生成公开分享用密文信封；后台同时保存明文，便于 owner 直接查看。
      const envelope = await encryptPayload({ content }, password)
      const days = expiresInDays === '' ? null : Math.max(1, Math.min(3650, parseInt(expiresInDays, 10) || 0))
      const res = await fetch('/api/admin/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          envelope,
          title: title.trim(),
          content,
          expiresInDays: days,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setCreatedSlug(data.slug)
      setCreatedPassword(password)
      setContent('')
      setTitle('')
      setPassword('')
      setExpiresInDays('')
      await refresh()
    } catch (e) {
      setCreateError(e?.message || 'CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmbedImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCreateError('')

    if (!EMBEDDABLE_IMAGE_TYPES.has(file.type)) {
      setCreateError('仅支持 JPG、PNG、WebP、GIF 或 AVIF 图片')
      return
    }
    if (file.size > MAX_EMBEDDED_IMAGE_BYTES) {
      setCreateError('内嵌图片不能超过 600 KB；请先压缩图片后再试')
      return
    }

    setEmbeddingImage(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      if (!/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/]+=*$/i.test(dataUrl)) {
        throw new Error('INVALID_IMAGE_DATA')
      }
      const markdown = `\n\n![${imageAltFromFileName(file.name)}](${dataUrl})\n`
      if (content.length + markdown.length > SHARED_NOTE_MAX_CONTENT_LENGTH) {
        throw new Error('CONTENT_TOO_LARGE')
      }
      setContent((current) => `${current}${markdown}`)
    } catch (error) {
      setCreateError(
        error?.message === 'CONTENT_TOO_LARGE'
          ? `图片加入后内容会超过 ${Math.floor(SHARED_NOTE_MAX_CONTENT_LENGTH / 1000)} 万字符上限`
          : '图片读取失败，请换一张图片重试'
      )
    } finally {
      setEmbeddingImage(false)
    }
  }

  async function handleDelete(slug) {
    if (!confirm(`确定删除分享 ${slug}？这是不可逆的。`)) return
    setPendingSlug(slug)
    try {
      const res = await fetch(`/api/admin/share?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      await refresh()
    } catch (e) {
      setListError(e?.message || 'DELETE_FAILED')
    } finally {
      setPendingSlug('')
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  function buildOwnerOpenUrl(item) {
    const password = !item?.content && item?.legacyContent ? LEGACY_SHARE_PASSWORD : ''
    return buildShareUrl(item.slug, password)
  }

  return (
    <AdminPage
      title="密码保护分享"
      maxWidth={embedded ? '1120px' : '960px'}
      compact={embedded}
      description="这是对外分发工具：后台保存明文副本，公开链接只返回密文信封；读者在浏览器用密码解锁。它不同于长期罗盘的强私密模式。密码可单独发送，或放在链接末尾 #密码 供一键打开。"
    >
      {/* 列表 */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">历史分享</h2>
          <span className="text-[11px] text-[#858779] dark:text-[#8e9ab0]">{items.length} 条</span>
        </div>
        {listError ? (
          <p className="mb-3 text-sm text-[#a34f47] dark:text-[#b5a09b]">{listError}</p>
        ) : null}
        {loadingList ? (
          <p className="text-sm text-[#63645a] dark:text-[#9aa6b6]">加载中…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#63645a] dark:text-[#9aa6b6]">还没有任何分享。</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#d5d7cd] dark:border-[#252e39]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#edefe7] text-[12px] uppercase tracking-[0.12em] text-[#616454] dark:bg-[#151c25] dark:text-[#8e9ab0]">
                <tr>
                  <th className="px-3 py-2">标题 / slug</th>
                  <th className="px-3 py-2">创建</th>
                  <th className="px-3 py-2">到期</th>
                  <th className="px-3 py-2">浏览</th>
                  <th className="px-3 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.slug} className="border-t border-[#dfe0d8] dark:border-[#252e39]">
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-[#15140f] dark:text-gray-100">{item.title || '(无标题)'}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#858779] dark:text-[#8e9ab0]">
                        /share/{item.slug}
                      </div>
                      {!item.content && item.legacyContent ? (
                        <div className="mt-1 text-[11px] text-[#8b5a1f] dark:text-[#d7a85c]">
                          旧分享：打开时自动带历史密码 123123
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      {item.expires_at ? formatDate(item.expires_at) : '永久'}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      {Number(item.view_count || 0)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <a
                          href={buildOwnerOpenUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => window.setTimeout(refresh, 1200)}
                          className="rounded-lg border border-[#c8b68f] bg-[#fffdf7] px-2 py-1 text-xs font-medium text-[#8b5a1f] hover:bg-[#f7efd9] dark:border-[#5a4730] dark:bg-[#19140d] dark:text-[#d7a85c] dark:hover:bg-[#221a10]"
                        >
                          打开
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText(buildShareUrl(item.slug, ''))}
                          className="rounded-lg border border-[#caccc0] px-2 py-1 text-xs text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                        >
                          复制链接
                        </button>
                        <button
                          type="button"
                          disabled={pendingSlug === item.slug}
                          onClick={() => handleDelete(item.slug)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        >
                          {pendingSlug === item.slug ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 创建新分享 */}
      <section className="rounded-xl border border-[#d5d7cd] bg-[#f6f8f3] p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="mb-4 text-base font-semibold text-[#15140f] dark:text-gray-100">新建分享</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#35362f] dark:text-gray-200">标题（明文，会显示在解锁前的标题位置）</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：2606 榴莲事件 · 夫妻共读复盘"
              className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#35362f] dark:text-gray-200">正文 Markdown（后台保留明文副本，公开端加密）</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="粘贴 markdown 全文…"
              className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 font-mono text-xs leading-6 outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleEmbedImage}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={embeddingImage}
                  className="rounded-md border border-[#caccc0] px-2.5 py-1.5 text-xs font-medium text-[#63645a] hover:bg-[#edefe7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                >
                  {embeddingImage ? '嵌入图片中…' : '嵌入图片'}
                </button>
                <span className="text-[11px] leading-5 text-[#73756a] dark:text-[#8e9ab0]">
                  ≤ 600 KB；图片随正文加密，解锁后才会加载。
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">
                {content.length.toLocaleString()} / {SHARED_NOTE_MAX_CONTENT_LENGTH.toLocaleString()}
              </span>
            </div>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#35362f] dark:text-gray-200">密码（≥6 位）</span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="自定义一个口令，分享给读者"
                className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#35362f] dark:text-gray-200">有效天数（留空 = 永久）</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="如 30"
                className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
            </label>
          </div>
          {createError ? (
            <p className="text-sm text-[#a34f47] dark:text-[#b5a09b]">{createError}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#8b5a1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#9aa170]"
          >
            {submitting ? '加密上传中…' : '生成加密链接'}
          </button>
        </form>

        {createdSlug ? (
          <div className="mt-4 rounded-lg border border-[#c7e0d2] bg-[#f1fbf4] p-4 text-sm dark:border-[#1f4533] dark:bg-[#10261c]">
            <p className="mb-2 font-medium text-[#2c5e3f] dark:text-[#9bd4a8]">
              已创建。下面两种链接二选一发给读者：
            </p>
            <div className="space-y-2">
              <Field
                label="基础链接（密码单独发）"
                value={buildShareUrl(createdSlug, '')}
                onCopy={copyText}
              />
              <Field
                label="带密码链接（一键打开）"
                value={buildShareUrl(createdSlug, createdPassword)}
                onCopy={copyText}
              />
              <Field label="密码" value={createdPassword} onCopy={copyText} mono />
            </div>
          </div>
        ) : null}
      </section>
    </AdminPage>
  )
}

function Field({ label, value, onCopy, mono = false }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[#63645a] dark:text-[#9aa6b6] sm:w-36">
        {label}
      </span>
      <code
        className={`flex-1 break-all rounded bg-white px-2 py-1 ${mono ? 'font-mono' : ''} text-[12px] text-[#15140f] dark:bg-[#0d131b] dark:text-gray-100`}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="rounded border border-[#caccc0] px-2 py-1 text-[11px] text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
      >
        复制
      </button>
    </div>
  )
}

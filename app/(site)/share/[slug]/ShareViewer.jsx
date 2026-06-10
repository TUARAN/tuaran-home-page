'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { decryptPayload } from '../../../../lib/longCompass/crypto'
import { PROSE_CLASS, renderMarkdown } from '../../long-compass/components/markdown'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function ShareViewer({ slug }) {
  const [phase, setPhase] = useState('loading') // loading | fetched | decrypted | error
  const [note, setNote] = useState(null)
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [plain, setPlain] = useState(null)
  const triedHashRef = useRef(false)

  // 拿密文
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        const data = await safeJson(res)
        if (!res.ok || !data?.envelope) {
          if (cancelled) return
          if (res.status === 404) setError('链接不存在或已被删除')
          else if (res.status === 410) setError('这条分享已过期')
          else setError(data?.error || `HTTP_${res.status}`)
          setPhase('error')
          return
        }
        if (cancelled) return
        setNote(data)
        setPhase('fetched')
      } catch (e) {
        if (cancelled) return
        setError(e?.message || 'NETWORK_FAILED')
        setPhase('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const tryDecrypt = useCallback(
    async (envelope, pwd) => {
      setWorking(true)
      setError('')
      try {
        const decoded = await decryptPayload(envelope, pwd)
        setPlain(decoded)
        setPhase('decrypted')
      } catch (e) {
        // PBKDF2/AES-GCM 解密失败 → 一般是密码错；浏览器不会告诉你具体原因
        setError('密码错误或数据损坏')
      } finally {
        setWorking(false)
      }
    },
    []
  )

  // 拿到密文后，如果 URL hash 里带了密码，自动尝试一次
  useEffect(() => {
    if (phase !== 'fetched' || triedHashRef.current) return
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return
    triedHashRef.current = true
    try {
      const pwd = decodeURIComponent(hash)
      setPassword(pwd)
      if (note?.envelope) tryDecrypt(note.envelope, pwd)
    } catch {
      /* ignore */
    }
  }, [phase, note, tryDecrypt])

  function handleSubmit(e) {
    e.preventDefault()
    if (!note?.envelope || !password) return
    tryDecrypt(note.envelope, password)
  }

  if (phase === 'loading') {
    return (
      <main className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Encrypted Share
        </p>
        <p className="mt-3 text-sm text-[#63645a] dark:text-[#9aa6b6]">加载中…</p>
      </main>
    )
  }

  if (phase === 'error') {
    return (
      <main className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Encrypted Share
        </p>
        <h1 className="mt-3 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">
          打不开
        </h1>
        <p className="mt-2 text-sm text-[#a34f47] dark:text-[#b5a09b]">{error}</p>
      </main>
    )
  }

  if (phase === 'fetched') {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Encrypted Share · 端到端加密
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-[#15140f] dark:text-gray-100">
          {note?.title || '加密文档'}
        </h1>
        <p className="mt-3 text-[13px] leading-7 text-[#51514a] dark:text-gray-300">
          这是一份端到端加密文档，<strong>服务器看不到内容</strong>，需要密码才能解锁。
          密码错误时只会在你的浏览器里失败，服务器既不知道你猜了什么，也不知道你猜对了没。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">
              访问密码
            </span>
            <input
              type="password"
              autoComplete="off"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="粘贴或输入密码"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>
          {error ? <p className="text-sm text-[#a34f47] dark:text-[#b5a09b]">{error}</p> : null}
          <button
            type="submit"
            disabled={working || !password}
            className="w-full rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#9aa170]"
          >
            {working ? '解密中…' : '解锁'}
          </button>
        </form>
        <p className="mt-6 text-[11px] text-[#858779] dark:text-[#8e9ab0]">
          提示：把密码加到链接末尾 <code className="rounded bg-[#e7e8e0] px-1 py-px font-mono text-[10px] dark:bg-[#19212b]">#密码</code>{' '}
          即可自动解锁；这样 URL 自带密码，下次直接打开。
        </p>
      </main>
    )
  }

  // decrypted
  const plainText =
    typeof plain === 'string' ? plain : plain?.content || plain?.markdown || JSON.stringify(plain, null, 2)
  return (
    <main className="mx-auto w-full max-w-[760px] px-4 py-8 md:py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
        Encrypted Share · 已解锁
      </p>
      <h1 className="mb-2 mt-3 font-serif text-2xl font-semibold text-[#15140f] dark:text-gray-100 md:text-3xl">
        {note?.title || '加密文档'}
      </h1>
      <p className="mb-6 text-[11.5px] text-[#858779] dark:text-[#8e9ab0]">
        创建 {formatDate(note?.created_at)}
        {note?.updated_at && note.updated_at !== note.created_at ? ` · 更新 ${formatDate(note.updated_at)}` : ''}
        {note?.expires_at ? ` · 到期 ${formatDate(note.expires_at)}` : ''}
      </p>
      <div
        className={PROSE_CLASS}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(plainText) }}
      />
      <p className="mt-8 border-t border-[#dee0db] pt-4 text-[11px] text-[#858779] dark:border-[#252e39] dark:text-[#8e9ab0]">
        内容已在你的浏览器解密。服务器始终看不到明文。关闭页面后明文不会保留。
      </p>
    </main>
  )
}

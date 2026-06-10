'use client'

import { useEffect, useState } from 'react'

import { renderMarkdown } from '../../../../../../lib/research/markdown'

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// 与 lib/research/crypto.js（Node 端 AES-256-GCM + PBKDF2）对应的浏览器侧解密
async function decryptPayload(payload, password) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(payload.salt),
      iterations: payload.iter,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.data),
  )
  return new TextDecoder().decode(plainBuf)
}

export default function EncryptedArticle({ payload, storageKey }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [markdown, setMarkdown] = useState('')

  // 同一会话内已解密过 → 直接还原，不再要求重新输入
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(storageKey)
      if (cached) setMarkdown(cached)
    } catch {
      // sessionStorage 不可用时忽略
    }
  }, [storageKey])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      const text = await decryptPayload(payload, password)
      setMarkdown(text)
      try {
        sessionStorage.setItem(storageKey, text)
      } catch {
        // 忽略存储失败
      }
    } catch {
      setError('密码错误，无法解密。')
    } finally {
      setBusy(false)
    }
  }

  if (markdown) {
    return (
      <article className="prose-tuaran" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
    )
  }

  return (
    <div className="mx-auto mt-2 max-w-md rounded-xl border border-[#dee0db] bg-white p-7 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#c9cbb8] bg-[#ebede3] text-[#8a5a14] dark:border-[#26281c] dark:bg-[#1c1d15] dark:text-[#9ba475]">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="9" width="12" height="8" rx="1.6" />
          <path d="M6.8 9V6.6a3.2 3.2 0 0 1 6.4 0V9" />
        </svg>
      </div>

      <h2 className="mt-4 text-lg text-[#444] dark:text-gray-200">本篇调研已加密</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-400">
        输入密码以查看完整内容。解密在你的浏览器本地完成，密码不会上传。
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入访问密码"
          autoComplete="off"
          className="w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm text-[#333] outline-none focus:border-[#818472] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={busy || !password}
          className="inline-flex items-center justify-center rounded-lg bg-[#444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-200 dark:text-[#111] dark:hover:bg-white"
        >
          {busy ? '解密中…' : '解锁查看'}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-[#b42318] dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

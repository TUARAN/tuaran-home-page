'use client'

import { useState } from 'react'

const DEFAULT_SYNCBLOG_URL = 'https://syncblog.cn/md/#content-sync'
const READY_TYPE = 'SYNCBLOG_IMPORT_READY'
const IMPORT_TYPE = 'SYNCBLOG_IMPORT_ARTICLE'

function getTargetOrigin(targetUrl) {
  try {
    return new URL(targetUrl).origin
  } catch {
    return 'https://syncblog.cn'
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // navigator.clipboard 不可用时退化到 execCommand。
  }

  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    return true
  } catch {
    return false
  } finally {
    document.body.removeChild(ta)
  }
}

export default function DistributeMarkdownButton({
  title,
  summary,
  markdown,
  images = [],
  url,
  category,
  slug,
  tags = [],
}) {
  const [state, setState] = useState('idle')

  function flash(next) {
    setState(next)
    setTimeout(() => setState('idle'), 2600)
  }

  async function handleDistribute() {
    const localSyncblogUrl = 'http://localhost:5173/md/#content-sync'
    const targetUrl =
      process.env.NEXT_PUBLIC_SYNCBLOG_IMPORT_URL
      || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? localSyncblogUrl
        : DEFAULT_SYNCBLOG_URL)
    const targetOrigin = getTargetOrigin(targetUrl)
    const win = window.open(targetUrl, 'syncblog-distribute')

    if (!win) {
      const copied = await copyText(markdown)
      flash(copied ? 'blocked' : 'failed')
      return
    }

    const payload = {
      version: 1,
      source: '2aran.com',
      type: IMPORT_TYPE,
      title,
      summary,
      canonicalUrl: url,
      category,
      slug,
      tags,
      coverImage: images[0] || null,
      images,
      markdown,
      importedAt: new Date().toISOString(),
    }

    let delivered = false
    let attempts = 0

    const send = () => {
      if (delivered || win.closed) return
      attempts += 1
      win.postMessage(payload, targetOrigin)
      if (attempts >= 20) {
        clearInterval(timer)
        copyText(markdown).then((copied) => flash(copied ? 'copied' : 'failed'))
      }
    }

    const onMessage = (event) => {
      if (event.origin !== targetOrigin) return
      if (event.data?.type !== READY_TYPE) return
      delivered = true
      clearInterval(timer)
      win.postMessage(payload, targetOrigin)
      window.removeEventListener('message', onMessage)
      flash('sent')
    }

    window.addEventListener('message', onMessage)
    const timer = setInterval(send, 500)
    send()
  }

  const label =
    state === 'sent'
      ? '已发送到分发'
      : state === 'copied'
        ? '已复制，去粘贴'
        : state === 'blocked'
          ? '已复制，去分发'
          : state === 'failed'
            ? '分发失败'
            : '分发'

  return (
    <button
      type="button"
      onClick={handleDistribute}
      aria-live="polite"
      title="发送到 syncblog.cn 内容分发页"
      className="article-action-button px-3 py-1 text-xs"
    >
      {state === 'sent' ? (
        <svg
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 7.5L6 11l5.5-7" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 11.5 12 2.5" />
          <path d="m5 2.5 7 0 0 7" />
          <path d="M2 5v6.5h6.5" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}

'use client'

import { useState } from 'react'

export default function ShareResearchButton({ title, text, url }) {
  const [state, setState] = useState('idle')

  function flash(next) {
    setState(next)
    setTimeout(() => setState('idle'), 2000)
  }

  async function copyUrl(targetUrl) {
    try {
      await navigator.clipboard.writeText(targetUrl)
      flash('copied')
      return
    } catch {
      // navigator.clipboard 不可用时退化到 execCommand。
    }

    const input = document.createElement('textarea')
    input.value = targetUrl
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      flash('copied')
    } catch {
      flash('failed')
    }
    document.body.removeChild(input)
  }

  async function handleShare() {
    const targetUrl = url || window.location.href
    const payload = {
      title,
      text,
      url: targetUrl,
    }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(payload)
        flash('shared')
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    await copyUrl(targetUrl)
  }

  const label = state === 'shared' ? '已分享' : state === 'copied' ? '已复制链接' : state === 'failed' ? '分享失败' : '分享'

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-live="polite"
      title="分享本篇调研"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ddd] bg-white px-3 py-1 text-xs text-[#555] transition-colors hover:border-[#999] hover:text-[#222] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
    >
      {state === 'shared' || state === 'copied' ? (
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
          <circle cx="4" cy="7" r="1.8" />
          <circle cx="10.5" cy="3" r="1.8" />
          <circle cx="10.5" cy="11" r="1.8" />
          <path d="M5.6 6.1 8.9 4" />
          <path d="M5.6 7.9 8.9 10" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}

'use client'

import { useState } from 'react'

/**
 * 通用分享按钮：优先调用 navigator.share（移动端会弹原生分享面板），
 * 不可用时退化为复制到剪贴板。
 *
 * props:
 * - title:    页面标题
 * - text:     短分享摘要（会和链接一起组成「文案 + 空行 + URL」）
 * - fullText: 完整分享文案（桌面端复制时一并塞进剪贴板，给用户粘到 X / 公众号用）
 *             不传则使用 text；text / fullText 都不传时才只复制 URL。
 * - url:      SSR 传入的 canonical URL；客户端优先用 window.location.href
 * - exactUrl: true 时 url 视为权威路径（拼 location.origin）
 * - size:     'sm' / 'md'
 */
export default function SharePageButton({ title, text, fullText, url, size = 'sm', exactUrl = false }) {
  const [state, setState] = useState('idle')

  function flash(next) {
    setState(next)
    setTimeout(() => setState('idle'), 2000)
  }

  async function copyToClipboard(payload) {
    try {
      await navigator.clipboard.writeText(payload)
      flash('copied')
      return
    } catch {
      // 退化到 execCommand
    }

    const input = document.createElement('textarea')
    input.value = payload
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
    let targetUrl
    if (exactUrl && typeof window !== 'undefined' && window.location?.origin) {
      targetUrl = /^https?:\/\//.test(url) ? url : `${window.location.origin}${url}`
    } else {
      targetUrl =
        typeof window !== 'undefined' && window.location?.href ? window.location.href : url
    }

    const shareCopy = fullText || text
    const textWithUrl = shareCopy ? `${shareCopy}\n\n${targetUrl}` : targetUrl

    // 移动端原生面板：把链接放进 text 末尾，避免部分平台把单独的 url 排到文案前面。
    const payload = shareCopy ? { title, text: textWithUrl } : { title, url: targetUrl }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(payload)
        flash('shared')
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    await copyToClipboard(textWithUrl)
  }

  const label =
    state === 'shared'
      ? '已分享'
      : state === 'copied'
      ? fullText || text ? '已复制文案 + 链接' : '已复制链接'
      : state === 'failed'
      ? '分享失败'
      : '分享'

  const paddingClass = size === 'md' ? 'px-3.5 py-1.5 text-sm' : 'px-3 py-1 text-xs'

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-live="polite"
      title="分享本页"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ddd] bg-white text-[#555] transition-colors hover:border-[#999] hover:text-[#222] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100 ${paddingClass}`}
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

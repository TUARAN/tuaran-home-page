'use client'

import { useState } from 'react'

/**
 * 通用分享按钮：优先调用 navigator.share（移动端会弹原生分享面板），
 * 不可用时退化为复制链接到剪贴板。所有专题内容页 + 调研详情页共用一份实现。
 *
 * props:
 * - title: 页面标题
 * - text:  可选，分享摘要（一句话即可）
 * - url:   SSR 传入的 canonical URL；客户端会优先用 window.location.href（保留 ?v=、#hash 等运行时参数）
 * - exactUrl: true 时把 url prop 视为权威路径（用 location.origin 拼接），适合 per-anchor 分享场景
 * - size:  'sm' / 'md'
 */
export default function SharePageButton({ title, text, url, size = 'sm', exactUrl = false }) {
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
      // navigator.clipboard 不可用时退化到 execCommand
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
    let targetUrl
    if (exactUrl && typeof window !== 'undefined' && window.location?.origin) {
      // url 是相对路径（如 "/skill-center#xxx"）或绝对路径，按权威值拼接 origin
      targetUrl = /^https?:\/\//.test(url) ? url : `${window.location.origin}${url}`
    } else {
      targetUrl =
        typeof window !== 'undefined' && window.location?.href ? window.location.href : url
    }
    const payload = { title, text, url: targetUrl }

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

  const label =
    state === 'shared'
      ? '已分享'
      : state === 'copied'
      ? '已复制链接'
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

'use client'

import { useState } from 'react'

const DEFAULT_ARTICLE_SYNCBLOG_URL = 'https://syncblog.cn/md/#content-sync'
const DEFAULT_OPINION_SYNCBLOG_URL = 'https://syncblog.cn/md/#opinion-sync'
const READY_TYPE = 'SYNCBLOG_IMPORT_READY'
const GENERIC_READY_TYPE = 'MD_IMPORT_READY'
const ARTICLE_IMPORT_TYPE = 'SYNCBLOG_IMPORT_ARTICLE'
const OPINION_IMPORT_TYPE = 'SYNCBLOG_IMPORT_OPINION'

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
  const [states, setStates] = useState({ article: 'idle', opinion: 'idle' })

  function flash(mode, next) {
    setStates((prev) => ({ ...prev, [mode]: next }))
    setTimeout(() => setStates((prev) => ({ ...prev, [mode]: 'idle' })), 2600)
  }

  function getSelectedOpinionText() {
    if (typeof window === 'undefined') return ''
    const selected = window.getSelection?.()?.toString()?.trim() || ''
    return selected.replace(/\s+/g, ' ').slice(0, 1200)
  }

  function buildOpinionText() {
    const opinion = getSelectedOpinionText() || String(summary || title || '').trim()
    const body = opinion || `我刚更新了一篇调研：${title}`
    return `${body}\n\n原文：${url}`
  }

  async function handleDistribute(mode) {
    const isOpinion = mode === 'opinion'
    const localSyncblogUrl = isOpinion
      ? 'http://localhost:5173/md/#opinion-sync'
      : 'http://localhost:5173/md/#content-sync'
    const defaultUrl = isOpinion ? DEFAULT_OPINION_SYNCBLOG_URL : DEFAULT_ARTICLE_SYNCBLOG_URL
    const targetUrl =
      (isOpinion ? process.env.NEXT_PUBLIC_SYNCBLOG_OPINION_IMPORT_URL : process.env.NEXT_PUBLIC_SYNCBLOG_IMPORT_URL)
      || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? localSyncblogUrl
        : defaultUrl)
    const targetOrigin = getTargetOrigin(targetUrl)
    const win = window.open(targetUrl, isOpinion ? 'syncblog-opinion-distribute' : 'syncblog-article-distribute')
    const fallbackText = isOpinion ? buildOpinionText() : markdown

    if (!win) {
      const copied = await copyText(fallbackText)
      flash(mode, copied ? 'blocked' : 'failed')
      return
    }

    const commonPayload = {
      version: 1,
      source: '2aran.com',
      title,
      summary,
      canonicalUrl: url,
      category,
      slug,
      tags,
      importedAt: new Date().toISOString(),
    }
    const payload = isOpinion
      ? {
          ...commonPayload,
          type: OPINION_IMPORT_TYPE,
          opinion: fallbackText,
          coverImage: images[0] || null,
        }
      : {
          ...commonPayload,
          type: ARTICLE_IMPORT_TYPE,
          coverImage: images[0] || null,
          images,
          markdown,
        }

    let delivered = false
    let attempts = 0

    const send = () => {
      if (delivered || win.closed) return
      attempts += 1
      win.postMessage(payload, targetOrigin)
      if (attempts >= 20) {
        clearInterval(timer)
        copyText(fallbackText).then((copied) => flash(mode, copied ? 'copied' : 'failed'))
      }
    }

    const onMessage = (event) => {
      if (event.origin !== targetOrigin) return
      if (event.data?.type !== READY_TYPE && event.data?.type !== GENERIC_READY_TYPE) return
      delivered = true
      clearInterval(timer)
      win.postMessage(payload, targetOrigin)
      window.removeEventListener('message', onMessage)
      flash(mode, 'sent')
    }

    window.addEventListener('message', onMessage)
    const timer = setInterval(send, 500)
    send()
  }

  function getLabel(mode) {
    const state = states[mode]
    const idleLabel = mode === 'opinion' ? '分发观点' : '分发文章'
    return state === 'sent'
      ? '已发送到分发'
      : state === 'copied'
        ? '已复制，去粘贴'
        : state === 'blocked'
          ? '已复制，去分发'
          : state === 'failed'
            ? '分发失败'
            : idleLabel
  }

  function DistributeIcon({ active }) {
    if (active) {
      return (
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
      )
    }
    return (
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
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleDistribute('article')}
        aria-live="polite"
        title="发送到 syncblog.cn 文章分发页"
        className="article-action-button px-3 py-1 text-xs"
      >
        <DistributeIcon active={states.article === 'sent'} />
        <span>{getLabel('article')}</span>
      </button>
      <button
        type="button"
        onClick={() => handleDistribute('opinion')}
        aria-live="polite"
        title="发送到 syncblog.cn 观点分发页；若先选中正文，会优先分发选中文本"
        className="article-action-button px-3 py-1 text-xs"
      >
        <DistributeIcon active={states.opinion === 'sent'} />
        <span>{getLabel('opinion')}</span>
      </button>
    </>
  )
}

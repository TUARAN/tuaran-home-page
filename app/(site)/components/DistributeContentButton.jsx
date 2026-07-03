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

function resolveCanonicalUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (typeof window !== 'undefined' && value.startsWith('/')) return `${window.location.origin}${value}`
  return value
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

export default function DistributeContentButton({
  title,
  summary,
  markdown,
  images = [],
  url,
  category,
  slug,
  tags = [],
  kindLabel = '内容',
  allowArticle = false,
}) {
  const modes = allowArticle ? ['article', 'opinion'] : ['opinion']
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
    const selected = getSelectedOpinionText()
    const seed = selected || String(summary || '').trim()
    const body = seed || `推荐一个${kindLabel}：${title}`
    return `${body}\n\n${title ? `标题：${title}\n` : ''}原文：${resolveCanonicalUrl(url)}`
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
    const fallbackText = isOpinion ? buildOpinionText() : String(markdown || '').trim()

    if (!fallbackText) {
      flash(mode, 'failed')
      return
    }

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
      canonicalUrl: resolveCanonicalUrl(url),
      category,
      slug,
      tags,
      kind: kindLabel,
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
          markdown: fallbackText,
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
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => handleDistribute(mode)}
          aria-live="polite"
          title={
            mode === 'opinion'
              ? '发送到 syncblog.cn 观点分发页；若先选中正文，会优先分发选中文本'
              : '发送到 syncblog.cn 文章分发页'
          }
          className="article-action-button px-3 py-1 text-xs"
        >
          <DistributeIcon active={states[mode] === 'sent'} />
          <span>{getLabel(mode)}</span>
        </button>
      ))}
    </>
  )
}

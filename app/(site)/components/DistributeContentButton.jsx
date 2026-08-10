'use client'

import { useRef, useState } from 'react'
import { IconLock } from '@tabler/icons-react'
import ArticleActionsDropdown from './ArticleActionsDropdown'
import { useSessionAccount } from './SessionProvider'
import { copyPlainText, copyRichText, markdownToPlainText } from '../../../lib/contentClipboard'

const DEFAULT_ARTICLE_SYNCBLOG_URL = 'https://syncblog.cn/md/#content-sync'
const DEFAULT_OPINION_SYNCBLOG_URL = 'https://syncblog.cn/#opinion-sync'
const READY_TYPE = 'SYNCBLOG_IMPORT_READY'
const GENERIC_READY_TYPE = 'MD_IMPORT_READY'
const ARTICLE_IMPORT_TYPE = 'SYNCBLOG_IMPORT_ARTICLE'
const OPINION_IMPORT_TYPE = 'MD_IMPORT_OPINION'
const OPINION_RESULT_TYPE = 'MD_IMPORT_RESULT'
const X_ARTICLE_COMPOSE_URL = 'https://x.com/compose/articles'

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

function isLocalSite() {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function resolveOpinionEntry() {
  const configuredUrl = process.env.NEXT_PUBLIC_SYNCBLOG_OPINION_IMPORT_URL
    || process.env.NEXT_PUBLIC_OPINION_IMPORT_URL
  const configuredOrigin = process.env.NEXT_PUBLIC_OPINION_EDITOR_ORIGIN

  if (configuredUrl) return configuredUrl
  if (configuredOrigin) return `${configuredOrigin.replace(/\/$/, '')}/#opinion-sync`
  return DEFAULT_OPINION_SYNCBLOG_URL
}

export default function DistributeContentButton({
  title,
  summary,
  markdown,
  html,
  images = [],
  url,
  category,
  slug,
  tags = [],
  kindLabel = '内容',
  allowArticle = false,
}) {
  const { loading, isOwner } = useSessionAccount()
  const [states, setStates] = useState({ article: 'idle', opinion: 'idle' })
  const [xState, setXState] = useState('idle')
  const [xArticleState, setXArticleState] = useState('idle')
  const xPublishingRef = useRef(false)

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

  function buildCommonPayload() {
    return {
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
  }

  function handleOpinionDistribute() {
    const targetUrl = resolveOpinionEntry()
    const targetOrigin = getTargetOrigin(targetUrl)
    const win = window.open(targetUrl, 'md-editor')
    const fallbackText = buildOpinionText()

    if (!fallbackText) {
      flash('opinion', 'failed')
      return
    }

    if (!win) {
      window.alert?.('请允许弹出窗口')
      flash('opinion', 'failed')
      return
    }

    let sent = false
    const requestId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const payload = {
      ...buildCommonPayload(),
      type: OPINION_IMPORT_TYPE,
      requestId,
      opinion: fallbackText,
      content: fallbackText,
      markdown: fallbackText,
      coverImage: images[0] || null,
    }

    const cleanup = () => {
      clearTimeout(timeout)
      window.removeEventListener('message', onMessage)
    }

    const onMessage = (event) => {
      if (event.origin !== targetOrigin) return

      if (event.data?.type === GENERIC_READY_TYPE && !sent) {
        sent = true
        win.postMessage(payload, targetOrigin)
        return
      }

      if (event.data?.type === OPINION_RESULT_TYPE && event.data?.requestId === requestId) {
        cleanup()
        if (event.data.ok) {
          flash('opinion', 'sent')
        } else {
          console.warn('导入失败:', event.data.reason)
          flash('opinion', 'failed')
        }
      }
    }

    window.addEventListener('message', onMessage)
    const timeout = setTimeout(() => {
      cleanup()
      flash('opinion', sent ? 'sent' : 'failed')
    }, 30000)
  }

  async function handleArticleDistribute() {
    const localSyncblogUrl = 'http://localhost:5173/md/#content-sync'
    const targetUrl =
      process.env.NEXT_PUBLIC_SYNCBLOG_IMPORT_URL
      || (isLocalSite() ? localSyncblogUrl : DEFAULT_ARTICLE_SYNCBLOG_URL)
    const targetOrigin = getTargetOrigin(targetUrl)
    const win = window.open(targetUrl, 'syncblog-article-distribute')
    const fallbackText = String(markdown || '').trim()

    if (!fallbackText) {
      flash('article', 'failed')
      return
    }

    if (!win) {
      const copied = await copyPlainText(fallbackText)
      flash('article', copied ? 'blocked' : 'failed')
      return
    }

    const payload = {
      ...buildCommonPayload(),
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
        copyPlainText(fallbackText).then((copied) => flash('article', copied ? 'copied' : 'failed'))
      }
    }

    const onMessage = (event) => {
      if (event.origin !== targetOrigin) return
      if (event.data?.type !== READY_TYPE && event.data?.type !== GENERIC_READY_TYPE) return
      delivered = true
      clearInterval(timer)
      win.postMessage(payload, targetOrigin)
      window.removeEventListener('message', onMessage)
      flash('article', 'sent')
    }

    window.addEventListener('message', onMessage)
    const timer = setInterval(send, 500)
    send()
  }

  function handleDistribute(mode) {
    if (mode === 'opinion') {
      handleOpinionDistribute()
      return
    }
    handleArticleDistribute()
  }

  async function handleOwnerDistribute() {
    if (xPublishingRef.current) return
    xPublishingRef.current = true
    setXState('publishing')
    try {
      const response = await fetch('/api/distribution/x', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, url: resolveCanonicalUrl(url) }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.post?.url) {
        console.warn('X 分发失败:', result?.error, result?.detail)
        window.alert?.(
          result?.error === 'X_NOT_CONFIGURED'
            ? 'X 分发尚未配置，请先设置服务端 API Key 与 Access Token。'
            : `X 分发失败${result?.detail ? `：${result.detail}` : '，请稍后重试。'}`,
        )
        setXState('failed')
        return
      }
      setXState('sent')
      window.open(result.post.url, '_blank', 'noopener,noreferrer')
    } catch {
      window.alert?.('X 分发请求失败，请检查网络后重试。')
      setXState('failed')
    } finally {
      xPublishingRef.current = false
      setTimeout(() => setXState('idle'), 3200)
    }
  }

  async function handleOwnerArticleDistribute() {
    const articleDraft = String(markdown || '').trim()
    if (!articleDraft) {
      window.alert?.('当前文章没有可分发的 Markdown 正文。')
      setXArticleState('failed')
      setTimeout(() => setXArticleState('idle'), 3200)
      return
    }

    const articleWindow = window.open('', 'x-article-compose')
    if (articleWindow) {
      articleWindow.opener = null
      articleWindow.location.replace(X_ARTICLE_COMPOSE_URL)
    }
    const copyResult = await copyRichText({
      html,
      text: markdownToPlainText(articleDraft),
    })
    const copied = copyResult.copied
    if (!articleWindow) {
      window.alert?.(copied
        ? `${copyResult.format === 'rich' ? '文章富文本' : '文章纯文本'}已复制，请允许弹出窗口后打开 X Articles 编辑器。`
        : '无法打开 X Articles 编辑器，请允许弹出窗口后重试。')
    }
    setXArticleState(copied ? 'copied' : 'failed')
    setTimeout(() => setXArticleState('idle'), 3200)
  }

  function getLabel(mode) {
    const state = states[mode]
    const idleLabel = mode === 'opinion' ? '分发观点至 SyncBlog' : '分发文章至 SyncBlog'
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

  // SyncBlog 与 X 分发都是站长的发布工作流，不属于读者操作。
  // 读者侧的分享、复制 Markdown、下载等按钮由各自组件继续提供。
  if (loading || !isOwner) return null

  return (
    <ArticleActionsDropdown
      label={(
        <span className="inline-flex items-center gap-1">
          <IconLock size={11} strokeWidth={2.2} aria-hidden="true" />
          站长分发
        </span>
      )}
      triggerClassName="owner-only-action"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => handleDistribute('article')}
        aria-live="polite"
        title="发送到 syncblog.cn 文章分发页"
        className="article-action-button owner-only-action px-3 py-1 text-xs"
      >
        <DistributeIcon active={states.article === 'sent'} />
        <span>{getLabel('article')}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleDistribute('opinion')}
        aria-live="polite"
        title="发送到 syncblog.cn 观点分发页；若先选中正文，会优先分发选中文本"
        className="article-action-button owner-only-action px-3 py-1 text-xs"
      >
        <DistributeIcon active={states.opinion === 'sent'} />
        <span>{getLabel('opinion')}</span>
      </button>
      {allowArticle ? (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={handleOwnerDistribute}
            disabled={xState === 'publishing'}
            aria-live="polite"
            title="由站长账号通过 X API 直接发布 Post"
            className="article-action-button owner-only-action px-3 py-1 text-xs disabled:cursor-wait disabled:opacity-60"
          >
            <DistributeIcon active={xState === 'sent'} />
            <span>{xState === 'publishing' ? '正在发布 Post' : xState === 'sent' ? 'Post 已发布' : xState === 'failed' ? 'Post 分发失败' : '发布 Post 至 X'}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleOwnerArticleDistribute}
            aria-live="polite"
            title="复制 X 可直接粘贴的富文本并打开 X Articles 编辑器"
            className="article-action-button owner-only-action px-3 py-1 text-xs"
          >
            <DistributeIcon active={xArticleState === 'copied'} />
            <span>{xArticleState === 'copied' ? '已复制，前往 X 文章' : xArticleState === 'failed' ? '文章分发失败' : '发布文章至 X'}</span>
          </button>
        </>
      ) : null}
    </ArticleActionsDropdown>
  )
}

'use client'

import { useState } from 'react'

import { adminSiteUrl } from '../../../lib/publicAdminOrigin'

function failureMessage(data, status) {
  const code = data?.error || ''
  if (status === 401 || code === 'NOT_AUTHENTICATED') return '请先用站长账号登录后再退回草稿。'
  if (status === 403 || code === 'NOT_OWNER') return '只有站长可以把文章退回草稿。'
  if (code === 'REVISION_CONFLICT') return '这篇刚刚被更新过，请刷新页面后再试。'
  if (data?.message) return String(data.message)
  return '退回草稿失败，请稍后在后台再试一次。'
}

async function readJson(response) {
  return response.json().catch(() => null)
}

export default function RevertToDraftButton({ sourcePath = '', articleId = '' }) {
  const [busy, setBusy] = useState(false)
  if (!sourcePath && !articleId) return null

  async function revertResearch(endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, status: 'draft' }),
    })
    const data = await readJson(response)
    if (!response.ok) throw new Error(failureMessage(data, response.status))
    return adminSiteUrl(`/admin/articles/research-import?path=${encodeURIComponent(sourcePath)}`, window.location.hostname)
  }

  async function revertArticle(endpoint) {
    const currentResponse = await fetch(endpoint, { credentials: 'include', cache: 'no-store' })
    const current = await readJson(currentResponse)
    if (!currentResponse.ok || !current?.article) throw new Error(failureMessage(current, currentResponse.status))
    const article = current.article
    const response = await fetch(endpoint, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        coverUrl: article.coverUrl,
        content: article.content,
        contentText: article.contentText,
        tags: article.tags,
        revision: article.revision,
        status: 'draft',
      }),
    })
    const data = await readJson(response)
    if (!response.ok) throw new Error(failureMessage(data, response.status))
    return adminSiteUrl(`/admin/articles/${encodeURIComponent(articleId)}/edit`, window.location.hostname)
  }

  async function revert() {
    if (busy) return
    const confirmed = window.confirm('退回为草稿后，这篇会从公开页面消失，并出现在后台草稿里。确定继续？')
    if (!confirmed) return
    setBusy(true)
    try {
      const hostname = window.location.hostname
      const nextUrl = sourcePath
        ? await revertResearch(adminSiteUrl('/api/admin/research-documents', hostname))
        : await revertArticle(adminSiteUrl(`/api/admin/articles/${encodeURIComponent(articleId)}`, hostname))
      window.location.assign(nextUrl)
    } catch (error) {
      window.alert(error?.message || '退回草稿失败，请稍后在后台再试一次。')
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={revert}
      disabled={busy}
      title="把已发布内容改回后台草稿，公开页不再展示"
      className="article-action-button px-3 py-1 text-xs text-rose-700 disabled:opacity-60 dark:text-rose-300"
    >
      <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 6.5A4.5 4.5 0 1 0 4 3.5" />
        <path d="M2 2.5v3.2h3.2" />
      </svg>
      <span>{busy ? '退回中…' : '退回为草稿'}</span>
    </button>
  )
}

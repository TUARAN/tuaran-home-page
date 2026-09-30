'use client'

import { useCallback, useEffect, useState } from 'react'

import { pickGenericXReply } from '../../../../lib/xReplyTasks'
import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'

const STATUS_META = {
  draft: { label: '待确认', tone: 'neutral' },
  publishing: { label: '发布中', tone: 'warning' },
  published: { label: '已发布', tone: 'success' },
  'publish-unknown': { label: '结果待核实', tone: 'warning' },
  failed: { label: '失败', tone: 'danger' },
}

const ERROR_LABELS = {
  INVALID_X_POST_URL: '请输入有效的 X 帖子链接或 Post ID。',
  REPLY_TEXT_REQUIRED: '请先填写回复内容。',
  REPLY_TEXT_TOO_LONG: '回复超过 X 的长度限制。',
  TARGET_ALREADY_QUEUED: '这个帖子已经创建过回复任务。',
  X_NOT_CONFIGURED: 'X API 凭据尚未配置。',
  X_PUBLISH_FAILED: 'X 拒绝了这次回复；请确认原帖已明确 @提及或引用你的账号。',
  MIGRATION_REQUIRED: '请先应用数据库迁移 0103_x_reply_tasks.sql。',
}

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

export default function XReplyTasksClient() {
  const [tasks, setTasks] = useState([])
  const [targetUrl, setTargetUrl] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replySource, setReplySource] = useState('manual')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishingId, setPublishingId] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [migrationRequired, setMigrationRequired] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/x-replies', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setTasks(payload?.tasks || [])
      setMigrationRequired(payload?.migrationRequired || '')
    } catch (refreshError) {
      setError(ERROR_LABELS[refreshError.message] || refreshError.message || '任务读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function setAndCopy(text, source) {
    setReplyText(text)
    setReplySource(source)
    setError('')
    try {
      await copyText(text)
      setNotice('已生成并复制到剪贴板。')
    } catch {
      setNotice('已生成；浏览器未允许自动复制，请手动复制。')
    }
  }

  async function randomFromLibrary() {
    await setAndCopy(pickGenericXReply(), 'library')
  }

  async function generateWithAi() {
    setGenerating(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/x-replies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'generate-ai' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await setAndCopy(payload.text, 'ai')
    } catch (generationError) {
      setError(ERROR_LABELS[generationError.message] || generationError.message || '模型生成失败。')
    } finally {
      setGenerating(false)
    }
  }

  async function createTask(event) {
    event.preventDefault()
    setCreating(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/x-replies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'create', targetUrl, replyText, source: replySource }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setTasks((current) => [payload.task, ...current])
      setTargetUrl('')
      setReplyText('')
      setReplySource('manual')
      setNotice('回复任务已保存，发布前仍需人工确认。')
    } catch (createError) {
      setError(ERROR_LABELS[createError.message] || createError.message || '任务创建失败。')
    } finally {
      setCreating(false)
    }
  }

  async function publishTask(task) {
    const confirmed = window.confirm(`确认通过 X API 发布这条回复？\n\n${task.replyText}`)
    if (!confirmed) return
    setPublishingId(task.id); setError(''); setNotice('')
    try {
      const response = await fetch(`/api/admin/x-replies/${task.id}/publish`, { method: 'POST' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setTasks((current) => current.map((item) => item.id === task.id ? payload.task : item))
      setNotice('X 回复发布成功。')
    } catch (publishError) {
      setError(ERROR_LABELS[publishError.message] || publishError.message || '发布失败。')
      await refresh()
    } finally {
      setPublishingId(0)
    }
  }

  return (
    <AdminPage
      title="X 回复任务"
      description="录入符合条件的目标帖子，准备短回复，人工确认后通过 X API 发布。"
      actions={<AdminButton type="button" onClick={refresh} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        自助付费 X API 只允许回复已经明确 @提及或引用你的账号的帖子。每个目标只建一个任务；模型生成的内容不会自动发布。
      </div>
      {migrationRequired ? <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">请先应用数据库迁移 {migrationRequired}。</div> : null}
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <Section
        title="通用回复生成器"
        description="短句库在浏览器本地随机抽取；模型按钮调用 DeepSeek。两个按钮都会把结果写入下方回复框并尝试复制。"
        className="mb-4"
      >
        <div className="flex flex-wrap gap-2">
          <AdminButton type="button" onClick={randomFromLibrary}>随机短句并复制</AdminButton>
          <AdminButton type="button" variant="ghost" onClick={generateWithAi} disabled={generating}>
            {generating ? '模型生成中…' : '模型生成并复制'}
          </AdminButton>
        </div>
      </Section>

      <Section title="新建回复任务" description="可以输入完整 X 链接，也可以直接输入数字 Post ID。" className="mb-4">
        <form onSubmit={createTask} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#44463d] dark:text-gray-200">目标帖子</span>
            <input
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://x.com/username/status/1234567890"
              className="w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-sm outline-none focus:border-[#7f8372] dark:border-[#2d3744] dark:bg-[#10161f]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#44463d] dark:text-gray-200">回复内容</span>
            <textarea
              value={replyText}
              onChange={(event) => { setReplyText(event.target.value); setReplySource('manual') }}
              rows={3}
              maxLength={280}
              placeholder="先生成一句，或直接输入回复。"
              className="w-full resize-y rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#7f8372] dark:border-[#2d3744] dark:bg-[#10161f]"
            />
            <span className="mt-1 block text-right text-xs text-[#96988e]">{replyText.length} / 280</span>
          </label>
          <AdminButton type="submit" disabled={creating || Boolean(migrationRequired)}>{creating ? '保存中…' : '保存为待确认任务'}</AdminButton>
        </form>
      </Section>

      <Section title="任务记录" description="只有“待确认”和明确失败的任务可以再次点击发布。">
        <div className="space-y-3">
          {!tasks.length && !loading ? <p className="m-0 text-sm text-[#77796e] dark:text-gray-400">还没有回复任务。</p> : null}
          {tasks.map((task) => {
            const meta = STATUS_META[task.status] || { label: task.status, tone: 'neutral' }
            const canPublish = task.status === 'draft' || task.status === 'failed'
            return (
              <article key={task.id} className="rounded-xl border border-[#e2e4da] bg-white p-4 dark:border-[#243041] dark:bg-[#10161f]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={meta.tone} size="sm">{meta.label}</StatusPill>
                      <span className="text-xs text-[#96988e]">#{task.id} · {formatTime(task.createdAt)}</span>
                    </div>
                    <p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-6 text-[#34352f] dark:text-gray-100">{task.replyText}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <a href={task.targetUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">查看目标帖子 ↗</a>
                      {task.replyPostUrl ? <a href={task.replyPostUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline dark:text-emerald-300">查看已发布回复 ↗</a> : null}
                      <span className="text-[#96988e]">来源：{task.source === 'library' ? '短句库' : task.source === 'ai' ? '模型' : '手写'}</span>
                    </div>
                    {task.error ? <p className="mb-0 mt-2 text-xs text-rose-600 dark:text-rose-300">{task.error}</p> : null}
                  </div>
                  {canPublish ? (
                    <AdminButton type="button" onClick={() => publishTask(task)} disabled={publishingId === task.id}>
                      {publishingId === task.id ? '发布中…' : task.status === 'failed' ? '确认重试' : '确认并发布'}
                    </AdminButton>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </Section>
    </AdminPage>
  )
}

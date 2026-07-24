'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IconAlertTriangle,
  IconClock,
  IconDownload,
  IconPhotoUp,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
  IconTrash,
  IconVideo,
} from '@tabler/icons-react'

import { useSessionAccount } from '../../components/SessionProvider'

const MAX_SCRIPT_CHARS = 200
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/png,image/jpeg,image/webp'
const ACTIVE_STATUSES = new Set(['preparing', 'queued', 'processing'])

const STATUS_META = {
  preparing: { label: '正在生成语音', tone: 'amber' },
  queued: { label: '等待生成', tone: 'sky' },
  processing: { label: '正在驱动人物', tone: 'violet' },
  succeeded: { label: '生成完成', tone: 'emerald' },
  failed: { label: '生成失败', tone: 'rose' },
  canceled: { label: '已取消', tone: 'stone' },
}

const STATUS_TONES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
  sky: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
  stone: 'border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-300',
}

async function safeJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 200) }
  }
}

function formatSize(bytes) {
  const value = Number(bytes || 0)
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(value / 1024))} KB`
}

function formatTime(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(Number(value)))
  } catch {
    return ''
  }
}

function displayError(data, status) {
  if (data?.error === 'BETA_OWNER_ONLY') return '数字人口播目前处于站长内测阶段。'
  if (data?.error === 'ACTIVE_JOB_EXISTS') return '已有一个任务正在生成，请等待它完成。'
  if (data?.error === 'RATE_LIMITED') return '今天的生成次数已经用完。'
  if (data?.error === 'MIGRATION_REQUIRED') return '数字人口播数据表尚未部署。'
  if (data?.error === 'DIGITAL_HUMAN_UNAVAILABLE') return data?.message || '数字人口播服务尚未配置完成。'
  if (data?.error === 'PROVIDER_NOT_CONFIGURED') return '数字人生成服务尚未配置。'
  if (data?.error === 'TTS_FAILED') return '中文语音生成失败，请稍后再试。'
  return data?.message || data?.detail || data?.error || `请求失败（${status}）`
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.failed
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[meta.tone]}`}>
      {ACTIVE_STATUSES.has(status) ? (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {meta.label}
    </span>
  )
}

export default function DigitalHumanTool() {
  const fileInputRef = useRef(null)
  const { user, loading: userLoading, isOwner } = useSessionAccount()
  const [jobs, setJobs] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [script, setScript] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isAuthed = Boolean(user)
  const activeJob = useMemo(
    () => jobs.find((job) => ACTIVE_STATUSES.has(job.status)) || null,
    [jobs]
  )
  const latestResult = useMemo(
    () => jobs.find((job) => job.status === 'succeeded' && job.resultUrl) || null,
    [jobs]
  )
  const canSubmit =
    isAuthed &&
    selectedFile &&
    script.trim() &&
    script.trim().length <= MAX_SCRIPT_CHARS &&
    consent &&
    !submitting &&
    !activeJob

  const refreshJobs = useCallback(async () => {
    if (!isAuthed) {
      setJobs([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/digital-human/jobs', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(displayError(data, response.status))
      setJobs(Array.isArray(data?.jobs) ? data.jobs : [])
      setError('')
    } catch (nextError) {
      setError(nextError?.message || '任务记录加载失败')
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  const refreshJob = useCallback(async (jobId) => {
    try {
      const response = await fetch(`/api/digital-human/jobs/${encodeURIComponent(jobId)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(response)
      if (!response.ok || !data?.job) return
      setJobs((list) => [
        data.job,
        ...list.filter((job) => job.id !== data.job.id),
      ].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)))
      if (data.job.status === 'succeeded') {
        setMessage('数字人口播已经生成完成。')
      }
      if (data.job.status === 'failed') {
        setError(data.job.errorDetail || '数字人口播生成失败。')
      }
    } catch {
      // 轮询是 best-effort，下一次轮询或 webhook 仍可恢复状态。
    }
  }, [])

  useEffect(() => {
    if (!userLoading && isAuthed) refreshJobs()
    if (!userLoading && !isAuthed) {
      setJobs([])
      setError('')
    }
  }, [isAuthed, refreshJobs, userLoading])

  useEffect(() => {
    if (!activeJob?.id) return undefined
    refreshJob(activeJob.id)
    const timer = window.setInterval(() => refreshJob(activeJob.id), 4000)
    return () => window.clearInterval(timer)
  }, [activeJob?.id, refreshJob])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function login() {
    window.location.href = `/login?returnTo=${encodeURIComponent('/tools/digital-human')}`
  }

  function chooseFile(file) {
    setError('')
    setMessage('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('请选择 JPG、PNG 或 WebP 人物照片。')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('人物照片不能超过 5 MB。')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const form = new FormData()
      form.set('file', selectedFile)
      form.set('script', script.trim())
      form.set('consent', consent ? 'true' : 'false')
      const response = await fetch('/api/digital-human/jobs', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const data = await safeJson(response)
      if (!response.ok || !data?.job) {
        throw new Error(displayError(data, response.status))
      }
      setJobs((list) => [data.job, ...list.filter((job) => job.id !== data.job.id)])
      setMessage('任务已提交，可以留在本页等待生成。')
      setSelectedFile(null)
      setScript('')
      setConsent(false)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (nextError) {
      setError(nextError?.message || '任务提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeOrCancel(job) {
    if (!job?.id || deletingId) return
    const active = ACTIVE_STATUSES.has(job.status)
    if (!active && !window.confirm('删除这条记录和生成的视频？')) return
    setDeletingId(job.id)
    setError('')
    try {
      const response = await fetch(`/api/digital-human/jobs/${encodeURIComponent(job.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(displayError(data, response.status))
      if (data?.action === 'deleted') {
        setJobs((list) => list.filter((item) => item.id !== job.id))
      } else if (data?.job) {
        setJobs((list) => [data.job, ...list.filter((item) => item.id !== job.id)])
      }
    } catch (nextError) {
      setError(nextError?.message || '操作失败')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-5 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-b border-[#d8d1c4] pb-5 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="mb-0 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
                AI Video Tool
              </p>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">
                内测
              </span>
            </div>
            <h1 className="mb-3 font-serif text-[36px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[46px]">
              数字人口播
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              上传一张正面人物照片，输入中文文案，生成带语音和嘴型的口播视频。当前使用默认中文音色，单次文案最多 {MAX_SCRIPT_CHARS} 字。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[12px] font-semibold text-[#28241d] dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100">
              <IconClock size={16} />
              成片保留 7 天
            </span>
            {!userLoading && !isAuthed ? (
              <button
                type="button"
                onClick={login}
                className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
              >
                登录使用
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#ded8ca] bg-white/[0.68] p-4 dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="mb-0 text-[15px] font-bold">1. 人物照片</h2>
              <span className="text-[11px] text-[#797469] dark:text-[#9da7b5]">JPG / PNG / WebP</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={!isAuthed || Boolean(activeJob)}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                chooseFile(event.dataTransfer.files?.[0])
              }}
              className="flex min-h-[170px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-dashed border-[#cfc5b6] bg-[#fffdf8] px-4 text-center transition hover:border-[#b89143] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#33404e] dark:bg-[#0b1118] dark:hover:border-[#607086]"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="人物照片预览" className="max-h-[240px] w-full object-contain" />
              ) : (
                <>
                  <IconPhotoUp size={36} className="text-[#8a6422] dark:text-[#d4ae66]" />
                  <span className="text-[14px] font-semibold">
                    {isAuthed ? '点击选择或拖入正面照片' : '登录后上传人物照片'}
                  </span>
                  <span className="text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
                    单张不超过 5 MB
                  </span>
                </>
              )}
            </button>
            {selectedFile ? (
              <p className="mb-0 mt-2 truncate text-[11px] text-[#797469] dark:text-[#9da7b5]">
                {selectedFile.name} · {formatSize(selectedFile.size)}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-[#ded8ca] bg-white/[0.68] p-4 dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="mb-0 text-[15px] font-bold">2. 口播文案</h2>
              <span className={`text-[11px] ${script.length > MAX_SCRIPT_CHARS ? 'text-rose-600' : 'text-[#797469] dark:text-[#9da7b5]'}`}>
                {script.length}/{MAX_SCRIPT_CHARS}
              </span>
            </div>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              disabled={!isAuthed || Boolean(activeJob)}
              rows={7}
              maxLength={MAX_SCRIPT_CHARS + 20}
              placeholder="例如：大家好，欢迎来到涂阿燃的个人网站。今天给大家介绍一个刚刚上线的新工具……"
              className="w-full resize-y rounded-md border border-[#d8d1c4] bg-[#fffdf8] px-3 py-2.5 text-[13px] leading-6 outline-none transition focus:border-[#a57b2d] disabled:opacity-60 dark:border-[#33404e] dark:bg-[#0b1118] dark:focus:border-[#d4ae66]"
            />
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] leading-5 text-[#68645a] dark:text-[#aab4c2]">
              <input
                type="checkbox"
                checked={consent}
                disabled={!isAuthed || Boolean(activeJob)}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1"
              />
              <span>我确认拥有该人物肖像和文案的使用权，不用于冒充、欺诈或未经授权的传播。</span>
            </label>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8a6422] px-4 text-[14px] font-bold text-white transition hover:bg-[#6f5019] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d4ae66] dark:text-[#14100a]"
            >
              <IconSparkles size={18} />
              {submitting ? '正在提交…' : activeJob ? '已有任务生成中' : '生成数字人口播'}
            </button>
          </div>

          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : null}
        </aside>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-[#ded8ca] bg-white/[0.68] dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <div className="flex h-12 items-center justify-between border-b border-[#e7dfd1] px-4 dark:border-[#252e38]">
              <h2 className="mb-0 text-[15px] font-bold">视频预览</h2>
              {activeJob ? <StatusBadge status={activeJob.status} /> : latestResult ? <StatusBadge status="succeeded" /> : null}
            </div>
            {latestResult ? (
              <div className="p-4">
                <video
                  key={`${latestResult.id}:${latestResult.updatedAt}`}
                  src={latestResult.resultUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded-md bg-black object-contain"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="mb-0 min-w-0 flex-1 truncate text-[12px] text-[#68645a] dark:text-[#aab4c2]">
                    {latestResult.script}
                  </p>
                  <a
                    href={`${latestResult.resultUrl}?download=1`}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-[#25221b] px-3 text-[12px] font-semibold text-white no-underline transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
                  >
                    <IconDownload size={16} />
                    下载 MP4
                  </a>
                </div>
              </div>
            ) : activeJob ? (
              <div className="flex min-h-[390px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">
                  <IconRefresh size={30} className="animate-spin" />
                </div>
                <p className="mb-2 text-[16px] font-bold">{STATUS_META[activeJob.status]?.label}</p>
                <p className="mb-0 max-w-md text-[13px] leading-6 text-[#797469] dark:text-[#9da7b5]">
                  页面会自动刷新任务状态。首次唤醒模型可能需要等待更久，可以稍后回到本页查看。
                </p>
              </div>
            ) : (
              <div className="flex min-h-[390px] flex-col items-center justify-center px-6 text-center">
                <IconVideo size={48} className="mb-4 text-[#8a6422] dark:text-[#d4ae66]" />
                <p className="mb-2 text-[15px] font-semibold">生成结果会显示在这里</p>
                <p className="mb-0 max-w-sm text-[12px] leading-5 text-[#797469] dark:text-[#9da7b5]">
                  清晰、正面、无遮挡的人脸照片效果更好。内测阶段使用固定中文音色。
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#ded8ca] bg-white/[0.68] dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <div className="flex h-12 items-center justify-between border-b border-[#e7dfd1] px-4 dark:border-[#252e38]">
              <h2 className="mb-0 text-[15px] font-bold">生成记录</h2>
              <button
                type="button"
                onClick={refreshJobs}
                disabled={!isAuthed || loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] px-2.5 text-[11px] font-semibold disabled:opacity-50 dark:border-[#33404e]"
              >
                <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
                刷新
              </button>
            </div>

            {!isAuthed && !userLoading ? (
              <div className="flex min-h-[230px] flex-col items-center justify-center px-6 text-center">
                <IconPlayerPlay size={38} className="mb-3 text-[#8a6422] dark:text-[#d4ae66]" />
                <p className="mb-3 text-[14px] font-semibold">登录后使用数字人口播</p>
                <button
                  type="button"
                  onClick={login}
                  className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white dark:bg-[#e8d7b4] dark:text-[#17130d]"
                >
                  去登录
                </button>
              </div>
            ) : loading && jobs.length === 0 ? (
              <p className="px-4 py-12 text-center text-[13px] text-[#797469] dark:text-[#9da7b5]">正在加载…</p>
            ) : jobs.length === 0 ? (
              <p className="px-4 py-12 text-center text-[13px] text-[#797469] dark:text-[#9da7b5]">
                {isOwner ? '还没有生成记录。' : '数字人口播目前处于站长内测阶段。'}
              </p>
            ) : (
              <div className="divide-y divide-[#e7dfd1] dark:divide-[#252e38]">
                {jobs.map((job) => (
                  <article key={job.id} className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#ded8ca] bg-[#fffdf8] dark:border-[#33404e] dark:bg-[#0b1118]">
                      <IconVideo size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={job.status} />
                        <span className="text-[11px] text-[#797469] dark:text-[#9da7b5]">
                          {formatTime(job.createdAt)}
                        </span>
                      </div>
                      <p className="mb-0 line-clamp-2 text-[12px] leading-5 text-[#58554d] dark:text-[#b0bac7]">
                        {job.script}
                      </p>
                      {job.status === 'failed' && job.errorDetail ? (
                        <p className="mb-0 mt-1 text-[11px] text-rose-600 dark:text-rose-300">
                          {job.errorDetail}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {job.resultUrl ? (
                        <a
                          href={job.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="播放视频"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d8d1c4] text-[#28241d] no-underline dark:border-[#33404e] dark:text-gray-100"
                        >
                          <IconPlayerPlay size={15} />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeOrCancel(job)}
                        disabled={deletingId === job.id}
                        title={ACTIVE_STATUSES.has(job.status) ? '取消任务' : '删除记录'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

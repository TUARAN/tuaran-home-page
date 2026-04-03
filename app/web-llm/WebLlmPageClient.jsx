'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_MODEL_ID, MAX_NEW_TOKENS, MODEL_OPTIONS } from './lib/constants'
import { getRuntimeDiagnostics, getSiteContextPreview, loadModel, runInference } from './lib/runtime'
import { deleteSessionById, listSessions, saveSession } from './lib/sessionStore'

const SUGGESTED_QUESTIONS = [
  'tuaran 是干嘛的？',
  '这个网站主要做什么？',
  '站内现在有哪些代表性项目？',
  '我第一次来，建议先看哪些内容？',
]
const ISOLATION_RELOAD_KEY = 'web-llm-isolation-reload-once'

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createSession(messages = []) {
  const now = Date.now()
  return {
    id: createId(),
    title: deriveSessionTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
  }
}

function deriveSessionTitle(messages) {
  const firstUserMessage = messages.find((item) => item.role === 'user' && item.text?.trim())
  if (!firstUserMessage) return '新会话'
  return firstUserMessage.text.trim().slice(0, 16) || '新会话'
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

function formatMetric(value) {
  if (!value) return '0'
  return Number(value).toFixed(value >= 10 ? 1 : 2)
}

function formatBytes(value) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let next = value
  let index = 0
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024
    index += 1
  }
  return `${next.toFixed(next >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function formatMs(value) {
  if (!value) return '0ms'
  if (value < 1000) return `${value}ms`
  return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}s`
}

function formatGenerationMeta(message) {
  if (!message?.generation) return []

  const { stage, timings } = message.generation
  const items = []

  if (stage) items.push(`阶段：${stage}`)
  if (timings?.contextMs) items.push(`上下文 ${formatMs(timings.contextMs)}`)
  if (timings?.promptMs) items.push(`提示词 ${formatMs(timings.promptMs)}`)
  if (timings?.preprocessMs) items.push(`输入处理 ${formatMs(timings.preprocessMs)}`)
  if (timings?.firstTokenMs) items.push(`首 token ${formatMs(timings.firstTokenMs)}`)
  if (timings?.decodeMs) items.push(`生成 ${formatMs(timings.decodeMs)}`)
  if (timings?.totalMs) items.push(`总耗时 ${formatMs(timings.totalMs)}`)

  return items
}

function StatusPill({ ok, label }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[12px]',
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200',
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export default function WebLlmPageClient() {
  const textareaRef = useRef(null)
  const chatBottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID)
  const [loadedModelId, setLoadedModelId] = useState('')
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [loadProgress, setLoadProgress] = useState({ percent: 0, message: '', file: '', loaded: 0, total: 0 })
  const [loadError, setLoadError] = useState('')
  const [storageError, setStorageError] = useState('')
  const [contextStatus] = useState(() => `已接入固定上下文，约 ${getSiteContextPreview().length} 字。`)
  const [diagnostics, setDiagnostics] = useState({
    hasWebGPU: false,
    isSecureContext: false,
    crossOriginIsolated: false,
    userAgent: '',
  })

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  )

  useEffect(() => {
    setDiagnostics(getRuntimeDiagnostics())
  }, [])

  useEffect(() => {
    const snapshot = getRuntimeDiagnostics()
    setDiagnostics(snapshot)

    if (typeof window === 'undefined') return

    if (snapshot.crossOriginIsolated) {
      window.sessionStorage.removeItem(ISOLATION_RELOAD_KEY)
      return
    }

    const hasReloaded = window.sessionStorage.getItem(ISOLATION_RELOAD_KEY) === '1'
    if (!hasReloaded) {
      window.sessionStorage.setItem(ISOLATION_RELOAD_KEY, '1')
      window.location.replace('/web-llm')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const storedSessions = await listSessions()
        if (cancelled) return

        if (storedSessions.length > 0) {
          setSessions(storedSessions)
          setActiveSessionId(storedSessions[0].id)
          return
        }

        const initialSession = createSession()
        setSessions([initialSession])
        setActiveSessionId(initialSession.id)
        await saveSession(initialSession)
      } catch (error) {
        if (cancelled) return
        const fallbackSession = createSession()
        setSessions([fallbackSession])
        setActiveSessionId(fallbackSession.id)
        setStorageError(`IndexedDB 初始化失败：${error?.message || 'UNKNOWN_ERROR'}`)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
  }, [inputValue])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeSession?.messages, isSending, imagePreview])

  function updateSessionState(sessionId, updater) {
    let nextSession = null
    setSessions((prev) =>
      sortSessions(
        prev.map((session) => {
          if (session.id !== sessionId) return session
          nextSession = updater(session)
          return nextSession
        })
      )
    )
    return nextSession
  }

  async function persistSession(nextSession) {
    try {
      await saveSession(nextSession)
      setStorageError('')
    } catch (error) {
      setStorageError(`会话保存失败：${error?.message || 'UNKNOWN_ERROR'}`)
    }
  }

  async function handleCreateSession() {
    const nextSession = createSession()
    setSessions((prev) => sortSessions([nextSession, ...prev]))
    setActiveSessionId(nextSession.id)
    setInputValue('')
    setImagePreview('')
    await persistSession(nextSession)
  }

  async function handleDeleteSession(sessionId) {
    const remaining = sessions.filter((session) => session.id !== sessionId)
    const nextSession = remaining[0] || createSession()

    setSessions(remaining.length > 0 ? sortSessions(remaining) : [nextSession])
    setActiveSessionId(nextSession.id)

    try {
      await deleteSessionById(sessionId)
      if (remaining.length === 0) {
        await persistSession(nextSession)
      }
      setStorageError('')
    } catch (error) {
      setStorageError(`删除会话失败：${error?.message || 'UNKNOWN_ERROR'}`)
    }
  }

  async function handleLoadModel() {
    setIsModelLoading(true)
    setLoadError('')
    setLoadProgress({ percent: 0, message: '正在初始化模型加载…', file: '', loaded: 0, total: 0 })

    try {
      const result = await loadModel(selectedModelId, (event) => {
        setLoadProgress({
          percent: event.percent || 0,
          message: event.message || event.status || '',
          file: event.file || '',
          loaded: event.loaded || 0,
          total: event.total || 0,
        })
        if (event.diagnostics) {
          setDiagnostics(event.diagnostics)
        }
      })

      setLoadedModelId(selectedModelId)
      setIsModelReady(true)
      setDiagnostics(result.diagnostics)
    } catch (error) {
      const snapshot = getRuntimeDiagnostics()
      setDiagnostics(snapshot)
      setIsModelReady(false)
      setLoadedModelId('')
      setLoadError(
        [
          `模型加载失败：${error?.message || 'UNKNOWN_ERROR'}`,
          `WebGPU: ${snapshot.hasWebGPU ? '可用' : '不可用'}`,
          `安全上下文: ${snapshot.isSecureContext ? '是' : '否'}`,
          `crossOriginIsolated: ${snapshot.crossOriginIsolated ? '是' : '否'}`,
        ].join('\n')
      )
    } finally {
      setIsModelLoading(false)
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    const input = event.target
    if (!file) return

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error || new Error('IMAGE_READ_FAILED'))
        reader.readAsDataURL(file)
      })

      setImagePreview(typeof dataUrl === 'string' ? dataUrl : '')
    } catch (error) {
      setStorageError(`图片读取失败：${error?.message || 'UNKNOWN_ERROR'}`)
    } finally {
      input.value = ''
    }
  }

  function handleRemoveImage() {
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit() {
    const text = inputValue.trim()
    if ((!text && !imagePreview) || !activeSession || !isModelReady || isSending) return

    const now = Date.now()
    const userMessage = {
      id: createId(),
      role: 'user',
      text,
      image: imagePreview || '',
      tps: 0,
    }
    const assistantMessageId = createId()
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      text: '',
      image: '',
      tps: 0,
      generation: {
        stage: '准备中',
        timings: {
          contextMs: 0,
          promptMs: 0,
          preprocessMs: 0,
          firstTokenMs: 0,
          decodeMs: 0,
          totalMs: 0,
        },
      },
    }

    const nextSession = {
      ...activeSession,
      title: deriveSessionTitle([...activeSession.messages, userMessage]),
      messages: [...activeSession.messages, userMessage, assistantMessage],
      updatedAt: now,
    }

    setInputValue('')
    setImagePreview('')
    setIsSending(true)
    updateSessionState(activeSession.id, () => nextSession)

    try {
      const result = await runInference({
        modelId: loadedModelId || selectedModelId,
        messages: [...activeSession.messages, userMessage],
        maxNewTokens: MAX_NEW_TOKENS,
        onUpdate: (update) => {
          updateSessionState(activeSession.id, (session) => ({
            ...session,
            updatedAt: Date.now(),
            messages: session.messages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text: update.text ?? message.text,
                    tps: update.tps ?? message.tps,
                    generation: update.stage
                      ? {
                          stage: update.stage,
                          timings: update.timings || message.generation?.timings,
                        }
                      : message.generation,
                  }
                : message
            ),
          }))
        },
      })

      const completedSession =
        updateSessionState(activeSession.id, (session) => ({
          ...session,
          updatedAt: Date.now(),
          messages: session.messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  text: result.text || '模型未返回内容。',
                  tps: result.tps || 0,
                  generation: {
                    stage: result.stage || '完成',
                    timings: result.timings || message.generation?.timings,
                  },
                }
              : message
          ),
        })) || nextSession

      await persistSession(completedSession)
    } catch (error) {
      const failedSession =
        updateSessionState(activeSession.id, (session) => ({
          ...session,
          updatedAt: Date.now(),
          messages: session.messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  text: `推理失败：${error?.message || 'UNKNOWN_ERROR'}`,
                  tps: 0,
                  generation: {
                    stage: '失败',
                    timings: message.generation?.timings || {
                      contextMs: 0,
                      promptMs: 0,
                      preprocessMs: 0,
                      firstTokenMs: 0,
                      decodeMs: 0,
                      totalMs: 0,
                    },
                  },
                }
              : message
          ),
        })) || nextSession

      await persistSession(failedSession)
    } finally {
      setIsSending(false)
    }
  }

  function handleTextareaKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const environmentReady =
    diagnostics.hasWebGPU && diagnostics.isSecureContext && diagnostics.crossOriginIsolated

  const canSend = isModelReady && !isSending && (inputValue.trim() || imagePreview)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8 border-b border-[#eee] pb-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-[12px] uppercase tracking-[0.22em] text-[#8c8674] dark:text-gray-500">
              Browser WebGPU LLM
            </p>
            <h1 className="mb-3 text-3xl text-[#222] dark:text-gray-100">大模型问答</h1>
            <p className="mb-0 text-sm text-[#5f5a4b] dark:text-gray-300">
              把浏览器端 WebGPU + ONNX 模型运行能力接进当前网站。默认不自动加载，用户手动初始化后即可进行本地会话与流式问答。
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e2cf] bg-[#faf5e8] px-4 py-3 text-sm text-[#665f4e] dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200">
            <div>当前模型：{loadedModelId || '尚未加载'}</div>
            <div>生成上限：{MAX_NEW_TOKENS} tokens</div>
            <div className="mt-1 text-[12px] text-[#80745c] dark:text-gray-400">{contextStatus}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="mb-0 border-0 pb-0 text-base">本地会话</h2>
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={isSending}
                className="rounded-full border border-gray-200/80 bg-white px-3 py-1 text-[12px] text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                新建会话
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId
                return (
                  <div
                    key={session.id}
                    className={[
                      'rounded-xl border px-3 py-2 transition',
                      isActive
                        ? 'border-[#d7c6a0] bg-[#f8f1df] dark:border-gray-500 dark:bg-gray-800'
                        : 'border-gray-200/70 bg-white/60 dark:border-gray-700/60 dark:bg-gray-900/40',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSessionId(session.id)}
                      className="block w-full text-left"
                    >
                      <div className="truncate text-sm text-[#2d2a21] dark:text-gray-100">{session.title || '新会话'}</div>
                      <div className="mt-1 text-[12px] text-[#8a816d] dark:text-gray-400">
                        {session.messages.length} 条消息
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={isSending && isActive}
                      className="mt-2 text-[12px] text-[#8f5a47] underline underline-offset-4 disabled:opacity-50 dark:text-rose-300"
                    >
                      删除
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <h2 className="mb-3 border-0 pb-0 text-base">运行状态</h2>
            <div className="flex flex-wrap gap-2">
              <StatusPill ok={diagnostics.hasWebGPU} label={`WebGPU ${diagnostics.hasWebGPU ? '可用' : '不可用'}`} />
              <StatusPill ok={diagnostics.isSecureContext} label={`安全上下文 ${diagnostics.isSecureContext ? '满足' : '不满足'}`} />
              <StatusPill
                ok={diagnostics.crossOriginIsolated}
                label={`cross-origin isolation ${diagnostics.crossOriginIsolated ? '已启用' : '未启用'}`}
              />
            </div>

            <div className="mt-3 space-y-2 text-[13px] text-[#625c4d] dark:text-gray-300">
              <p className="mb-0">
                {environmentReady
                  ? '当前页面已满足 WebGPU 运行前提，可以手动加载模型。'
                  : '当前环境存在缺项，页面会继续显示错误原因，不会静默失败。'}
              </p>
              <p className="mb-0 break-all text-[12px] text-[#8b826d] dark:text-gray-400">{diagnostics.userAgent}</p>
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1">
                <label htmlFor="model-select" className="mb-2 block text-sm text-[#585241] dark:text-gray-300">
                  模型控制区
                </label>
                <select
                  id="model-select"
                  value={selectedModelId}
                  onChange={(event) => setSelectedModelId(event.target.value)}
                  disabled={isModelLoading || isSending}
                  className="w-full rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-sm text-[#2d2a21] outline-none focus:ring-2 focus:ring-[#d7c6a0] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-gray-600"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} · {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleLoadModel}
                disabled={isModelLoading || isSending || !environmentReady}
                className="rounded-full border border-[#d7c6a0] bg-[#f5ebd2] px-5 py-2 text-sm text-[#5f5030] shadow-sm transition hover:bg-[#f1e3c2] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                {isModelLoading ? '加载中…' : isModelReady && loadedModelId === selectedModelId ? '重新加载模型' : '加载模型'}
              </button>
            </div>

            {loadError ? (
              <pre className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
                {loadError}
              </pre>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200/80 bg-[#fcfaf4] px-3 py-2 text-[13px] text-[#716852] dark:border-gray-700 dark:bg-gray-950/50 dark:text-gray-300">
                {isModelReady ? '模型已加载完成，可以发送消息。问站点内容时会优先参考固定上下文文件。' : '页面默认不自动加载模型，请手动点击“加载模型”。'}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200/70 bg-white/80 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/70">
            <div className="border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/60">
              <h2 className="mb-0 border-0 pb-0 text-base">聊天展示区</h2>
            </div>

            <div className="max-h-[60vh] min-h-[360px] overflow-y-auto px-4 py-4">
              {activeSession?.messages?.length ? (
                <div className="space-y-4">
                  {activeSession.messages.map((message) => {
                    const isUser = message.role === 'user'
                    const generationMeta = formatGenerationMeta(message)
                    return (
                      <article
                        key={message.id}
                        className={[
                          'max-w-[90%] rounded-2xl border px-4 py-3',
                          isUser
                            ? 'ml-auto border-[#d7c6a0] bg-[#f7edd5] text-[#2d2a21] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                            : 'border-gray-200/70 bg-white text-[#35312a] dark:border-gray-700 dark:bg-gray-950/70 dark:text-gray-100',
                        ].join(' ')}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3 text-[12px] text-[#8a816d] dark:text-gray-400">
                          <span>{isUser ? '你' : '模型'}</span>
                          {!isUser && message.tps ? <span>{formatMetric(message.tps)} tokens/s</span> : null}
                        </div>

                        {message.image ? (
                          <Image
                            src={message.image}
                            alt="用户上传图片"
                            width={960}
                            height={720}
                            unoptimized
                            className="mb-3 max-h-56 w-auto rounded-xl border border-gray-200/70 object-contain dark:border-gray-700"
                          />
                        ) : null}

                        <div className="whitespace-pre-wrap break-words text-sm leading-7">
                          {message.text || (isUser ? '已上传图片' : '...')}
                        </div>

                        {!isUser && generationMeta.length ? (
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#8a816d] dark:text-gray-400">
                            {generationMeta.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200/80 bg-[#fcfaf4] px-4 py-6 text-sm text-[#756d58] dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-300">
                  先加载模型，再发送一条文本消息。页面会边生成边刷新聊天气泡。
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="border-t border-gray-200/70 px-4 py-4 dark:border-gray-700/60">
              <div className="mb-3 flex flex-wrap gap-3 text-[12px] text-[#7c745f] dark:text-gray-400">
                <span>Enter 发送</span>
                <span>Shift + Enter 换行</span>
                <span>{isSending ? '发送中，输入暂时禁用。' : isModelReady ? '模型已就绪。' : '模型尚未加载。'}</span>
              </div>

              {imagePreview ? (
                <div className="mb-3 rounded-2xl border border-gray-200/80 bg-[#fbf7ec] p-3 dark:border-gray-700 dark:bg-gray-950/50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] text-[#756d58] dark:text-gray-400">图片预览</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isSending}
                      className="text-[12px] text-[#8f5a47] underline underline-offset-4 disabled:opacity-50 dark:text-rose-300"
                    >
                      移除
                    </button>
                  </div>
                  <Image
                    src={imagePreview}
                    alt="预览图片"
                    width={960}
                    height={720}
                    unoptimized
                    className="max-h-56 w-auto rounded-xl border border-gray-200/70 dark:border-gray-700"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#7c745f] dark:text-gray-400">
                  <span className="mr-1">问题建议：</span>
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInputValue(question)}
                      disabled={isSending}
                      className="rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-[12px] text-[#665f4e] transition hover:border-[#d7c6a0] hover:bg-[#fbf4e4] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  disabled={!isModelReady || isSending}
                  rows={1}
                  placeholder={isModelReady ? '输入消息，按 Enter 发送…' : '请先加载模型'}
                  className="min-h-[48px] w-full resize-none rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-sm text-[#2d2a21] outline-none focus:ring-2 focus:ring-[#d7c6a0] disabled:cursor-not-allowed disabled:bg-gray-100/80 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-gray-600 dark:disabled:bg-gray-900"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={!isModelReady || isSending}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isModelReady || isSending}
                      className="rounded-full border border-gray-200/80 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      上传图片
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className="rounded-full border border-[#d7c6a0] bg-[#f5ebd2] px-5 py-2 text-sm text-[#5f5030] shadow-sm transition hover:bg-[#f1e3c2] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    {isSending ? '发送中…' : '发送'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {storageError ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
              {storageError}
            </section>
          ) : null}
        </main>
      </div>

      {isModelLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1a12]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#eadfc3] bg-[#fffaf0] p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#8c8674] dark:text-gray-500">Model Loading</div>
            <h2 className="mb-3 border-0 pb-0 text-xl">模型下载与初始化中</h2>
            <p className="mb-4 text-sm text-[#655d4e] dark:text-gray-300">
              {loadProgress.message || '正在准备 WebGPU 运行时…'}
            </p>

            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#eadfc3] dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-[#9e7b36] transition-[width] duration-300 dark:bg-amber-300"
                style={{ width: `${loadProgress.percent || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[12px] text-[#7a715f] dark:text-gray-400">
              <span>{loadProgress.percent || 0}%</span>
              <span>
                {formatBytes(loadProgress.loaded)} / {formatBytes(loadProgress.total)}
              </span>
            </div>

            {loadProgress.file ? (
              <div className="mt-3 break-all text-[12px] text-[#8b826d] dark:text-gray-500">{loadProgress.file}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const PRIORITIES = [
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
  { value: 'low', label: '低' },
]

const STATUS_LABELS = {
  pending: '待执行',
  done: '已完成',
  void: '作废',
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function VoiceTasksClient() {
  const recognitionRef = useRef(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [content, setContent] = useState('')
  const [interimText, setInterimText] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueValue, setDueValue] = useState('')
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAuthed = !!user
  const displayText = [content, interimText].filter(Boolean).join('')
  const remaining = useMemo(() => 2000 - content.trim().length, [content])

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition())
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        const data = await safeJson(res)
        setUser(data?.user || null)
      } catch {
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (isAuthed) refresh(statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, statusFilter])

  function login() {
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent('/voice-tasks')}`
  }

  function logout() {
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent('/voice-tasks')}`
  }

  async function refresh(nextStatus = statusFilter) {
    setError('')
    try {
      const res = await fetch(`/api/voice-tasks?status=${encodeURIComponent(nextStatus)}&limit=50`, { cache: 'no-store' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    }
  }

  function startListening() {
    const Recognition = getSpeechRecognition()
    if (!Recognition || listening) return

    const recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finalText += text
        else interim += text
      }
      if (finalText) {
        setContent((prev) => `${prev}${finalText}`)
      }
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      setError(event?.error ? `语音识别失败：${event.error}` : '语音识别失败')
      setListening(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    setListening(true)
    setError('')
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop?.()
    recognitionRef.current = null
    setListening(false)
    setInterimText('')
  }

  async function submit(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || remaining < 0) return

    setLoading(true)
    setError('')
    try {
      const dueAt = dueValue ? new Date(dueValue).getTime() : null
      const res = await fetch('/api/voice-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, priority, dueAt, source: 'voice' }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setContent('')
      setInterimText('')
      setPriority('normal')
      setDueValue('')
      setStatusFilter('pending')
      await refresh('pending')
    } catch (e) {
      setError(e?.message || 'POST_FAILED')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    setError('')
    try {
      const res = await fetch('/api/voice-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      await refresh(statusFilter)
    } catch (e) {
      setError(e?.message || 'UPDATE_FAILED')
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[#666] dark:text-gray-300">
            {userLoading ? '检查登录状态…' : isAuthed ? `已登录：${user.name || user.login}` : '需要 GitHub 登录后使用'}
          </div>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <button type="button" onClick={logout} className="rounded-full border border-[#ddd] px-3 py-1 text-xs text-[#555] dark:border-gray-700 dark:text-gray-300">
                退出
              </button>
            ) : (
              <button
                type="button"
                disabled={userLoading}
                onClick={login}
                className="rounded-full border border-[#ddd] px-3 py-1 text-xs text-[#555] disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
              >
                GitHub 登录
              </button>
            )}
            <button type="button" onClick={() => refresh()} className="rounded-full border border-[#ddd] px-3 py-1 text-xs text-[#555] dark:border-gray-700 dark:text-gray-300">
              刷新
            </button>
          </div>
        </div>

        {!speechSupported ? (
          <p className="mt-3 text-xs leading-6 text-[#9a5b24] dark:text-[#e2bd75]">
            当前浏览器没有暴露 Web Speech API。可以直接手动输入任务；手机端请优先用 Chrome / Safari 并保持 HTTPS。
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!isAuthed || !speechSupported}
              onClick={listening ? stopListening : startListening}
              className={[
                'inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition',
                listening
                  ? 'border-[#b7791f] bg-[#fbf3e3] text-[#8a5a14] dark:border-[#e2bd75] dark:bg-[#2a2115] dark:text-[#e2bd75]'
                  : 'border-[#ddd] bg-white text-[#444] hover:border-[#aaa] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                !isAuthed || !speechSupported ? 'opacity-60' : '',
              ].join(' ')}
            >
              {listening ? '停止识别' : '开始语音'}
            </button>
            <span className="text-xs text-[#888] dark:text-gray-400">
              {listening ? '正在听写，确认后再提交。' : '点击后说话，文字会实时出现在下面。'}
            </span>
          </div>

          <textarea
            value={displayText}
            onChange={(e) => {
              setContent(e.target.value)
              setInterimText('')
            }}
            disabled={!isAuthed}
            rows={6}
            maxLength={2200}
            placeholder="说一句或手动输入：例如「明天下午整理大模型教程资源，优先级高」"
            className="w-full rounded-md border border-[#ddd] bg-white p-3 text-sm leading-7 text-[#333] outline-none focus:ring-2 focus:ring-[#ddd] disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-700"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-[#666] dark:text-gray-300">
              <span className="mb-1 block">优先级</span>
              <select
                value={priority}
                disabled={!isAuthed}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#666] dark:text-gray-300 sm:col-span-2">
              <span className="mb-1 block">截止时间</span>
              <input
                type="datetime-local"
                value={dueValue}
                disabled={!isAuthed}
                onChange={(e) => setDueValue(e.target.value)}
                className="w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs ${remaining < 0 ? 'text-red-600' : 'text-[#999] dark:text-gray-400'}`}>
              {remaining} 字
            </span>
            <button
              type="submit"
              disabled={!isAuthed || loading || !content.trim() || remaining < 0}
              className="rounded-full border border-[#333] bg-[#222] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950"
            >
              {loading ? '提交中…' : '确认提交'}
            </button>
          </div>
        </form>

        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      </div>

      <div className="rounded-md border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#333] dark:text-gray-100">任务池</h2>
          <div className="flex flex-wrap gap-2">
            {['pending', 'done', 'void'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={[
                  'rounded-full border px-3 py-1 text-xs',
                  statusFilter === status
                    ? 'border-[#333] bg-[#222] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950'
                    : 'border-[#ddd] text-[#666] dark:border-gray-700 dark:text-gray-300',
                ].join(' ')}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-md border border-[#e8dfd0] bg-[#fdfcf9] p-3 dark:border-gray-800 dark:bg-gray-950/60">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#888] dark:text-gray-400">
                  <span>#{item.id}</span>
                  <span>{STATUS_LABELS[item.status] || item.status}</span>
                  <span>{item.priority}</span>
                  {item.dueAt ? <span>截止 {formatTime(item.dueAt)}</span> : null}
                  <span>录入 {formatTime(item.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#333] dark:text-gray-100">{item.content}</p>
                {item.status === 'pending' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateStatus(item.id, 'done')} className="rounded-full border border-[#ddd] px-3 py-1 text-xs text-[#555] dark:border-gray-700 dark:text-gray-300">
                      标记完成
                    </button>
                    <button type="button" onClick={() => updateStatus(item.id, 'void')} className="rounded-full border border-[#ddd] px-3 py-1 text-xs text-[#555] dark:border-gray-700 dark:text-gray-300">
                      作废
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#777] dark:text-gray-400">
            {isAuthed ? '当前分类没有任务。' : '登录后查看任务池。'}
          </p>
        )}
      </div>
    </section>
  )
}

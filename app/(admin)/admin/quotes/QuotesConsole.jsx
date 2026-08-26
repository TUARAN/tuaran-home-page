'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconSparkles } from '@tabler/icons-react'

import { AdminButton, AdminPage } from '../../components/ui'

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function QuotesConsole() {
  const [prompt, setPrompt] = useState('')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [persistent, setPersistent] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/quotes', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`)
      setQuote(data?.quote || null)
      setPersistent(data?.persistent !== false)
    } catch (reason) {
      setError(reason?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function generate(event) {
    event.preventDefault()
    const value = prompt.trim()
    if (!value) return

    setGenerating(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ prompt: value }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.detail || data?.error || `HTTP_${response.status}`)
      setQuote(data?.quote || null)
      setMessage('已生成并展示。')
    } catch (reason) {
      setError(reason?.message || 'QUOTE_GENERATION_FAILED')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AdminPage title="名言生成" description="输入提示语，大模型生成一句原创短句并立即展示。">
      <div className="mx-auto max-w-3xl space-y-5">
        {!persistent ? <Notice tone="warning">当前环境没有可写入的 D1 数据库。</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <form onSubmit={generate} className="rounded-xl border border-[#d9dbd0] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
          <label className="block text-sm font-medium text-[#33342e] dark:text-gray-200">
            提示语
            <textarea
              autoFocus
              required
              maxLength={500}
              rows={4}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-2 w-full resize-y rounded-lg border border-[#d7d8ce] bg-white px-3 py-2 text-sm leading-6 text-[#292a24] outline-none transition focus:border-[#818472] dark:border-[#34404d] dark:bg-[#0c1118] dark:text-gray-100"
              placeholder="写下这句名言想表达的内容"
            />
          </label>
          <AdminButton type="submit" variant="primary" disabled={generating || !persistent || !prompt.trim()} className="mt-4">
            <IconSparkles size={15} />{generating ? '生成中…' : '生成并展示'}
          </AdminButton>
        </form>

        <section className="rounded-xl border border-[#d9dbd0] bg-white p-6 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
          <p className="text-xs font-medium text-[#858779] dark:text-gray-500">当前展示</p>
          {loading ? <p className="mt-4 text-sm text-[#858779]">读取中…</p> : quote ? (
            <blockquote className="mt-4 font-serif text-xl leading-9 text-[#292a24] dark:text-gray-100">
              “{quote.text}”
              <footer className="mt-2 font-sans text-sm text-[#858779] dark:text-gray-500">— {quote.author}</footer>
            </blockquote>
          ) : <p className="mt-4 text-sm text-[#858779] dark:text-gray-500">尚未生成</p>}
        </section>
      </div>
    </AdminPage>
  )
}

function Notice({ tone, children }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  }
  return <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}>{children}</div>
}

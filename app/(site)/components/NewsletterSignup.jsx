'use client'

import { useState } from 'react'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function NewsletterSignup({ source = 'article_footer' }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setEmail('')
      setMessage('已订阅。后续会把新文章、资源更新和工具发布整理成邮件发给你。')
    } catch (err) {
      const code = err?.message || ''
      if (code === 'INVALID_EMAIL') {
        setError('邮箱格式不太对，检查一下再试。')
      } else if (code === 'RATE_LIMITED') {
        setError('请求太频繁，稍后再试。')
      } else {
        setError('订阅失败，稍后再试。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#d8cfbd] bg-[#fffdf7] p-5 shadow-[0_14px_36px_rgba(70,55,24,0.08)] dark:border-[#313b48] dark:bg-[#101720] dark:shadow-none"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] md:items-end">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6422] dark:text-[#d4ae66]">
            Newsletter
          </p>
          <h2 className="mb-2 font-serif text-[22px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
            每周收一封，少刷一点信息流
          </h2>
          <p className="mb-0 text-[13px] leading-6 text-[#66645c] dark:text-gray-400">
            我会把新文章、调研、资源更新和工具发布整理成一封邮件。频率克制，不做日更轰炸。
          </p>
        </div>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-11 flex-1 rounded-xl border border-[#d8dad0] bg-white px-3 text-[14px] text-[#15140f] outline-none transition focus:border-[#8a6422] dark:border-[#303947] dark:bg-[#0b1119] dark:text-gray-100 dark:focus:border-[#d4ae66]"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="min-h-11 rounded-xl bg-[#15140f] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3f3a2f] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white"
            >
              {loading ? '提交中…' : '订阅'}
            </button>
          </div>
          {message ? <p className="mb-0 mt-2 text-[12px] leading-5 text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          {error ? <p className="mb-0 mt-2 text-[12px] leading-5 text-rose-600 dark:text-rose-300">{error}</p> : null}
          <p className="mb-0 mt-2 text-[11px] leading-5 text-[#999] dark:text-gray-500">
            先用本站 D1 记录订阅；配置 Buttondown token 后会同步到 Buttondown。
          </p>
        </div>
      </div>
    </form>
  )
}

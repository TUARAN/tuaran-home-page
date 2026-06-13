'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { normalizeReturnTo } from '../../../lib/returnTo'

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '邮箱或密码不正确。',
  LOGIN_FAILED: '登录失败，请稍后再试。',
}

function getReturnTo() {
  const value = new URLSearchParams(window.location.search).get('returnTo')
  return normalizeReturnTo(value)
}

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [oauthReturnTo, setOauthReturnTo] = useState('/')

  useEffect(() => {
    setOauthReturnTo(getReturnTo())
  }, [])

  async function login(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'LOGIN_FAILED')
      window.location.href = getReturnTo()
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] || ERROR_MESSAGES.LOGIN_FAILED)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45] dark:text-[#929870]">
          Account
        </p>
        <h1 className="mb-8 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">登录</h1>

        <form onSubmit={login} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">邮箱</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">密码</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入密码"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          {error ? <p className="text-sm text-[#a34f47] dark:text-[#b5a09b]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#9aa170]"
          >
            {submitting ? '登录中…' : '邮箱登录'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-[#898a7f] dark:text-[#738095]">
          <span className="h-px flex-1 bg-[#d3d5cb] dark:bg-[#2d3746]" />
          <span>或</span>
          <span className="h-px flex-1 bg-[#d3d5cb] dark:bg-[#2d3746]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`/api/auth/login?provider=github&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            className="rounded-xl border border-[#caccc0] px-4 py-2.5 text-center text-sm font-medium text-[#35362f] no-underline transition hover:bg-[#e7e8e0] dark:border-[#344052] dark:text-gray-200 dark:hover:bg-[#19212b]"
          >
            GitHub 登录
          </a>
          <a
            href={`/api/auth/login?provider=google&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            className="rounded-xl border border-[#caccc0] px-4 py-2.5 text-center text-sm font-medium text-[#35362f] no-underline transition hover:bg-[#e7e8e0] dark:border-[#344052] dark:text-gray-200 dark:hover:bg-[#19212b]"
          >
            Google 登录
          </a>
        </div>

        <p className="mb-0 mt-6 text-center text-sm text-[#65665d] dark:text-[#9aa6b6]">
          还没有账号？{' '}
          <Link href="/register" className="font-medium text-[#8b5a1f] dark:text-[#d7a85c]">
            邮箱注册
          </Link>
        </p>
      </section>
    </main>
  )
}

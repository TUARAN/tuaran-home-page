'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { normalizeReturnTo } from '../../../lib/returnTo'

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '邮箱或密码不正确。',
  INVALID_PASSWORD: '第一次使用这个邮箱时，密码长度需要至少 8 位。',
  LOGIN_FAILED: '登录失败，请稍后再试。',
}
const LAST_LOGIN_METHOD_COOKIE = 'tuaran_last_login_method'
const LOGIN_METHOD_LABELS = {
  google: 'Google / Chrome',
  github: 'GitHub',
  email: '邮箱',
}

function getReturnTo() {
  const value = new URLSearchParams(window.location.search).get('returnTo')
  return normalizeReturnTo(value)
}

function getCookie(name) {
  if (typeof document === 'undefined') return ''
  const prefix = `${name}=`
  const item = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return item ? decodeURIComponent(item.slice(prefix.length)) : ''
}

function LastUsedBadge() {
  return (
    <span className="rounded-full bg-[#efe5d4] px-2 py-0.5 text-[10px] font-semibold text-[#8b5a1f] dark:bg-amber-950/60 dark:text-[#d7a85c]">
      上次使用
    </span>
  )
}

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [oauthReturnTo, setOauthReturnTo] = useState('/')
  const [lastLoginMethod, setLastLoginMethod] = useState('')

  useEffect(() => {
    setOauthReturnTo(getReturnTo())
    setLastLoginMethod(getCookie(LAST_LOGIN_METHOD_COOKIE))
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
        <h1 className="mb-2 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">登录 / 创建临时账号</h1>
        <p className="mb-8 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">
          推荐使用 Google / Chrome 或 GitHub 登录；如果你想先用邮箱继续，也可以在下面创建临时账号。
        </p>

        {lastLoginMethod && LOGIN_METHOD_LABELS[lastLoginMethod] ? (
          <p className="mb-3 rounded-xl border border-[#e4d8c3] bg-white/65 px-3.5 py-2 text-xs text-[#776b58] dark:border-[#344052] dark:bg-[#0d131b]/70 dark:text-gray-300">
            上次你使用的是 <span className="font-semibold text-[#8b5a1f] dark:text-[#d7a85c]">{LOGIN_METHOD_LABELS[lastLoginMethod]}</span> 登录。
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={`/api/auth/login?provider=google&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-center text-sm font-medium no-underline transition hover:bg-[#e7e8e0] dark:hover:bg-[#19212b] ${
              lastLoginMethod === 'google'
                ? 'border-[#a37b3c] bg-white text-[#1f211b] shadow-sm dark:border-[#d7a85c] dark:bg-[#151d26] dark:text-gray-100'
                : 'border-[#caccc0] text-[#35362f] dark:border-[#344052] dark:text-gray-200'
            }`}
          >
            <span>Google / Chrome 登录</span>
            {lastLoginMethod === 'google' ? <LastUsedBadge /> : null}
          </a>
          <a
            href={`/api/auth/login?provider=github&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-center text-sm font-medium no-underline transition hover:bg-[#e7e8e0] dark:hover:bg-[#19212b] ${
              lastLoginMethod === 'github'
                ? 'border-[#a37b3c] bg-white text-[#1f211b] shadow-sm dark:border-[#d7a85c] dark:bg-[#151d26] dark:text-gray-100'
                : 'border-[#caccc0] text-[#35362f] dark:border-[#344052] dark:text-gray-200'
            }`}
          >
            <span>GitHub 登录</span>
            {lastLoginMethod === 'github' ? <LastUsedBadge /> : null}
          </a>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-[#898a7f] dark:text-[#738095]">
          <span className="h-px flex-1 bg-[#d3d5cb] dark:bg-[#2d3746]" />
          <span>或使用邮箱</span>
          <span className="h-px flex-1 bg-[#d3d5cb] dark:bg-[#2d3746]" />
        </div>

        <p className="mb-4 rounded-xl border border-[#e4d8c3] bg-white/55 px-3.5 py-2.5 text-xs leading-5 text-[#776b58] dark:border-[#344052] dark:bg-[#0d131b]/60 dark:text-gray-300">
          邮箱已有账号会直接登录。第一次使用这个邮箱时，请设置一个你记得住的密码；我们会先保留阅读记录和燃币，之后再引导你激活邮箱。
        </p>

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
              placeholder="第一次使用请设置至少 8 位密码"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          {error ? <p className="text-sm text-[#a34f47] dark:text-[#b5a09b]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#9aa170]"
          >
            <span>{submitting ? '处理中…' : '邮箱继续'}</span>
            {lastLoginMethod === 'email' ? <LastUsedBadge /> : null}
          </button>
        </form>

        <p className="mb-0 mt-6 text-center text-sm text-[#65665d] dark:text-[#9aa6b6]">
          想先完成邮箱验证？{' '}
          <Link href="/register" className="font-medium text-[#8b5a1f] dark:text-[#d7a85c]">
            邮箱注册
          </Link>
        </p>
      </section>
    </main>
  )
}

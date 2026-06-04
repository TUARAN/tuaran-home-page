'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const ERROR_MESSAGES = {
  INVALID_EMAIL: '请输入有效的邮箱地址。',
  EMAIL_ALREADY_REGISTERED: '这个邮箱已经注册。',
  CODE_SENT_TOO_RECENTLY: '验证码发送过于频繁，请稍后再试。',
  EMAIL_DAILY_LIMIT_REACHED: '这个邮箱今天发送验证码的次数已达上限。',
  IP_RATE_LIMIT_REACHED: '当前网络请求过于频繁，请稍后再试。',
  SEND_CODE_FAILED: '验证码发送失败，请稍后再试。',
  INVALID_CODE_FORMAT: '请输入 6 位数字验证码。',
  INVALID_PASSWORD: '密码长度需要在 8 到 128 位之间。',
  INVALID_NAME: '请输入不超过 50 个字符的昵称。',
  CODE_NOT_FOUND: '请先发送验证码。',
  CODE_EXPIRED: '验证码已过期，请重新发送。',
  CODE_ATTEMPTS_EXCEEDED: '验证码尝试次数过多，请重新发送。',
  INVALID_CODE: '验证码不正确。',
  REGISTER_FAILED: '注册失败，请稍后再试。',
}

function messageFor(error) {
  return ERROR_MESSAGES[error] || '请求失败，请稍后再试。'
}

export default function RegisterClient() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function sendCode() {
    setSending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'SEND_CODE_FAILED')
      setNotice('验证码已发送，请检查收件箱和垃圾邮件目录。')
      setCountdown(60)
    } catch (err) {
      setError(messageFor(err.message))
    } finally {
      setSending(false)
    }
  }

  async function register(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, code }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'REGISTER_FAILED')

      const returnTo = new URLSearchParams(window.location.search).get('returnTo')
      window.location.href = returnTo?.startsWith('/') ? returnTo : '/'
    } catch (err) {
      setError(messageFor(err.message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <section className="rounded-3xl border border-[#e5dccd] bg-[#fdfaf3] p-6 shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45] dark:text-[#d2ae70]">
          Account
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-[#211d17] dark:text-gray-100">邮箱验证码注册</h1>
        <p className="mb-8 text-sm leading-6 text-[#746b5d] dark:text-[#9aa6b6]">
          验证码 10 分钟内有效。注册成功后会自动登录，现有 GitHub 和 Google 登录不受影响。
        </p>

        <form onSubmit={register} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#3f392f] dark:text-gray-200">邮箱</span>
            <div className="flex gap-2">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-[#ddd2c0] bg-white px-3.5 py-2.5 text-sm text-[#211d17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#d7bd8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="shrink-0 rounded-xl bg-[#31291d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4a3c29] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7bd8d] dark:text-[#17130d] dark:hover:bg-[#e5cc9d]"
              >
                {sending ? '发送中…' : countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#3f392f] dark:text-gray-200">验证码</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位数字验证码"
              className="w-full rounded-xl border border-[#ddd2c0] bg-white px-3.5 py-2.5 text-sm tracking-[0.18em] text-[#211d17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#d7bd8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#3f392f] dark:text-gray-200">昵称</span>
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={50}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="用于评论和站内工具展示"
              className="w-full rounded-xl border border-[#ddd2c0] bg-white px-3.5 py-2.5 text-sm text-[#211d17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#d7bd8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#3f392f] dark:text-gray-200">密码</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              className="w-full rounded-xl border border-[#ddd2c0] bg-white px-3.5 py-2.5 text-sm text-[#211d17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#d7bd8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          {notice ? <p className="text-sm text-[#55734e] dark:text-[#98c591]">{notice}</p> : null}
          {error ? <p className="text-sm text-[#a34f47] dark:text-[#e6a29b]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#e8bb70]"
          >
            {submitting ? '注册中…' : '注册并登录'}
          </button>
        </form>

        <p className="mb-0 mt-6 text-center text-sm text-[#746b5d] dark:text-[#9aa6b6]">
          已有账号？{' '}
          <Link href="/login" className="font-medium text-[#8b5a1f] dark:text-[#d7a85c]">
            去登录
          </Link>
        </p>
      </section>
    </main>
  )
}

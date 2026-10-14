'use client'

import Link from 'next/link'
import { useState } from 'react'

const ERROR_MESSAGES = {
  INVALID_EMAIL: '请输入有效的邮箱地址。',
  INVALID_PASSWORD: '密码长度需要在 8 到 128 位之间。',
  INVALID_NAME: '请输入不超过 50 个字符的昵称。',
  REGISTER_FAILED: '注册失败，请稍后再试。',
  RATE_LIMITED: '请求过于频繁，请稍后再试。',
  SUPABASE_AUTH_UNAVAILABLE: '邮箱服务暂时不可用，请稍后再试。',
}

function messageFor(error) {
  return ERROR_MESSAGES[error] || '请求失败，请稍后再试。'
}

export default function RegisterClient() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function register(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'REGISTER_FAILED')

      setNotice('确认邮件已发送，请打开邮件确认邮箱后返回登录。')
      setPassword('')
    } catch (err) {
      setError(messageFor(err.message))
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
        <h1 className="mb-2 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">邮箱注册</h1>
        <p className="mb-8 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">
          注册后请查看邮箱确认邮件，再返回登录。已有 GitHub 或 Google 账号可登录后在账号中心绑定邮箱。
        </p>

        <form onSubmit={register} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">邮箱</span>
            <div className="flex gap-2">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">昵称</span>
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={50}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="用于评论和站内工具展示"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#35362f] dark:text-gray-200">密码</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              className="w-full rounded-xl border border-[#caccc0] bg-white px-3.5 py-2.5 text-sm text-[#1a1b17] outline-none transition focus:border-[#a37b3c] focus:ring-2 focus:ring-[#a7ac8d]/30 dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>

          {notice ? <p className="text-sm text-[#50664e] dark:text-[#93b391]">{notice}</p> : null}
          {error ? <p className="text-sm text-[#a34f47] dark:text-[#b5a09b]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#9aa170]"
          >
            {submitting ? '注册中…' : '注册并发送确认邮件'}
          </button>
        </form>

        <p className="mb-0 mt-6 text-center text-sm text-[#65665d] dark:text-[#9aa6b6]">
          已有账号？{' '}
          <Link href="/login" className="font-medium text-[#8b5a1f] dark:text-[#d7a85c]">
            去登录
          </Link>
        </p>
      </section>
    </main>
  )
}

'use client'

import { useState } from 'react'

import { useSessionAccount } from './SessionProvider'

const ERROR_MESSAGES = {
  INVALID_EMAIL: '邮箱地址无效。',
  EMAIL_NOT_FOUND: '没有找到这个邮箱账号。',
  EMAIL_ALREADY_ACTIVE: '这个邮箱已经激活。',
  CODE_SENT_TOO_RECENTLY: '验证码发送过于频繁，请稍后再试。',
  EMAIL_DAILY_LIMIT_REACHED: '这个邮箱今天发送验证码的次数已达上限。',
  IP_RATE_LIMIT_REACHED: '当前网络请求过于频繁，请稍后再试。',
  SEND_CODE_FAILED: '验证码发送失败，请稍后再试。',
  INVALID_CODE_FORMAT: '请输入 6 位数字验证码。',
  CODE_NOT_FOUND: '请先发送验证码。',
  CODE_EXPIRED: '验证码已过期，请重新发送。',
  CODE_ATTEMPTS_EXCEEDED: '验证码尝试次数过多，请重新发送。',
  INVALID_CODE: '验证码不正确。',
  ACTIVATE_FAILED: '激活失败，请稍后再试。',
}

function messageFor(error) {
  return ERROR_MESSAGES[error] || '请求失败，请稍后再试。'
}

export default function EmailActivationPrompt() {
  const { loading, user, refresh } = useSessionAccount()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const shouldShow = !loading && user?.provider === 'email' && user?.status === 'pending'

  if (!shouldShow) return null

  async function sendCode() {
    setSending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, purpose: 'activate' }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'SEND_CODE_FAILED')
      setNotice('激活验证码已发送。')
    } catch (err) {
      setError(messageFor(err.message))
    } finally {
      setSending(false)
    }
  }

  async function activate(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/auth/email/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'ACTIVATE_FAILED')
      setNotice('邮箱已激活，正式账号权益已生效。')
      setCode('')
      await refresh()
    } catch (err) {
      setError(messageFor(err.message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--site-header-height)+0.5rem)] z-[112] px-4">
      <form
        onSubmit={activate}
        className="pointer-events-auto mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#e2d8c6] bg-[#faf7ef] px-4 py-2 text-sm shadow-sm dark:border-amber-900/50 dark:bg-[#1a1711] sm:rounded-full"
      >
        <p className="m-0 min-w-0 text-[13px] leading-5 text-[#5a5648] dark:text-amber-100 sm:text-sm">
          已为你保留阅读记录和 100 燃币。激活邮箱后，可换设备登录、找回密码，并保留长期权益。
        </p>
        <button
          type="button"
          onClick={sendCode}
          disabled={sending}
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#d8cdb8] bg-white/75 px-3 text-xs font-semibold text-[#4a463b] transition hover:border-[#bfb29b] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100"
        >
          {sending ? '发送中…' : '发送激活码'}
        </button>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6 位验证码"
          className="h-8 w-28 rounded-full border border-[#d8cdb8] bg-white/80 px-3 text-center text-xs tracking-[0.16em] text-[#1a1b17] outline-none focus:border-[#a37b3c] dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100"
        />
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#8b5a1f] px-3 text-xs font-semibold text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d7a85c] dark:text-[#1d160d]"
        >
          {submitting ? '激活中…' : '激活'}
        </button>
        {notice || error ? (
          <span className={`text-xs ${error ? 'text-[#a34f47] dark:text-[#e5b1a8]' : 'text-[#50664e] dark:text-[#b3d4a4]'}`}>
            {error || notice}
          </span>
        ) : null}
      </form>
    </div>
  )
}

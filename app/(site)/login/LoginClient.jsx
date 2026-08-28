'use client'

import {
  IconArrowRight,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandWechat,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconKey,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { normalizeReturnTo } from '../../../lib/returnTo'

const ERROR_MESSAGES = {
  INVALID_CREDENTIAL: '凭证无效、已过期或已停用。',
  INVALID_CREDENTIALS: '邮箱或密码不正确。',
  INVALID_PASSWORD: '第一次使用这个邮箱时，密码长度需要至少 8 位。',
  LOGIN_FAILED: '登录失败，请稍后再试。',
}
const LAST_LOGIN_METHOD_COOKIE = 'tuaran_last_login_method'
const WECHAT_LOGIN_ENABLED = process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED === 'true'
const LOGIN_METHOD_LABELS = {
  google: 'Google',
  github: 'GitHub',
  wechat: '微信',
  email: '邮箱',
  credential: '凭证',
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
    <span className="shrink-0 rounded-full bg-[#f1e4d9] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#9c553d] dark:bg-[#4a2c27] dark:text-[#e3a58e]">
      上次使用
    </span>
  )
}

function Divider({ children }) {
  return (
    <div className="my-5 flex items-center gap-2 text-xs text-[#74736d] dark:text-[#949b9d]">
      <span className="h-px flex-1 bg-[#d6d3cc] dark:bg-[#343c43]" aria-hidden="true" />
      <span className="shrink-0 bg-[#fbfaf7] px-1 dark:bg-[#10161b]">{children}</span>
      <span className="h-px flex-1 bg-[#d6d3cc] dark:bg-[#343c43]" aria-hidden="true" />
    </div>
  )
}

function SocialLogin({ href, icon, label, lastUsed }) {
  return (
    <a
      href={href}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-transparent px-3 py-2.5 text-center text-sm font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5795f]/45 dark:text-gray-100 ${
        lastUsed
          ? 'border-[#c47a63] text-[#171714] shadow-[0_0_0_1px_rgba(196,122,99,0.12)] dark:border-[#c9846e]'
          : 'border-[#d1cec7] text-[#171714] hover:border-[#aaa69d] hover:bg-white dark:border-[#3a4249] dark:hover:border-[#616b73] dark:hover:bg-[#171e24]'
      }`}
    >
      {icon}
      <span>使用 {label} 继续</span>
      {lastUsed ? <LastUsedBadge /> : null}
    </a>
  )
}

const inputClassName =
  'min-h-11 w-full rounded-lg border border-[#ccc9c1] bg-transparent px-3 py-2.5 text-base text-[#171714] outline-none transition placeholder:text-[#85837d] hover:border-[#aaa69d] focus:border-[#1b1b19] focus:ring-1 focus:ring-[#1b1b19] dark:border-[#3a4249] dark:text-gray-100 dark:placeholder:text-[#778087] dark:hover:border-[#616b73] dark:focus:border-[#d8d4ca] dark:focus:ring-[#d8d4ca] sm:text-sm'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [credential, setCredential] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [credentialError, setCredentialError] = useState('')
  const [oauthReturnTo, setOauthReturnTo] = useState('/')
  const [lastLoginMethod, setLastLoginMethod] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCredential, setShowCredential] = useState(false)

  useEffect(() => {
    setOauthReturnTo(getReturnTo())
    setLastLoginMethod(getCookie(LAST_LOGIN_METHOD_COOKIE))
  }, [])

  async function login(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setCredentialError('')
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

  async function loginWithCredential(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setCredentialError('')
    try {
      const response = await fetch('/api/auth/credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'LOGIN_FAILED')
      window.location.href = getReturnTo()
    } catch (err) {
      setCredentialError(ERROR_MESSAGES[err.message] || ERROR_MESSAGES.LOGIN_FAILED)
    } finally {
      setSubmitting(false)
    }
  }

  const registerHref = `/register?returnTo=${encodeURIComponent(oauthReturnTo)}`

  return (
    <main className="min-h-[calc(100svh-var(--site-header-height))] border-l border-[#dedbd4] bg-[#fbfaf7] px-5 py-8 dark:border-[#242d34] dark:bg-[#10161b] sm:px-8 sm:py-12">
      <section className="mx-auto w-full max-w-md">
        <div className="mb-6 h-1 w-12 bg-[#d5795f] dark:bg-[#c97861]" aria-hidden="true" />

        <header className="mb-5">
          <h1 className="mb-2 font-serif text-3xl font-semibold leading-none tracking-[-0.06em] text-[#151513] dark:text-[#f2efe8] sm:text-4xl">
            登录
          </h1>
          <p className="mb-0 text-sm text-[#676660] dark:text-[#9ba2a5]">
            没有账号？{' '}
            <Link
              href={registerHref}
              className="font-semibold text-[#55544f] underline decoration-[#8b8982] underline-offset-[6px] transition hover:text-[#151513] dark:text-[#c3c5c3] dark:hover:text-white"
            >
              注册
            </Link>
          </p>
        </header>

        {lastLoginMethod && LOGIN_METHOD_LABELS[lastLoginMethod] ? (
          <p className="mb-3 text-xs text-[#77756e] dark:text-[#959da1]" aria-live="polite">
            上次使用 <span className="font-semibold text-[#9c553d] dark:text-[#dfa08b]">{LOGIN_METHOD_LABELS[lastLoginMethod]}</span> 登录
          </p>
        ) : null}

        <Divider>或继续使用</Divider>

        <div className="grid gap-2">
          {WECHAT_LOGIN_ENABLED ? (
            <SocialLogin
              href={`/api/auth/login?provider=wechat&returnTo=${encodeURIComponent(oauthReturnTo)}`}
              icon={<IconBrandWechat size={20} stroke={1.8} className="shrink-0 text-[#07a443]" aria-hidden="true" />}
              label="微信"
              lastUsed={lastLoginMethod === 'wechat'}
            />
          ) : null}
          <SocialLogin
            href={`/api/auth/login?provider=github&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            icon={<IconBrandGithub size={20} stroke={1.8} className="shrink-0" aria-hidden="true" />}
            label="GitHub"
            lastUsed={lastLoginMethod === 'github'}
          />
          <SocialLogin
            href={`/api/auth/login?provider=google&returnTo=${encodeURIComponent(oauthReturnTo)}`}
            icon={<IconBrandGoogle size={20} stroke={2.2} className="shrink-0 text-[#4285f4]" aria-hidden="true" />}
            label="Google"
            lastUsed={lastLoginMethod === 'google'}
          />
        </div>

        <form onSubmit={login} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#1b1b18] dark:text-gray-100">电子邮箱</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="输入您的电子邮箱"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#1b1b18] dark:text-gray-100">密码</span>
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入密码"
                className={`${inputClassName} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#74726c] transition hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d5795f] dark:text-[#969da0] dark:hover:text-white"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <IconEyeOff size={20} stroke={1.7} /> : <IconEye size={20} stroke={1.7} />}
              </button>
            </span>
          </label>

          {error ? (
            <p className="rounded-md bg-[#f7e8e4] px-3.5 py-2.5 text-sm text-[#963f35] dark:bg-[#442620] dark:text-[#e9a99e]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#181817] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#33322f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5795f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f1eee7] dark:text-[#151513] dark:hover:bg-white dark:focus-visible:ring-offset-[#10161b]"
          >
            <IconArrowRight size={20} stroke={1.9} aria-hidden="true" />
            <span>{submitting ? '登录中…' : '登录'}</span>
            {lastLoginMethod === 'email' ? <span className="sr-only">上次使用</span> : null}
          </button>
        </form>

        <div className="mt-5 border-t border-[#d6d3cc] pt-3 dark:border-[#343c43]">
          <button
            type="button"
            onClick={() => setShowCredential((value) => !value)}
            className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium text-[#66645e] transition hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5795f]/45 dark:text-[#9ca3a6] dark:hover:text-white"
            aria-expanded={showCredential}
            aria-controls="credential-login"
          >
            <span className="flex items-center gap-2">
              <IconKey size={19} stroke={1.7} aria-hidden="true" />
              使用站长签发的登录凭证
              {lastLoginMethod === 'credential' ? (
                <span className="rounded-full bg-[#f1e4d9] px-2 py-0.5 text-[10px] font-semibold text-[#9c553d] dark:bg-[#4a2c27] dark:text-[#e3a58e]">
                  上次使用
                </span>
              ) : null}
            </span>
            <IconChevronDown
              size={19}
              stroke={1.7}
              className={`shrink-0 transition-transform ${showCredential ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {showCredential ? (
            <form id="credential-login" onSubmit={loginWithCredential} className="mt-3 space-y-3">
              <label className="sr-only" htmlFor="login-credential">登录凭证</label>
              <input
                id="login-credential"
                type="password"
                autoComplete="off"
                required
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                placeholder="输入站长签发的凭证"
                className={`${inputClassName} font-mono text-sm`}
              />
              {credentialError ? <p className="text-sm text-[#963f35] dark:text-[#e9a99e]" role="alert">{credentialError}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md border border-[#aaa69d] px-4 py-3 text-sm font-semibold text-[#24231f] transition hover:border-[#171714] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#505960] dark:text-gray-100 dark:hover:border-[#8a949b] dark:hover:bg-[#171e24]"
              >
                {submitting ? '验证中…' : '使用凭证登录'}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  )
}

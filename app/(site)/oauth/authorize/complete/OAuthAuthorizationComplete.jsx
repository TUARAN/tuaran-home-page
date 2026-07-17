'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STATUS = {
  returning: {
    eyebrow: 'OAuth Authorized',
    title: '授权已完成',
    description: '正在返回 WorkBuddy，由客户端完成安全连接。',
  },
  ready: {
    eyebrow: 'OAuth Authorized',
    title: '授权已完成',
    description: '如果 WorkBuddy 没有自动打开，请点击下方按钮继续。',
  },
  invalid: {
    eyebrow: 'OAuth Error',
    title: '无法返回客户端',
    description: '回调信息已丢失，请返回 WorkBuddy 重新发起连接。',
  },
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 fill-none stroke-current" strokeWidth="2">
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function OAuthAuthorizationComplete() {
  const [status, setStatus] = useState('returning')
  const [callbackUrl, setCallbackUrl] = useState('')

  useEffect(() => {
    let target = ''
    try {
      target = decodeURIComponent(window.location.hash.slice(1))
      const parsed = new URL(target)
      if (
        parsed.protocol !== 'workbuddy:' ||
        parsed.hostname !== 'workbuddy' ||
        !/^\/mcp\/[^/]+\/oauth\/callback$/.test(parsed.pathname) ||
        !parsed.searchParams.get('code')
      ) throw new Error('INVALID_CALLBACK')
    } catch {
      setStatus('invalid')
      return undefined
    }

    setCallbackUrl(target)
    window.history.replaceState(null, '', window.location.pathname)

    const returnTimer = window.setTimeout(() => {
      window.location.assign(target)
    }, 350)
    const statusTimer = window.setTimeout(() => setStatus('ready'), 1800)
    return () => {
      window.clearTimeout(returnTimer)
      window.clearTimeout(statusTimer)
    }
  }, [])

  const content = STATUS[status]
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-12 sm:py-20">
      <section className="w-full rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 text-center shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${status === 'invalid' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
          {status === 'invalid' ? <span className="text-2xl font-semibold">!</span> : <CheckIcon />}
        </div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45] dark:text-[#929870]">{content.eyebrow}</p>
        <h1 className="mb-3 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">{content.title}</h1>
        <p className="mx-auto max-w-md text-sm leading-7 text-[#65665d] dark:text-gray-300">{content.description}</p>

        {status === 'returning' ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#77796d] dark:text-gray-400" role="status" aria-live="polite">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#8b5a1f] dark:bg-[#d7a85c]" />
            正在唤起客户端…
          </div>
        ) : null}

        {status === 'ready' && callbackUrl ? (
          <a href={callbackUrl} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white no-underline hover:bg-[#724817] dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#c99a4d]">
            返回 WorkBuddy
          </a>
        ) : null}

        <div className="mt-6 border-t border-[#d8d9cf] pt-5 dark:border-[#344052]">
          <p className="mb-2 text-xs leading-6 text-[#77796d] dark:text-gray-400">
            本页面不会展示或保存 Access Token。连接状态请以 WorkBuddy 客户端提示为准。
          </p>
          <Link href="/mcp-center" className="text-sm text-[#8b5a1f] underline underline-offset-4 dark:text-[#d7a85c]">返回 MCP 中心</Link>
        </div>
      </section>
    </main>
  )
}

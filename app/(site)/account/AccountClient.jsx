'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useSessionAccount } from '../components/SessionProvider'

const PROVIDER_LABELS = {
  wechat: '微信',
  github: 'GitHub',
  google: 'Google',
}
const WECHAT_LOGIN_ENABLED = process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED === 'true'

const RESULT_MESSAGES = {
  bound: '微信已绑定。以后可直接使用微信扫码登录这个账号。',
  already_bound: '这个微信已经绑定到当前账号。',
  belongs_to_other_account: '该微信已绑定到另一个账号。为保护账号数据，系统不会自动合并。',
  login_required: '绑定已取消：返回站点时没有检测到原登录状态。请重新登录后再试。',
}

function identityName(identity) {
  return PROVIDER_LABELS[identity.provider] || identity.provider
}

export default function AccountClient() {
  const { loading, user } = useSessionAccount()
  const [identities, setIdentities] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    fetch('/api/account/identities', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json().catch(() => null) }))
      .then(({ response, data }) => {
        if (cancelled) return
        if (!response.ok) throw new Error(data?.error || 'LOAD_FAILED')
        setIdentities(Array.isArray(data?.identities) ? data.identities : [])
      })
      .catch(() => {
        if (!cancelled) setLoadError('暂时无法读取已绑定的登录方式，请稍后刷新。')
      })
    return () => { cancelled = true }
  }, [user?.id])

  const result = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('wechat')
  const wechatBound = identities.some((identity) => identity.provider === 'wechat')

  if (!loading && !user) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
        <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 text-center shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
          <h1 className="text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">账号与登录方式</h1>
          <p className="mt-3 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">请先登录，再绑定微信或查看账号的登录方式。</p>
          <Link href="/login?returnTo=/account" className="mt-6 inline-flex rounded-xl bg-[#8b5a1f] px-4 py-2.5 text-sm font-medium text-white no-underline dark:bg-[#d7a85c] dark:text-[#1d160d]">去登录</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45] dark:text-[#929870]">Account</p>
        <h1 className="text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">账号与登录方式</h1>
        <p className="mt-2 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">当前账号：{user?.name || user?.login || user?.email || '已登录用户'}</p>

        {result && RESULT_MESSAGES[result] ? <p className={`mt-5 rounded-xl border px-3.5 py-3 text-sm leading-6 ${result === 'belongs_to_other_account' || result === 'login_required' ? 'border-[#e3bbb3] bg-[#fff5f2] text-[#8c3d34] dark:border-[#693b36] dark:bg-[#281815] dark:text-[#e9b7b0]' : 'border-[#bfd5bd] bg-[#f1f8ef] text-[#426440] dark:border-[#3b5b40] dark:bg-[#16261a] dark:text-[#b3d6ae]'}`}>{RESULT_MESSAGES[result]}</p> : null}

        <div className="mt-6 rounded-2xl border border-[#d8dad0] bg-white/65 p-4 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">已绑定</p>
          {loadError ? <p className="mt-2 text-sm text-[#a34f47]">{loadError}</p> : null}
          {!loadError && identities.length === 0 ? <p className="mt-2 text-sm text-[#65665d] dark:text-[#9aa6b6]">暂未发现已迁移的第三方登录记录。你仍可安全绑定微信。</p> : null}
          {identities.length ? <ul className="mt-3 space-y-2">{identities.map((identity) => <li key={`${identity.provider}:${identity.provider_login}`} className="flex items-center justify-between rounded-xl border border-[#e1e3da] px-3 py-2.5 text-sm dark:border-[#2c3746]"><span className="font-medium text-[#35362f] dark:text-gray-100">{identityName(identity)}</span><span className="max-w-[60%] truncate text-xs text-[#74766d] dark:text-[#9aa6b6]">{identity.provider_name || identity.provider_login || '已绑定'}</span></li>)}</ul> : null}
        </div>

        <div className="mt-4 rounded-2xl border border-[#d8dad0] bg-white/65 p-4 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">微信登录</p>
          <p className="mt-1 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">绑定后可用微信扫码登录。系统不会依据昵称、手机号或邮箱自动合并账号；若该微信已属于另一个账号，会拒绝绑定以保护评论、燃币和阅读记录。</p>
          {WECHAT_LOGIN_ENABLED ? (
            <Link href="/api/auth/login?provider=wechat&intent=bind&returnTo=%2Faccount" className={`mt-4 inline-flex rounded-xl px-4 py-2.5 text-sm font-medium no-underline ${wechatBound ? 'bg-[#e7e8e0] text-[#5f6257] dark:bg-[#293241] dark:text-gray-300' : 'bg-[#07a443] text-white hover:bg-[#078c3a]'}`}>{wechatBound ? '重新确认微信绑定' : '绑定微信'}</Link>
          ) : (
            <span className="mt-4 inline-flex rounded-xl border border-dashed border-[#b7c7b2] bg-[#eff5ed] px-4 py-2.5 text-sm font-medium text-[#597154] dark:border-[#3b5b40] dark:bg-[#16261a] dark:text-[#9ac596]">微信登录审核中，开放后可绑定</span>
          )}
        </div>
      </section>
    </main>
  )
}

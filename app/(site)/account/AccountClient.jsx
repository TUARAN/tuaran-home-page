'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useSessionAccount } from '../components/SessionProvider'

const PROVIDER_LABELS = {
  wechat: '微信',
  github: 'GitHub',
  google: 'Google',
  email: '邮箱密码',
}
const WECHAT_LOGIN_ENABLED = process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED === 'true'

const RESULT_MESSAGES = {
  bound: '登录方式已绑定。以后可直接使用它登录这个账号。',
  already_bound: '该登录方式已绑定到当前账号。',
  belongs_to_other_account: '该登录方式已绑定到另一个账号。为保护账号数据，系统不会自动合并。',
  login_required: '绑定已取消：返回站点时没有检测到原登录状态。请重新登录后再试。',
  unbound: '登录方式已解绑。',
}

function identityName(identity) {
  return PROVIDER_LABELS[identity.provider] || identity.provider
}

export default function AccountClient() {
  const { loading, user } = useSessionAccount()
  const [identities, setIdentities] = useState([])
  const [guestIdentities, setGuestIdentities] = useState([])
  const [platformId, setPlatformId] = useState('')
  const [loadError, setLoadError] = useState('')
  const [unlinking, setUnlinking] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    fetch('/api/account/identities', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json().catch(() => null) }))
      .then(({ response, data }) => {
        if (cancelled) return
        if (!response.ok) throw new Error(data?.error || 'LOAD_FAILED')
        setIdentities(Array.isArray(data?.identities) ? data.identities : [])
        setGuestIdentities(Array.isArray(data?.guestIdentities) ? data.guestIdentities : [])
        setPlatformId(data?.account?.platformId || user.id || '')
      })
      .catch(() => {
        if (!cancelled) setLoadError('暂时无法读取已绑定的登录方式，请稍后刷新。')
      })
    return () => { cancelled = true }
  }, [user?.id])

  const result = typeof window === 'undefined' ? '' : ['github', 'google', 'wechat'].map((key) => new URLSearchParams(window.location.search).get(key)).find(Boolean)
  const wechatBound = identities.some((identity) => identity.provider === 'wechat')

  async function unbind(provider) {
    if (unlinking) return
    setActionError('')
    setUnlinking(provider)
    try {
      const response = await fetch(`/api/account/identities?provider=${encodeURIComponent(provider)}`, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const messages = {
          LAST_LOGIN_METHOD: '至少保留一种登录方式，避免账号无法再次登录。',
          IDENTITY_CANNOT_BE_UNBOUND: '邮箱密码请在之后的安全设置中管理。',
        }
        throw new Error(messages[data?.error] || '解绑失败，请稍后重试。')
      }
      setIdentities((current) => current.filter((identity) => identity.provider !== provider))
    } catch (error) {
      setActionError(String(error?.message || error))
    } finally {
      setUnlinking('')
    }
  }

  if (!loading && !user) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
        <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 text-center shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
          <h1 className="text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">账号中心</h1>
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
        <h1 className="text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">账号中心</h1>
        <p className="mt-2 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">账号模块统一管理你的站内身份和登录方式。</p>

        <div className="mt-5 rounded-2xl border border-[#d8dad0] bg-[#fbfcf9] px-4 py-3 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">平台 ID</p>
          <p className="mt-1 break-all font-mono text-xs text-[#74766d] dark:text-[#9aa6b6]">{platformId || user?.id || '读取中…'}</p>
          <p className="mt-2 text-xs leading-5 text-[#74766d] dark:text-[#9aa6b6]">这是唯一且长期不变的站内身份；GitHub、微信、Google 和邮箱只是可绑定的登录方式。</p>
        </div>

        {result && RESULT_MESSAGES[result] ? <p className={`mt-5 rounded-xl border px-3.5 py-3 text-sm leading-6 ${result === 'belongs_to_other_account' || result === 'login_required' ? 'border-[#e3bbb3] bg-[#fff5f2] text-[#8c3d34] dark:border-[#693b36] dark:bg-[#281815] dark:text-[#e9b7b0]' : 'border-[#bfd5bd] bg-[#f1f8ef] text-[#426440] dark:border-[#3b5b40] dark:bg-[#16261a] dark:text-[#b3d6ae]'}`}>{RESULT_MESSAGES[result]}</p> : null}

        <div className="mt-6 rounded-2xl border border-[#d8dad0] bg-white/65 p-4 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">已绑定</p>
          {loadError ? <p className="mt-2 text-sm text-[#a34f47]">{loadError}</p> : null}
          {!loadError && identities.length === 0 ? <p className="mt-2 text-sm text-[#65665d] dark:text-[#9aa6b6]">暂未发现已绑定的登录方式。请重新登录或绑定一种登录方式。</p> : null}
          {identities.length ? <ul className="mt-3 space-y-2">{identities.map((identity) => <li key={`${identity.provider}:${identity.provider_account_id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#e1e3da] px-3 py-2.5 text-sm dark:border-[#2c3746]"><span className="font-medium text-[#35362f] dark:text-gray-100">{identityName(identity)}</span><span className="ml-auto max-w-[42%] truncate text-xs text-[#74766d] dark:text-[#9aa6b6]">{identity.provider_name || identity.provider_login || '已绑定'}</span>{identity.provider !== 'email' ? <button type="button" onClick={() => unbind(identity.provider)} disabled={Boolean(unlinking)} className="shrink-0 text-xs text-[#a34f47] disabled:opacity-50">{unlinking === identity.provider ? '解绑中…' : '解绑'}</button> : <span className="shrink-0 text-xs text-[#74766d] dark:text-[#9aa6b6]">邮箱凭据</span>}</li>)}</ul> : null}
          {actionError ? <p className="mt-3 text-sm text-[#a34f47]">{actionError}</p> : null}
        </div>

        <div className="mt-4 rounded-2xl border border-[#d8dad0] bg-white/65 p-4 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">添加登录方式</p>
          <p className="mt-1 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">系统不会依据昵称、手机号或邮箱自动合并账号；若该身份已属于另一个账号，会拒绝绑定以保护评论、燃币和阅读记录。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/api/auth/login?provider=github&intent=bind&returnTo=%2Faccount" className="inline-flex rounded-xl bg-[#24292f] px-4 py-2.5 text-sm font-medium text-white no-underline">绑定 GitHub</Link>
            <Link href="/api/auth/login?provider=google&intent=bind&returnTo=%2Faccount" className="inline-flex rounded-xl bg-[#3b6db3] px-4 py-2.5 text-sm font-medium text-white no-underline">绑定 Google</Link>
          {WECHAT_LOGIN_ENABLED ? (
            <Link href="/api/auth/login?provider=wechat&intent=bind&returnTo=%2Faccount" className={`inline-flex rounded-xl px-4 py-2.5 text-sm font-medium no-underline ${wechatBound ? 'bg-[#e7e8e0] text-[#5f6257] dark:bg-[#293241] dark:text-gray-300' : 'bg-[#07a443] text-white hover:bg-[#078c3a]'}`}>{wechatBound ? '重新确认微信' : '绑定微信'}</Link>
          ) : (
            <span className="inline-flex rounded-xl border border-dashed border-[#b7c7b2] bg-[#eff5ed] px-4 py-2.5 text-sm font-medium text-[#597154] dark:border-[#3b5b40] dark:bg-[#16261a] dark:text-[#9ac596]">微信登录审核中</span>
          )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#d8dad0] bg-white/65 p-4 dark:border-[#344052] dark:bg-[#0d131b]/60">
          <p className="text-sm font-semibold text-[#35362f] dark:text-gray-100">已关联的游客身份</p>
          <p className="mt-1 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">登录前在这台浏览器产生的游客记录会归入本账号，并保留关联历史。</p>
          {guestIdentities.length ? <ul className="mt-3 space-y-2">{guestIdentities.map((guest) => <li key={guest.id} className="rounded-xl border border-[#e1e3da] px-3 py-2 text-xs font-mono text-[#74766d] dark:border-[#2c3746] dark:text-[#9aa6b6]">{guest.id}</li>)}</ul> : <p className="mt-3 text-sm text-[#74766d] dark:text-[#9aa6b6]">暂无已关联的游客身份。</p>}
        </div>
      </section>
    </main>
  )
}

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

function SectionIntro({ index, eyebrow, title, children }) {
  return <aside className="lg:pr-8">
    <p className="text-[11px] font-bold tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">{index} / {eyebrow}</p>
    <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#1a1b17] dark:text-gray-100">{title}</h2>
    {children ? <div className="mt-3 text-sm leading-7 text-[#65665d] dark:text-[#9aa6b6]">{children}</div> : null}
  </aside>
}

export default function AccountClient() {
  const { loading, user } = useSessionAccount()
  const [identities, setIdentities] = useState([])
  const [guestIdentities, setGuestIdentities] = useState([])
  const [platformId, setPlatformId] = useState('')
  const [identitiesLoaded, setIdentitiesLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [unlinking, setUnlinking] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setIdentitiesLoaded(false)
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
      .finally(() => {
        if (!cancelled) setIdentitiesLoaded(true)
      })
    return () => { cancelled = true }
  }, [user?.id])

  const result = typeof window === 'undefined' ? '' : ['github', 'google', 'wechat'].map((key) => new URLSearchParams(window.location.search).get(key)).find(Boolean)
  const boundProviders = new Set(identities.map((identity) => identity.provider))
  const githubBound = boundProviders.has('github')
  const googleBound = boundProviders.has('google')
  const wechatBound = boundProviders.has('wechat')

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
    return <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">Account</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1b17] dark:text-gray-100">账号中心</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-[#65665d] dark:text-[#9aa6b6]">请先登录，再绑定微信或查看账号的登录方式。</p>
      <Link href="/login?returnTo=/account" className="mt-6 inline-flex rounded-full bg-[#1f242b] px-4 py-2.5 text-sm font-medium text-white no-underline transition hover:bg-[#353c46]">去登录</Link>
    </main>
  }

  return <main className="mx-auto w-full max-w-[960px] px-4 py-12 sm:py-16">
    <header className="border-b border-[#d8dad0] pb-9 dark:border-[#344052]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">Account / identity</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1b17] dark:text-gray-100 sm:text-4xl">账号中心</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#65665d] dark:text-[#9aa6b6]">管理你的站内身份与登录方式。第三方账号只是登录凭据，不会改变你的平台 ID、评论、燃币或阅读记录。</p>
      <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-[#d8dad0] pt-4 text-sm dark:border-[#344052]">
        <div className="flex items-baseline gap-3"><dt className="text-[#74766d] dark:text-[#9aa6b6]">平台 ID</dt><dd className="font-mono text-xs text-[#35362f] dark:text-gray-100">{platformId || user?.id || '读取中…'}</dd></div>
        <div className="flex items-baseline gap-3"><dt className="text-[#74766d] dark:text-[#9aa6b6]">登录方式</dt><dd className="text-[#35362f] dark:text-gray-100">{identitiesLoaded ? `${identities.length} 种` : '读取中…'}</dd></div>
      </dl>
    </header>

    {result && RESULT_MESSAGES[result] ? <p className={`mt-6 border-l-2 py-1 pl-4 text-sm leading-6 ${result === 'belongs_to_other_account' || result === 'login_required' ? 'border-[#a34f47] text-[#8c3d34] dark:border-[#d58a82] dark:text-[#e9b7b0]' : 'border-[#638262] text-[#426440] dark:border-[#8bb585] dark:text-[#b3d6ae]'}`}>{RESULT_MESSAGES[result]}</p> : null}

    <section className="grid gap-8 border-b border-[#d8dad0] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 dark:border-[#344052]">
      <SectionIntro index="01" eyebrow="CONNECTED" title="已绑定">
        <p>这些方式均可直接登录同一个账号。</p>
      </SectionIntro>
      <div className="border-t border-[#d8dad0] dark:border-[#344052]">
        {loadError ? <p className="py-4 text-sm text-[#a34f47]">{loadError}</p> : null}
        {!loadError && !identitiesLoaded ? <p className="py-4 text-sm text-[#74766d] dark:text-[#9aa6b6]">正在读取登录方式…</p> : null}
        {!loadError && identitiesLoaded && identities.length === 0 ? <p className="py-4 text-sm leading-6 text-[#65665d] dark:text-[#9aa6b6]">暂未发现已绑定的登录方式。请重新登录或绑定一种登录方式。</p> : null}
        {identities.map((identity) => {
          const canUnbind = identity.provider !== 'email' && identities.length > 1
          return <div key={`${identity.provider}:${identity.provider_account_id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#d8dad0] py-4 dark:border-[#344052]">
            <span className="min-w-20 font-medium text-[#35362f] dark:text-gray-100">{identityName(identity)}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-[#74766d] dark:text-[#9aa6b6]">{identity.provider_name || identity.provider_login || '已绑定'}</span>
            {identity.provider === 'email' ? <span className="text-xs text-[#74766d] dark:text-[#9aa6b6]">邮箱凭据</span> : canUnbind ? <button type="button" onClick={() => unbind(identity.provider)} disabled={Boolean(unlinking)} className="text-xs text-[#a34f47] transition hover:text-[#7f332d] disabled:opacity-50">{unlinking === identity.provider ? '解绑中…' : '解绑'}</button> : <span className="text-xs text-[#74766d] dark:text-[#9aa6b6]">主要登录方式</span>}
          </div>
        })}
      </div>
    </section>

    <section className="grid gap-8 border-b border-[#d8dad0] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 dark:border-[#344052]">
      <SectionIntro index="02" eyebrow="ADD A METHOD" title="添加登录方式">
        <p>系统不会按昵称、手机号或邮箱合并账号。若身份已属于另一个账号，会拒绝绑定以保护你的记录。</p>
      </SectionIntro>
      <div className="border-t border-[#d8dad0] dark:border-[#344052]">
        {!identitiesLoaded ? <p className="py-4 text-sm text-[#74766d] dark:text-[#9aa6b6]">正在读取可添加的方式…</p> : <>
          {!githubBound ? <Link href="/api/auth/login?provider=github&intent=bind&returnTo=%2Faccount" className="group flex items-center justify-between gap-4 border-b border-[#d8dad0] py-4 text-sm no-underline dark:border-[#344052]"><span className="font-medium text-[#35362f] dark:text-gray-100">GitHub</span><span className="text-[#74766d] transition group-hover:text-[#1f242b] dark:text-[#9aa6b6] dark:group-hover:text-white">绑定 GitHub →</span></Link> : null}
          {!googleBound ? <Link href="/api/auth/login?provider=google&intent=bind&returnTo=%2Faccount" className="group flex items-center justify-between gap-4 border-b border-[#d8dad0] py-4 text-sm no-underline dark:border-[#344052]"><span className="font-medium text-[#35362f] dark:text-gray-100">Google</span><span className="text-[#74766d] transition group-hover:text-[#1f242b] dark:text-[#9aa6b6] dark:group-hover:text-white">绑定 Google →</span></Link> : null}
          {!wechatBound && (WECHAT_LOGIN_ENABLED ? <Link href="/api/auth/login?provider=wechat&intent=bind&returnTo=%2Faccount" className="group flex items-center justify-between gap-4 border-b border-[#d8dad0] py-4 text-sm no-underline dark:border-[#344052]"><span className="font-medium text-[#35362f] dark:text-gray-100">微信</span><span className="text-[#74766d] transition group-hover:text-[#1f242b] dark:text-[#9aa6b6] dark:group-hover:text-white">绑定微信 →</span></Link> : <div className="flex items-center justify-between gap-4 border-b border-[#d8dad0] py-4 text-sm dark:border-[#344052]"><span className="font-medium text-[#74766d] dark:text-[#9aa6b6]">微信</span><span className="text-xs text-[#7a8e73] dark:text-[#9ac596]">登录审核中</span></div>)}
          {githubBound && googleBound && (wechatBound || !WECHAT_LOGIN_ENABLED) ? <p className="py-4 text-sm text-[#74766d] dark:text-[#9aa6b6]">当前可用的登录方式均已添加。</p> : null}
        </>}
        {actionError ? <p className="mt-4 text-sm text-[#a34f47]">{actionError}</p> : null}
      </div>
    </section>

    <section className="grid gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <SectionIntro index="03" eyebrow="GUEST HISTORY" title="已关联的游客身份">
        <p>登录前在这台浏览器产生的游客记录会归入本账号，并保留关联历史。</p>
      </SectionIntro>
      <div className="border-t border-[#d8dad0] dark:border-[#344052]">
        {guestIdentities.length ? guestIdentities.map((guest) => <div key={guest.id} className="border-b border-[#d8dad0] py-4 font-mono text-xs text-[#74766d] dark:border-[#344052] dark:text-[#9aa6b6]">{guest.id}</div>) : <p className="py-4 text-sm text-[#74766d] dark:text-[#9aa6b6]">暂无已关联的游客身份。</p>}
      </div>
    </section>
  </main>
}

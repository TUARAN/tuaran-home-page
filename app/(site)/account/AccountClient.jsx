'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  IconArrowRight,
  IconCoin,
  IconDownload,
  IconLockOpen,
} from '@tabler/icons-react'

import { useSessionAccount } from '../components/SessionProvider'
import UserAvatar from '../components/UserAvatar'

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

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

export default function AccountClient() {
  const { loading, user } = useSessionAccount()
  const [activeTab, setActiveTab] = useState('overview')
  const [identities, setIdentities] = useState([])
  const [guestIdentities, setGuestIdentities] = useState([])
  const [oauthGrants, setOauthGrants] = useState([])
  const [pointsInfo, setPointsInfo] = useState(null)
  const [platformId, setPlatformId] = useState('')
  const [identitiesLoaded, setIdentitiesLoaded] = useState(false)
  const [pointsLoaded, setPointsLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [unlinking, setUnlinking] = useState('')
  const [actionError, setActionError] = useState('')
  const [revokingClient, setRevokingClient] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setIdentitiesLoaded(false)
    setPointsLoaded(false)
    Promise.all([
      fetch('/api/account/identities', { cache: 'no-store' }),
      fetch('/api/account/oauth-grants', { cache: 'no-store' }),
      fetch('/api/points/me', { cache: 'no-store', credentials: 'same-origin' }),
    ]).then(async ([identityResponse, grantResponse, pointsResponse]) => ({
      identityResponse,
      identityData: await identityResponse.json().catch(() => null),
      grantData: grantResponse.ok ? await grantResponse.json().catch(() => null) : null,
      pointsData: pointsResponse.ok ? await pointsResponse.json().catch(() => null) : null,
    }))
      .then(({ identityResponse, identityData, grantData, pointsData }) => {
        if (cancelled) return
        if (!identityResponse.ok) throw new Error(identityData?.error || 'LOAD_FAILED')
        setIdentities(Array.isArray(identityData?.identities) ? identityData.identities : [])
        setGuestIdentities(Array.isArray(identityData?.guestIdentities) ? identityData.guestIdentities : [])
        setOauthGrants(Array.isArray(grantData?.grants) ? grantData.grants : [])
        setPointsInfo(pointsData?.authed ? pointsData : null)
        setPlatformId(identityData?.account?.platformId || user.id || '')
      })
      .catch(() => {
        if (!cancelled) setLoadError('暂时无法读取已绑定的登录方式，请稍后刷新。')
      })
      .finally(() => {
        if (!cancelled) setIdentitiesLoaded(true)
        if (!cancelled) setPointsLoaded(true)
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

  async function revokeOAuthGrant(clientId) {
    if (revokingClient) return
    setActionError('')
    setRevokingClient(clientId)
    try {
      const response = await fetch(`/api/account/oauth-grants?client_id=${encodeURIComponent(clientId)}`, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || '撤销失败，请稍后重试。')
      setOauthGrants((current) => current.filter((grant) => grant.client_id !== clientId))
    } catch (error) {
      setActionError(String(error?.message || error))
    } finally {
      setRevokingClient('')
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

  const unlocks = Array.isArray(pointsInfo?.unlocks) ? pointsInfo.unlocks : []
  const resourceEvents = Array.isArray(pointsInfo?.resourceEvents) ? pointsInfo.resourceEvents : []
  const tabs = [
    { id: 'overview', label: '资料概览' },
    { id: 'connections', label: '连接账号' },
    { id: 'access', label: '授权与记录' },
  ]

  return <main className="mx-auto w-full max-w-[1080px] px-4 py-10 sm:py-14">
    <header>
      <h1 className="text-[32px] font-semibold tracking-tight text-[var(--site-ink)] sm:text-[38px]">个人资料</h1>
      <p className="mt-2 text-[14px] text-[var(--site-muted)]">管理站内身份、燃币权益与登录方式。</p>
    </header>

    <div className="mt-9 flex gap-7 overflow-x-auto border-b border-[var(--site-line)]" role="tablist" aria-label="个人资料分类">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative shrink-0 px-1 pb-3 text-[14px] font-semibold transition ${
            activeTab === tab.id
              ? 'text-[var(--site-ink)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--site-green)]'
              : 'text-[var(--site-faint)] hover:text-[var(--site-muted)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {result && RESULT_MESSAGES[result] ? <p className={`mt-6 border-l-2 py-1 pl-4 text-sm leading-6 ${result === 'belongs_to_other_account' || result === 'login_required' ? 'border-[#a34f47] text-[#8c3d34] dark:border-[#d58a82] dark:text-[#e9b7b0]' : 'border-[#638262] text-[#426440] dark:border-[#8bb585] dark:text-[#b3d6ae]'}`}>{RESULT_MESSAGES[result]}</p> : null}
    {actionError ? <p className="mt-6 border-l-2 border-[#a34f47] py-1 pl-4 text-sm text-[#a34f47]">{actionError}</p> : null}

    {activeTab === 'overview' ? (
      <div className="mt-8 space-y-6" role="tabpanel">
        <section className="rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_62%,transparent)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar user={user} isOwner={false} size={72} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[var(--site-faint)]">我的站内账号</p>
              <h2 className="mt-1 truncate text-[20px] font-semibold text-[var(--site-ink)]">{user?.name || user?.login || '已登录用户'}</h2>
              <p className="mt-1 truncate font-mono text-[13px] text-[var(--site-muted)]">
                @{user?.login || user?.email || user?.id}
              </p>
            </div>
            <dl className="min-w-0 border-t border-[var(--site-line)] pt-4 sm:w-[46%] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[13px] text-[var(--site-faint)]">平台 ID</dt>
                <dd className="max-w-[70%] break-all text-right font-mono text-[12px] text-[var(--site-ink)]">
                  {platformId || user?.id || '读取中…'}
                </dd>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <dt className="text-[13px] text-[var(--site-faint)]">登录方式</dt>
                <dd className="text-[13px] font-medium text-[var(--site-ink)]">{identitiesLoaded ? `${identities.length} 种` : '读取中…'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="账号权益概览">
          {[
            { label: '当前燃币', value: pointsLoaded ? (pointsInfo?.balance ?? 0) : '—', suffix: '枚', icon: IconCoin },
            { label: '已解锁资源', value: pointsLoaded ? unlocks.length : '—', suffix: '项', icon: IconLockOpen },
            { label: '资源领取记录', value: pointsLoaded ? resourceEvents.length : '—', suffix: '次', icon: IconDownload },
          ].map((metric) => {
            const Icon = metric.icon
            return <div key={metric.label} className="rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_55%,transparent)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-[var(--site-muted)]">{metric.label}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--site-green)_11%,var(--site-panel))] text-[var(--site-green)]">
                  <Icon size={17} stroke={1.7} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-5 text-[28px] font-semibold leading-none text-[var(--site-ink)]">
                {metric.value}
                <span className="ml-1.5 text-[12px] font-medium text-[var(--site-faint)]">{metric.suffix}</span>
              </p>
            </div>
          })}
        </section>

        <section className="rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_58%,transparent)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--site-ink)]">已解锁资源</h2>
              <p className="mt-1 text-[13px] text-[var(--site-muted)]">解锁后永久保留在当前账号中。</p>
            </div>
            <Link href="/ranbi" className="shrink-0 text-[12px] font-medium text-[var(--site-accent)] no-underline hover:underline">
              查看燃币说明
            </Link>
          </div>
          {!pointsLoaded ? (
            <p className="mt-6 text-[13px] text-[var(--site-muted)]">正在读取资源记录…</p>
          ) : unlocks.length ? (
            <ul className="mt-5 divide-y divide-[var(--site-line)]">
              {unlocks.slice(0, 6).map((item) => (
                <li key={`${item.resourceKey}:${item.unlockedAt}`}>
                  {item.href ? (
                    <Link href={item.href} className="group flex items-center gap-4 py-3.5 text-[var(--site-ink)] no-underline">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--site-panel)] text-[var(--site-green)]">
                        <IconLockOpen size={17} stroke={1.7} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{item.title}</span>
                        <span className="mt-0.5 block text-[11px] text-[var(--site-faint)]">{item.typeLabel} · {formatTime(item.unlockedAt)}</span>
                      </span>
                      <IconArrowRight size={16} className="shrink-0 text-[var(--site-faint)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 py-3.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--site-panel)] text-[var(--site-green)]"><IconLockOpen size={17} /></span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--site-ink)]">{item.title}</span>
                      <span className="text-[11px] text-[var(--site-faint)]">{formatTime(item.unlockedAt)}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl bg-[var(--site-panel)] px-4 py-5">
              <p className="text-[13px] leading-6 text-[var(--site-muted)]">当前账号还没有解锁资源。打开带燃币权益的调研或资源后，会自动记录在这里。</p>
              <Link href="/articles?tab=resources" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--site-accent)] no-underline">
                浏览资源库 <IconArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>
    ) : null}

    {activeTab === 'connections' ? (
      <div className="mt-8 grid gap-6 lg:grid-cols-2" role="tabpanel">
        <section className="rounded-2xl border border-[var(--site-line)] p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-[var(--site-ink)]">已连接账号</h2>
          <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">这些方式均可登录同一个站内账号。</p>
          <div className="mt-5 border-t border-[var(--site-line)]">
            {loadError ? <p className="py-4 text-sm text-[#a34f47]">{loadError}</p> : null}
            {!loadError && !identitiesLoaded ? <p className="py-4 text-sm text-[var(--site-muted)]">正在读取登录方式…</p> : null}
            {identities.map((identity) => {
              const canUnbind = identity.provider !== 'email' && identities.length > 1
              return <div key={`${identity.provider}:${identity.provider_account_id}`} className="flex items-center gap-3 border-b border-[var(--site-line)] py-4">
                <span className="min-w-16 text-[14px] font-medium text-[var(--site-ink)]">{identityName(identity)}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--site-muted)]">{identity.provider_name || identity.provider_login || '已绑定'}</span>
                {identity.provider === 'email' ? <span className="text-[11px] text-[var(--site-faint)]">邮箱凭据</span> : canUnbind ? <button type="button" onClick={() => unbind(identity.provider)} disabled={Boolean(unlinking)} className="text-[11px] text-[#a34f47] disabled:opacity-50">{unlinking === identity.provider ? '解绑中…' : '解绑'}</button> : <span className="text-[11px] text-[var(--site-faint)]">主要方式</span>}
              </div>
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--site-line)] p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-[var(--site-ink)]">添加登录方式</h2>
          <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">第三方身份只作为登录凭据，不会自动合并不同账号。</p>
          <div className="mt-5 border-t border-[var(--site-line)]">
            {!identitiesLoaded ? <p className="py-4 text-sm text-[var(--site-muted)]">正在读取可添加方式…</p> : <>
              {!githubBound ? <Link href="/api/auth/login?provider=github&intent=bind&returnTo=%2Faccount" className="flex items-center justify-between border-b border-[var(--site-line)] py-4 text-[14px] font-medium text-[var(--site-ink)] no-underline"><span>GitHub</span><span className="text-[12px] text-[var(--site-muted)]">绑定 →</span></Link> : null}
              {!googleBound ? <Link href="/api/auth/login?provider=google&intent=bind&returnTo=%2Faccount" className="flex items-center justify-between border-b border-[var(--site-line)] py-4 text-[14px] font-medium text-[var(--site-ink)] no-underline"><span>Google</span><span className="text-[12px] text-[var(--site-muted)]">绑定 →</span></Link> : null}
              {!wechatBound && (WECHAT_LOGIN_ENABLED ? <Link href="/api/auth/login?provider=wechat&intent=bind&returnTo=%2Faccount" className="flex items-center justify-between border-b border-[var(--site-line)] py-4 text-[14px] font-medium text-[var(--site-ink)] no-underline"><span>微信</span><span className="text-[12px] text-[var(--site-muted)]">绑定 →</span></Link> : <div className="flex items-center justify-between border-b border-[var(--site-line)] py-4 text-[14px]"><span className="text-[var(--site-muted)]">微信</span><span className="text-[11px] text-[var(--site-green)]">登录审核中</span></div>)}
              {githubBound && googleBound && (wechatBound || !WECHAT_LOGIN_ENABLED) ? <p className="py-4 text-[13px] text-[var(--site-muted)]">当前可用的登录方式均已添加。</p> : null}
            </>}
          </div>
        </section>
      </div>
    ) : null}

    {activeTab === 'access' ? (
      <div className="mt-8 grid gap-6 lg:grid-cols-2" role="tabpanel">
        <section className="rounded-2xl border border-[var(--site-line)] p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-[var(--site-ink)]">智能体授权</h2>
          <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">管理已获得本站 MCP 权限的客户端。</p>
          <div className="mt-5 border-t border-[var(--site-line)]">
            {oauthGrants.length ? oauthGrants.map((grant) => <div key={`${grant.client_id}:${grant.resource}`} className="flex items-center gap-4 border-b border-[var(--site-line)] py-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-[var(--site-ink)]">{grant.client_name || 'MCP Client'}</span>
                <span className="mt-1 block truncate font-mono text-[10px] text-[var(--site-faint)]">{grant.scope}</span>
              </span>
              <button type="button" onClick={() => revokeOAuthGrant(grant.client_id)} disabled={Boolean(revokingClient)} className="text-[11px] text-[#a34f47] disabled:opacity-50">{revokingClient === grant.client_id ? '撤销中…' : '撤销访问'}</button>
            </div>) : <p className="py-4 text-[13px] text-[var(--site-muted)]">暂无已授权的 MCP 客户端。</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--site-line)] p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-[var(--site-ink)]">游客身份记录</h2>
          <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">登录前产生的游客记录会归入当前账号。</p>
          <div className="mt-5 border-t border-[var(--site-line)]">
            {guestIdentities.length ? guestIdentities.map((guest) => <div key={guest.id} className="break-all border-b border-[var(--site-line)] py-4 font-mono text-[11px] text-[var(--site-muted)]">{guest.id}</div>) : <p className="py-4 text-[13px] text-[var(--site-muted)]">暂无已关联的游客身份。</p>}
          </div>
        </section>
      </div>
    ) : null}
  </main>
}

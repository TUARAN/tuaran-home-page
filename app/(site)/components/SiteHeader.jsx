'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import SettingsButton from './SettingsButton'
import { useSessionAccount } from './SessionProvider'
import { SITE_CHANNELS, getChannelNavSections } from '../../../lib/siteNav'
import { getTagToneClass } from '../../../lib/tagTone'

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="opacity-60">
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuItem({ item, onNavigate }) {
  const base =
    'group/menuitem flex items-start gap-3 rounded-xl px-3 py-2 no-underline transition-colors hover:bg-[#f4ede0] dark:hover:bg-[#19212b]'
  const inner = (
    <>
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5b89c] transition-colors group-hover/menuitem:bg-[#8b5a1f] dark:bg-[#475061] dark:group-hover/menuitem:bg-[#e0b572]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13.5px] font-medium leading-tight text-[#221f19] dark:text-gray-100">
          {item.label}
          {item.tag ? (
            <span
              className={`rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${getTagToneClass(item.tag)}`}
            >
              {item.tag}
            </span>
          ) : null}
        </span>
        {item.desc ? (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-[#85806f] dark:text-[#8a93a3]">
            {item.desc}
          </span>
        ) : null}
      </span>
    </>
  )

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={`${base} no-external-arrow`}
        onClick={onNavigate}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link href={item.href} className={base} onClick={onNavigate}>
      {inner}
    </Link>
  )
}

const TIER_SECTION_STYLES = {
  '专栏': {
    wrap: 'bg-[#fbf2dc]/50 dark:bg-[#2a2113]/40',
    title: 'text-[#8a6b2e] dark:text-[#d6b87a]',
  },
  '调研': {
    wrap: 'bg-[#e6ecf2]/55 dark:bg-[#15202c]/50',
    title: 'text-[#4d6a85] dark:text-[#8fb0ce]',
  },
  '资料': {
    wrap: 'bg-[#eef0e4]/55 dark:bg-[#1a1f17]/50',
    title: 'text-[#5f6b3b] dark:text-[#b0bd84]',
  },
}

function getTierStyle(title) {
  return TIER_SECTION_STYLES[title] || { wrap: '', title: 'text-[#9c8f79] dark:text-[#93a0b3]' }
}

function ChannelTrigger({ channel, isOpen, isActive, onToggle, onClose, triggerRef, align = 'center', account, navOverrides }) {
  const closeTimerRef = useRef(null)
  const sections = getChannelNavSections(channel, account, navOverrides)
  const positionClass =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2'

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function handleMouseEnter() {
    clearCloseTimer()
    onToggle.open()
  }

  function handleMouseLeave() {
    clearCloseTimer()
    // Keep a small grace window so moving into the panel never flashes closed.
    closeTimerRef.current = setTimeout(() => onToggle.close(), 120)
  }

  function handleToggleClick() {
    clearCloseTimer()
    onToggle.toggle()
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={handleToggleClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={[
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
          isActive
            ? 'text-[#111] font-medium dark:text-gray-100'
            : 'text-[#5b5448] hover:text-[#111] dark:text-[#c7d0df] dark:hover:text-[#f7fbff]',
        ].join(' ')}
      >
        {channel.label}
        <ChevronDown />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className={`absolute top-full z-[120] w-[min(calc(100vw-1rem),440px)] pt-2 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-[''] ${positionClass}`}
        >
          <div className="rounded-2xl border border-[#e6dfd0] bg-[#fdfaf3] p-3 shadow-[0_24px_60px_rgba(82,69,45,0.14)] dark:border-[#2c3340] dark:bg-[#10161f] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {sections.map((section) => {
              const tier = getTierStyle(section.title)
              return (
                <div
                  key={section.title}
                  className={`mb-2 rounded-xl px-2 pb-1.5 pt-2 last:mb-0 ${tier.wrap}`}
                >
                  <p className={`mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] ${tier.title}`}>
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {section.items.map((item) => (
                      <MenuItem key={item.href + item.label} item={item} onNavigate={onClose} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getAccountName(user) {
  return user?.name || user?.login || user?.email || '已登录'
}

function getAccountInitial(user) {
  const name = getAccountName(user)
  return name.trim().slice(0, 1).toUpperCase() || 'U'
}

function getReturnPath(pathname) {
  return pathname || '/'
}

function AccountAvatar({ user, isOwner, loading, size = 'sm' }) {
  const isLg = size === 'lg'
  // 头像里的字与外面的 name 字号保持一致，配合默认 line-height 让 flex items-center
  // 能稳定居中——之前 leading-none 加上字体度量偏移会让 "T" 偏低，去掉就正常了。
  const sizeCls = isLg ? 'h-10 w-10 text-[15px]' : 'h-7 w-7 text-[12px]'
  const borderCls = isOwner
    ? 'border-2 border-[#c79347] dark:border-[#e0b572]'
    : 'border border-[#ddd3c2] dark:border-gray-700'
  const baseCls = `relative flex ${sizeCls} shrink-0 items-center justify-center rounded-full ${borderCls}`

  if (loading) {
    return (
      <span className={`${baseCls} font-mono text-[10px] text-[#8f8069] dark:text-gray-400`}>
        ...
      </span>
    )
  }

  if (user?.image) {
    return (
      <span
        className={`${baseCls} overflow-hidden bg-cover bg-center`}
        style={{ backgroundImage: `url(${JSON.stringify(user.image)})` }}
        aria-hidden="true"
      />
    )
  }

  return (
    <span className={`${baseCls} bg-[#f7efe2] font-semibold text-[#6f5f49] dark:bg-gray-900 dark:text-gray-200`}>
      {user ? getAccountInitial(user) : '登'}
    </span>
  )
}

function AccountIdentity({ user, isOwner, loading, size = 'sm' }) {
  const isLg = size === 'lg'
  // 不用 leading-none、不用 items-stretch——保持自然行高 + items-center 是最稳的方案。
  // 头像和右侧 name 使用同一字号（15px / 12px），同一字体度量 → flex items-center 能
  // 让两边字符的视觉中线自然对齐。
  return (
    <div className={`flex min-w-0 items-center ${isLg ? 'gap-3' : 'gap-2.5'}`}>
      <AccountAvatar user={user} isOwner={isOwner} loading={loading} size={size} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <p
          className={[
            'truncate font-semibold text-[#221f19] dark:text-gray-100',
            isLg ? 'text-[15px]' : 'text-[13.5px]',
          ].join(' ')}
        >
          {loading ? '检查登录状态…' : getAccountName(user)}
        </p>
        {isOwner ? (
          <span className="shrink-0 rounded-full bg-[#fbf2dc] px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#8a6b2e] dark:bg-[#2a2113] dark:text-[#d6b87a]">
            站长
          </span>
        ) : null}
      </div>
    </div>
  )
}

function AccountMenu({ account, isOpen, onToggle, onClose, pathname, accountRef }) {
  const returnTo = getReturnPath(pathname)
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const { loading, user, isOwner } = account

  if (!loading && !user) {
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-2 rounded-full border border-[#ddd3c2] px-2.5 py-1 text-sm font-medium text-[#5b5448] no-underline transition-colors hover:border-[#b99b6d] hover:text-[#111] dark:border-gray-700 dark:text-[#c7d0df] dark:hover:border-gray-500 dark:hover:text-[#f7fbff]"
      >
        <AccountAvatar loading={false} />
        登录
      </Link>
    )
  }

  return (
    <div className="relative" ref={accountRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border border-[#ddd3c2] px-2 py-1 text-sm font-medium text-[#5b5448] transition-colors hover:border-[#b99b6d] hover:text-[#111] dark:border-gray-700 dark:text-[#c7d0df] dark:hover:border-gray-500 dark:hover:text-[#f7fbff]"
      >
        <AccountAvatar user={user} isOwner={isOwner} loading={loading} />
        <span>{loading ? '检查中' : isOwner ? '站长' : '已登录'}</span>
        <ChevronDown />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-[130] mt-2 w-64 overflow-hidden rounded-2xl border border-[#e6dfd0] bg-[#fdfaf3] shadow-[0_24px_60px_rgba(82,69,45,0.14)] dark:border-[#2c3340] dark:bg-[#10161f] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="border-b border-[#eee5d6] bg-[#faf3e3]/60 px-3.5 py-3 dark:border-gray-800 dark:bg-[#141a23]/60">
            <AccountIdentity user={user} isOwner={isOwner} loading={loading} size="lg" />
          </div>
          <div className="px-1.5 py-1.5">
            <a
              href={logoutHref}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-medium text-[#8b5a1f] no-underline transition-colors hover:bg-[#f4ede0] dark:text-[#f0c776] dark:hover:bg-[#19212b]"
            >
              <span>退出登录</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">↩</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileAccountPanel({ account, pathname, onNavigate }) {
  const returnTo = getReturnPath(pathname)
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const { loading, user, isOwner } = account

  if (!loading && !user) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e7decb] bg-white/70 px-3.5 py-3 dark:border-[#2a3340] dark:bg-[#151c25]/70">
        <div className="flex items-center gap-3">
          <AccountAvatar loading={false} />
          <div>
            <p className="text-[13.5px] font-semibold text-[#221f19] dark:text-gray-100">未登录</p>
            <p className="mt-0.5 text-[11.5px] text-[#85806f] dark:text-[#8a93a3]">登录后可评论 / 私域</p>
          </div>
        </div>
        <Link
          href={loginHref}
          onClick={onNavigate}
          className="shrink-0 rounded-full border border-[#ddd3c2] px-3 py-1.5 text-[12px] font-medium text-[#6f5f49] no-underline dark:border-gray-700 dark:text-gray-300"
        >
          登录
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[#e7decb] bg-white/75 dark:border-[#2a3340] dark:bg-[#151c25]/70">
      <div className="border-b border-[#eee5d6] bg-[#faf3e3]/50 px-3.5 py-3 dark:border-[#252e39] dark:bg-[#141a23]/60">
        <AccountIdentity user={user} isOwner={isOwner} loading={loading} size="lg" />
      </div>
      {!loading && user ? (
        <div className="px-1.5 py-1.5">
          <a
            href={logoutHref}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-medium text-[#8b5a1f] no-underline dark:text-[#f0c776]"
          >
            <span>退出登录</span>
            <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">↩</span>
          </a>
        </div>
      ) : null}
    </div>
  )
}

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openChannel, setOpenChannel] = useState(null)
  const [openMobileChannel, setOpenMobileChannel] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const account = useSessionAccount()
  const navWrapRef = useRef(null)
  const accountRef = useRef(null)

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenChannel(null)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openChannel) return
    function onDocClick(e) {
      if (navWrapRef.current && !navWrapRef.current.contains(e.target)) setOpenChannel(null)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpenChannel(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openChannel])

  useEffect(() => {
    if (!accountOpen) return
    function onDocClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  if (pathname?.startsWith('/people/elon-musk')) return null

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#e8dfd0] bg-[#f8f5f0]/92 backdrop-blur dark:border-[#202938] dark:bg-[#0f141b]/96">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="no-underline hover:no-underline group min-w-0" aria-label="返回首页">
            <div className="leading-tight inline-flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-[#111] dark:text-gray-100">
                涂阿燃 · 网络日志
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav ref={navWrapRef} aria-label="主导航" className="flex items-center gap-1">
              {SITE_CHANNELS.map((channel) => {
                const isActive = channel.match(pathname)
                const isOpen = openChannel === channel.key
                const align =
                  channel.key === 'content'
                    ? 'left'
                    : channel.key === 'services' || channel.key === 'about'
                    ? 'right'
                    : 'center'
                return (
                  <ChannelTrigger
                    key={channel.key}
                    channel={channel}
                    isOpen={isOpen}
                    isActive={isActive}
                    onToggle={{
                      open: () => setOpenChannel(channel.key),
                      close: () => setOpenChannel((cur) => (cur === channel.key ? null : cur)),
                      toggle: () => setOpenChannel((cur) => (cur === channel.key ? null : channel.key)),
                    }}
                    onClose={() => setOpenChannel(null)}
                    align={align}
                    account={account}
                    navOverrides={account?.navOverrides}
                  />
                )
              })}
              <Link
                href="/changelog"
                aria-label="站点更新记录"
                title="站点更新记录"
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium no-underline transition-colors hover:no-underline',
                  pathname?.startsWith('/changelog')
                    ? 'text-[#111] visited:text-[#111] dark:text-gray-100 dark:visited:text-gray-100'
                    : 'text-[#5b5448] visited:text-[#5b5448] hover:text-[#111] dark:text-[#c7d0df] dark:visited:text-[#c7d0df] dark:hover:text-[#f7fbff]',
                ].join(' ')}
              >
                更新
              </Link>
            </nav>
            <SettingsButton />
            <AccountMenu
              account={account}
              isOpen={accountOpen}
              onToggle={() => setAccountOpen((cur) => !cur)}
              onClose={() => setAccountOpen(false)}
              pathname={pathname}
              accountRef={accountRef}
            />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <SettingsButton />
            <button
              type="button"
              aria-label={mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="header-icon-link"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
                {mobileMenuOpen ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6h12M4 10h12M4 14h12"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={[
          'fixed inset-0 z-30 bg-[rgba(23,18,12,0.22)] transition-opacity duration-200 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={[
          'fixed right-0 top-[73px] z-40 max-h-[calc(100vh-73px)] w-[min(88vw,340px)] overflow-y-auto border-l border-[#e5dccd] bg-[#faf7f0] px-4 py-5 shadow-[-18px_0_48px_rgba(77,62,37,0.10)] transition-transform duration-200 dark:border-[#232c36] dark:bg-[#10151d] md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <p className="mb-3 px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9e8f75] dark:text-[#8e9ab0]">
          Menu
        </p>
        <MobileAccountPanel
          account={account}
          pathname={pathname}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <nav aria-label="移动端主导航" className="flex flex-col gap-1.5">
          {SITE_CHANNELS.map((channel) => {
            const expanded = openMobileChannel === channel.key
            const sections = getChannelNavSections(channel, account, account?.navOverrides)
            return (
              <div key={channel.key} className="rounded-2xl border border-[#e7decb] bg-white/70 dark:border-[#2a3340] dark:bg-[#151c25]/70">
                <button
                  type="button"
                  onClick={() => setOpenMobileChannel((cur) => (cur === channel.key ? null : channel.key))}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-medium text-[#191611] dark:text-gray-100"
                >
                  {channel.label}
                  <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                    <ChevronDown />
                  </span>
                </button>
                {expanded ? (
                  <div className="space-y-2 border-t border-[#ece3d1] px-2 pb-3 pt-2 dark:border-[#2a3340]">
                    {sections.map((section) => {
                      const tier = getTierStyle(section.title)
                      return (
                        <div key={section.title} className={`rounded-xl px-2 pb-1 pt-2 ${tier.wrap}`}>
                          <p className={`mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.18em] ${tier.title}`}>
                            {section.title}
                          </p>
                          <div className="flex flex-col">
                            {section.items.map((item) => (
                              <MenuItem
                                key={item.href + item.label}
                                item={item}
                                onNavigate={() => setMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )
}

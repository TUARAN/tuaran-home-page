'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import SettingsButton from './SettingsButton'
import UserAvatar from './UserAvatar'
import { useLocale } from './LocaleProvider'
import { useSessionAccount } from './SessionProvider'
import { pick } from '../../../lib/i18n'
import {
  SITE_ADMIN_NAV_LINK,
  SITE_CHANNELS,
  getChannelNavSections,
  isAdminNavVisible,
  navDesc,
  navLabel,
  navSectionTitle,
} from '../../../lib/siteNav'
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
  const { locale } = useLocale()
  const label = navLabel(item, locale)
  const desc = navDesc(item, locale)
  const base = 'site-menu-item'
  const inner = (
    <>
      <span className="site-menu-dot mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-colors" />
      <span className="min-w-0 flex-1">
        <span className="site-menu-title flex items-center gap-1.5 text-[13.5px] font-medium leading-tight">
          {label}
          {item.tag ? (
            <span
              className={`rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${getTagToneClass(item.tag)}`}
            >
              {item.tag}
            </span>
          ) : null}
        </span>
        {desc ? (
          <span className="site-menu-desc mt-0.5 block text-[11.5px] leading-snug">
            {desc}
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
    wrap: 'site-tier-section site-tier-column',
    title: 'site-tier-title site-tier-title-column',
  },
  '调研': {
    wrap: 'site-tier-section site-tier-research',
    title: 'site-tier-title site-tier-title-research',
  },
  '资源': {
    wrap: 'site-tier-section site-tier-archive',
    title: 'site-tier-title site-tier-title-archive',
  },
}

function getTierStyle(title) {
  return TIER_SECTION_STYLES[title] || { wrap: 'site-tier-section', title: 'site-tier-title' }
}

function ChannelTrigger({ channel, isOpen, isActive, onToggle, onClose, triggerRef, align = 'center', account, navOverrides }) {
  const { locale } = useLocale()
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
          'site-nav-trigger',
          isActive ? 'site-nav-trigger-active' : '',
        ].join(' ')}
      >
        {navLabel(channel, locale)}
        <ChevronDown />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className={`absolute top-full z-[120] w-[min(calc(100vw-1rem),440px)] pt-2 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-[''] ${positionClass}`}
        >
          <div className="site-dropdown-panel rounded-2xl border p-3">
            {sections.map((section) => {
              const tier = getTierStyle(section.title)
              return (
                <div
                  key={section.title}
                  className={`mb-2 rounded-xl px-2 pb-1.5 pt-2 last:mb-0 ${tier.wrap}`}
                >
                  <p className={`mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] ${tier.title}`}>
                    {navSectionTitle(section, locale)}
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

function getAccountId(user) {
  return user?.login || user?.email || user?.id || '已登录'
}

function getReturnPath(pathname) {
  return pathname || '/'
}

function AccountAvatar({ user, isOwner, loading, size = 'sm' }) {
  return <UserAvatar user={user} size={size} isOwner={isOwner} loading={loading} />
}

function AccountIdentity({ user, isOwner, loading, size = 'sm' }) {
  const { locale } = useLocale()
  const isLg = size === 'lg'
  return (
    <div className={`flex min-w-0 items-center ${isLg ? 'gap-3' : 'gap-2.5'}`}>
      <AccountAvatar user={user} isOwner={isOwner} loading={loading} size={size} />
      <div className="flex min-w-0 flex-1 items-center">
        <p
          className={[
            'site-menu-title truncate font-semibold',
            isLg ? 'text-[15px]' : 'text-[13.5px]',
          ].join(' ')}
        >
          {loading ? pick(locale, '检查登录状态…', 'Checking sign-in…') : getAccountId(user)}
        </p>
      </div>
    </div>
  )
}

function NotificationBadge({ count }) {
  const n = Number(count) || 0
  if (n <= 0) return null
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
      {n > 99 ? '99+' : n}
    </span>
  )
}

function formatNotificationTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  try {
    return new Date(n).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

function NotificationList({ notifications, markNotificationsRead, onNavigate, emptyLabel }) {
  const items = Array.isArray(notifications?.items) ? notifications.items.slice(0, 5) : []
  if (!items.length) {
    return <p className="site-notification-empty">{emptyLabel}</p>
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const unread = !item.readAt
        return (
          <Link
            key={item.id}
            href={item.href || '/community'}
            onClick={() => {
              if (item.id) markNotificationsRead?.({ id: item.id })
              onNavigate?.()
            }}
            className={`site-notification-item ${unread ? 'site-notification-item-unread' : ''}`}
          >
            <span className="min-w-0 flex-1">
              <span className="site-notification-title">
                {item.actorUserName || '有人'} 回复了你
              </span>
              <span className="site-notification-body">
                {item.articleTitle ? `${item.articleTitle} · ` : ''}{item.messageExcerpt || '查看详情'}
              </span>
            </span>
            <span className="site-notification-time">{formatNotificationTime(item.createdAt)}</span>
          </Link>
        )
      })}
    </div>
  )
}

function AccountMenu({ account, isOpen, onToggle, onClose, pathname, accountRef }) {
  const { locale } = useLocale()
  const returnTo = getReturnPath(pathname)
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const { loading, user, isOwner, notifications, markNotificationsRead } = account
  const unread = Number(notifications?.unread) || 0
  const showAdminLink = isAdminNavVisible(account, account?.navOverrides)

  if (!loading && !user) {
    return (
      <Link
        href={loginHref}
        className="site-account-button"
      >
        <AccountAvatar loading={false} />
        {pick(locale, '登录', 'Sign in')}
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
        className="site-account-button px-2"
      >
        <AccountAvatar user={user} isOwner={isOwner} loading={loading} />
        <span>{loading ? pick(locale, '检查中', 'Checking…') : getAccountId(user)}</span>
        <NotificationBadge count={unread} />
        <ChevronDown />
      </button>

      {isOpen ? (
        <div className="site-dropdown-panel absolute right-0 top-full z-[130] mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border">
          <div className="site-dropdown-strip border-b px-3.5 py-3">
            <AccountIdentity user={user} isOwner={isOwner} loading={loading} size="lg" />
          </div>
          <div className="border-b border-[var(--site-line)] px-2 py-2">
            <div className="mb-1.5 flex items-center justify-between px-1.5">
              <p className="site-menu-desc mb-0 font-mono text-[10px] uppercase tracking-[0.16em]">
                {pick(locale, '通知', 'Notifications')}
              </p>
              <NotificationBadge count={unread} />
            </div>
            <NotificationList
              notifications={notifications}
              markNotificationsRead={markNotificationsRead}
              onNavigate={onClose}
              emptyLabel={pick(locale, '暂无新的评论回复。', 'No comment replies yet.')}
            />
          </div>
          <div className="px-1.5 py-1.5">
            {showAdminLink ? (
              <Link
                href={SITE_ADMIN_NAV_LINK.href}
                onClick={onClose}
                className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
              >
                <span>{navLabel(SITE_ADMIN_NAV_LINK, locale)}</span>
                <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
              </Link>
            ) : null}
            <Link
              href="/community"
              onClick={onClose}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '讨论中心', 'Discussion hub')}</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
            </Link>
            <a
              href={logoutHref}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '退出登录', 'Sign out')}</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">↩</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileAccountPanel({ account, pathname, onNavigate }) {
  const { locale } = useLocale()
  const returnTo = getReturnPath(pathname)
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const { loading, user, isOwner, notifications, markNotificationsRead } = account
  const unread = Number(notifications?.unread) || 0
  const showAdminLink = isAdminNavVisible(account, account?.navOverrides)

  if (!loading && !user) {
    return (
      <div className="site-mobile-card mb-4 flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3">
        <div className="flex items-center gap-3">
          <AccountAvatar loading={false} />
          <div>
            <p className="site-menu-title text-[13.5px] font-semibold">{pick(locale, '未登录', 'Not signed in')}</p>
            <p className="site-menu-desc mt-0.5 text-[11.5px]">{pick(locale, '登录后可评论 / 私域', 'Sign in to comment / private area')}</p>
          </div>
        </div>
        <Link
          href={loginHref}
          onClick={onNavigate}
          className="site-account-button shrink-0 px-3 py-1.5 text-[12px]"
        >
          {pick(locale, '登录', 'Sign in')}
        </Link>
      </div>
    )
  }

  return (
    <div className="site-mobile-card mb-4 overflow-hidden rounded-2xl border">
      <div className="site-dropdown-strip border-b px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <AccountIdentity user={user} isOwner={isOwner} loading={loading} size="lg" />
          <NotificationBadge count={unread} />
        </div>
      </div>
      {!loading && user ? (
        <div>
          <div className="border-b border-[var(--site-line)] px-2 py-2">
            <div className="mb-1.5 flex items-center justify-between px-1.5">
              <p className="site-menu-desc mb-0 font-mono text-[10px] uppercase tracking-[0.16em]">
                {pick(locale, '通知', 'Notifications')}
              </p>
              <NotificationBadge count={unread} />
            </div>
            <NotificationList
              notifications={notifications}
              markNotificationsRead={markNotificationsRead}
              onNavigate={onNavigate}
              emptyLabel={pick(locale, '暂无新的评论回复。', 'No comment replies yet.')}
            />
          </div>
          <div className="px-1.5 py-1.5">
            {showAdminLink ? (
              <Link
                href={SITE_ADMIN_NAV_LINK.href}
                onClick={onNavigate}
                className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
              >
                <span>{navLabel(SITE_ADMIN_NAV_LINK, locale)}</span>
                <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
              </Link>
            ) : null}
            <Link
              href="/community"
              onClick={onNavigate}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '讨论中心', 'Discussion hub')}</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
            </Link>
          <a
            href={logoutHref}
            className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
          >
            <span>{pick(locale, '退出登录', 'Sign out')}</span>
            <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">↩</span>
          </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function SiteHeader() {
  const { locale } = useLocale()
  const pathname = usePathname()
  const [searchString, setSearchString] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openChannel, setOpenChannel] = useState(null)
  const [openMobileChannel, setOpenMobileChannel] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const account = useSessionAccount()
  const navWrapRef = useRef(null)
  const accountRef = useRef(null)
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString])

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenChannel(null)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    function syncSearch() {
      setSearchString(window.location.search || '')
    }

    syncSearch()
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args)
      queueMicrotask(syncSearch)
      return result
    }
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args)
      queueMicrotask(syncSearch)
      return result
    }
    window.addEventListener('popstate', syncSearch)
    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener('popstate', syncSearch)
    }
  }, [])

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
      <header className="site-header fixed left-0 right-0 top-0 z-[120] w-full border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 no-underline hover:no-underline" aria-label={pick(locale, '返回首页', 'Back to home')}>
            <span className="site-brand-mark" aria-hidden="true">T</span>
            <div className="inline-flex min-w-0 flex-col leading-tight">
              <span className="site-brand-text font-serif text-lg font-semibold tracking-wide sm:text-xl">
                TUARAN
              </span>
              <span className="site-brand-subtitle hidden text-[11px] font-medium sm:block">
                {pick(locale, '涂阿燃 · 网络日志', 'Weblog')}
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav ref={navWrapRef} aria-label={pick(locale, '主导航', 'Main navigation')} className="flex items-center gap-1">
              {SITE_CHANNELS.map((channel) => {
                const isActive = channel.match(pathname, searchParams)
                const isOpen = openChannel === channel.key
                const align =
                  channel.key === 'content'
                    ? 'left'
                    : channel.key === 'community' || channel.key === 'about'
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
              aria-label={mobileMenuOpen ? pick(locale, '关闭导航菜单', 'Close menu') : pick(locale, '打开导航菜单', 'Open menu')}
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
          'fixed inset-0 z-30 bg-[color-mix(in_srgb,var(--site-accent-strong)_18%,transparent)] transition-opacity duration-200 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={[
          'site-mobile-drawer fixed right-0 top-[var(--site-header-height)] z-[120] max-h-[calc(100vh-var(--site-header-height))] w-[min(88vw,340px)] overflow-y-auto border-l px-4 py-5 transition-transform duration-200 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <p className="site-menu-desc mb-3 px-1 font-mono text-[11px] uppercase tracking-[0.22em]">
          Menu
        </p>
        <MobileAccountPanel
          account={account}
          pathname={pathname}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <nav aria-label={pick(locale, '移动端主导航', 'Mobile navigation')} className="flex flex-col gap-1.5">
          {SITE_CHANNELS.map((channel) => {
            const expanded = openMobileChannel === channel.key
            const sections = getChannelNavSections(channel, account, account?.navOverrides)
            return (
              <div key={channel.key} className="site-mobile-card rounded-2xl border">
                <button
                  type="button"
                  onClick={() => setOpenMobileChannel((cur) => (cur === channel.key ? null : channel.key))}
                  aria-expanded={expanded}
                  className="site-menu-title flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-medium"
                >
                  {navLabel(channel, locale)}
                  <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                    <ChevronDown />
                  </span>
                </button>
                {expanded ? (
                  <div className="site-mobile-section-divider space-y-2 border-t px-2 pb-3 pt-2">
                    {sections.map((section) => {
                      const tier = getTierStyle(section.title)
                      return (
                        <div key={section.title} className={`rounded-xl px-2 pb-1 pt-2 ${tier.wrap}`}>
                          <p className={`mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.18em] ${tier.title}`}>
                            {navSectionTitle(section, locale)}
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

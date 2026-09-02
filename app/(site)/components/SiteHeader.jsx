'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  IconBell,
  IconBook2,
  IconCheck,
  IconChevronRight,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconLanguage,
  IconLayoutDashboard,
  IconLogout,
  IconMessageCircle,
  IconRobot,
  IconUser,
} from '@tabler/icons-react'

import SettingsButton from './SettingsButton'
import UserAvatar from './UserAvatar'
import { useLocale } from './LocaleProvider'
import { usePwaInstall } from './PwaInstallGuide'
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
import { trackSiteEvent } from '../../../lib/siteAnalytics'

const DESKTOP_CHANNEL_GROUPS = [
  SITE_CHANNELS.slice(0, 3),
  SITE_CHANNELS.slice(3, 5),
]

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

function SpaceXNavLink({ active }) {
  return (
    <Link
      href="/spacex"
      aria-label="SpaceX"
      aria-current={active ? 'page' : undefined}
      className={[
        'group flex h-8 items-center rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--site-accent)]',
        active ? 'bg-[var(--site-panel-strong)]' : 'hover:bg-[var(--site-panel)]',
      ].join(' ')}
      data-analytics-event="entry_click"
      data-analytics-surface="global_nav"
      data-analytics-destination-kind="page"
      data-analytics-destination-id="/spacex"
    >
      <Image
        src="/images/brand/spacex-logo.webp"
        alt="SpaceX"
        width={3840}
        height={480}
        className="h-auto w-[72px] opacity-70 transition-opacity group-hover:opacity-100 dark:invert"
      />
    </Link>
  )
}

function MenuItem({ item, onNavigate }) {
  const { locale } = useLocale()
  const label = navLabel(item, locale)
  const desc = navDesc(item, locale)
  const base = `site-menu-item${item.featured ? ' site-menu-item-featured' : ''}`
  const destinationKind = item.href.startsWith('/articles')
    ? 'content'
    : item.href.startsWith('/resources')
      ? 'resource'
      : item.href.startsWith('/tools')
        ? 'tool'
        : 'page'
  const analyticsProps = {
    'data-analytics-event': 'entry_click',
    'data-analytics-surface': 'global_nav',
    'data-analytics-destination-kind': destinationKind,
    'data-analytics-destination-id': item.href.slice(0, 120),
  }
  const inner = (
    <>
      <span className="site-menu-dot mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-colors" />
      <span className="min-w-0 flex-1">
        <span className="site-menu-title flex items-center gap-1.5 text-[13.5px] font-medium leading-tight">
          {label}
          {item.tag ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] ${getTagToneClass(item.tag)}`}
            >
              {String(item.tag).toLowerCase() === 'auto' ? <IconRobot size={10} stroke={1.8} aria-hidden="true" /> : null}
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
        {...analyticsProps}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link href={item.href} className={base} onClick={onNavigate} {...analyticsProps}>
      {inner}
    </Link>
  )
}

const TIER_SECTION_STYLES = {
  '入口': {
    wrap: 'site-tier-section site-tier-column',
    title: 'site-tier-title site-tier-title-column',
  },
  '内容类型': {
    wrap: 'site-tier-section site-tier-research',
    title: 'site-tier-title site-tier-title-research',
  },
  '按主题': {
    wrap: 'site-tier-section site-tier-archive',
    title: 'site-tier-title site-tier-title-archive',
  },
  '创作': {
    wrap: 'site-tier-section site-tier-column',
    title: 'site-tier-title site-tier-title-column',
  },
  '专栏': {
    wrap: 'site-tier-section site-tier-column',
    title: 'site-tier-title site-tier-title-column',
  },
  '调研': {
    wrap: 'site-tier-section site-tier-research',
    title: 'site-tier-title site-tier-title-research',
  },
  '分析': {
    wrap: 'site-tier-section site-tier-research',
    title: 'site-tier-title site-tier-title-research',
  },
  '资源': {
    wrap: 'site-tier-section site-tier-archive',
    title: 'site-tier-title site-tier-title-archive',
  },
  '互动专题': {
    wrap: 'site-tier-section site-tier-column',
    title: 'site-tier-title site-tier-title-column',
  },
}

function getTierStyle(title) {
  return TIER_SECTION_STYLES[title] || { wrap: 'site-tier-section', title: 'site-tier-title' }
}

function ChannelTrigger({ channel, isOpen, isActive, onToggle, onClose, triggerRef, align = 'center', account, navOverrides }) {
  const { locale } = useLocale()
  const closeTimerRef = useRef(null)
  const sections = getChannelNavSections(channel, account, navOverrides)
  const landingItem = sections[0]?.items[0]
  const landingHref = landingItem?.href || channel.href
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

  function handleTriggerFocus() {
    clearCloseTimer()
    if (!isOpen) {
      trackSiteEvent('menu_open', {
        surface: 'global_nav',
        destination_id: channel.key,
      })
    }
    onToggle.open()
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={landingHref}
        ref={triggerRef}
        onClick={onClose}
        onFocus={handleTriggerFocus}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-current={isActive ? 'page' : undefined}
        className={[
          'site-nav-trigger',
          isActive ? 'site-nav-trigger-active' : '',
        ].join(' ')}
        data-analytics-event="entry_click"
        data-analytics-surface="global_nav"
        data-analytics-destination-kind="page"
        data-analytics-destination-id={landingHref}
      >
        <span className="relative">
          {navLabel(channel, locale)}
          {channel.key === 'community' ? <span className="site-nav-vip-badge">VIP</span> : null}
        </span>
        <ChevronDown />
      </Link>

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

function AccountIdentity({ user, isOwner, loading, size = 'sm' }) {
  const { locale } = useLocale()
  const isLg = size === 'lg'
  return (
    <div className={`flex min-w-0 items-center ${isLg ? 'gap-3' : 'gap-2.5'}`}>
      <UserAvatar user={user} size={size} isOwner={isOwner} loading={loading} />
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
  const items = Array.isArray(notifications?.items) ? notifications.items.slice(0, 2) : []
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
                {item.title || `${item.actorUserName || '有人'} 回复了你`}
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
  const { locale, setLocale } = useLocale()
  const { resolvedTheme, setTheme } = useTheme()
  const [languageOpen, setLanguageOpen] = useState(false)
  const returnTo = getReturnPath(pathname)
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  const { loading, user, isOwner, notifications, markNotificationsRead } = account
  const unread = Number(notifications?.unread) || 0
  const showAdminLink = isAdminNavVisible(account, account?.navOverrides)

  useEffect(() => {
    if (!isOpen) setLanguageOpen(false)
  }, [isOpen])

  if (!loading && !user) {
    return (
      <Link
        href={loginHref}
        rel="nofollow"
        className="site-account-button"
      >
        <UserAvatar loading={false} />
        {pick(locale, '登录', 'Sign in')}
      </Link>
    )
  }

  return (
    <div className="relative flex items-center gap-1.5" ref={accountRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={pick(locale, '查看通知', 'View notifications')}
        aria-expanded={isOpen}
        className="site-account-notification-button"
      >
        <IconBell size={19} stroke={1.7} aria-hidden="true" />
        <NotificationBadge count={unread} />
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={pick(locale, '打开个人菜单', 'Open account menu')}
        className="site-account-avatar-button"
      >
        <UserAvatar user={user} isOwner={isOwner} loading={loading} size="md" />
      </button>

      {isOpen ? (
        <div className="site-account-popover absolute right-0 top-full z-[130] mt-2 w-[min(92vw,320px)] overflow-hidden rounded-[14px] border">
          <div className="site-account-name px-4 py-3">
            {loading
              ? pick(locale, '检查登录状态…', 'Checking sign-in…')
              : `@${String(getAccountId(user)).replace(/^@/, '')}`}
          </div>
          <div className="site-account-section">
            <AccountPopoverLink href="/account" onClick={onClose} icon={IconUser}>
              {pick(locale, '个人资料', 'Profile')}
            </AccountPopoverLink>
            <AccountPopoverLink href="/community" onClick={onClose} icon={IconMessageCircle}>
              {pick(locale, '讨论中心', 'Discussion hub')}
            </AccountPopoverLink>
            <AccountPopoverLink href="/notifications" onClick={onClose} icon={IconBell}>
              {pick(locale, '通知中心', 'Notifications')}
            </AccountPopoverLink>
            <AccountPopoverLink href="/help" onClick={onClose} icon={IconBook2}>
              {pick(locale, '帮助与文档', 'Help & documentation')}
            </AccountPopoverLink>
          </div>
          <div className="site-account-section px-3 py-3">
            <div className="mb-1 flex items-center justify-between px-2">
              <p className="m-0 text-xs text-[var(--site-faint)]">
                {pick(locale, '最近通知', 'Recent notifications')}
              </p>
              <NotificationBadge count={unread} />
            </div>
            <NotificationList
              notifications={notifications}
              markNotificationsRead={markNotificationsRead}
              onNavigate={onClose}
              emptyLabel={pick(locale, '暂无新的评论回复。', 'No comment replies yet.')}
            />
            <Link
              href="/notifications"
              onClick={onClose}
              className="mt-1 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--site-faint)] transition-colors hover:bg-[#2b2924] hover:text-[#f1f0ea]"
            >
              <span>{pick(locale, '查看全部通知', 'View all notifications')}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="site-account-section">
            <button
              type="button"
              className="site-account-menu-item"
              onClick={() => setLanguageOpen((value) => !value)}
              aria-expanded={languageOpen}
              aria-controls="site-account-language-options"
            >
              <IconLanguage size={20} stroke={1.65} aria-hidden="true" />
              <span>{pick(locale, '语言', 'Language')}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--site-faint)]">
                {locale === 'en' ? 'English' : '中文'}
                <IconChevronRight
                  size={16}
                  stroke={1.7}
                  className={`transition-transform ${languageOpen ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </button>
            {languageOpen ? (
              <div id="site-account-language-options" className="mx-2 mb-1 grid grid-cols-2 gap-1 rounded-lg bg-[var(--site-panel)] p-1">
                {[
                  { id: 'zh', label: '中文' },
                  { id: 'en', label: 'English' },
                ].map((option) => {
                  const selected = locale === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setLocale(option.id)
                        setLanguageOpen(false)
                      }}
                      aria-pressed={selected}
                      className={[
                        'flex items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] transition',
                        selected
                          ? 'bg-[var(--site-panel-strong)] font-semibold text-[var(--site-ink)] shadow-sm'
                          : 'text-[var(--site-muted)] hover:bg-[var(--site-panel-strong)] hover:text-[var(--site-ink)]',
                      ].join(' ')}
                    >
                      {option.label}
                      {selected ? <IconCheck size={14} stroke={2} aria-hidden="true" /> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
            <button
              type="button"
              className="site-account-menu-item"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              <IconDeviceDesktop size={20} stroke={1.65} aria-hidden="true" />
              <span>{pick(locale, '主题', 'Theme')}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--site-faint)]">
                {resolvedTheme === 'dark' ? pick(locale, '深色', 'Dark') : pick(locale, '浅色', 'Light')}
                <IconChevronRight size={16} stroke={1.7} aria-hidden="true" />
              </span>
            </button>
          </div>
          <div className="site-account-section">
            {showAdminLink ? (
              <AccountPopoverLink
                href={SITE_ADMIN_NAV_LINK.href}
                onClick={onClose}
                icon={IconLayoutDashboard}
              >
                {navLabel(SITE_ADMIN_NAV_LINK, locale)}
              </AccountPopoverLink>
            ) : null}
            <a
              href={logoutHref}
              className="site-account-menu-item site-account-menu-item-danger"
            >
              <IconLogout size={20} stroke={1.65} aria-hidden="true" />
              <span>{pick(locale, '退出登录', 'Sign out')}</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AccountPopoverLink({ href, onClick, icon: Icon, children }) {
  return (
    <Link href={href} onClick={onClick} className="site-account-menu-item">
      <Icon size={20} stroke={1.65} aria-hidden="true" />
      <span>{children}</span>
    </Link>
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
          <UserAvatar loading={false} />
          <div>
            <p className="site-menu-title text-[13.5px] font-semibold">{pick(locale, '未登录', 'Not signed in')}</p>
            <p className="site-menu-desc mt-0.5 text-[11.5px]">{pick(locale, '登录后可评论 / 私域', 'Sign in to comment / private area')}</p>
          </div>
        </div>
        <Link
          href={loginHref}
          rel="nofollow"
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
              href="/account"
              onClick={onNavigate}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '账号中心', 'Account center')}</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
            </Link>
            <Link
              href="/community"
              onClick={onNavigate}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '讨论中心', 'Discussion hub')}</span>
              <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
            </Link>
            <Link
              href="/notifications"
              onClick={onNavigate}
              className="site-menu-item flex items-center justify-between text-[12.5px] font-medium"
            >
              <span>{pick(locale, '通知中心', 'Notification center')}</span>
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
  const { installed, openGuide: openInstallGuide } = usePwaInstall()
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
        <div className="mx-auto flex h-[var(--site-header-height)] w-full max-w-[1880px] items-center justify-between gap-2 px-3 py-1 sm:px-6 sm:gap-4 lg:px-10">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5 no-underline hover:no-underline" aria-label={pick(locale, '返回首页', 'Back to home')}>
            <span className="site-brand-mark" aria-hidden="true">T</span>
            <div className="hidden min-w-0 flex-col leading-tight sm:inline-flex">
              <span className="site-brand-text font-serif text-base font-semibold tracking-wide sm:text-lg">
                TUARAN
              </span>
              <span className="site-brand-subtitle hidden w-full text-[11px] font-medium [text-align-last:justify] sm:block">
                {pick(locale, '涂阿燃 · 网络日志', 'Weblog')}
              </span>
            </div>
          </Link>

          <form action="/articles" method="get" role="search" className="site-mobile-search min-w-0 flex-1 md:hidden">
            <label className="sr-only" htmlFor="site-mobile-search-q">{pick(locale, '搜索内容', 'Search')}</label>
            <input
              id="site-mobile-search-q"
              type="search"
              name="q"
              placeholder={pick(locale, '搜索文章、调研、资源', 'Search articles, research, resources')}
              defaultValue={searchParams.get('q') || ''}
              autoComplete="off"
            />
          </form>

          <div className="hidden items-center gap-3 md:flex">
            <nav ref={navWrapRef} aria-label={pick(locale, '主导航', 'Main navigation')} className="flex items-center gap-2">
              {DESKTOP_CHANNEL_GROUPS.map((channels, groupIndex) => (
                <div key={`nav-group-${groupIndex}`} className="site-nav-cluster">
                  {channels.map((channel) => {
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
                  {groupIndex === 0 ? <SpaceXNavLink active={pathname?.startsWith('/spacex')} /> : null}
                </div>
              ))}
            </nav>
            {!account.loading && !account.user ? <SettingsButton /> : null}
            <AccountMenu
              account={account}
              isOpen={accountOpen}
              onToggle={() => setAccountOpen((cur) => !cur)}
              onClose={() => setAccountOpen(false)}
              pathname={pathname}
              accountRef={accountRef}
            />
          </div>

          <div className="flex items-center gap-1 md:hidden">
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
          'fixed inset-0 z-[115] bg-[color-mix(in_srgb,var(--site-accent-strong)_18%,transparent)] transition-opacity duration-200 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={[
          'site-mobile-drawer fixed right-0 top-[calc(var(--site-header-height)+env(safe-area-inset-top,0px))] z-[120] max-h-[calc(100dvh-var(--site-header-height)-var(--site-tabbar-height)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] w-[min(88vw,340px)] overflow-y-auto border-l px-4 py-5 transition-transform duration-200 md:hidden',
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
        {!installed ? (
          <button
            type="button"
            className="site-mobile-card mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left"
            onClick={() => {
              setMobileMenuOpen(false)
              openInstallGuide()
            }}
          >
            <span className="flex items-center gap-2.5">
              <IconDeviceMobile size={18} stroke={1.7} aria-hidden="true" />
              <span className="site-menu-title text-[13.5px] font-medium">{pick(locale, '添加到桌面', 'Add to Home Screen')}</span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] opacity-70">→</span>
          </button>
        ) : null}
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

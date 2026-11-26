'use client'

import Link from 'next/link'

import { useLocale } from './LocaleProvider'
import { useSessionAccount } from './SessionProvider'
import { pick } from '../../../lib/site/i18n'
import { SITE_CHANNELS, SITE_FOOTER_GROUPS, getFooterLinks, navLabel } from '../../../lib/site/siteNav'
import { ContactDialogButton } from './ContactCards'
import { useSitePresence } from './SitePresenceProvider'

const FEEDBACK_ISSUES_URL = 'https://github.com/TUARAN/tuaran-home-page/issues'
const CI_STATUS_URL = 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/ci.yml'
// 「频道」栏只列内容型一级频道；圈子、关于在右侧各自成栏，避免同一入口出现两次。
const FOOTER_CHANNEL_KEYS = ['content', 'tools', 'systems', 'ranbi']
const EXTRA_LINKS = [
  { href: FEEDBACK_ISSUES_URL, group: 'more', label: '提建议', labelEn: 'Issues', external: true, newTab: true },
  { href: CI_STATUS_URL, group: 'more', label: 'CI 状态', labelEn: 'CI Status', external: true, newTab: true },
]

export function OnlinePresenceStatus({ className = '' }) {
  const { locale } = useLocale()
  const onlineCount = useSitePresence()

  if (onlineCount === null) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[#74786b] dark:text-gray-400 ${className}`}
      aria-live="polite"
      title={pick(locale, '过去 25 分钟内活跃的浏览器数量', 'Browsers active in the past 25 minutes')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {pick(locale, `当前 ${onlineCount} 人在线`, `${onlineCount} online now`)}
    </span>
  )
}

function FooterLink({ link, locale }) {
  const classes = 'text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]'
  const label = navLabel(link, locale)

  if (link.dialog) {
    return (
      <ContactDialogButton className={`${classes} bg-transparent p-0 text-left`}>
        {label}
      </ContactDialogButton>
    )
  }

  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.newTab ? '_blank' : undefined}
        rel={link.newTab ? 'noopener noreferrer' : undefined}
        className={classes}
      >
        {label}
      </a>
    )
  }

  return <Link href={link.href} className={classes}>{label}</Link>
}

function FooterColumn({ title, links, locale }) {
  if (!links.length) return null

  return (
    <nav aria-label={title} className="min-w-0">
      <h2 className="mb-4 text-sm font-semibold text-[var(--site-ink)]">{title}</h2>
      <ul className="space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink link={link} locale={locale} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function SiteFooter({ className = '', showOnline = false }) {
  const { locale } = useLocale()
  const account = useSessionAccount()
  const onlineCount = useSitePresence()
  const links = [...getFooterLinks(account, account?.navOverrides), ...EXTRA_LINKS]
  const channelLinks = FOOTER_CHANNEL_KEYS
    .map((key) => SITE_CHANNELS.find((channel) => channel.key === key))
    .filter(Boolean)
  const columns = [
    { key: 'channels', title: pick(locale, '频道', 'Channels'), links: channelLinks },
    ...SITE_FOOTER_GROUPS.map((group) => ({
      key: group.id,
      title: pick(locale, group.title, group.titleEn),
      links: links.filter((link) => link.group === group.id),
    })),
  ]

  return (
    <footer
      className={[
        'site-footer border-t border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel)_70%,transparent)]',
        className,
      ].join(' ')}
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-x-8 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,3fr)] lg:py-14">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline hover:no-underline" aria-label={pick(locale, '返回首页', 'Back to home')}>
            <span className="site-brand-mark" aria-hidden="true">T</span>
            <span className="font-serif text-lg font-semibold tracking-wide text-[var(--site-ink)]">TUARAN</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--site-muted)]">
            {pick(locale, '涂阿燃的网络日志：前端与 AI 工程、技术情报、知识库与调研。', 'Frontend & AI engineering, tech intel, knowledge base and research.')}
          </p>
          <p className="mt-4 text-xs text-[var(--site-faint)]">
            © 2025—2026 {pick(locale, '涂阿燃 · 网络日志', 'TUARAN · Weblog')}
          </p>
          {showOnline && onlineCount !== null ? <OnlinePresenceStatus className="mt-3 text-xs" /> : null}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
          {columns.map((column) => (
            <FooterColumn key={column.key} title={column.title} links={column.links} locale={locale} />
          ))}
        </div>
      </div>
    </footer>
  )
}

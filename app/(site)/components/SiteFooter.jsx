'use client'

import Link from 'next/link'

import { useLocale } from './LocaleProvider'
import { useSessionAccount } from './SessionProvider'
import { pick } from '../../../lib/i18n'
import { getFooterLinks, navLabel } from '../../../lib/siteNav'

const FEEDBACK_ISSUES_URL = 'https://github.com/TUARAN/tuaran-home-page/issues'
const CI_STATUS_URL = 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/ci.yml'
const PRIMARY_LINK_COUNT = 5

function FooterLink({ link, locale, className = '' }) {
  const classes = `opacity-80 transition-colors hover:text-[#666] hover:opacity-100 dark:hover:text-gray-300 ${className}`

  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.newTab ? '_blank' : undefined}
        rel={link.newTab ? 'noopener noreferrer' : undefined}
        className={classes}
      >
        {navLabel(link, locale)}
      </a>
    )
  }

  return <Link href={link.href} className={classes}>{navLabel(link, locale)}</Link>
}

export default function SiteFooter({ className = '' }) {
  const { locale } = useLocale()
  const account = useSessionAccount()
  const links = getFooterLinks(account, account?.navOverrides)
  const primaryLinks = links.slice(0, PRIMARY_LINK_COUNT)
  const moreLinks = [
    ...links.slice(PRIMARY_LINK_COUNT),
    { href: FEEDBACK_ISSUES_URL, label: '提建议', labelEn: 'Issues', external: true, newTab: true },
    { href: CI_STATUS_URL, label: 'CI 状态', labelEn: 'CI Status', external: true, newTab: true },
  ]

  return (
    <footer
      className={[
        'border-t border-[#dee0db] pt-4 text-xs text-[#999] dark:border-gray-800',
        className,
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <span>© 2025—2026 {pick(locale, '网络日志', 'Weblog')}</span>
        {primaryLinks.map((link) => (
          <span key={link.href} className="contents">
            <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">
              ·
            </span>
            <FooterLink link={link} locale={locale} />
          </span>
        ))}
        <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">
          ·
        </span>
        <details className="group relative">
          <summary className="cursor-pointer list-none opacity-80 transition-colors hover:text-[#666] hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f8863] dark:hover:text-gray-300 [&::-webkit-details-marker]:hidden">
            {pick(locale, '更多', 'More')}
            <span className="ml-1 inline-block transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <div className="absolute bottom-full left-1/2 z-50 mb-3 grid w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-1 rounded-xl border border-[#d8dad2] bg-white p-2 text-left shadow-[0_16px_40px_rgba(20,22,18,0.16)] dark:border-gray-700 dark:bg-[#111923]">
            {moreLinks.map((link) => (
              <FooterLink
                key={link.href}
                link={link}
                locale={locale}
                className="block rounded-lg px-3 py-2 text-[#666] hover:bg-[#f3f4ef] dark:text-gray-300 dark:hover:bg-gray-800"
              />
            ))}
          </div>
        </details>
      </div>
    </footer>
  )
}

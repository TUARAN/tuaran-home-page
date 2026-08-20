'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconBook2,
  IconHome2,
  IconTools,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/i18n'
import { SITE_MOBILE_TABS } from '../../../lib/siteMobileNav'

const TAB_ICONS = {
  home: IconHome2,
  content: IconBook2,
  tools: IconTools,
  community: IconUsers,
  me: IconUser,
}

export default function SiteMobileTabBar() {
  const pathname = usePathname()
  const { locale } = useLocale()

  return (
    <nav className="site-mobile-tabbar md:hidden" aria-label={pick(locale, '底部导航', 'Tab bar')}>
      {SITE_MOBILE_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.icon] || IconHome2
        const active = Boolean(tab.match(pathname))
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={active ? 'is-active' : undefined}
            data-analytics-event="entry_click"
            data-analytics-surface="mobile_tabbar"
            data-analytics-destination-kind="page"
            data-analytics-destination-id={tab.key}
          >
            <Icon size={22} stroke={active ? 2.1 : 1.7} aria-hidden="true" />
            <span>{pick(locale, tab.label, tab.labelEn)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

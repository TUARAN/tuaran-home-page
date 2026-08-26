'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    setHidden(false)
    lastScrollY.current = window.scrollY
    let frame = 0

    const handleScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const nextScrollY = Math.max(0, window.scrollY)
        const delta = nextScrollY - lastScrollY.current
        if (nextScrollY < 32) setHidden(false)
        else if (Math.abs(delta) >= 8) setHidden(delta > 0)
        lastScrollY.current = nextScrollY
        frame = 0
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [pathname])

  return (
    <nav className={`site-mobile-tabbar md:hidden ${hidden ? 'is-hidden' : ''}`} aria-label={pick(locale, '底部导航', 'Tab bar')}>
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

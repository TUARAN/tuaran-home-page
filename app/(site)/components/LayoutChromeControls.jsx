'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import BackToTopButton from './BackToTopButton'
import CommunityLoginPrompt from './CommunityLoginPrompt'
import EmailActivationPrompt from './EmailActivationPrompt'
import PwaInstallGuide from './PwaInstallGuide'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'
import SiteMobileTabBar from './SiteMobileTabBar'
import { getRichPageByPath, getRichPagePresentation } from '../../../lib/engineeringWorks'

const HIDE_CHROME_PATHS = new Set(['/about', '/web-llm', '/web-llm/embed', '/archives/agent-world-cup'])
const HIDE_HEADER_PATHS = new Set(['/spacex'])

function useChromeVisibility() {
  const pathname = usePathname()
  const richPage = getRichPageByPath(pathname)
  const isFeaturePage = getRichPagePresentation(richPage).id === 'feature'
  const hideChrome = HIDE_CHROME_PATHS.has(pathname) || isFeaturePage
  const hideHeader = HIDE_HEADER_PATHS.has(pathname)
  const showHomeButton = isFeaturePage || pathname === '/archives/agent-world-cup'

  return { hideChrome, hideHeader, showHomeButton, pathname }
}

function RichPageHomeButton() {
  return (
    <Link
      href="/"
      aria-label="返回 2aran.com 首页"
      className="fixed right-4 top-4 z-[150] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-[15px] font-black text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-white/30 hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-6 md:top-6"
    >
      T
    </Link>
  )
}

export default function LayoutChromeControls() {
  const { hideChrome, hideHeader, showHomeButton } = useChromeVisibility()

  if (hideChrome) return showHomeButton ? <RichPageHomeButton /> : null

  return (
    <PwaInstallGuide>
      {hideHeader ? <RichPageHomeButton /> : <SiteHeader />}
      <EmailActivationPrompt />
      <CommunityLoginPrompt />
      <BackToTopButton />
      <SiteMobileTabBar />
    </PwaInstallGuide>
  )
}

export function LayoutChromeFooter() {
  const { hideChrome, pathname } = useChromeVisibility()

  if (hideChrome || pathname === '/') return null

  return <SiteFooter className="mx-auto mb-8 mt-12 w-full max-w-[1120px] px-4" />
}

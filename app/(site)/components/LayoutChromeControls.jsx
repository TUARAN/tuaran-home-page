'use client'

import { usePathname } from 'next/navigation'

import BackToTopButton from './BackToTopButton'
import CommunityLoginPrompt from './CommunityLoginPrompt'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

const HIDE_CHROME_PATHS = new Set(['/web-llm', '/web-llm/embed', '/xiaomoli-dad-todo', '/eatwhat', '/agent-world-cup'])

function useChromeVisibility() {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PATHS.has(pathname)

  return { hideChrome, pathname }
}

export default function LayoutChromeControls() {
  const { hideChrome } = useChromeVisibility()

  if (hideChrome) return null

  return (
    <>
      <SiteHeader />
      <CommunityLoginPrompt />
      <BackToTopButton />
    </>
  )
}

export function LayoutChromeFooter() {
  const { hideChrome, pathname } = useChromeVisibility()

  if (hideChrome || pathname === '/') return null

  return <SiteFooter className="mx-auto mb-8 mt-12 w-full max-w-[1120px] px-4" />
}

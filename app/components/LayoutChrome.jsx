'use client'

import { usePathname } from 'next/navigation'

import BackToTopButton from './BackToTopButton'
import SiteHeader from './SiteHeader'

const HIDE_CHROME_PATHS = new Set(['/web-llm/embed', '/xiaomoli-dad-todo'])

export default function LayoutChrome({ children }) {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PATHS.has(pathname)

  return (
    <>
      {!hideChrome ? <SiteHeader /> : null}
      <div className="flex-1 flex flex-col">{children}</div>
      {!hideChrome ? <BackToTopButton /> : null}
    </>
  )
}

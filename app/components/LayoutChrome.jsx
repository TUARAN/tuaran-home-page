'use client'

import { usePathname } from 'next/navigation'

import BackToTopButton from './BackToTopButton'
import SiteHeader from './SiteHeader'

export default function LayoutChrome({ children }) {
  const pathname = usePathname()
  const hideChrome = pathname === '/web-llm/embed' || pathname === '/xiaomoli-dad-todo'

  return (
    <>
      {!hideChrome ? <SiteHeader /> : null}
      <div className="flex-1 flex flex-col">{children}</div>
      {!hideChrome ? <BackToTopButton /> : null}
    </>
  )
}

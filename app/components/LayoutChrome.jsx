'use client'

import { usePathname } from 'next/navigation'

import BackToTopButton from './BackToTopButton'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

const HIDE_CHROME_PATHS = new Set(['/web-llm', '/web-llm/embed', '/xiaomoli-dad-todo', '/eatwhat'])

export default function LayoutChrome({ children }) {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PATHS.has(pathname)

  return (
    <>
      {!hideChrome ? <SiteHeader /> : null}
      <div className="flex-1 flex flex-col">{children}</div>
      {!hideChrome && pathname !== '/' ? <SiteFooter className="mx-auto mb-8 mt-12 w-full max-w-[1120px] px-4" /> : null}
      {!hideChrome ? <BackToTopButton /> : null}
    </>
  )
}

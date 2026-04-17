'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import SiteHeader from './SiteHeader'

function LayoutChromeInner({ children }) {
  const searchParams = useSearchParams()
  const hideChrome = searchParams?.get('embed') === '1'

  return (
    <>
      {!hideChrome ? <SiteHeader /> : null}
      {children}
    </>
  )
}

export default function LayoutChrome({ children }) {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          {children}
        </>
      }
    >
      <LayoutChromeInner>{children}</LayoutChromeInner>
    </Suspense>
  )
}

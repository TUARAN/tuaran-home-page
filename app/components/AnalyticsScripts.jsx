'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function AnalyticsScripts() {
  const pathname = usePathname()

  if (pathname?.startsWith('/web-llm')) {
    return null
  }

  return (
    <>
      <Script
        src="https://analytics.umami.is/script.js"
        data-website-id="8bb48b09-3e10-4ec1-9bbe-c55c87418fa9"
        strategy="afterInteractive"
      />
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="8bb48b09-3e10-4ec1-9bbe-c55c87418fa9"
        strategy="afterInteractive"
      />
    </>
  )
}

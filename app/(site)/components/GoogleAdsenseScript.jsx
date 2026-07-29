'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { getPublicSiteSettings } from './siteSettingsClient'
import { isAdsenseReviewPath } from '../../../lib/adsenseReviewPolicy'

const GOOGLE_ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT || 'ca-pub-7037125126940820'
const SCRIPT_ID = 'google-adsense-script'

export default function GoogleAdsenseScript() {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    async function loadScript() {
      const settings = await getPublicSiteSettings()
      if (cancelled || !settings?.ads?.scriptEnabled || !GOOGLE_ADSENSE_CLIENT) return
      if (!isAdsenseReviewPath(pathname)) return
      if (document.getElementById(SCRIPT_ID)) return

      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.crossOrigin = 'anonymous'
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT}`
      document.head.appendChild(script)
    }

    loadScript()

    return () => {
      cancelled = true
    }
  }, [pathname])

  return null
}

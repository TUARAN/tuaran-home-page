'use client'

import { useEffect, useRef } from 'react'

const GOOGLE_ADSENSE_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT

export default function GoogleAdSlot({
  slot,
  className = '',
  format = 'auto',
  fullWidthResponsive = true,
  label = 'Google 广告',
}) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!GOOGLE_ADSENSE_CLIENT || !slot || pushedRef.current) return
    pushedRef.current = true

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      pushedRef.current = false
    }
  }, [slot])

  if (!GOOGLE_ADSENSE_CLIENT || !slot) return null

  return (
    <aside
      aria-label={label}
      className={`not-prose my-8 min-h-[96px] overflow-hidden rounded-lg border border-[#e7e3d8] bg-[#f8f6ef] px-3 py-4 dark:border-gray-800 dark:bg-gray-900/60 ${className}`}
    >
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={GOOGLE_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </aside>
  )
}

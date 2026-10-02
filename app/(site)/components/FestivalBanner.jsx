'use client'

import { useEffect, useState } from 'react'
import CampaignBanner from './CampaignBanner'

export default function FestivalBanner() {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/api/festival-banner', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setBanner(data?.banner || null) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!banner) return null

  return <CampaignBanner {...banner} />
}

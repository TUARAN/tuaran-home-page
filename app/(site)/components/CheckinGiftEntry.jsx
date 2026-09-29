'use client'

import Link from 'next/link'
import { IconGift } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export default function CheckinGiftEntry({ className = '' }) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/points/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (active) setChecked(Boolean(data?.authed && data?.checkedInToday))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <Link
      href="/checkin"
      className={`checkin-gift-entry ${checked ? 'is-checked' : ''} ${className}`}
      aria-label={checked ? '今日已签到，查看签到礼物' : '签到有礼'}
    >
      <span className="checkin-gift-entry-icon" aria-hidden="true">
        <IconGift size={19} stroke={1.8} />
      </span>
      <span>{checked ? '今日已签到' : '签到有礼'}</span>
      <span className="checkin-gift-entry-arrow" aria-hidden="true">→</span>
    </Link>
  )
}

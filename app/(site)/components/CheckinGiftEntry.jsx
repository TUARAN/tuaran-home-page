'use client'

import Link from 'next/link'
import { IconCheck, IconGift } from '@tabler/icons-react'
import { useSessionAccount } from './SessionProvider'

export default function CheckinGiftEntry({ className = '' }) {
  const account = useSessionAccount()
  const checked = Boolean(account.user && account.points?.checkedInToday)

  return (
    <Link
      href="/checkin"
      className={`checkin-gift-entry checkin-gift-entry-icon-only ${checked ? 'is-checked' : ''} ${className}`}
      aria-label={checked ? '今日已签到，查看签到礼物' : '签到有礼'}
      title={checked ? '今日已签到' : '签到有礼'}
    >
      <span className="checkin-gift-entry-icon" aria-hidden="true">
        <IconGift size={22} stroke={1.8} />
      </span>
      {checked ? <span className="checkin-gift-entry-check" aria-hidden="true"><IconCheck size={10} stroke={2.4} /></span> : null}
    </Link>
  )
}

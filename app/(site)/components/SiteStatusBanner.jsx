'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconInfoCircle, IconTool } from '@tabler/icons-react'

const POLL_INTERVAL_MS = 60_000

const TONES = {
  info: 'border-blue-200/80 bg-[#f4f8fb] text-[#27475d] dark:border-blue-900/80 dark:bg-[#111c24] dark:text-blue-100',
  warning: 'border-[#e6d6b5] bg-[#fbf7ed] text-[#523b24] dark:border-[#5a472a] dark:bg-[#211c14] dark:text-[#f2dfb7]',
  critical: 'border-rose-200/80 bg-[#fff5f4] text-[#702f31] dark:border-rose-900/80 dark:bg-[#241517] dark:text-rose-100',
}

function BannerIcon({ status, severity }) {
  if (status === 'maintenance') return <IconTool size={18} aria-hidden="true" />
  if (severity === 'info') return <IconInfoCircle size={18} aria-hidden="true" />
  return <IconAlertTriangle size={18} aria-hidden="true" />
}

export default function SiteStatusBanner() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let alive = true
    let timer = null
    const load = () => {
      fetch('/api/site-status', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (alive) setStatus(data?.active ? data : null)
        })
        .catch(() => {})
        .finally(() => {
          if (alive) timer = window.setTimeout(load, POLL_INTERVAL_MS)
        })
    }
    load()
    return () => {
      alive = false
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  if (!status) return null
  const tone = TONES[status.severity] || TONES.warning

  return (
    <aside
      className={`relative z-[110] border-b px-3 py-2 text-[13px] shadow-[0_1px_8px_rgba(57,45,28,0.04)] sm:px-5 ${tone}`}
      role={status.severity === 'critical' ? 'alert' : 'status'}
      aria-live={status.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-start gap-2.5 sm:items-center sm:justify-center">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/45 sm:mt-0 dark:bg-white/5">
          <BannerIcon status={status.status} severity={status.severity} />
        </span>
        <div className="min-w-0 break-words leading-5 sm:flex sm:flex-wrap sm:items-baseline sm:justify-center sm:gap-x-3">
          <strong className="block font-semibold sm:inline">{status.message}</strong>
          {status.detail ? <span className="block opacity-75 sm:inline">{status.detail}</span> : null}
          {status.affectedServices?.length ? (
            <span className="mt-0.5 block text-[12px] opacity-70 sm:mt-0 sm:inline">受影响：{status.affectedServices.join('、')}</span>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

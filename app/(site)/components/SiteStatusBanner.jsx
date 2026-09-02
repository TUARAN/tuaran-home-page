'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconInfoCircle, IconTool } from '@tabler/icons-react'

const POLL_INTERVAL_MS = 60_000

const TONES = {
  info: 'border-blue-300/70 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  warning: 'border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  critical: 'border-rose-300/70 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
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
      className={`relative z-[160] border-b px-4 py-2.5 text-[13px] shadow-sm ${tone}`}
      role={status.severity === 'critical' ? 'alert' : 'status'}
      aria-live={status.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="mx-auto flex w-full max-w-[1120px] items-start justify-center gap-2.5 sm:items-center">
        <span className="mt-0.5 shrink-0 sm:mt-0">
          <BannerIcon status={status.status} severity={status.severity} />
        </span>
        <div className="min-w-0 sm:flex sm:items-baseline sm:gap-2">
          <strong className="font-semibold">{status.message}</strong>
          {status.detail ? <span className="ml-1 opacity-80 sm:ml-0">{status.detail}</span> : null}
          {status.affectedServices?.length ? (
            <span className="ml-1 opacity-70 sm:ml-0">受影响：{status.affectedServices.join('、')}</span>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

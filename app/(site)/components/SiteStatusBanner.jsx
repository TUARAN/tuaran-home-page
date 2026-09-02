'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconInfoCircle, IconTool, IconX } from '@tabler/icons-react'

const POLL_INTERVAL_MS = 60_000
const DISMISSED_STATUS_KEY = 'site-status-dismissed'

const TONES = {
  info: 'border-blue-300/80 bg-[#eaf2f7] text-[#27475d] dark:border-blue-900/80 dark:bg-[#172630] dark:text-blue-100',
  warning: 'border-[#ddc99f] bg-[#f3ead7] text-[#523b24] dark:border-[#66502d] dark:bg-[#2c2418] dark:text-[#f2dfb7]',
  critical: 'border-rose-300/80 bg-[#fbe8e6] text-[#702f31] dark:border-rose-900/80 dark:bg-[#301a1d] dark:text-rose-100',
}

function statusSignature(status) {
  return JSON.stringify([
    status.status,
    status.source,
    status.startedAt,
    status.severity,
    status.message,
    status.detail,
    status.affectedServices,
  ])
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
          if (!alive) return
          if (!data?.active) {
            setStatus(null)
            try {
              window.localStorage.removeItem(DISMISSED_STATUS_KEY)
            } catch {}
            return
          }
          let dismissed = false
          try {
            dismissed = window.localStorage.getItem(DISMISSED_STATUS_KEY) === statusSignature(data)
          } catch {}
          setStatus(dismissed ? null : data)
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
  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_STATUS_KEY, statusSignature(status))
    } catch {}
    setStatus(null)
  }

  return (
    <aside
      className={`relative z-[110] border-b px-3 py-2 text-[13px] shadow-[0_1px_8px_rgba(57,45,28,0.04)] sm:px-5 ${tone}`}
      role={status.severity === 'critical' ? 'alert' : 'status'}
      aria-live={status.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="relative mx-auto flex w-full max-w-[1280px] items-start gap-2.5 pr-9 sm:items-center sm:justify-center">
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
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-0 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:hover:bg-white/10"
          aria-label="关闭这条预警"
          title="关闭"
        >
          <IconX size={17} stroke={1.8} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

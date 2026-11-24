'use client'

import { useEffect, useRef, useState } from 'react'

import SiteSettingsControls from './SiteSettingsControls'
import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/site/i18n'

/**
 * 桌面右上角的设置弹层触发器。具体控件在 SiteSettingsControls，
 * H5 菜单抽屉复用同一份控件，不再单独摆一个右上角图标。
 */
export default function SettingsButton() {
  const { locale } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (panelRef.current?.contains(e.target)) return
      if (triggerRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={pick(locale, '主题与阅读设置', 'Theme & reading settings')}
        aria-expanded={open}
        title={pick(locale, '主题与阅读设置', 'Theme & reading settings')}
        className="header-icon-link"
      >
        {/* 三档调节图标，代替单独月亮 */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" />
          <circle cx="9" cy="7" r="2.2" fill="currentColor" stroke="none" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <line x1="4" y1="17" x2="20" y2="17" />
          <circle cx="10" cy="17" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={pick(locale, '阅读设置', 'Reading settings')}
          className="site-settings-panel absolute right-0 top-11 z-50 w-72 rounded-2xl border p-4"
        >
          <SiteSettingsControls />
        </div>
      )}
    </div>
  )
}

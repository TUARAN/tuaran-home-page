'use client'

import { useEffect, useState } from 'react'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/i18n'

export default function BackToTopButton() {
  const { locale } = useLocale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 480)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <button
      type="button"
      aria-label={pick(locale, '返回顶部', 'Back to top')}
      title={pick(locale, '返回顶部', 'Back to top')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={[
        'back-to-top-button',
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      ].join(' ')}
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M10 15V5M10 5L5.75 9.25M10 5l4.25 4.25"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

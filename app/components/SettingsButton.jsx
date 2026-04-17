'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export default function SettingsButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 避免服务端渲染不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
      title={isDark ? '切换到浅色主题' : '切换到深色主题'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/70 bg-white/80 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  )
}

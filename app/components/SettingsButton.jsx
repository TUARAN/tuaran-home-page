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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-base text-gray-700 opacity-85 transition-opacity hover:opacity-100 dark:text-gray-200"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

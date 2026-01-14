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

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200/70 bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        aria-label="主题 · 浅色"
        className={`rounded-full px-2 py-1 transition-colors ${
          theme === 'light'
            ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        ☀️
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="主题 · 深色"
        className={`rounded-full px-2 py-1 transition-colors ${
          theme === 'dark'
            ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        🌙
      </button>
    </div>
  )
}

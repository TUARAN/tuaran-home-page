'use client'

import { useTheme } from 'next-themes'
import { useLanguage } from './LanguageContext'
import { useState, useEffect } from 'react'

export default function SettingsButton() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // 避免服务端渲染不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const translations = {
    zh: {
      theme: '主题',
      language: '语言',
      light: '浅色',
      dark: '深色',
      chinese: '中文',
      english: 'English'
    },
    en: {
      theme: 'Theme',
      language: 'Language',
      light: 'Light',
      dark: 'Dark',
      chinese: '中文',
      english: 'English'
    }
  }

  const t = translations[language]

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200/70 bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        aria-label={`${t.theme} · ${t.light}`}
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
        aria-label={`${t.theme} · ${t.dark}`}
        className={`rounded-full px-2 py-1 transition-colors ${
          theme === 'dark'
            ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        🌙
      </button>
      <span className="mx-1 h-3 w-px bg-gray-300/70 dark:bg-gray-600/60" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage('zh')}
        aria-pressed={language === 'zh'}
        aria-label={`${t.language} · ${t.chinese}`}
        className={`rounded-full px-2 py-1 transition-colors ${
          language === 'zh'
            ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        中
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        aria-label={`${t.language} · ${t.english}`}
        className={`rounded-full px-2 py-1 transition-colors ${
          language === 'en'
            ? 'bg-gray-200/80 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        EN
      </button>
    </div>
  )
}

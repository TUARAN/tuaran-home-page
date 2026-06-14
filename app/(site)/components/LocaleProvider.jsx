'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, pick } from '../../../lib/i18n'

const LocaleContext = createContext(null)

function readCookieLocale() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))
  return match ? normalizeLocale(decodeURIComponent(match[1])) : null
}

function writeCookieLocale(locale) {
  if (typeof document === 'undefined') return
  const oneYear = 60 * 60 * 24 * 365
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; samesite=lax`
}

export function LocaleProvider({ children }) {
  // SSR / 首帧用默认语言（与静态 HTML 一致，避免 hydration 不匹配）；
  // 挂载后再从 cookie 读取真实语言并切换。
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE)

  useEffect(() => {
    const fromCookie = readCookieLocale()
    if (fromCookie && fromCookie !== locale) setLocaleState(fromCookie)
    // 仅初始化时同步一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN'
    document.documentElement.dataset.lang = locale
  }, [locale])

  const setLocale = useCallback((next) => {
    const value = normalizeLocale(next)
    setLocaleState(value)
    writeCookieLocale(value)
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) return { locale: DEFAULT_LOCALE, setLocale: () => {} }
  return ctx
}

/** 内联双语文本：<T zh="中文" en="English" />。 */
export function T({ zh, en }) {
  const { locale } = useLocale()
  return <>{pick(locale, zh, en)}</>
}

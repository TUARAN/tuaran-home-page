'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/i18n'
import { trackSiteEvent } from '../../../lib/siteAnalytics'
import {
  A2HS_STORAGE_KEY,
  getInstallCopy,
  getInstallSurface,
  nextDismissUntil,
  shouldOfferInstall,
} from '../../../lib/pwaInstall'

const PwaInstallContext = createContext({
  installed: false,
  canOffer: false,
  openGuide: () => {},
})

export function usePwaInstall() {
  return useContext(PwaInstallContext)
}

function readDismissedUntil() {
  try {
    return Number(window.localStorage.getItem(A2HS_STORAGE_KEY) || 0)
  } catch {
    return 0
  }
}

function readDisplayMode() {
  if (typeof window === 'undefined') return ''
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
  return 'browser'
}

function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (window.location.protocol !== 'https:' && !isLocal) return
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
}

export default function PwaInstallGuide({ children }) {
  const { locale } = useLocale()
  const [installed, setInstalled] = useState(false)
  const [canOffer, setCanOffer] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [surface, setSurface] = useState('android')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    registerServiceWorker()
    const displayMode = readDisplayMode()
    const standalone = window.navigator.standalone === true
    setInstalled(standalone || displayMode === 'standalone' || displayMode === 'fullscreen')
    setSurface(getInstallSurface(window.navigator.userAgent))

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
      setBannerOpen(false)
      setSheetOpen(false)
      setInstalled(true)
      setCanOffer(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    const timer = window.setTimeout(() => {
      const offer = shouldOfferInstall({
        standalone: window.navigator.standalone === true,
        displayMode: readDisplayMode(),
        userAgent: window.navigator.userAgent,
        viewportWidth: window.innerWidth,
        dismissedUntil: readDismissedUntil(),
      })
      setCanOffer(offer)
      if (!offer) return
      setBannerOpen(true)
      trackSiteEvent('a2hs_prompt_shown', {
        surface: getInstallSurface(window.navigator.userAgent),
        source: 'auto',
      })
    }, 2200)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const copy = getInstallCopy(surface, locale)

  const dismiss = useCallback((source) => {
    try {
      window.localStorage.setItem(A2HS_STORAGE_KEY, String(nextDismissUntil()))
    } catch {}
    setBannerOpen(false)
    setSheetOpen(false)
    setCanOffer(false)
    trackSiteEvent('a2hs_dismiss', { surface, source })
  }, [surface])

  const openGuide = useCallback(() => {
    setBannerOpen(false)
    setSheetOpen(true)
    trackSiteEvent('a2hs_prompt_shown', { surface, source: 'manual' })
  }, [surface])

  const install = useCallback(async () => {
    trackSiteEvent('a2hs_install_click', { surface, has_native_prompt: Boolean(deferredPrompt) })
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice.catch(() => null)
      setDeferredPrompt(null)
      if (result?.outcome === 'accepted') {
        setBannerOpen(false)
        setSheetOpen(false)
        setInstalled(true)
        setCanOffer(false)
        return
      }
    }
    setBannerOpen(false)
    setSheetOpen(true)
  }, [deferredPrompt, surface])

  useEffect(() => {
    if (!sheetOpen) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const value = useMemo(
    () => ({ installed, canOffer: canOffer && !installed, openGuide }),
    [canOffer, installed, openGuide],
  )

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      {bannerOpen && !installed && !sheetOpen ? (
        <div className="site-a2hs-banner md:hidden" role="region" aria-label={copy.title}>
          <div className="site-a2hs-banner-copy">
            <strong>{copy.title}</strong>
            <span>{pick(locale, '从桌面打开，少一次找地址', 'Open from the Home Screen next time')}</span>
          </div>
          <button type="button" className="site-a2hs-banner-action" onClick={install}>
            {copy.action}
          </button>
          <button
            type="button"
            className="site-a2hs-banner-dismiss"
            onClick={() => dismiss('banner')}
            aria-label={pick(locale, '关闭', 'Dismiss')}
          >
            ×
          </button>
        </div>
      ) : null}

      {sheetOpen ? (
        <div className="site-a2hs-sheet-root md:hidden">
          <button
            type="button"
            className="site-a2hs-sheet-backdrop"
            aria-label={pick(locale, '关闭', 'Close')}
            onClick={() => setSheetOpen(false)}
          />
          <div className="site-a2hs-sheet" role="dialog" aria-modal="true" aria-labelledby="a2hs-sheet-title">
            <p id="a2hs-sheet-title">{copy.title}</p>
            <p className="site-a2hs-sheet-body">{copy.body}</p>
            {surface === 'ios-safari' ? (
              <ol className="site-a2hs-steps">
                <li>{pick(locale, '点 Safari 底部分享按钮', 'Tap the Safari Share button')}</li>
                <li>{pick(locale, '向下滑动，选择「添加到主屏幕」', 'Scroll and choose Add to Home Screen')}</li>
                <li>{pick(locale, '右上角点「添加」', 'Tap Add in the top-right corner')}</li>
              </ol>
            ) : null}
            {surface === 'android' && !deferredPrompt ? (
              <ol className="site-a2hs-steps">
                <li>{pick(locale, '点浏览器右上角菜单', 'Open the browser menu')}</li>
                <li>{pick(locale, '选择「添加到主屏幕」或「安装应用」', 'Choose Add to Home Screen or Install app')}</li>
              </ol>
            ) : null}
            <div className="site-a2hs-sheet-actions">
              {surface === 'android' && deferredPrompt ? (
                <button type="button" className="site-a2hs-banner-action" onClick={install}>
                  {pick(locale, '添加到桌面', 'Add to Home Screen')}
                </button>
              ) : null}
              <button type="button" className="site-a2hs-sheet-secondary" onClick={() => dismiss('sheet')}>
                {pick(locale, '暂不', 'Not now')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PwaInstallContext.Provider>
  )
}

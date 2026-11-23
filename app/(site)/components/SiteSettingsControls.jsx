'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/site/i18n'

/**
 * 阅读 / 显示设置的具体控件。桌面由 SettingsButton 包成弹层，H5 直接嵌进菜单抽屉。
 * 两处实例会同时挂载，本地状态用自定义事件互相同步，避免切换断点后看到旧值。
 */

const UI_STORAGE_KEY = 'site-ui-mode'
const READING_PALETTE_KEY = 'reading-palette'
const HOME_PANEL_OPACITY_KEY = 'home:panel-opacity'
const DEFAULT_HOME_PANEL_OPACITY = 70
const MIN_HOME_PANEL_OPACITY = 0
const MAX_HOME_PANEL_OPACITY = 100
const SETTINGS_SYNC_EVENT = 'site-settings-sync'
const UI_MODES = [
  { id: 'polished', label: '潮流', labelEn: 'Modern', desc: '横幅视觉、重点入口、随机推荐', descEn: 'Hero visual, key entries, random picks' },
]

function clampHomePanelOpacity(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return DEFAULT_HOME_PANEL_OPACITY
  return Math.min(MAX_HOME_PANEL_OPACITY, Math.max(MIN_HOME_PANEL_OPACITY, Math.round(next)))
}

export default function SiteSettingsControls() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [uiMode, setUiMode] = useState('polished')
  const [readingPalette, setReadingPalette] = useState('default')
  const [homePanelOpacity, setHomePanelOpacity] = useState(DEFAULT_HOME_PANEL_OPACITY)
  const instanceIdRef = useRef(null)
  if (!instanceIdRef.current) instanceIdRef.current = `settings-${Math.random().toString(36).slice(2)}`

  useEffect(() => {
    setMounted(true)
    try {
      // 经典样式已下线：任何遗留的 'classic' 都归一到 'polished'
      const ui = localStorage.getItem(UI_STORAGE_KEY)
      const nextUi = 'polished'
      if (ui === 'classic') localStorage.setItem(UI_STORAGE_KEY, nextUi)
      setUiMode(nextUi)
      localStorage.removeItem('reading-bg')
      document.documentElement.style.removeProperty('--page-bg')
      // 默认走标准色系；仅当用户显式选择 'eink' 时叠加墨水屏
      const rp = localStorage.getItem(READING_PALETTE_KEY)
      setReadingPalette(rp === 'eink' ? 'eink' : 'default')
      const homeOpacity = localStorage.getItem(HOME_PANEL_OPACITY_KEY)
      if (homeOpacity !== null) setHomePanelOpacity(clampHomePanelOpacity(homeOpacity))
    } catch (e) {}
  }, [])

  useEffect(() => {
    function onSync(event) {
      const patch = event.detail
      if (!patch || patch.source === instanceIdRef.current) return
      if (patch.uiMode === 'polished' || patch.uiMode === 'classic') setUiMode(patch.uiMode)
      if (patch.readingPalette === 'eink' || patch.readingPalette === 'default') setReadingPalette(patch.readingPalette)
      if (typeof patch.homePanelOpacity === 'number') setHomePanelOpacity(clampHomePanelOpacity(patch.homePanelOpacity))
    }
    window.addEventListener(SETTINGS_SYNC_EVENT, onSync)
    return () => window.removeEventListener(SETTINGS_SYNC_EVENT, onSync)
  }, [])

  function broadcast(patch) {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(SETTINGS_SYNC_EVENT, { detail: { ...patch, source: instanceIdRef.current } }))
  }

  useEffect(() => {
    if (!mounted) return
    document.documentElement.style.setProperty('--home-panel-opacity', `${homePanelOpacity}%`)
    document.documentElement.style.setProperty('--home-panel-backdrop-blur', `${Math.round(homePanelOpacity * 0.14)}px`)
    document.documentElement.style.setProperty(
      '--home-backdrop-overlay-opacity',
      String(Math.min(1, homePanelOpacity / DEFAULT_HOME_PANEL_OPACITY)),
    )
    try {
      localStorage.setItem(HOME_PANEL_OPACITY_KEY, String(homePanelOpacity))
    } catch (e) {}
  }, [mounted, homePanelOpacity])

  // 墨水屏开关：写到 data-reading，触发 globals.css 的 e-ink token 覆盖。
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (readingPalette === 'eink') root.dataset.reading = 'eink'
    else delete root.dataset.reading
  }, [readingPalette, mounted])

  // 主题与语言由 next-themes / LocaleProvider 全局管理，SSR 时不渲染，避免首帧高亮态不一致。
  if (!mounted) return null

  const isDark = theme === 'dark'
  const isHome = pathname === '/'

  const pickReadingPalette = (val) => {
    const next = val === 'eink' ? 'eink' : 'default'
    setReadingPalette(next)
    try {
      localStorage.setItem(READING_PALETTE_KEY, next)
    } catch (e) {}
    broadcast({ readingPalette: next })
  }

  const pickUiMode = (mode) => {
    const next = mode === 'classic' ? 'classic' : 'polished'
    setUiMode(next)
    document.documentElement.dataset.ui = next
    try {
      localStorage.setItem(UI_STORAGE_KEY, next)
    } catch (e) {}
    broadcast({ uiMode: next })
  }

  const updateHomePanelOpacity = (value) => {
    const next = clampHomePanelOpacity(value)
    setHomePanelOpacity(next)
    broadcast({ homePanelOpacity: next })
  }

  return (
    <>
      {/* 语言 / Language */}
      <div className="mb-3">
        <div className="site-settings-label">{pick(locale, '语言', 'Language')}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLocale('zh')}
            aria-pressed={locale !== 'en'}
            className={`site-settings-option inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm ${
              locale !== 'en' ? 'site-settings-option-active' : ''
            }`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            aria-pressed={locale === 'en'}
            className={`site-settings-option inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm ${
              locale === 'en' ? 'site-settings-option-active' : ''
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* 明暗 */}
      <div className="mb-3">
        <div className="site-settings-label">{pick(locale, '主题', 'Theme')}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={!isDark}
            className={`site-settings-option inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm ${
              !isDark ? 'site-settings-option-active' : ''
            }`}
          >
            <span aria-hidden="true">☀️</span>
            <span>{pick(locale, '浅色', 'Light')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={isDark}
            className={`site-settings-option inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm ${
              isDark ? 'site-settings-option-active' : ''
            }`}
          >
            <span aria-hidden="true">🌙</span>
            <span>{pick(locale, '深色', 'Dark')}</span>
          </button>
        </div>
      </div>

      {/* UI（原「样式」；经典已下线，仅保留潮流） */}
      <div className="mb-3">
        <div className="site-settings-label">{pick(locale, 'UI', 'UI')}</div>
        <div className="grid grid-cols-1 gap-2">
          {UI_MODES.map((mode) => {
            const active = uiMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => pickUiMode(mode.id)}
                aria-pressed={active}
                className={`site-settings-option px-3 py-2 text-left ${
                  active ? 'site-settings-option-active' : ''
                }`}
              >
                <span className="block text-sm font-medium">{pick(locale, mode.label, mode.labelEn)}</span>
                <span className="site-settings-option-desc mt-0.5 block text-[10px] leading-4">
                  {pick(locale, mode.desc, mode.descEn)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 护眼配色 / 墨水屏（浅色深色均可叠加） */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="site-settings-label mb-0">{pick(locale, '护眼配色', 'Reading palette')}</div>
          <span className="site-settings-note text-[10px]">{pick(locale, '叠加于当前明暗', 'Layers on light/dark')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => pickReadingPalette('default')}
            aria-pressed={readingPalette !== 'eink'}
            className={`site-settings-option px-3 py-2 text-left ${
              readingPalette !== 'eink' ? 'site-settings-option-active' : ''
            }`}
          >
            <span className="block text-sm font-medium">{pick(locale, '标准', 'Standard')}</span>
            <span className="site-settings-option-desc mt-0.5 block text-[10px] leading-4">
              {pick(locale, '彩色强调 · 默认观感', 'Color accents · default')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => pickReadingPalette('eink')}
            aria-pressed={readingPalette === 'eink'}
            className={`site-settings-option px-3 py-2 text-left ${
              readingPalette === 'eink' ? 'site-settings-option-active' : ''
            }`}
          >
            <span className="block text-sm font-medium">{pick(locale, '墨水屏', 'E-ink')}</span>
            <span className="site-settings-option-desc mt-0.5 block text-[10px] leading-4">
              {pick(locale, '纸感灰阶 · 低刺激', 'Paper grayscale · gentle')}
            </span>
          </button>
        </div>
      </div>

      {isHome ? (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="site-settings-label mb-0">{pick(locale, '首页背景', 'Homepage background')}</div>
            <output className="site-settings-opacity-value">{homePanelOpacity}%</output>
          </div>
          <div className="site-settings-opacity-control rounded-lg border px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[#aaa69a]">
              <span>{pick(locale, '组件透明度', 'Panel opacity')}</span>
              <button
                type="button"
                onClick={() => updateHomePanelOpacity(DEFAULT_HOME_PANEL_OPACITY)}
                className="underline underline-offset-2 transition hover:text-[#f4f3ee]"
              >
                {pick(locale, '恢复默认', 'Reset')}
              </button>
            </div>
            <input
              type="range"
              min={MIN_HOME_PANEL_OPACITY}
              max={MAX_HOME_PANEL_OPACITY}
              step="1"
              value={homePanelOpacity}
              onChange={(event) => updateHomePanelOpacity(event.target.value)}
              aria-label={pick(locale, '首页组件透明度', 'Homepage panel opacity')}
              aria-valuetext={`${homePanelOpacity}%`}
              className="site-settings-opacity-slider"
            />
            <p className="site-settings-option-desc mt-1 text-[10px]">
              {pick(locale, '数值越低，组件与背景遮罩越淡，背后城市越清晰。', 'Lower values reduce panel and backdrop overlays.')}
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}

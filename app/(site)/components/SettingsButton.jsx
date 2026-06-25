'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/i18n'

const BG_PRESETS = [
  { id: 'city',  label: '雾粉城景', labelEn: 'Misty Pink', hex: '#f1eef2', desc: '潮流默认，贴合首页横幅', descEn: 'Modern default, matches the hero' },
  { id: 'cold',  label: '冷牙白', labelEn: 'Cool White', hex: '#f0f1ee', desc: '经典默认，编辑感、克制', descEn: 'Classic default, editorial & restrained' },
  { id: 'warm',  label: '暖米',   labelEn: 'Warm Cream', hex: '#f4ead5', desc: '书页感，适合长读', descEn: 'Paper-like, good for long reads' },
  { id: 'sand',  label: '沙石纸', labelEn: 'Sandstone', hex: '#f1ebde', desc: '砂纸质地，介于两者', descEn: 'Grainy, in between' },
  { id: 'pure',  label: '纯白',   labelEn: 'Pure White', hex: '#ffffff', desc: '最克制，最现代', descEn: 'Most minimal, most modern' },
]

const DEFAULT_BG_HEX = BG_PRESETS[0].hex
const DEFAULT_BG_BY_UI_MODE = {
  polished: BG_PRESETS[0].hex,
  classic: BG_PRESETS[1].hex,
}
const LEGACY_DEFAULT_BG_HEXES = new Set(['#f1f2ee'])
const STORAGE_KEY = 'reading-bg'
const UI_STORAGE_KEY = 'site-ui-mode'
const UI_MODES = [
  { id: 'polished', label: '潮流', labelEn: 'Modern', desc: '横幅视觉、重点入口、随机推荐', descEn: 'Hero visual, key entries, random picks' },
  { id: 'classic', label: '经典', labelEn: 'Classic', desc: '原首页布局、推荐阅读、个人侧栏', descEn: 'Original layout, picks & profile sidebar' },
]

function findPresetByHex(hex) {
  return BG_PRESETS.find((p) => p.hex.toLowerCase() === (hex || '').toLowerCase())
}

export default function SettingsButton() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [bgHex, setBgHex] = useState(DEFAULT_BG_HEX)
  const [uiMode, setUiMode] = useState('polished')
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    try {
      const ui = localStorage.getItem(UI_STORAGE_KEY)
      const nextUi = ui === 'classic' || ui === 'polished' ? ui : 'polished'
      setUiMode(nextUi)
      const v = localStorage.getItem(STORAGE_KEY)
      if (v && LEGACY_DEFAULT_BG_HEXES.has(v.toLowerCase())) {
        localStorage.removeItem(STORAGE_KEY)
        setBgHex(DEFAULT_BG_BY_UI_MODE[nextUi])
      } else if (v) {
        setBgHex(v)
      } else {
        setBgHex(DEFAULT_BG_BY_UI_MODE[nextUi])
      }
    } catch (e) {}
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

  const isDark = theme === 'dark'
  const activePreset = findPresetByHex(bgHex)?.id || 'custom'

  const pickBg = (hex) => {
    setBgHex(hex)
    document.documentElement.style.setProperty('--page-bg', hex)
    try {
      localStorage.setItem(STORAGE_KEY, hex)
    } catch (e) {}
  }

  const pickUiMode = (mode) => {
    const next = mode === 'classic' ? 'classic' : 'polished'
    const nextBg = DEFAULT_BG_BY_UI_MODE[next]
    setUiMode(next)
    setBgHex(nextBg)
    document.documentElement.dataset.ui = next
    document.documentElement.style.setProperty('--page-bg', nextBg)
    try {
      localStorage.setItem(UI_STORAGE_KEY, next)
      localStorage.setItem(STORAGE_KEY, nextBg)
    } catch (e) {}
  }

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

          {/* 样式 */}
          <div className="mb-3">
            <div className="site-settings-label">{pick(locale, '样式', 'Style')}</div>
            <div className="grid grid-cols-2 gap-2">
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

          {/* 阅读底色 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="site-settings-label mb-0">{pick(locale, '阅读底色', 'Reading background')}</div>
              {!isDark ? null : (
                <span className="site-settings-note text-[10px]">{pick(locale, '深色模式下不生效', 'Disabled in dark mode')}</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {BG_PRESETS.map((p) => {
                const isActive = activePreset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickBg(p.hex)}
                    aria-pressed={isActive}
                    className={`site-settings-option flex items-center gap-3 px-3 py-2 text-left ${
                      isActive ? 'site-settings-option-active' : ''
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="site-settings-swatch inline-block h-6 w-6 shrink-0 rounded-full border"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm">{pick(locale, p.label, p.labelEn)}</span>
                      <span className="site-settings-option-desc text-[11px]">{pick(locale, p.desc, p.descEn)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

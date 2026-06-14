'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'

const BG_PRESETS = [
  { id: 'city',  label: '雾粉城景', hex: '#f1eef2', desc: '封面默认，贴合首页横幅' },
  { id: 'cold',  label: '冷牙白', hex: '#f0f1ee', desc: '编辑感、克制' },
  { id: 'warm',  label: '暖米',   hex: '#f4ead5', desc: '书页感，适合长读' },
  { id: 'sand',  label: '沙石纸', hex: '#f1ebde', desc: '砂纸质地，介于两者' },
  { id: 'pure',  label: '纯白',   hex: '#ffffff', desc: '最克制，最现代' },
]

const DEFAULT_BG_HEX = BG_PRESETS[0].hex
const LEGACY_DEFAULT_BG_HEXES = new Set(['#f0f1ee', '#f1f2ee'])
const STORAGE_KEY = 'reading-bg'
const UI_STORAGE_KEY = 'site-ui-mode'
const UI_MODES = [
  { id: 'polished', label: '封面', desc: '横幅视觉、重点入口、随机推荐' },
  { id: 'classic', label: '日志', desc: '原首页布局、推荐阅读、个人侧栏' },
]

function findPresetByHex(hex) {
  return BG_PRESETS.find((p) => p.hex.toLowerCase() === (hex || '').toLowerCase())
}

export default function SettingsButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [bgHex, setBgHex] = useState(DEFAULT_BG_HEX)
  const [uiMode, setUiMode] = useState('polished')
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v && LEGACY_DEFAULT_BG_HEXES.has(v.toLowerCase())) {
        localStorage.removeItem(STORAGE_KEY)
        setBgHex(DEFAULT_BG_HEX)
      } else if (v) {
        setBgHex(v)
      }
      const ui = localStorage.getItem(UI_STORAGE_KEY)
      if (ui === 'classic' || ui === 'polished') setUiMode(ui)
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
    setUiMode(next)
    document.documentElement.dataset.ui = next
    try {
      localStorage.setItem(UI_STORAGE_KEY, next)
    } catch (e) {}
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="主题与阅读设置"
        aria-expanded={open}
        title="主题与阅读设置"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 opacity-85 transition-opacity hover:opacity-100 dark:text-gray-200"
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
          aria-label="阅读设置"
          className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-[#d6d5cd] bg-white p-4 shadow-[0_18px_48px_rgba(20,20,18,0.12)] dark:border-[#2a3440] dark:bg-[#121821]"
        >
          {/* 明暗 */}
          <div className="mb-3">
            <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6a685f] dark:text-gray-400">主题</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={!isDark}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                  !isDark
                    ? 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#15140f]'
                    : 'border-[#d6d5cd] text-[#15140f] hover:border-[#15140f] dark:border-[#2a3440] dark:text-gray-200'
                }`}
              >
                <span aria-hidden="true">☀️</span>
                <span>浅色</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={isDark}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                  isDark
                    ? 'border-gray-200 bg-gray-200 text-[#15140f]'
                    : 'border-[#d6d5cd] text-[#15140f] hover:border-[#15140f]'
                }`}
              >
                <span aria-hidden="true">🌙</span>
                <span>深色</span>
              </button>
            </div>
          </div>

          {/* 首页样式 */}
          <div className="mb-3">
            <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[#6a685f] dark:text-gray-400">首页样式</div>
            <div className="grid grid-cols-2 gap-2">
              {UI_MODES.map((mode) => {
                const active = uiMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => pickUiMode(mode.id)}
                    aria-pressed={active}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#15140f]'
                        : 'border-[#d6d5cd] text-[#15140f] hover:border-[#15140f] dark:border-[#2a3440] dark:text-gray-200 dark:hover:border-gray-400'
                    }`}
                  >
                    <span className="block text-sm font-medium">{mode.label}</span>
                    <span className={`mt-0.5 block text-[10px] leading-4 ${active ? 'opacity-75' : 'text-[#6a685f] dark:text-gray-400'}`}>
                      {mode.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 阅读底色 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.12em] text-[#6a685f] dark:text-gray-400">阅读底色</div>
              {!isDark ? null : (
                <span className="text-[10px] text-[#8a8a8a] dark:text-gray-500">深色模式下不生效</span>
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
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-[#15140f] dark:border-gray-200'
                        : 'border-[#d6d5cd] hover:border-[#15140f] dark:border-[#2a3440] dark:hover:border-gray-400'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-6 w-6 shrink-0 rounded-full border border-[#d6d5cd]"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm text-[#15140f] dark:text-gray-100">{p.label}</span>
                      <span className="text-[11px] text-[#6a685f] dark:text-gray-400">{p.desc}</span>
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

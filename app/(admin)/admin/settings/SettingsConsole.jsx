'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminPage } from '../../components/ui'

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export default function SettingsConsole() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [ads, setAds] = useState({ scriptEnabled: true, manualSlotsEnabled: false, reviewMode: true })

  const fetchSettings = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/admin/settings', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setAds({
        scriptEnabled: Boolean(data?.settings?.ads?.scriptEnabled),
        manualSlotsEnabled: Boolean(data?.settings?.ads?.manualSlotsEnabled),
        reviewMode: data?.settings?.ads?.reviewMode !== false,
      })
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function saveAdsField(field, nextValue) {
    const previousValue = ads[field]
    setAds((current) => ({ ...current, [field]: nextValue }))
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ads: { [field]: nextValue } }),
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setAds({
        scriptEnabled: Boolean(data?.settings?.ads?.scriptEnabled),
        manualSlotsEnabled: Boolean(data?.settings?.ads?.manualSlotsEnabled),
        reviewMode: data?.settings?.ads?.reviewMode !== false,
      })
      setMessage('广告设置已保存，新页面加载后生效。')
    } catch (e) {
      setAds((current) => ({ ...current, [field]: previousValue }))
      setError(e?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPage
      title="站点设置"
      maxWidth="960px"
      description="管理影响全站的功能开关。当前先接入广告开关；后续 SEO、第三方脚本、实验功能可以继续挂到这里。"
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border border-[#d5d7cd] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#15140f] dark:text-gray-100">Google AdSense</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                {loading ? '读取中' : ads.reviewMode ? '复审模式' : '常规模式'}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#56564e] dark:text-gray-400">
              复审期间建议保留首页与内容详情页的 AdSense 脚本、关闭手动广告位，并在 AdSense 后台关闭 Auto ads。脚本和广告位分开控制，避免验证代码与实际投放互相绑死。
            </p>
            <div className="mt-3 grid gap-2 text-xs text-[#77786d] dark:text-[#9aa6b6] sm:grid-cols-3">
              <InfoItem label="Publisher" value="ca-pub-7037125126940820" />
              <InfoItem label="Script" value={ads.scriptEnabled ? '内容路由加载' : '不加载'} />
              <InfoItem label="Slots" value={ads.manualSlotsEnabled && !ads.reviewMode ? '按文章白名单' : '隐藏'} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SettingToggle
            title="审核脚本"
            description="仅在首页、普通文章和分析详情页加载。"
            checked={ads.scriptEnabled}
            disabled={loading || saving}
            onChange={(value) => saveAdsField('scriptEnabled', value)}
          />
          <SettingToggle
            title="手动广告位"
            description="仍需文章自身进入广告白名单。"
            checked={ads.manualSlotsEnabled}
            disabled={loading || saving || ads.reviewMode}
            onChange={(value) => saveAdsField('manualSlotsEnabled', value)}
          />
          <SettingToggle
            title="复审模式"
            description="开启时强制隐藏所有手动广告位。"
            checked={ads.reviewMode}
            disabled={loading || saving}
            onChange={(value) => saveAdsField('reviewMode', value)}
          />
        </div>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Auto ads 只能在 Google AdSense 后台关闭，本站开关不能替代该设置。
        </p>
      </section>
    </AdminPage>
  )
}

function SettingToggle({ title, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#ece7dc] bg-[#faf8f1] p-3 dark:border-[#252e39] dark:bg-[#0c1118]">
      <div>
        <div className="text-sm font-medium text-[#2f3029] dark:text-gray-200">{title}</div>
        <p className="mt-1 text-xs leading-5 text-[#77786d] dark:text-[#9aa6b6]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'border-emerald-500 bg-emerald-500' : 'border-[#c8cabc] bg-[#e9ebdf] dark:border-[#384351] dark:bg-[#1b2530]'
        }`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? 'left-5' : 'left-0.5'}`} />
        <span className="sr-only">切换{title}</span>
      </button>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border border-[#ece7dc] bg-[#faf8f1] px-3 py-2 dark:border-[#252e39] dark:bg-[#0c1118]">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b8d7d] dark:text-[#7d899a]">
        {label}
      </div>
      <div className="mt-1 break-all font-mono text-[11px] text-[#2f3029] dark:text-gray-200">{value}</div>
    </div>
  )
}

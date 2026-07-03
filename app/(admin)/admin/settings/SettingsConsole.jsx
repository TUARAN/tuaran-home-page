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
  const [adsEnabled, setAdsEnabled] = useState(true)

  const fetchSettings = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/admin/settings', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setAdsEnabled(Boolean(data?.settings?.ads?.enabled))
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function saveAdsEnabled(nextValue) {
    const previousValue = adsEnabled
    setAdsEnabled(nextValue)
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ads: { enabled: nextValue } }),
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setAdsEnabled(Boolean(data?.settings?.ads?.enabled))
      setMessage(nextValue ? '广告已开启。新页面加载会注入 AdSense。' : '广告已关闭。新页面加载不会展示 AdSense。')
    } catch (e) {
      setAdsEnabled(previousValue)
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
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  adsEnabled
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {loading ? '读取中' : adsEnabled ? '已开启' : '已关闭'}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#56564e] dark:text-gray-400">
              控制全站 AdSense 脚本和文章广告位。关闭后不会注入 Google 广告脚本，文章页和调研页广告位也不会渲染；已有浏览器页面刷新后生效。
            </p>
            <div className="mt-3 grid gap-2 text-xs text-[#77786d] dark:text-[#9aa6b6] sm:grid-cols-3">
              <InfoItem label="Publisher" value="ca-pub-7037125126940820" />
              <InfoItem label="Script" value={adsEnabled ? '允许加载' : '不加载'} />
              <InfoItem label="Slots" value={adsEnabled ? '允许渲染' : '隐藏'} />
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={adsEnabled}
            disabled={loading || saving}
            onClick={() => saveAdsEnabled(!adsEnabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
              adsEnabled
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-[#c8cabc] bg-[#e9ebdf] dark:border-[#384351] dark:bg-[#1b2530]'
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                adsEnabled ? 'left-7' : 'left-1'
              }`}
            />
            <span className="sr-only">{adsEnabled ? '关闭广告' : '开启广告'}</span>
          </button>
        </div>
      </section>
    </AdminPage>
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

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { notifyNavChanged } from '../../../(site)/components/SessionProvider'
import { AdminPage } from '../../components/ui'

const AUDIENCE_LABELS = {
  public: '所有访客',
  authed: '登录用户',
  owner: '仅站长',
}

const AUDIENCE_HINTS = {
  public: '任何访问者都能在菜单里看到',
  authed: '需要登录后才能在菜单里看到',
  owner: '只有站长本人登录后才能看到',
}

const AUDIENCE_TONE = {
  public: 'text-emerald-700 dark:text-emerald-300',
  authed: 'text-sky-700 dark:text-sky-300',
  owner: 'text-rose-700 dark:text-rose-300',
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function NavAdminClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [audiences, setAudiences] = useState(['public', 'authed', 'owner'])
  const [items, setItems] = useState([])
  const [pendingHref, setPendingHref] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/nav', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setAudiences(Array.isArray(data?.audiences) ? data.audiences : ['public', 'authed', 'owner'])
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'overridden' && !item.overridden) return false
      if (filter === 'owner' && item.effectiveAudience !== 'owner') return false
      if (filter === 'public' && item.effectiveAudience !== 'public') return false
      if (!q) return true
      return (
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.channel.toLowerCase().includes(q)
      )
    })
  }, [items, search, filter])

  const stats = useMemo(() => {
    const total = items.length
    const overridden = items.filter((i) => i.overridden).length
    const byAudience = items.reduce(
      (acc, i) => {
        acc[i.effectiveAudience] = (acc[i.effectiveAudience] || 0) + 1
        return acc
      },
      { public: 0, authed: 0, owner: 0 }
    )
    return { total, overridden, byAudience }
  }, [items])

  async function setAudience(href, audience) {
    setPendingHref(href)
    setError('')
    try {
      const res = await fetch('/api/admin/nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ href, audience }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      notifyNavChanged()
      await fetchData()
    } catch (e) {
      setError(e?.message || 'SAVE_FAILED')
    } finally {
      setPendingHref('')
    }
  }

  async function resetAudience(href) {
    setPendingHref(href)
    setError('')
    try {
      const res = await fetch(`/api/admin/nav?href=${encodeURIComponent(href)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      notifyNavChanged()
      await fetchData()
    } catch (e) {
      setError(e?.message || 'RESET_FAILED')
    } finally {
      setPendingHref('')
    }
  }

  return (
    <AdminPage
      title="菜单权限管理"
      maxWidth="1080px"
      description="这里列出全站所有菜单 item。每一项的「可见用户」决定它是否出现在主导航、移动端菜单和 /map 全站索引里。这里只控制菜单展示，页面本身的 owner gate 不受影响——把私域页面设成 public 也只是让链接出现在菜单中，访客点进去仍然被 gate 拦截。"
    >

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="全部" value={stats.total} />
        <Stat label="已覆盖" value={stats.overridden} hint="非默认配置" />
        <Stat label="Owner" value={stats.byAudience.owner || 0} tone="rose" />
        <Stat label="Public" value={stats.byAudience.public || 0} tone="emerald" />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip current={filter} value="all" onClick={setFilter}>全部</FilterChip>
          <FilterChip current={filter} value="overridden" onClick={setFilter}>已覆盖</FilterChip>
          <FilterChip current={filter} value="owner" onClick={setFilter}>仅站长</FilterChip>
          <FilterChip current={filter} value="public" onClick={setFilter}>公开</FilterChip>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 label / 路径 / 频道…"
          className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100 sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d5d7cd] dark:border-[#252e39]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#edefe7] text-[12px] uppercase tracking-[0.12em] text-[#616454] dark:bg-[#151c25] dark:text-[#8e9ab0]">
            <tr>
              <th className="px-3 py-2">菜单项</th>
              <th className="px-3 py-2">归类</th>
              <th className="px-3 py-2">当前可见</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                  加载中…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                  没有匹配项
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isPending = pendingHref === item.href
                return (
                  <tr
                    key={item.href}
                    className="border-t border-[#dfe0d8] dark:border-[#252e39]"
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-[#15140f] dark:text-gray-100">{item.label}</span>
                        {item.tag ? (
                          <span className="rounded bg-[#e4e9d6] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a6b2e] dark:bg-[#1b1c13] dark:text-[#9aa27a]">
                            {item.tag}
                          </span>
                        ) : null}
                        {item.navHidden ? (
                          <span className="rounded bg-[#e8ece4] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#485a3b] dark:bg-[#1a1f17] dark:text-[#93a984]">
                            nav:false
                          </span>
                        ) : null}
                        {item.external ? (
                          <span className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">↗</span>
                        ) : null}
                      </div>
                      <div className="mt-1 break-all font-mono text-[11px] text-[#858779] dark:text-[#8e9ab0]">
                        {item.href}
                      </div>
                      {item.desc ? (
                        <div className="mt-1 text-[12px] text-[#63645a] dark:text-[#9aa6b6]">{item.desc}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      <div className="flex items-center gap-1.5">
                        <span>{item.channel}</span>
                        {item.scope === 'footer' ? (
                          <span className="rounded bg-[#e8ece4] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#485a3b] dark:bg-[#1a1f17] dark:text-[#93a984]">
                            footer
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-[#858779] dark:text-[#8e9ab0]">{item.section}</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className={`flex items-center gap-2 ${AUDIENCE_TONE[item.effectiveAudience] || ''}`}>
                        <span className="text-sm font-medium">
                          {AUDIENCE_LABELS[item.effectiveAudience] || item.effectiveAudience}
                        </span>
                        {item.overridden ? (
                          <span className="rounded bg-[#e4e9d6] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a6b2e] dark:bg-[#1b1c13] dark:text-[#9aa27a]">
                            Override
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-[11px] text-[#858779] dark:text-[#8e9ab0]">
                        默认 {AUDIENCE_LABELS[item.defaultAudience] || item.defaultAudience}
                        {' · '}
                        {AUDIENCE_HINTS[item.effectiveAudience]}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <select
                          value={item.effectiveAudience}
                          disabled={isPending}
                          onChange={(e) => setAudience(item.href, e.target.value)}
                          className="rounded-lg border border-[#caccc0] bg-white px-2 py-1 text-sm dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100"
                        >
                          {audiences.map((a) => (
                            <option key={a} value={a}>{AUDIENCE_LABELS[a] || a}</option>
                          ))}
                        </select>
                        {item.overridden ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => resetAudience(item.href)}
                            className="rounded-lg border border-[#caccc0] px-2 py-1 text-xs text-[#63645a] hover:bg-[#edefe7] disabled:opacity-50 dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                          >
                            重置
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
        改动立即生效；菜单组件会在 focus / visibilitychange / 自定义事件触发时拉新。需要其他设备同步可以让对方刷新一次。
      </p>
    </AdminPage>
  )
}

function Stat({ label, value, hint, tone }) {
  const toneClass =
    tone === 'rose'
      ? 'text-rose-700 dark:text-rose-300'
      : tone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-300'
      : 'text-[#15140f] dark:text-gray-100'
  return (
    <div className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-3 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint ? <div className="text-[11px] text-[#858779] dark:text-[#8e9ab0]">{hint}</div> : null}
    </div>
  )
}

function FilterChip({ current, value, onClick, children }) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        'rounded-full border px-3 py-1 text-xs transition',
        active
          ? 'border-[#8b5a1f] bg-[#e7eadc] text-[#8a6b2e] dark:border-[#d7a85c] dark:bg-[#1b1c13] dark:text-[#9aa27a]'
          : 'border-[#caccc0] bg-white text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

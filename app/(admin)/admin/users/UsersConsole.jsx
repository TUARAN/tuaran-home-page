'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconRefresh } from '@tabler/icons-react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'
import { displayNameForUserId } from '../../../../lib/userDisplayName'
import { AdminPage, Section, StatCard, DataTable, EmptyState, AdminButton } from '../../components/ui'

const roleStyles = {
  member: 'bg-[#eef1f6] text-[#475467] dark:bg-gray-800 dark:text-gray-300',
  trusted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  blocked: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

const providerLabels = {
  github: 'GitHub',
  google: 'Google',
  email: '邮箱',
}

const stickyUserTh =
  'sticky left-0 z-20 bg-white shadow-[10px_0_16px_-16px_rgba(21,20,15,0.45)] dark:bg-[#0d1218]'
const stickyUserTd =
  'sticky left-0 z-10 bg-white shadow-[10px_0_16px_-16px_rgba(21,20,15,0.45)] dark:bg-[#0d1218]'
const stickyActionTh =
  'sticky right-0 z-20 bg-white shadow-[-10px_0_16px_-16px_rgba(21,20,15,0.45)] dark:bg-[#0d1218]'
const stickyActionTd =
  'sticky right-0 z-10 bg-white shadow-[-10px_0_16px_-16px_rgba(21,20,15,0.45)] dark:bg-[#0d1218]'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function UsersConsole({ initialTab = 'users', mode = 'all' }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState('')
  const [rowError, setRowError] = useState({ id: '', text: '' })

  const [mcpGrants, setMcpGrants] = useState([])
  const [mcpClients, setMcpClients] = useState([])
  const [mcpStatus, setMcpStatus] = useState('idle')
  const [mcpMessage, setMcpMessage] = useState('')
  const [mcpQuery, setMcpQuery] = useState('')
  const [mcpDraft, setMcpDraft] = useState({ userId: '', clientId: '' })
  const [mcpSaving, setMcpSaving] = useState(false)
  const [mcpDeleting, setMcpDeleting] = useState('')

  const [guests, setGuests] = useState([])
  const [guestStats, setGuestStats] = useState(null)
  const [guestStatus, setGuestStatus] = useState('idle')
  const [guestMessage, setGuestMessage] = useState('')
  const [guestQuery, setGuestQuery] = useState('')
  const [guestFilter, setGuestFilter] = useState('active')
  const [guestDetail, setGuestDetail] = useState(null)
  const [guestDetailTarget, setGuestDetailTarget] = useState(null)
  const [guestDetailStatus, setGuestDetailStatus] = useState('idle')
  const [guestPage, setGuestPage] = useState({ hasMore: false, nextCursor: '' })
  const [guestCurrentCursor, setGuestCurrentCursor] = useState('')
  const [guestCursorHistory, setGuestCursorHistory] = useState([])

  const refresh = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok' && Array.isArray(data.users)) {
        setUsers(data.users)
        setDrafts({})
        setStatus('ok')
      } else {
        setStatus(data?.status === 'unavailable' ? 'unavailable' : 'error')
        setMessage(data?.message || data?.error || `HTTP ${res.status}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (mode !== 'all') return
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    if (['users', 'guests', 'mcp'].includes(requestedTab)) setActiveTab(requestedTab)
  }, [mode])

  const refreshMcpGrants = useCallback(async () => {
    setMcpStatus('loading')
    setMcpMessage('')
    try {
      const res = await fetch('/api/admin/oauth-grants', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.status !== 'ok') throw new Error(data?.error || `HTTP ${res.status}`)
      setMcpGrants(Array.isArray(data.grants) ? data.grants : [])
      setMcpClients(Array.isArray(data.clients) ? data.clients : [])
      setMcpStatus('ok')
    } catch (error) {
      setMcpStatus('error')
      setMcpMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'mcp' && mcpStatus === 'idle') refreshMcpGrants()
  }, [activeTab, mcpStatus, refreshMcpGrants])

  const loadGuestPage = useCallback(async (cursor = '', history = []) => {
    setGuestStatus('loading')
    setGuestMessage('')
    try {
      const params = new URLSearchParams({ limit: '30', status: guestFilter })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/admin/guests?${params}`, { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok' && Array.isArray(data.guests)) {
        setGuests(data.guests)
        setGuestStats(data.stats || null)
        setGuestPage(data.page || { hasMore: false, nextCursor: '' })
        setGuestCurrentCursor(cursor)
        setGuestCursorHistory(history)
        setGuestStatus('ok')
      } else {
        setGuestStatus(data?.status === 'unavailable' ? 'unavailable' : 'error')
        setGuestMessage(data?.message || data?.error || `HTTP ${res.status}`)
      }
    } catch (error) {
      setGuestStatus('error')
      setGuestMessage(String(error?.message || error))
    }
  }, [guestFilter])

  const refreshGuests = useCallback(() => loadGuestPage('', []), [loadGuestPage])

  useEffect(() => {
    if (activeTab === 'guests') {
      refreshGuests()
    }
  }, [activeTab, refreshGuests])

  const stats = useMemo(() => {
    const counts = { total: users.length, member: 0, trusted: 0, blocked: 0, owner: 0, totalBalance: 0, totalUnlocks: 0 }
    for (const user of users) {
      counts[user.role] = (counts[user.role] || 0) + 1
      if (user.isOwner) counts.owner += 1
      counts.totalBalance += Number(user.balance || 0)
      counts.totalUnlocks += Number(user.unlockCount || 0)
    }
    return counts
  }, [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      if (roleFilter === 'owner') {
        if (!user.isOwner) return false
      } else if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false
      }
      if (!q) return true
      return [user.name, user.login, user.email, user.id, user.note]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [users, query, roleFilter])

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase()
    return guests.filter((guest) => {
      if (!q) return true
      const u = displayNameForUserId(guest.userId)
      return [
        guest.userId,
        guest.gid,
        guest.boundUserId,
        guest.latestLedger?.reason,
        guest.latestLedger?.ref,
        u.name,
        u.short,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [guests, guestQuery])

  const usersById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users])

  const filteredMcpGrants = useMemo(() => {
    const q = mcpQuery.trim().toLowerCase()
    if (!q) return mcpGrants
    return mcpGrants.filter((grant) => {
      const user = usersById[grant.user_id] || {}
      return [grant.user_id, user.name, user.login, user.email, grant.client_id, grant.client_name, grant.scope]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [mcpGrants, mcpQuery, usersById])

  function draftFor(user) {
    return drafts[user.id] || { role: user.role, note: user.note }
  }

  function setDraft(user, patch) {
    setDrafts((prev) => ({ ...prev, [user.id]: { ...draftFor(user), ...patch } }))
  }

  function isDirty(user) {
    const draft = drafts[user.id]
    if (!draft) return false
    return draft.role !== user.role || draft.note !== user.note
  }

  async function saveUser(user) {
    const draft = draftFor(user)
    setSavingId(user.id)
    setRowError({ id: '', text: '' })
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: user.id, role: draft.role, note: draft.note }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !data.user) {
        throw new Error(data?.error || `HTTP_${res.status}`)
      }
      setUsers((prev) => prev.map((item) => (item.id === data.user.id ? data.user : item)))
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[user.id]
        return next
      })
    } catch (error) {
      setRowError({ id: user.id, text: String(error?.message || error) })
    } finally {
      setSavingId('')
    }
  }

  async function addMcpGrant(event) {
    event.preventDefault()
    if (!mcpDraft.userId || !mcpDraft.clientId) return
    setMcpSaving(true)
    setMcpMessage('')
    try {
      const res = await fetch('/api/admin/oauth-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(mcpDraft),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setMcpGrants(Array.isArray(data.grants) ? data.grants : [])
      setMcpDraft({ userId: '', clientId: '' })
      setMcpMessage('授权已新增。客户端仍需通过标准 OAuth 流程取得 Token。')
    } catch (error) {
      setMcpMessage(`新增失败：${String(error?.message || error)}`)
    } finally {
      setMcpSaving(false)
    }
  }

  async function deleteMcpGrant(grant) {
    const key = `${grant.user_id}:${grant.client_id}`
    if (!window.confirm(`确认撤销 ${grant.client_name || grant.client_id} 对该账号的 MCP 授权？现有 Token 将同时失效。`)) return
    setMcpDeleting(key)
    setMcpMessage('')
    try {
      const params = new URLSearchParams({ user_id: grant.user_id, client_id: grant.client_id })
      const res = await fetch(`/api/admin/oauth-grants?${params}`, { method: 'DELETE', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setMcpGrants(Array.isArray(data.grants) ? data.grants : [])
      setMcpMessage('授权已撤销，相关 Access Token 和 Refresh Token 已失效。')
    } catch (error) {
      setMcpMessage(`撤销失败：${String(error?.message || error)}`)
    } finally {
      setMcpDeleting('')
    }
  }

  async function copyGuestId(userId) {
    try {
      await navigator.clipboard.writeText(userId)
      setGuestMessage(`已复制：${userId}`)
    } catch {
      setGuestMessage(userId)
    }
  }

  async function openGuestUnlocks(guest) {
    setGuestDetailTarget(guest)
    setGuestDetailStatus('loading')
    setGuestDetail(null)
    setGuestMessage('')
    try {
      const res = await fetch(`/api/admin/guests/${encodeURIComponent(guest.userId)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.status !== 'ok' || !data?.guestDetail) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
      }
      setGuestDetail(data.guestDetail)
      setGuestDetailStatus('ok')
    } catch (error) {
      setGuestDetailStatus('error')
      setGuestMessage(`读取游客解锁记录失败：${String(error?.message || error)}`)
    }
  }

  function closeGuestUnlocks() {
    setGuestDetail(null)
    setGuestDetailTarget(null)
    setGuestDetailStatus('idle')
    setGuestMessage('')
  }

  const inputCls =
    'rounded-md border border-[#d8dad0] bg-white px-2 py-1.5 text-xs text-[#15140f] outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568]'

  const tabCls = (value) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      activeTab === value
        ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
        : 'border border-[#d8dad0] bg-white text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-300'
    }`

  function goToPoints(userId, view) {
    router.push(`/admin/points?userId=${encodeURIComponent(userId)}&view=${view}`)
  }

  function selectTab(value) {
    setActiveTab(value)
    const url = new URL(window.location.href)
    if (value === 'users') url.searchParams.delete('tab')
    else url.searchParams.set('tab', value)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const columns = [
    {
      key: 'user',
      header: '用户',
      width: '260px',
      thClassName: stickyUserTh,
      tdClassName: `${stickyUserTd} w-[260px] min-w-[260px] max-w-[260px]`,
      render: (user) => (
        <div className="flex items-center gap-2.5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full border border-[#e2e6ee] object-cover dark:border-gray-700"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef1f6] text-xs font-semibold text-[#667085] dark:bg-gray-800 dark:text-gray-300">
              {(user.name || user.login || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium text-[#17202a] dark:text-gray-100">
              <span className="truncate">{user.name || user.login || user.id}</span>
              {user.isOwner ? (
                <span className="shrink-0 rounded-full bg-[#dae4c7] px-1.5 py-0.5 text-[10px] text-[#3f5212] dark:bg-[#3a4a1a] dark:text-[#c3d69b]">
                  站长
                </span>
              ) : null}
            </p>
            <p className="truncate font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">
              {user.email || user.login || user.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'provider',
      header: '来源',
      width: '92px',
      render: (user) => providerLabels[user.provider] || user.provider || '—',
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'role',
      header: '角色',
      width: '136px',
      render: (user) =>
        user.isOwner ? (
          <span className={`inline-block rounded-full px-2 py-1 text-xs ${roleStyles[user.role] || roleStyles.member}`}>
            {USER_ROLE_LABELS[user.role] || user.role}（锁定）
          </span>
        ) : (
          <select
            value={draftFor(user).role}
            onChange={(event) => setDraft(user, { role: event.target.value })}
            className={`${inputCls} w-32`}
          >
            {VALID_USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        ),
    },
    {
      key: 'note',
      header: '备注',
      width: '160px',
      render: (user) => (
        <input
          value={draftFor(user).note}
          onChange={(event) => setDraft(user, { note: event.target.value })}
          placeholder="备注"
          maxLength={500}
          className={`w-full ${inputCls}`}
        />
      ),
    },
    {
      key: 'lastSeen',
      header: '最近活跃',
      width: '150px',
      render: (user) => formatTime(user.lastSeenAt),
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'loginCount',
      header: '登录次数',
      width: '92px',
      align: 'center',
      render: (user) => user.loginCount,
      tdClassName: 'text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'balance',
      header: '燃币',
      width: '80px',
      align: 'right',
      render: (user) => Number(user.balance || 0),
      tdClassName: 'font-mono text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'unlocks',
      header: '已解锁',
      width: '104px',
      align: 'right',
      render: (user) => (
        <div className="text-right">
          <p className="font-mono text-xs text-[#67695d] dark:text-gray-400">{Number(user.unlockCount || 0)}</p>
          {user.lastUnlockAt ? (
            <p className="text-[10px] text-[#94a3b8] dark:text-gray-500">{formatTime(user.lastUnlockAt)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'action',
      header: '操作',
      width: '300px',
      thClassName: stickyActionTh,
      tdClassName: `${stickyActionTd} w-[300px] min-w-[300px] max-w-[300px]`,
      render: (user) => (
        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => saveUser(user)}
            disabled={!isDirty(user) || savingId === user.id}
          >
            {savingId === user.id ? '保存中…' : '保存'}
          </AdminButton>
          <button
            type="button"
            onClick={() => goToPoints(user.id, 'ledger')}
            className="inline-flex h-8 items-center rounded-md border border-[#c9d4e5] px-2.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            流水/解锁
          </button>
          <button
            type="button"
            onClick={() => goToPoints(user.id, 'adjust')}
            className="inline-flex h-8 items-center rounded-md border border-[#d8dad0] px-2.5 text-[11px] font-medium text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
          >
            调整燃币
          </button>
          {rowError.id === user.id ? (
            <span className="text-[11px] text-rose-600 dark:text-rose-400">{rowError.text}</span>
          ) : null}
        </div>
      ),
    },
  ]

  const guestColumns = [
    {
      key: 'guest',
      header: '游客',
      width: '360px',
      tdClassName: 'w-[360px] max-w-[360px]',
      render: (guest) => {
        const u = displayNameForUserId(guest.userId)
        return (
          <div className="w-full min-w-0">
            <p className="flex min-w-0 items-center gap-1.5 font-medium text-[#17202a] dark:text-gray-100">
              <span className="shrink-0" aria-hidden="true">{u.emoji}</span>
              <span className="truncate">{u.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">
                游客 {u.short}
              </span>
            </p>
            <button
              type="button"
              onClick={() => copyGuestId(guest.userId)}
              className="block max-w-full truncate font-mono text-[11px] text-[#94a3b8] underline-offset-2 transition hover:text-[#53554d] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15140f]/20 dark:text-gray-500 dark:hover:text-gray-300"
              title="点击复制游客 ID"
              aria-label={`复制游客 ID：${guest.userId}`}
            >
              {guest.userId}
            </button>
          </div>
        )
      },
    },
    {
      key: 'state',
      header: '状态',
      width: '96px',
      tdClassName: 'whitespace-nowrap',
      render: (guest) =>
        guest.boundUserId ? (
          <span className="inline-block max-w-full truncate rounded-full bg-[#eef1f6] px-2 py-1 text-xs text-[#475467] dark:bg-gray-800 dark:text-gray-300" title={guest.boundUserId}>
            历史身份 -&gt; {displayNameForUserId(guest.boundUserId).short}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            未绑定
          </span>
        ),
    },
    {
      key: 'balance',
      header: '燃币概况',
      width: '132px',
      align: 'right',
      render: (guest) => (
        <div className="whitespace-nowrap text-right">
          <p className="font-mono text-xs text-[#3f4039] dark:text-gray-200">{guest.balance}</p>
          <p className="font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">
            得 {guest.earned} / 用 {guest.spent}
          </p>
        </div>
      ),
    },
    {
      key: 'activity',
      header: '行为',
      width: '132px',
      tdClassName: 'whitespace-nowrap',
      render: (guest) => (
        <div className="whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400">
          <p>解锁 {guest.unlockCount} · 评论 {guest.commentCount}</p>
          <p className="font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">变动 {guest.ledgerCount}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      width: '104px',
      tdClassName: 'whitespace-nowrap',
      render: (guest) => (
        <button
          type="button"
          onClick={() => openGuestUnlocks(guest)}
          disabled={guestDetailStatus === 'loading'}
          className="rounded-md border border-[#c9d4e5] px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
        >
          查看解锁
        </button>
      ),
    },
    {
      key: 'lastSeen',
      header: '最近活跃',
      width: '136px',
      render: (guest) => formatTime(guest.lastSeenAt),
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
  ]

  const mcpColumns = [
    {
      key: 'user',
      header: '账号',
      width: '250px',
      render: (grant) => {
        const user = usersById[grant.user_id]
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-[#17202a] dark:text-gray-100">{user?.name || user?.login || grant.user_id}</p>
            <p className="truncate font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">{user?.email || grant.user_id}</p>
          </div>
        )
      },
    },
    {
      key: 'client',
      header: 'MCP 客户端',
      width: '260px',
      render: (grant) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-[#3f4039] dark:text-gray-200">{grant.client_name || 'MCP Client'}</p>
          <p className="truncate font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">{grant.client_id}</p>
        </div>
      ),
    },
    { key: 'scope', header: '权限', width: '130px', render: (grant) => grant.scope, tdClassName: 'font-mono text-xs' },
    { key: 'grantedAt', header: '授权时间', width: '150px', render: (grant) => formatTime(grant.granted_at), tdClassName: 'whitespace-nowrap text-xs' },
    {
      key: 'token',
      header: 'Token 状态',
      width: '140px',
      render: (grant) => grant.access_expires_at && Number(grant.access_expires_at) > Date.now() ? 'Access Token 有效' : '无有效 Access Token',
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'action',
      header: '操作',
      width: '100px',
      render: (grant) => {
        const key = `${grant.user_id}:${grant.client_id}`
        return (
          <button
            type="button"
            onClick={() => deleteMcpGrant(grant)}
            disabled={mcpDeleting === key}
            className="rounded-md border border-rose-200 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
          >
            {mcpDeleting === key ? '撤销中…' : '撤销授权'}
          </button>
        )
      },
    },
  ]

  const refreshActive = activeTab === 'guests' ? refreshGuests : activeTab === 'mcp' ? refreshMcpGrants : refresh
  const activeLoading = activeTab === 'guests' ? guestStatus === 'loading' : activeTab === 'mcp' ? mcpStatus === 'loading' : status === 'loading'

  return (
    <AdminPage
      title={mode === 'mcp' ? '授权管理' : '账号与身份'}
      description={
        mode === 'mcp'
          ? '管理用户与 MCP OAuth 客户端之间的授权和撤销关系。'
          : '管理登录账号、角色、游客身份与 MCP 授权。燃币流水和调账统一进入燃币与权益。'
      }
      actions={
        <AdminButton onClick={refreshActive} disabled={activeLoading}>
          <IconRefresh size={16} aria-hidden="true" />
          {activeLoading ? '刷新中…' : '刷新'}
        </AdminButton>
      }
    >
      {mode === 'all' ? <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={tabCls('users')} onClick={() => selectTab('users')}>
          登录用户
        </button>
        <button type="button" className={tabCls('guests')} onClick={() => selectTab('guests')}>
          游客管理
        </button>
        <button type="button" className={tabCls('mcp')} onClick={() => selectTab('mcp')}>
          MCP 授权
        </button>
      </div> : null}

      {activeTab === 'users' && (status === 'unavailable' || status === 'error') ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {message || '用户目录不可用。'}
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
            <StatCard label="用户总数" value={stats.total} icon="users" />
            <StatCard label={USER_ROLE_LABELS.member} value={stats.member} />
            <StatCard label={USER_ROLE_LABELS.trusted} value={stats.trusted} tone="success" />
            <StatCard label={USER_ROLE_LABELS.blocked} value={stats.blocked} tone="danger" />
            <StatCard label="站长（env）" value={stats.owner} />
            <StatCard label="燃币总余额" value={stats.totalBalance} />
            <StatCard label="累计解锁" value={stats.totalUnlocks} />
          </div>

          <Section
            title="用户目录"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="搜索名字 / 邮箱 / ID / 备注"
                  className="w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568] sm:w-64"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['all', '全部'],
                    ['member', USER_ROLE_LABELS.member],
                    ['trusted', USER_ROLE_LABELS.trusted],
                    ['blocked', USER_ROLE_LABELS.blocked],
                    ['owner', '站长'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={roleFilter === value}
                      onClick={() => setRoleFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        roleFilter === value
                          ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
                          : 'border border-[#d8dad0] bg-white text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            }
            className="overflow-hidden"
          >
            <DataTable
              columns={columns}
              rows={status === 'loading' ? [] : filtered}
              rowKey={(user) => user.id}
              tableClassName="min-w-[1374px] table-fixed"
              empty={
                <EmptyState
                  title={
                    status === 'loading'
                      ? '加载中…'
                      : users.length
                        ? '没有匹配的用户'
                        : '目录为空'
                  }
                  description={
                    status === 'loading'
                      ? undefined
                      : users.length
                        ? '换个关键词或角色筛选试试。'
                        : '用户下次登录时会自动登记。'
                  }
                />
              }
            />
          </Section>

          <p className="mt-4 text-xs leading-6 text-[#94a3b8] dark:text-gray-500">
            角色说明：<b>已封禁</b>用户无法发表评论（403）；<b>信任用户</b>当前为预留档位，尚未挂接额外能力；
            历史评论作者由迁移回填，OAuth 用户首次重新登录后信息会自动补全。
          </p>
        </>
      ) : activeTab === 'guests' ? (
        <>
          {guestStatus === 'unavailable' || guestStatus === 'error' ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {guestMessage || '游客目录不可用。'}
            </div>
          ) : null}

          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="游客总数" value={guestStats?.total ?? guests.length} icon="users" />
            <StatCard label="未绑定" value={guestStats?.active ?? 0} tone="success" />
            <StatCard label="已绑定" value={guestStats?.bound ?? 0} />
            <StatCard label="历史游客余额" value={guestStats?.totalBalance ?? 0} />
            <StatCard label="累计解锁" value={guestStats?.unlocks ?? 0} />
            <StatCard label="解锁燃币" value={guestStats?.totalSpent ?? 0} tone="danger" />
          </div>

          <Section
            title="游客目录"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={guestQuery}
                  onChange={(event) => setGuestQuery(event.target.value)}
                  type="search"
                  placeholder="筛选当前页昵称 / guest ID"
                  className="w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568] sm:w-72"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['active', '未绑定'],
                    ['all', '全部'],
                    ['bound', '已绑定'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={guestFilter === value}
                      onClick={() => setGuestFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        guestFilter === value
                          ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
                          : 'border border-[#d8dad0] bg-white text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            }
            className="overflow-hidden"
          >
            <DataTable
              columns={guestColumns}
              rows={guestStatus === 'loading' ? [] : filteredGuests}
              rowKey={(guest) => guest.userId}
              tableClassName="min-w-[884px] table-fixed"
              empty={
                <EmptyState
                  title={
                    guestStatus === 'loading'
                      ? '加载中…'
                      : guests.length
                        ? '没有匹配的游客'
                        : '暂无游客'
                  }
                  description={
                    guestStatus === 'loading'
                      ? undefined
                      : guests.length
                        ? '换个关键词或状态筛选试试。'
                        : '游客产生燃币、解锁或评论后会出现在这里。'
                  }
                />
              }
            />

            <div className="flex items-center justify-between border-t border-[#e2e3da] px-4 py-3 text-xs text-[#67695d] dark:border-[#1e2733] dark:text-gray-400">
              <span>每页最多 30 位游客，仅筛选当前页数据</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={guestStatus === 'loading' || guestCursorHistory.length === 0}
                  onClick={() => {
                    const history = guestCursorHistory.slice(0, -1)
                    loadGuestPage(guestCursorHistory[guestCursorHistory.length - 1] || '', history)
                  }}
                  className="rounded-md border border-[#d8dad0] px-2.5 py-1 disabled:opacity-40 dark:border-[#2d3744]"
                >
                  上一页
                </button>
                <button
                  type="button"
                  disabled={guestStatus === 'loading' || !guestPage.hasMore || !guestPage.nextCursor}
                  onClick={() => loadGuestPage(guestPage.nextCursor, [...guestCursorHistory, guestCurrentCursor])}
                  className="rounded-md border border-[#d8dad0] px-2.5 py-1 disabled:opacity-40 dark:border-[#2d3744]"
                >
                  下一页
                </button>
              </div>
            </div>

          </Section>

          {guestDetailTarget ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
              role="presentation"
              onClick={closeGuestUnlocks}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="guest-unlocks-title"
                className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-hidden rounded-xl border border-[#d8dad0] bg-white shadow-2xl sm:max-h-[42rem] dark:border-[#2d3744] dark:bg-[#10161f]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e3da] px-5 py-4 dark:border-[#1e2733]">
                  <div>
                    <h3 id="guest-unlocks-title" className="text-base font-semibold text-[#15140f] dark:text-gray-100">
                      {displayNameForUserId(guestDetailTarget.userId).name} 的解锁记录
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">{guestDetailTarget.userId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeGuestUnlocks}
                    className="rounded-md border border-[#d8dad0] px-2.5 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
                  >
                    关闭
                  </button>
                </div>
                <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto p-5 sm:max-h-[36.5rem]">
                  {guestDetailStatus === 'loading' ? (
                    <p className="py-8 text-center text-sm text-[#67695d] dark:text-gray-400">正在读取游客解锁内容…</p>
                  ) : guestDetailStatus === 'error' ? (
                    <p className="py-8 text-center text-sm text-rose-700 dark:text-rose-300">
                      {guestMessage || '读取游客解锁记录失败。'}
                    </p>
                  ) : guestDetail ? (
                    <>
                      {guestDetail.movedToAccount ? (
                        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-[#c9d4e5] bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
                          <span>该游客已绑定，解锁权益已归并到正式账号。</span>
                          <button
                            type="button"
                            onClick={() => goToPoints(guestDetail.movedToAccount, 'ledger')}
                            className="font-medium underline underline-offset-2"
                          >
                            查看正式账号记录
                          </button>
                        </div>
                      ) : guestDetail.unlocks.length ? (
                        <DataTable
                          columns={[
                            {
                              key: 'title',
                              header: '已解锁内容',
                              render: (row) => (
                                <div>
                                  <p className="font-medium text-[#33352c] dark:text-gray-200">{row.title}</p>
                                  <p className="mt-1 font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">{row.resourceKey}</p>
                                </div>
                              ),
                            },
                            { key: 'typeLabel', header: '类型', tdClassName: 'text-xs text-[#67695d] dark:text-gray-400' },
                            { key: 'costPoints', header: '燃币', align: 'right' },
                            { key: 'unlockedAt', header: '解锁时间', render: (row) => formatTime(row.unlockedAt), tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400' },
                          ]}
                          rows={guestDetail.unlocks}
                          rowKey={(row) => `${row.resourceKey}:${row.unlockedAt}`}
                        />
                      ) : (
                        <p className="py-8 text-center text-sm text-[#67695d] dark:text-gray-400">该游客还没有解锁内容。</p>
                      )}
                    </>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {mcpStatus === 'error' || mcpMessage ? (
            <div className={`mb-5 rounded-lg border px-3 py-2 text-sm ${mcpStatus === 'error' || mcpMessage.startsWith('新增失败') || mcpMessage.startsWith('撤销失败') ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
              {mcpMessage || 'MCP 授权数据不可用。'}
            </div>
          ) : null}

          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <StatCard label="有效授权" value={mcpGrants.length} />
            <StatCard label="已授权账号" value={new Set(mcpGrants.map((grant) => grant.user_id)).size} icon="users" />
            <StatCard label="已注册客户端" value={mcpClients.length} />
          </div>

          <Section title="新增 MCP 授权" description="选择站点账号和已注册的 MCP OAuth 客户端。这里只建立批准记录，不展示或签发明文 Token。">
            <form onSubmit={addMcpGrant} className="flex flex-wrap items-end gap-3">
              <label className="min-w-64 flex-1 text-xs text-[#67695d] dark:text-gray-400">
                <span className="mb-1 block">账号</span>
                <select value={mcpDraft.userId} onChange={(event) => setMcpDraft((prev) => ({ ...prev, userId: event.target.value }))} className={`${inputCls} h-9 w-full`} required>
                  <option value="">选择账号</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name || user.login || user.id} · {user.email || user.id}</option>)}
                </select>
              </label>
              <label className="min-w-64 flex-1 text-xs text-[#67695d] dark:text-gray-400">
                <span className="mb-1 block">MCP 客户端</span>
                <select value={mcpDraft.clientId} onChange={(event) => setMcpDraft((prev) => ({ ...prev, clientId: event.target.value }))} className={`${inputCls} h-9 w-full`} required>
                  <option value="">选择已注册客户端</option>
                  {mcpClients.map((client) => <option key={client.client_id} value={client.client_id}>{client.client_name} · {client.client_id}</option>)}
                </select>
              </label>
              <AdminButton type="submit" variant="primary" disabled={mcpSaving || !mcpDraft.userId || !mcpDraft.clientId}>
                {mcpSaving ? '新增中…' : '新增授权'}
              </AdminButton>
            </form>
          </Section>

          <Section
            title="已授权 MCP"
            actions={<input value={mcpQuery} onChange={(event) => setMcpQuery(event.target.value)} type="search" placeholder="搜索账号 / 客户端 / 权限" className="w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 sm:w-72" />}
            className="mt-5 overflow-hidden"
          >
            <DataTable
              columns={mcpColumns}
              rows={mcpStatus === 'loading' ? [] : filteredMcpGrants}
              rowKey={(grant) => `${grant.user_id}:${grant.client_id}:${grant.resource}`}
              tableClassName="min-w-[1030px] table-fixed"
              empty={<EmptyState title={mcpStatus === 'loading' ? '加载中…' : mcpGrants.length ? '没有匹配的授权' : '暂无 MCP 授权'} description={mcpStatus === 'loading' ? undefined : '可从上方为账号新增授权。'} />}
            />
          </Section>
        </>
      )}
    </AdminPage>
  )
}

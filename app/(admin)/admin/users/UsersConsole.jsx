'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

const reasonLabels = {
  guest_seed: '游客播种',
  register: '注册',
  checkin: '签到',
  comment: '评论',
  unlock: '解锁',
  admin: '手动',
}

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

export default function UsersConsole() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState('')
  const [rowError, setRowError] = useState({ id: '', text: '' })
  const [ptsAdjustUser, setPtsAdjustUser] = useState('')
  const [ptsAdjustDelta, setPtsAdjustDelta] = useState('')
  const [ptsAdjustNote, setPtsAdjustNote] = useState('')
  const [ptsBusy, setPtsBusy] = useState(false)
  const [ptsMessage, setPtsMessage] = useState('')

  const [guests, setGuests] = useState([])
  const [guestStats, setGuestStats] = useState(null)
  const [guestStatus, setGuestStatus] = useState('idle')
  const [guestMessage, setGuestMessage] = useState('')
  const [guestQuery, setGuestQuery] = useState('')
  const [guestFilter, setGuestFilter] = useState('all')
  const [guestBusy, setGuestBusy] = useState(false)
  const [guestAdjustUser, setGuestAdjustUser] = useState('')
  const [guestAdjustDelta, setGuestAdjustDelta] = useState('')
  const [guestAdjustNote, setGuestAdjustNote] = useState('')

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

  const refreshGuests = useCallback(async () => {
    setGuestStatus('loading')
    setGuestMessage('')
    try {
      const res = await fetch('/api/admin/guests', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok' && Array.isArray(data.guests)) {
        setGuests(data.guests)
        setGuestStats(data.stats || null)
        setGuestStatus('ok')
      } else {
        setGuestStatus(data?.status === 'unavailable' ? 'unavailable' : 'error')
        setGuestMessage(data?.message || data?.error || `HTTP ${res.status}`)
      }
    } catch (error) {
      setGuestStatus('error')
      setGuestMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'guests' && guestStatus === 'idle') {
      refreshGuests()
    }
  }, [activeTab, guestStatus, refreshGuests])

  const stats = useMemo(() => {
    const counts = { total: users.length, member: 0, trusted: 0, blocked: 0, owner: 0, totalBalance: 0 }
    for (const user of users) {
      counts[user.role] = (counts[user.role] || 0) + 1
      if (user.isOwner) counts.owner += 1
      counts.totalBalance += Number(user.balance || 0)
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
      if (guestFilter === 'active' && guest.boundUserId) return false
      if (guestFilter === 'bound' && !guest.boundUserId) return false
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
  }, [guests, guestFilter, guestQuery])

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

  async function adjustUserPoints(e) {
    e.preventDefault()
    if (!ptsAdjustUser.trim() || !ptsAdjustDelta) return
    setPtsBusy(true)
    setPtsMessage('')
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'adjust',
          userId: ptsAdjustUser.trim(),
          delta: Number(ptsAdjustDelta),
          note: ptsAdjustNote.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP_${res.status}`)
      }
      setPtsMessage(`已调整，最新余额 ${data?.balance ?? '—'}`)
      setPtsAdjustDelta('')
      setPtsAdjustNote('')
      await refresh()
    } catch (error) {
      setPtsMessage(String(error?.message || error))
    } finally {
      setPtsBusy(false)
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

  async function adjustGuest(e) {
    e.preventDefault()
    if (!guestAdjustUser.trim() || !guestAdjustDelta) return
    setGuestBusy(true)
    setGuestMessage('')
    try {
      const res = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'adjust',
          userId: guestAdjustUser.trim(),
          delta: Number(guestAdjustDelta),
          note: guestAdjustNote.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP_${res.status}`)
      }
      setGuestMessage('游客燃币已调整')
      setGuestAdjustDelta('')
      setGuestAdjustNote('')
      await refreshGuests()
    } catch (error) {
      setGuestMessage(String(error?.message || error))
    } finally {
      setGuestBusy(false)
    }
  }

  const inputCls =
    'rounded-md border border-[#d8dad0] bg-white px-2 py-1.5 text-xs text-[#15140f] outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568]'

  const tabCls = (value) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      activeTab === value
        ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
        : 'border border-[#d8dad0] bg-white text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-300'
    }`

  const columns = [
    {
      key: 'user',
      header: '用户',
      width: '240px',
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
      render: (user) => providerLabels[user.provider] || user.provider || '—',
      tdClassName: 'text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'role',
      header: '角色',
      render: (user) =>
        user.isOwner ? (
          <span className={`inline-block rounded-full px-2 py-1 text-xs ${roleStyles[user.role] || roleStyles.member}`}>
            {USER_ROLE_LABELS[user.role] || user.role}（锁定）
          </span>
        ) : (
          <select
            value={draftFor(user).role}
            onChange={(event) => setDraft(user, { role: event.target.value })}
            className={inputCls}
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
      width: '200px',
      render: (user) => (
        <input
          value={draftFor(user).note}
          onChange={(event) => setDraft(user, { note: event.target.value })}
          placeholder="备注（仅站长可见）"
          maxLength={500}
          className={`w-full ${inputCls}`}
        />
      ),
    },
    {
      key: 'lastSeen',
      header: '最近活跃',
      render: (user) => formatTime(user.lastSeenAt),
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'loginCount',
      header: '登录次数',
      align: 'center',
      render: (user) => user.loginCount,
      tdClassName: 'text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'balance',
      header: '燃币',
      align: 'right',
      render: (user) => Number(user.balance || 0),
      tdClassName: 'font-mono text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'action',
      header: '操作',
      render: (user) => (
        <div className="flex items-center gap-2">
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
            onClick={() => {
              setPtsAdjustUser(user.id)
              setPtsMessage(`已填入：${user.name || user.login || user.id}`)
            }}
            className="rounded-md border border-[#d8dad0] px-2 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
          >
            燃币
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
      width: '280px',
      tdClassName: 'w-[280px] max-w-[280px]',
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
            <p className="truncate font-mono text-[11px] text-[#94a3b8] dark:text-gray-500" title={guest.userId}>
              {guest.userId}
            </p>
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
            已绑定 {displayNameForUserId(guest.boundUserId).short}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            未绑定
          </span>
        ),
    },
    {
      key: 'balance',
      header: '余额',
      width: '64px',
      align: 'right',
      render: (guest) => guest.balance,
      tdClassName: 'whitespace-nowrap font-mono text-xs',
    },
    {
      key: 'earned',
      header: '累计获得',
      width: '72px',
      align: 'right',
      render: (guest) => `+${guest.earned}`,
      tdClassName: 'whitespace-nowrap font-mono text-xs text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'spent',
      header: '累计消费',
      width: '72px',
      align: 'right',
      render: (guest) => (guest.spent ? `-${guest.spent}` : '0'),
      tdClassName: 'whitespace-nowrap font-mono text-xs text-rose-600 dark:text-rose-400',
    },
    {
      key: 'activity',
      header: '行为',
      width: '100px',
      tdClassName: 'whitespace-nowrap',
      render: (guest) => (
        <span className="whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400">
          解锁 {guest.unlockCount} · 评论 {guest.commentCount}
        </span>
      ),
    },
    {
      key: 'latest',
      header: '最近流水',
      width: '220px',
      tdClassName: 'w-[220px] max-w-[220px]',
      render: (guest) =>
        guest.latestLedger ? (
          <div className="w-full min-w-0 text-xs">
            <p className="truncate text-[#3f4039] dark:text-gray-200">
              {reasonLabels[guest.latestLedger.reason] || guest.latestLedger.reason}
              <span className={guest.latestLedger.delta >= 0 ? 'ml-1 font-mono text-emerald-600 dark:text-emerald-400' : 'ml-1 font-mono text-rose-600 dark:text-rose-400'}>
                {guest.latestLedger.delta >= 0 ? `+${guest.latestLedger.delta}` : guest.latestLedger.delta}
              </span>
            </p>
            <p className="truncate font-mono text-[11px] text-[#94a3b8] dark:text-gray-500" title={guest.latestLedger.ref}>
              {guest.latestLedger.ref || '—'}
            </p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'lastSeen',
      header: '最近活跃',
      width: '136px',
      render: (guest) => formatTime(guest.lastSeenAt),
      tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400',
    },
    {
      key: 'action',
      header: '操作',
      width: '124px',
      tdClassName: 'whitespace-nowrap',
      render: (guest) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setGuestAdjustUser(guest.userId)
              setGuestMessage(`已填入：${guest.userId}`)
            }}
            className="rounded-md border border-[#d8dad0] px-2 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
          >
            填入
          </button>
          <button
            type="button"
            onClick={() => copyGuestId(guest.userId)}
            className="rounded-md border border-[#d8dad0] px-2 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
          >
            复制 ID
          </button>
        </div>
      ),
    },
  ]

  const refreshActive = activeTab === 'guests' ? refreshGuests : refresh
  const activeLoading = activeTab === 'guests' ? guestStatus === 'loading' : status === 'loading'

  return (
    <AdminPage
      title="用户管理"
      maxWidth="1180px"
      description="管理登录用户与燃币游客。登录用户可维护角色、备注与燃币；游客按 guest:<gid> 聚合燃币、解锁、评论和绑定状态。"
      actions={
        <AdminButton onClick={refreshActive} disabled={activeLoading}>
          <IconRefresh size={16} aria-hidden="true" />
          {activeLoading ? '刷新中…' : '刷新'}
        </AdminButton>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={tabCls('users')} onClick={() => setActiveTab('users')}>
          登录用户
        </button>
        <button type="button" className={tabCls('guests')} onClick={() => setActiveTab('guests')}>
          游客管理
        </button>
      </div>

      {activeTab === 'users' && (status === 'unavailable' || status === 'error') ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {message || '用户目录不可用。'}
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="用户总数" value={stats.total} icon="users" />
            <StatCard label={USER_ROLE_LABELS.member} value={stats.member} />
            <StatCard label={USER_ROLE_LABELS.trusted} value={stats.trusted} tone="success" />
            <StatCard label={USER_ROLE_LABELS.blocked} value={stats.blocked} tone="danger" />
            <StatCard label="站长（env）" value={stats.owner} />
            <StatCard label="燃币总余额" value={stats.totalBalance} />
          </div>

          <Section
            title="登录用户燃币调整"
            description="点击用户行「燃币」按钮把其 user_id 填入下方；调整会写入燃币流水（reason=admin），不直接改余额。"
            className="mb-5"
          >
            <form onSubmit={adjustUserPoints} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                user_id
                <input
                  className={`${inputCls} h-9 w-72 text-sm`}
                  value={ptsAdjustUser}
                  onChange={(event) => setPtsAdjustUser(event.target.value)}
                  placeholder="点用户行「燃币」按钮填入"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                增减（可负）
                <input
                  type="number"
                  className={`${inputCls} h-9 w-28 text-sm`}
                  value={ptsAdjustDelta}
                  onChange={(event) => setPtsAdjustDelta(event.target.value)}
                  placeholder="+10 / -5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                备注
                <input
                  className={`${inputCls} h-9 w-48 text-sm`}
                  value={ptsAdjustNote}
                  onChange={(event) => setPtsAdjustNote(event.target.value)}
                  placeholder="可选"
                />
              </label>
              <AdminButton type="submit" variant="primary" disabled={ptsBusy || !ptsAdjustUser.trim() || !ptsAdjustDelta}>
                {ptsBusy ? '调整中…' : '调整'}
              </AdminButton>
            </form>
            {ptsMessage ? <p className="mt-3 text-xs text-[#67695d] dark:text-gray-400">{ptsMessage}</p> : null}
          </Section>

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
      ) : (
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
            <StatCard label="游客总余额" value={guestStats?.totalBalance ?? 0} />
            <StatCard label="累计解锁" value={guestStats?.unlocks ?? 0} />
            <StatCard label="累计消费" value={guestStats?.totalSpent ?? 0} tone="danger" />
          </div>

          <Section
            title="游客燃币调整"
            description="点击下方表格的「填入」拿到完整 guest:<gid> 后再调整；调整会写入燃币流水，不直接改余额。"
            className="mb-5"
          >
            <form onSubmit={adjustGuest} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                guest user_id
                <input
                  className={`${inputCls} h-9 w-72 text-sm`}
                  value={guestAdjustUser}
                  onChange={(event) => setGuestAdjustUser(event.target.value)}
                  placeholder="guest:..."
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                增减（可负）
                <input
                  type="number"
                  className={`${inputCls} h-9 w-28 text-sm`}
                  value={guestAdjustDelta}
                  onChange={(event) => setGuestAdjustDelta(event.target.value)}
                  placeholder="+10 / -5"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                备注
                <input
                  className={`${inputCls} h-9 w-48 text-sm`}
                  value={guestAdjustNote}
                  onChange={(event) => setGuestAdjustNote(event.target.value)}
                  placeholder="可选"
                />
              </label>
              <AdminButton type="submit" variant="primary" disabled={guestBusy || !guestAdjustUser.trim() || !guestAdjustDelta}>
                {guestBusy ? '调整中…' : '调整'}
              </AdminButton>
            </form>
            {guestMessage ? <p className="mt-3 text-xs text-[#67695d] dark:text-gray-400">{guestMessage}</p> : null}
          </Section>

          <Section
            title="游客目录"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={guestQuery}
                  onChange={(event) => setGuestQuery(event.target.value)}
                  type="search"
                  placeholder="搜索昵称 / guest ID / 绑定用户 / ref"
                  className="w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568] sm:w-72"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['all', '全部'],
                    ['active', '未绑定'],
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
              tableClassName="min-w-[1164px] table-fixed"
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
          </Section>
        </>
      )}
    </AdminPage>
  )
}

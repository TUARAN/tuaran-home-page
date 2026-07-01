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

export default function UsersConsole() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState('')
  const [rowError, setRowError] = useState({ id: '', text: '' })

  const [guests, setGuests] = useState([])
  const [guestStats, setGuestStats] = useState(null)
  const [guestStatus, setGuestStatus] = useState('idle')
  const [guestMessage, setGuestMessage] = useState('')
  const [guestQuery, setGuestQuery] = useState('')
  const [guestFilter, setGuestFilter] = useState('active')

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

  async function copyGuestId(userId) {
    try {
      await navigator.clipboard.writeText(userId)
      setGuestMessage(`已复制：${userId}`)
    } catch {
      setGuestMessage(userId)
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

  function goToPoints(userId, view) {
    router.push(`/admin/points?userId=${encodeURIComponent(userId)}&view=${view}`)
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
      description="管理登录用户、角色与游客身份。燃币流水和调账统一跳转到燃币管理，登录后的游客身份只作为历史绑定记录保留。"
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
                  placeholder="搜索昵称 / guest ID / 绑定用户"
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
              tableClassName="min-w-[900px] table-fixed"
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

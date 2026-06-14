'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconRefresh } from '@tabler/icons-react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'
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
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState('')
  const [rowError, setRowError] = useState({ id: '', text: '' })

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

  const stats = useMemo(() => {
    const counts = { total: users.length, member: 0, trusted: 0, blocked: 0, owner: 0 }
    for (const user of users) {
      counts[user.role] = (counts[user.role] || 0) + 1
      if (user.isOwner) counts.owner += 1
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

  const inputCls =
    'rounded-md border border-[#d8dad0] bg-white px-2 py-1.5 text-xs text-[#15140f] outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d1218] dark:text-gray-100 dark:focus:border-[#4a5568]'

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
          {rowError.id === user.id ? (
            <span className="text-[11px] text-rose-600 dark:text-rose-400">{rowError.text}</span>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <AdminPage
      title="用户管理"
      maxWidth="1180px"
      description="登录过的用户都会进入目录（GitHub / Google / 邮箱）。角色控制写操作权限：已封禁用户不能发评论；站长权限由环境变量决定，目录里只展示不可改。"
      actions={
        <AdminButton onClick={refresh} disabled={status === 'loading'}>
          <IconRefresh size={16} aria-hidden="true" />
          {status === 'loading' ? '刷新中…' : '刷新'}
        </AdminButton>
      }
    >
      {status === 'unavailable' || status === 'error' ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {message || '用户目录不可用。'}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <StatCard label="用户总数" value={stats.total} icon="users" />
        <StatCard label={USER_ROLE_LABELS.member} value={stats.member} />
        <StatCard label={USER_ROLE_LABELS.trusted} value={stats.trusted} tone="success" />
        <StatCard label={USER_ROLE_LABELS.blocked} value={stats.blocked} tone="danger" />
        <StatCard label="站长（env）" value={stats.owner} />
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
    </AdminPage>
  )
}

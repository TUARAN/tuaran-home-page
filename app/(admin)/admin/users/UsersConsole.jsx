'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'

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

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 md:py-12">
      <header className="mb-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Admin · Users
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 font-serif text-[1.9rem] font-semibold text-[#15140f] dark:text-gray-100 md:text-[2.2rem]">
              用户管理
            </h1>
            <p className="mb-0 max-w-[44rem] text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
              登录过的用户都会进入目录（GitHub / Google / 邮箱）。角色控制写操作权限：
              已封禁用户不能发评论；站长权限由环境变量决定，目录里只展示不可改。
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-sm font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
          >
            {status === 'loading' ? '刷新中…' : '刷新'}
          </button>
        </div>
      </header>

      {status === 'unavailable' || status === 'error' ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {message || '用户目录不可用。'}
        </div>
      ) : null}

      <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          [String(stats.total), '用户总数'],
          [String(stats.member), USER_ROLE_LABELS.member],
          [String(stats.trusted), USER_ROLE_LABELS.trusted],
          [String(stats.blocked), USER_ROLE_LABELS.blocked],
          [String(stats.owner), '站长（env）'],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-lg border border-[#d9dee7] bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <b className="block text-lg text-[#15140f] dark:text-gray-100">{value}</b>
            <span className="text-xs text-[#667085] dark:text-gray-400">{label}</span>
          </div>
        ))}
      </section>

      <section className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="搜索名字、登录名、邮箱、ID 或备注"
          className="w-full rounded-lg border border-[#d9dee7] bg-white px-3 py-2 text-sm outline-none focus:border-[#111827] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 sm:w-80"
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
                  ? 'bg-[#111827] text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'border border-[#d9dee7] bg-white text-[#475467] hover:border-[#98a2b3] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-xs text-[#475467] dark:bg-gray-950 dark:text-gray-300">
                {['用户', '来源', '角色', '备注', '最近活跃', '登录次数', '操作'].map((head) => (
                  <th key={head} className="border-b border-[#d9dee7] px-3 py-2 font-semibold dark:border-gray-800">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[#667085] dark:text-gray-400">
                    加载中…
                  </td>
                </tr>
              ) : null}
              {status !== 'loading' && !filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[#667085] dark:text-gray-400">
                    {users.length ? '没有匹配的用户。' : '目录为空：用户下次登录时会自动登记。'}
                  </td>
                </tr>
              ) : null}
              {filtered.map((user) => {
                const draft = draftFor(user)
                return (
                  <tr key={user.id} className="align-top hover:bg-[#fbfcff] dark:hover:bg-gray-950">
                    <td className="min-w-[220px] border-b border-[#d9dee7] px-3 py-2.5 dark:border-gray-800">
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
                    </td>
                    <td className="border-b border-[#d9dee7] px-3 py-2.5 text-xs text-[#475467] dark:border-gray-800 dark:text-gray-300">
                      {providerLabels[user.provider] || user.provider || '—'}
                    </td>
                    <td className="border-b border-[#d9dee7] px-3 py-2.5 dark:border-gray-800">
                      {user.isOwner ? (
                        <span className={`inline-block rounded-full px-2 py-1 text-xs ${roleStyles[user.role] || roleStyles.member}`}>
                          {USER_ROLE_LABELS[user.role] || user.role}（锁定）
                        </span>
                      ) : (
                        <select
                          value={draft.role}
                          onChange={(event) => setDraft(user, { role: event.target.value })}
                          className="rounded-md border border-[#d9dee7] bg-white px-2 py-1.5 text-xs text-[#15140f] outline-none focus:border-[#111827] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                        >
                          {VALID_USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {USER_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="min-w-[180px] border-b border-[#d9dee7] px-3 py-2.5 dark:border-gray-800">
                      <input
                        value={draft.note}
                        onChange={(event) => setDraft(user, { note: event.target.value })}
                        placeholder="备注（仅站长可见）"
                        maxLength={500}
                        className="w-full rounded-md border border-[#d9dee7] bg-white px-2 py-1.5 text-xs text-[#15140f] outline-none focus:border-[#111827] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      />
                    </td>
                    <td className="whitespace-nowrap border-b border-[#d9dee7] px-3 py-2.5 text-xs text-[#667085] dark:border-gray-800 dark:text-gray-400">
                      {formatTime(user.lastSeenAt)}
                    </td>
                    <td className="border-b border-[#d9dee7] px-3 py-2.5 text-center text-xs text-[#667085] dark:border-gray-800 dark:text-gray-400">
                      {user.loginCount}
                    </td>
                    <td className="border-b border-[#d9dee7] px-3 py-2.5 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveUser(user)}
                          disabled={!isDirty(user) || savingId === user.id}
                          className="inline-flex h-7 items-center justify-center rounded-md border border-[#111827] bg-[#111827] px-2.5 text-xs font-medium text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:border-[#d9dee7] disabled:bg-white disabled:text-[#98a2b3] dark:disabled:border-gray-700 dark:disabled:bg-gray-950"
                        >
                          {savingId === user.id ? '保存中…' : '保存'}
                        </button>
                        {rowError.id === user.id ? (
                          <span className="text-[11px] text-rose-600 dark:text-rose-400">{rowError.text}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-xs leading-6 text-[#94a3b8] dark:text-gray-500">
        角色说明：<b>已封禁</b>用户无法发表评论（403）；<b>信任用户</b>当前为预留档位，尚未挂接额外能力；
        历史评论作者由迁移回填，OAuth 用户首次重新登录后信息会自动补全。
      </p>
    </main>
  )
}

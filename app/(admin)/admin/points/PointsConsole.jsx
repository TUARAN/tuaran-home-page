'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconRefresh, IconCoin, IconTrash } from '@tabler/icons-react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'
import { displayNameForUserId } from '../../../../lib/userDisplayName'
import { AdminPage, Section, StatCard, DataTable, EmptyState, AdminButton } from '../../components/ui'

/** 把 user_id 渲染成趣味昵称 + 来源 + 短 id（hover 看完整 id） */
function UserIdCell({ userId, onPick }) {
  const u = displayNameForUserId(userId)
  const isGuest = String(userId || '').startsWith('guest:')
  const inner = (
    <>
      <span aria-hidden="true">{u.emoji}</span>
      <span className="font-medium text-[#33352c] dark:text-gray-200">{u.name}</span>
      <span className="font-mono text-[10px] text-[#9a9c8f] dark:text-gray-500">{u.providerLabel} {u.short}</span>
    </>
  )
  // 短 id 只是显示用；真正能操作的是完整 user_id。点一下把完整 id 填进调整框，避免手敲对不上。
  if (onPick && !isGuest) {
    return (
      <button
        type="button"
        onClick={() => onPick(u.full)}
        title={`点击填入调整框：${u.full}`}
        className="group inline-flex items-center gap-1.5 text-left hover:opacity-80"
      >
        {inner}
        <span className="font-mono text-[10px] text-[#caa86a] opacity-0 transition-opacity group-hover:opacity-100">填入↑</span>
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5" title={isGuest ? `${u.full}（游客不参与后台燃币调整）` : u.full}>
      {inner}
    </span>
  )
}

const REASON_LABELS = {
  register: '注册',
  checkin: '签到',
  comment: '评论',
  unlock: '解锁',
  admin: '手动',
}

const TABS = [
  { id: 'overview', label: '账户概览' },
  { id: 'settings', label: '门槛与调整' },
]

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

function timeValue(ts) {
  const value = new Date(ts || 0).getTime()
  return Number.isFinite(value) ? value : 0
}

const inputCls =
  'h-9 rounded-lg border border-[#caccc0] bg-white px-2.5 text-sm text-[#15140f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

export default function PointsConsole() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [rules, setRules] = useState(null)
  const [resources, setResources] = useState([])
  const [summary, setSummary] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [ledger, setLedger] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountDetail, setAccountDetail] = useState(null)
  const [accountLedger, setAccountLedger] = useState([])
  const [detailStatus, setDetailStatus] = useState('idle')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // 账户搜索与近期变动筛选 / 排序
  const [ledgerQuery, setLedgerQuery] = useState('')
  const [ledgerReason, setLedgerReason] = useState('all')
  const [ledgerDelta, setLedgerDelta] = useState('all')
  const [ledgerSort, setLedgerSort] = useState('timeDesc')

  // 资源门槛表单
  const [resKey, setResKey] = useState('')
  const [resCost, setResCost] = useState('10')
  const [resRole, setResRole] = useState('member')

  // 手动调整表单
  const [adjUser, setAdjUser] = useState('')
  const [adjDelta, setAdjDelta] = useState('')
  const [adjNote, setAdjNote] = useState('')
  const adjUserRef = useRef(null)

  // 从账户或近期变动里点某个用户 → 把完整 user_id 填进调整框并聚焦。
  const pickUser = useCallback((userId) => {
    setAdjUser(userId)
    setMessage(`已填入 user_id：${userId}`)
    requestAnimationFrame(() => {
      adjUserRef.current?.focus()
      adjUserRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [])

  const refresh = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/points', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok') {
        setRules(data.rules || null)
        setResources(Array.isArray(data.resources) ? data.resources : [])
        setSummary(data.summary || null)
        setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
        setLedger(Array.isArray(data.recentLedger) ? data.recentLedger : [])
        setStatus('ok')
      } else {
        setRules(data?.rules || null)
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

  async function post(payload, okMsg) {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
      }
      setMessage(okMsg || '已保存')
      await refresh()
      return data
    } catch (error) {
      setMessage(String(error?.message || error))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function loadAccountHistory(userId) {
    const id = String(userId || '').trim()
    if (!id) return
    setSelectedAccountId(id)
    setDetailStatus('loading')
    setMessage('')
    try {
      const res = await fetch(`/api/admin/points?userId=${encodeURIComponent(id)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.status !== 'ok') {
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`)
      }
      setRules(data.rules || null)
      setResources(Array.isArray(data.resources) ? data.resources : [])
      setSummary(data.summary || null)
      setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
      setLedger(Array.isArray(data.recentLedger) ? data.recentLedger : [])
      setAccountDetail(data.accountDetail || null)
      setAccountLedger(Array.isArray(data.accountLedger) ? data.accountLedger : [])
      setDetailStatus('ok')
    } catch (error) {
      setDetailStatus('error')
      setMessage(String(error?.message || error))
    }
  }

  async function saveResource(e) {
    e.preventDefault()
    if (!resKey.trim()) return
    const ok = await post(
      { action: 'upsertResource', resourceKey: resKey.trim(), costPoints: Number(resCost) || 0, minRole: resRole },
      '门槛已保存'
    )
    if (ok) setResKey('')
  }

  async function removeResource(key) {
    await post({ action: 'deleteResource', resourceKey: key }, '门槛已删除')
  }

  async function adjust(e) {
    e.preventDefault()
    if (!adjUser.trim() || !adjDelta) return
    const id = adjUser.trim()
    if (id.startsWith('guest:')) {
      setMessage('游客燃币由系统自动发放/消费，后台不支持手动增减。')
      return
    }
    // 只认登录账户前缀；裸码 / 手滑粘进的短 id 会被服务端拒绝（避免凭空建号），这里先友好拦一道。
    if (!/^(github|google|email):/.test(id)) {
      setMessage('user_id 需带登录前缀（github: / google: / email:）。点上方账户行的「调整」会自动填入完整 id，别手敲短码。')
      return
    }
    const ok = await post(
      { action: 'adjust', userId: adjUser.trim(), delta: Number(adjDelta), note: adjNote.trim() },
      '燃币已调整'
    )
    if (ok) {
      setAdjDelta('')
      setAdjNote('')
      if (selectedAccountId === adjUser.trim()) await loadAccountHistory(selectedAccountId)
    }
  }

  async function reverseEntry(row) {
    if (!row?.id) return
    const sign = row.delta >= 0 ? '+' : ''
    if (!window.confirm(`撤销这笔「${sign}${row.delta}」变动？会给该用户补一笔反向变动来抵消（账本只增不改）。`)) return
    const ok = await post({ action: 'reverse', ledgerId: row.id }, '已撤销该笔变动')
    if (ok && selectedAccountId) await loadAccountHistory(selectedAccountId)
  }

  const filteredLedger = useMemo(() => {
    const q = ledgerQuery.trim().toLowerCase()
    const rows = ledger.filter((row) => {
      if (ledgerReason !== 'all' && row.reason !== ledgerReason) return false
      if (ledgerDelta === 'earn' && Number(row.delta) <= 0) return false
      if (ledgerDelta === 'spend' && Number(row.delta) >= 0) return false
      if (q) {
        const user = displayNameForUserId(row.user_id)
        const haystack = [
          row.user_id,
          user.name,
          user.providerLabel,
          user.short,
          row.reason,
          REASON_LABELS[row.reason],
          row.ref,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    return [...rows].sort((a, b) => {
      if (ledgerSort === 'balanceDesc') {
        return Number(b.user_balance || 0) - Number(a.user_balance || 0) || timeValue(b.created_at) - timeValue(a.created_at)
      }
      if (ledgerSort === 'balanceAsc') {
        return Number(a.user_balance || 0) - Number(b.user_balance || 0) || timeValue(b.created_at) - timeValue(a.created_at)
      }
      if (ledgerSort === 'deltaDesc') {
        return Number(b.delta || 0) - Number(a.delta || 0) || timeValue(b.created_at) - timeValue(a.created_at)
      }
      if (ledgerSort === 'deltaAsc') {
        return Number(a.delta || 0) - Number(b.delta || 0) || timeValue(b.created_at) - timeValue(a.created_at)
      }
      return timeValue(b.created_at) - timeValue(a.created_at)
    })
  }, [ledger, ledgerDelta, ledgerQuery, ledgerReason, ledgerSort])

  const filteredAccounts = useMemo(() => {
    const q = ledgerQuery.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter((row) => {
      const user = displayNameForUserId(row.user_id)
      return [row.user_id, user.name, user.providerLabel, user.short]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [accounts, ledgerQuery])

  const actions = (
    <AdminButton variant="default" onClick={refresh} disabled={busy}>
      <IconRefresh size={16} /> 刷新
    </AdminButton>
  )

  return (
    <AdminPage
      title="燃币管理"
      description="面向登录账户的燃币控制台：看余额、发放与扣减概况，配置资源门槛，并对指定账户做手动调整。游客燃币活动归入游客管理。"
      actions={actions}
    >
      {status === 'unavailable' || status === 'error' ? (
        <Section title="状态">
          <p className="text-sm text-rose-600 dark:text-rose-400">{message || '读取失败'}</p>
        </Section>
      ) : null}

      {rules ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="注册奖励" value={`+${rules.register}`} />
          <StatCard label="每日签到" value={`+${rules.checkin}`} />
          <StatCard label="有效评论" value={`+${rules.comment}`} />
          <StatCard label="评论每日上限" value={`+${rules.commentDailyCap}`} />
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-[#e2e3da] dark:border-[#1e2733]">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px h-10 border-b-2 px-3 text-sm font-medium transition ${
                active
                  ? 'border-[#15140f] text-[#15140f] dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-[#67695d] hover:text-[#15140f] dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="燃币账户" value={summary?.accountCount ?? accounts.length} icon="users" />
            <StatCard label="当前总余额" value={summary?.totalBalance ?? 0} />
            <StatCard label="累计发放" value={`+${summary?.issuedPoints ?? 0}`} tone="success" />
            <StatCard label="累计扣减" value={`-${summary?.spentPoints ?? 0}`} tone="danger" />
          </div>

          <Section
            title="燃币账户"
            description="只展示登录账户余额，不混入 guest:* 游客。点击账户可填入下方手动调整表单。"
            actions={
              <input
                className={`${inputCls} w-64`}
                value={ledgerQuery}
                onChange={(e) => setLedgerQuery(e.target.value)}
                placeholder="搜索用户 / provider / ID"
              />
            }
            className="mb-5"
          >
            {accounts.length ? (
              filteredAccounts.length ? (
                <DataTable
                  columns={[
                    { key: 'user_id', header: '账户', render: (row) => <UserIdCell userId={row.user_id} onPick={pickUser} /> },
                    { key: 'balance', header: '余额', align: 'right', render: (row) => Number(row.balance || 0) },
                    { key: 'ledger_count', header: '变动次数', align: 'right', render: (row) => Number(row.ledger_count || 0) },
                    { key: 'last_ledger_at', header: '最近变动', render: (row) => formatTime(row.last_ledger_at || row.updated_at) },
                    {
                      key: 'op',
                      header: '操作',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadAccountHistory(row.user_id)}
                            className="rounded-md border border-[#c9d4e5] px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                          >
                            记录
                          </button>
                          <button
                            type="button"
                            onClick={() => pickUser(row.user_id)}
                            className="rounded-md border border-[#d8dad0] px-2 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
                          >
                            调整
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  rows={filteredAccounts}
                  rowKey={(row) => row.user_id}
                />
              ) : (
                <EmptyState icon={IconCoin} title="没有匹配的账户" description="换一个关键词试试。" />
              )
            ) : (
              <EmptyState icon={IconCoin} title="暂无登录账户燃币数据" description="用户获得或消费燃币后会出现在这里。" />
            )}
          </Section>

          {selectedAccountId ? (
            <Section
              title="账户记录"
              description={`当前查看：${selectedAccountId}。这里展示该账户自己的完整燃币变动，不受全站最近 50 条限制。`}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId('')
                    setAccountDetail(null)
                    setAccountLedger([])
                    setDetailStatus('idle')
                  }}
                  className="rounded-md border border-[#d8dad0] px-2 py-1 text-[11px] text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
                >
                  关闭
                </button>
              }
              className="mb-5"
            >
              {detailStatus === 'loading' ? (
                <EmptyState icon={IconCoin} title="正在读取账户记录…" />
              ) : detailStatus === 'error' ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{message || '账户记录读取失败'}</p>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="当前余额" value={accountDetail?.balance ?? 0} />
                    <StatCard label="记录数" value={accountDetail?.ledgerCount ?? accountLedger.length} />
                    <StatCard label="累计获得" value={`+${accountDetail?.earnedPoints ?? 0}`} tone="success" />
                    <StatCard label="累计消费" value={`-${accountDetail?.spentPoints ?? 0}`} tone="danger" />
                  </div>

                  {accountLedger.length ? (
                    <DataTable
                      columns={[
                        { key: 'created_at', header: '时间', render: (row) => formatTime(row.created_at) },
                        {
                          key: 'delta',
                          header: '增减',
                          render: (row) => (
                            <span className={row.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {row.delta >= 0 ? `+${row.delta}` : row.delta}
                            </span>
                          ),
                        },
                        { key: 'reason', header: '原因', render: (row) => REASON_LABELS[row.reason] || row.reason },
                        { key: 'ref', header: 'ref' },
                        {
                          key: 'op',
                          header: '操作',
                          render: (row) => (
                            <button
                              type="button"
                              onClick={() => reverseEntry(row)}
                              disabled={busy || String(row.ref || '').startsWith('reverse:')}
                              title="给该用户补一笔反向变动，抵消这笔"
                              className="rounded-md border border-[#d8b4b4] px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            >
                              撤销
                            </button>
                          ),
                        },
                      ]}
                      rows={accountLedger}
                      rowKey={(row) => row.id}
                    />
                  ) : (
                    <EmptyState icon={IconCoin} title="这个账户还没有燃币记录" />
                  )}
                </>
              )}
            </Section>
          ) : null}

          <Section
            title="近期变动"
            description="登录账户最近 50 条燃币变动，用于核对发放、消费和手动调整；游客变动已从这里排除。"
          >
            <div className="mb-4 grid gap-2 md:grid-cols-[140px_140px_180px]">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                原因
                <select className={inputCls} value={ledgerReason} onChange={(e) => setLedgerReason(e.target.value)}>
                  <option value="all">全部原因</option>
                  {Object.entries(REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                增减
                <select className={inputCls} value={ledgerDelta} onChange={(e) => setLedgerDelta(e.target.value)}>
                  <option value="all">全部</option>
                  <option value="earn">只看增加</option>
                  <option value="spend">只看扣减</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                排序
                <select className={inputCls} value={ledgerSort} onChange={(e) => setLedgerSort(e.target.value)}>
                  <option value="timeDesc">最新优先</option>
                  <option value="balanceDesc">用户余额高到低</option>
                  <option value="balanceAsc">用户余额低到高</option>
                  <option value="deltaDesc">单笔增减高到低</option>
                  <option value="deltaAsc">单笔增减低到高</option>
                </select>
              </label>
            </div>

            {ledger.length ? (
              filteredLedger.length ? (
                <DataTable
                  columns={[
                    { key: 'created_at', header: '时间', render: (row) => formatTime(row.created_at) },
                    { key: 'user_id', header: '账户', render: (row) => <UserIdCell userId={row.user_id} onPick={pickUser} /> },
                    {
                      key: 'user_balance',
                      header: '余额',
                      align: 'right',
                      render: (row) => `${Number(row.user_balance || 0)}`,
                    },
                    {
                      key: 'delta',
                      header: '增减',
                      render: (row) => (
                        <span className={row.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {row.delta >= 0 ? `+${row.delta}` : row.delta}
                        </span>
                      ),
                    },
                    { key: 'reason', header: '原因', render: (row) => REASON_LABELS[row.reason] || row.reason },
                    { key: 'ref', header: 'ref' },
                    {
                      key: 'op',
                      header: '操作',
                      render: (row) => (
                        <button
                          type="button"
                          onClick={() => reverseEntry(row)}
                          disabled={busy || String(row.ref || '').startsWith('reverse:')}
                          title="给该用户补一笔反向变动，抵消这笔"
                          className="rounded-md border border-[#d8b4b4] px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          撤销
                        </button>
                      ),
                    },
                  ]}
                  rows={filteredLedger}
                  rowKey={(row) => row.id}
                />
              ) : (
                <EmptyState icon={IconCoin} title="没有匹配的变动" description="换一个筛选条件试试。" />
              )
            ) : (
              <EmptyState icon={IconCoin} title="暂无登录账户变动" />
            )}
          </Section>
        </>
      ) : (
        <>
          <Section
            title="资源门槛设置"
            description="resource_key 为资源标识（如文章 slug 或 download:xxx）；解锁一次后该用户永久可读，不再扣燃币。"
            className="mb-5"
          >
            <form onSubmit={saveResource} className="mb-4 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                resource_key
                <input
                  className={`${inputCls} w-64`}
                  value={resKey}
                  onChange={(e) => setResKey(e.target.value)}
                  placeholder="如 research/topics/xxx"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                燃币价格
                <input
                  type="number"
                  min="0"
                  className={`${inputCls} w-28`}
                  value={resCost}
                  onChange={(e) => setResCost(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                最低角色
                <select className={`${inputCls} w-32`} value={resRole} onChange={(e) => setResRole(e.target.value)}>
                  {VALID_USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </label>
              <AdminButton type="submit" variant="primary" disabled={busy || !resKey.trim()}>
                保存门槛
              </AdminButton>
            </form>

            {resources.length ? (
              <DataTable
                columns={[
                  { key: 'resource_key', header: 'resource_key' },
                  { key: 'cost_points', header: '燃币价格', render: (row) => `${row.cost_points}` },
                  {
                    key: 'min_role',
                    header: '最低角色',
                    render: (row) => USER_ROLE_LABELS[row.min_role] || row.min_role,
                  },
                  { key: 'created_at', header: '创建时间', render: (row) => formatTime(row.created_at) },
                  {
                    key: '_ops',
                    header: '',
                    render: (row) => (
                      <AdminButton variant="danger" size="sm" onClick={() => removeResource(row.resource_key)} disabled={busy}>
                        <IconTrash size={14} /> 删除
                      </AdminButton>
                    ),
                  },
                ]}
                rows={resources}
                rowKey={(row) => row.resource_key}
              />
            ) : (
              <EmptyState icon={IconCoin} title="还没有配置任何门槛资源" description="在上方表单添加第一个。" />
            )}
          </Section>

          <Section
            title="手动增减燃币"
            description="仅支持登录用户 user_id（如 github:123 / google:abc / email:xxx）；游客燃币活动归游客管理观察，不在后台手动增减。"
          >
            <form onSubmit={adjust} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                user_id
                <input ref={adjUserRef} className={`${inputCls} w-72`} value={adjUser} onChange={(e) => setAdjUser(e.target.value)} placeholder="点账户或近期变动自动填入" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                增减（可负）
                <input type="number" className={`${inputCls} w-28`} value={adjDelta} onChange={(e) => setAdjDelta(e.target.value)} placeholder="+10 / -5" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                备注
                <input className={`${inputCls} w-48`} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="可选" />
              </label>
              <AdminButton type="submit" variant="primary" disabled={busy || !adjUser.trim() || !adjDelta}>
                调整
              </AdminButton>
            </form>
          </Section>
        </>
      )}

      {message ? <p className="mt-4 text-xs text-[#67695d] dark:text-gray-400">{message}</p> : null}
    </AdminPage>
  )
}

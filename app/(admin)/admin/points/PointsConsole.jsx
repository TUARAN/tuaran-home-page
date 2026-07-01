'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconCoin, IconRefresh, IconTrash } from '@tabler/icons-react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'
import { displayNameForUserId } from '../../../../lib/userDisplayName'
import { AdminPage, Section, StatCard, DataTable, EmptyState, AdminButton } from '../../components/ui'

function UserIdCell({ userId }) {
  const u = displayNameForUserId(userId)
  return (
    <span className="inline-flex items-center gap-1.5" title={u.full}>
      <span aria-hidden="true">{u.emoji}</span>
      <span className="font-medium text-[#33352c] dark:text-gray-200">{u.name}</span>
      <span className="font-mono text-[10px] text-[#9a9c8f] dark:text-gray-500">
        {u.providerLabel} {u.short}
      </span>
    </span>
  )
}

function isAdjustableAccountId(userId) {
  return /^(github|google|email):/.test(String(userId || '').trim())
}

const REASON_LABELS = {
  guest_seed: '游客初始',
  register: '注册',
  checkin: '签到',
  comment: '评论',
  unlock: '解锁',
  admin: '手动',
}

const ROLE_LABELS = {
  ...USER_ROLE_LABELS,
  guest: '游客可解锁',
}

const TABS = [
  { id: 'settings', label: '门槛与调整' },
  { id: 'ledger', label: '账户流水查询' },
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

function toValue(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const inputCls =
  'h-9 rounded-lg border border-[#caccc0] bg-white px-2.5 text-sm text-[#15140f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

export default function PointsConsole() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [rules, setRules] = useState(null)
  const [policy, setPolicy] = useState(null)
  const [resources, setResources] = useState([])
  const [summary, setSummary] = useState(null)
  const [accountDetail, setAccountDetail] = useState(null)
  const [accountLedger, setAccountLedger] = useState([])
  const [accountUnlocks, setAccountUnlocks] = useState([])
  const [detailStatus, setDetailStatus] = useState('idle')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')

  const [resKey, setResKey] = useState('')
  const [resCost, setResCost] = useState('10')
  const [resRole, setResRole] = useState('member')

  const [adjUser, setAdjUser] = useState('')
  const [adjDelta, setAdjDelta] = useState('')
  const [adjNote, setAdjNote] = useState('')
  const adjUserRef = useRef(null)
  const adjustSectionRef = useRef(null)

  const [historyUser, setHistoryUser] = useState('')
  const historyUserRef = useRef(null)
  const initialParamsApplied = useRef(false)

  const refresh = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/points', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok') {
        setRules(data.rules || null)
        setPolicy(data.policy || null)
        setResources(Array.isArray(data.resources) ? data.resources : [])
        setSummary(data.summary || null)
        setStatus('ok')
      } else {
        setRules(data?.rules || null)
        setPolicy(data?.policy || null)
        setStatus(data?.status === 'unavailable' ? 'unavailable' : 'error')
        setMessage(data?.message || data?.error || `HTTP ${res.status}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  const loadAccountHistory = useCallback(async (userId) => {
    const id = String(userId || '').trim()
    if (!id) return
    if (id.startsWith('guest:')) {
      setMessage('已绑定游客身份只作为历史记录保留。登录用户流水请查询 github: / google: / email: 账号。')
      return
    }
    setHistoryUser(id)
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
      setPolicy(data.policy || null)
      setResources(Array.isArray(data.resources) ? data.resources : [])
      setSummary(data.summary || null)
      setAccountDetail(data.accountDetail || null)
      setAccountLedger(Array.isArray(data.accountLedger) ? data.accountLedger : [])
      setAccountUnlocks(Array.isArray(data.accountUnlocks) ? data.accountUnlocks : [])
      setDetailStatus('ok')
    } catch (error) {
      setDetailStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (initialParamsApplied.current) return
    initialParamsApplied.current = true
    const params = new URLSearchParams(window.location.search)
    const userId = String(params.get('userId') || '').trim()
    const view = String(params.get('view') || '')
    if (view === 'ledger') {
      setActiveTab('ledger')
      if (userId) loadAccountHistory(userId)
      requestAnimationFrame(() => historyUserRef.current?.focus())
      return
    }
    if (view === 'adjust') {
      setActiveTab('settings')
      if (userId) setAdjUser(userId)
      requestAnimationFrame(() => {
        adjUserRef.current?.focus()
        adjustSectionRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }, [loadAccountHistory])

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
    const id = adjUser.trim()
    if (!id || !adjDelta) return
    if (!isAdjustableAccountId(id)) {
      setMessage('user_id 需带登录前缀（github: / google: / email:）。游客身份绑定后不再后台手动调账。')
      return
    }
    const ok = await post(
      { action: 'adjust', userId: id, delta: Number(adjDelta), note: adjNote.trim() },
      '燃币已调整'
    )
    if (ok) {
      setAdjDelta('')
      setAdjNote('')
      if (historyUser === id) await loadAccountHistory(id)
    }
  }

  async function queryHistory(e) {
    e.preventDefault()
    const id = historyUser.trim()
    if (!id) return
    await loadAccountHistory(id)
  }

  async function reverseEntry(row) {
    if (!row?.id) return
    const sign = row.delta >= 0 ? '+' : ''
    if (!window.confirm(`撤销这笔「${sign}${row.delta}」变动？会给该用户补一笔反向变动来抵消（账本只增不改）。`)) return
    const ok = await post({ action: 'reverse', ledgerId: row.id }, '已撤销该笔变动')
    if (ok && historyUser) await loadAccountHistory(historyUser)
  }

  const defaultResourceRows = useMemo(
    () => [
      {
        key: 'research:*',
        label: '调研文章默认门槛',
        cost: toValue(rules?.researchDefaultCost, 5),
        minRole: 'guest',
        note: '未单独配置的 research: 资源按这个价格解锁。',
      },
      {
        key: 'resource:*',
        label: '资料页默认门槛',
        cost: toValue(rules?.resourceDefaultCost, 10),
        minRole: 'guest',
        note: '未单独配置的 resource: 资源按这个价格解锁。',
      },
    ],
    [rules]
  )

  const policyEarnRows = useMemo(() => {
    return (policy?.earnMethods || []).map((item) => ({
      ...item,
      amount: item.delta == null ? '按需' : `+${item.delta}`,
      capText: item.cap == null ? '按运营判断' : `+${item.cap}`,
      statusLabel: item.status === 'live' ? '已上线' : '预留',
    }))
  }, [policy])

  const policySpendRows = useMemo(() => {
    return (policy?.spendScenarios || []).map((item) => ({
      ...item,
      quota: item.cost == null ? '按需' : `${item.cost}`,
      pattern: item.resourcePattern || '—',
      statusLabel: item.status === 'live' ? '已上线' : '预留',
    }))
  }, [policy])

  const actions = (
    <AdminButton variant="default" onClick={refresh} disabled={busy}>
      <IconRefresh size={16} /> 刷新
    </AdminButton>
  )

  return (
    <AdminPage
      title="燃币管理"
      description="集中管理燃币规则、资源权益和人工调账。流水只在查询具体登录账户时显示。"
      actions={actions}
    >
      {status === 'unavailable' || status === 'error' ? (
        <Section title="状态">
          <p className="text-sm text-rose-600 dark:text-rose-400">{message || '读取失败'}</p>
        </Section>
      ) : null}

      {rules ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="游客初始" value={`+${rules.guestSeed}`} />
          <StatCard label="注册奖励" value={`+${rules.register}`} />
          <StatCard label="每日签到" value={`+${rules.checkin}`} />
          <StatCard label="有效评论" value={`+${rules.comment}`} />
          <StatCard label="评论每日上限" value={`+${rules.commentDailyCap}`} />
          <StatCard label="调研默认额度" value={rules.researchDefaultCost} />
          <StatCard label="资源默认额度" value={rules.resourceDefaultCost} />
          <StatCard label="登录账户余额" value={summary?.totalBalance ?? 0} />
        </div>
      ) : null}

      {policy ? (
        <Section
          title="燃币体系设置"
          description={`参考 ${policy.reference?.label || '社区货币体系'}：${policy.reference?.note || '把获取、使用、余额和反滥用放在同一套规则里。'}`}
          className="mb-5"
        >
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1.3fr]">
            <div className="rounded-lg border border-[#e2e3da] bg-[#fbfcf7] p-4 dark:border-[#1e2733] dark:bg-[#10161f]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#67695d] dark:text-gray-400">
                {policy.currency?.symbol || '🔥'} {policy.currency?.name || '燃币'}
              </p>
              <p className="mt-2 text-sm text-[#33352c] dark:text-gray-200">{policy.currency?.scope}</p>
              <a
                href={policy.reference?.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-medium text-[#7a5b1e] underline underline-offset-2 dark:text-amber-300"
              >
                查看参考页面
              </a>
            </div>
            <ul className="rounded-lg border border-[#e2e3da] bg-white p-4 text-xs leading-6 text-[#67695d] dark:border-[#1e2733] dark:bg-[#0b1119] dark:text-gray-400">
              {(policy.principles || []).map((text) => (
                <li key={text}>· {text}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable
              columns={[
                { key: 'label', header: '获取方式' },
                { key: 'amount', header: '燃币', align: 'right' },
                { key: 'frequency', header: '频率' },
                { key: 'capText', header: '上限', align: 'right' },
                { key: 'statusLabel', header: '状态' },
                { key: 'description', header: '说明', tdClassName: 'text-xs text-[#67695d] dark:text-gray-400' },
              ]}
              rows={policyEarnRows}
              rowKey={(row) => row.id}
            />
            <DataTable
              columns={[
                { key: 'label', header: '使用场景' },
                { key: 'quota', header: '额度', align: 'right' },
                { key: 'unit', header: '单位' },
                { key: 'pattern', header: '匹配范围', tdClassName: 'font-mono text-xs text-[#67695d] dark:text-gray-400' },
                { key: 'statusLabel', header: '状态' },
                { key: 'description', header: '说明', tdClassName: 'text-xs text-[#67695d] dark:text-gray-400' },
              ]}
              rows={policySpendRows}
              rowKey={(row) => row.id}
            />
          </div>
        </Section>
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

      {activeTab === 'settings' ? (
        <>
          <Section
            title="默认权益额度"
            description="这些是代码里的默认规则：资源没有显式配置时会自动回退到这里，不需要逐条登记。"
            className="mb-5"
          >
            <DataTable
              columns={[
                { key: 'label', header: '默认项' },
                { key: 'key', header: '匹配范围', tdClassName: 'font-mono text-xs text-[#67695d] dark:text-gray-400' },
                { key: 'cost', header: '燃币额度', align: 'right' },
                {
                  key: 'minRole',
                  header: '最低角色',
                  render: (row) => ROLE_LABELS[row.minRole] || row.minRole,
                },
                { key: 'note', header: '说明', tdClassName: 'text-xs text-[#67695d] dark:text-gray-400' },
              ]}
              rows={defaultResourceRows}
              rowKey={(row) => row.key}
            />
          </Section>

          <Section
            title="资源权益覆盖"
            description="只在需要改写默认额度或最低角色时添加显式配置；解锁一次后该用户永久可读。"
            className="mb-5"
          >
            <form onSubmit={saveResource} className="mb-4 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                resource_key
                <input
                  className={`${inputCls} w-64`}
                  value={resKey}
                  onChange={(e) => setResKey(e.target.value)}
                  placeholder="如 research:topics:xxx"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                燃币额度
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
                保存权益
              </AdminButton>
            </form>

            {resources.length ? (
              <DataTable
                columns={[
                  { key: 'resource_key', header: 'resource_key', tdClassName: 'font-mono text-xs' },
                  { key: 'cost_points', header: '燃币额度', align: 'right', render: (row) => `${row.cost_points}` },
                  {
                    key: 'min_role',
                    header: '最低角色',
                    render: (row) => ROLE_LABELS[row.min_role] || row.min_role,
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
              <EmptyState icon={IconCoin} title="暂无显式权益覆盖" description="没有配置时会使用上方默认项。" />
            )}
          </Section>

          <div ref={adjustSectionRef}>
            <Section
              title="手动增减燃币"
              description="仅支持登录用户 user_id（github: / google: / email:）。用户管理页的「调整燃币」会直接跳到这里。"
            >
              <form onSubmit={adjust} className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                  user_id
                  <input
                    ref={adjUserRef}
                    className={`${inputCls} w-72`}
                    value={adjUser}
                    onChange={(e) => setAdjUser(e.target.value)}
                    placeholder="github:123 / google:abc / email:x"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
                  增减（可负）
                  <input
                    type="number"
                    className={`${inputCls} w-28`}
                    value={adjDelta}
                    onChange={(e) => setAdjDelta(e.target.value)}
                    placeholder="+10 / -5"
                  />
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
          </div>
        </>
      ) : (
        <Section
          title="账户流水查询"
          description="这里只查具体登录账户的燃币流水；不再默认展示全站流水。"
        >
          <form onSubmit={queryHistory} className="mb-5 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
              user_id
              <input
                ref={historyUserRef}
                className={`${inputCls} w-72`}
                value={historyUser}
                onChange={(e) => setHistoryUser(e.target.value)}
                placeholder="从用户管理跳转，或手动输入完整 user_id"
              />
            </label>
            <AdminButton type="submit" variant="primary" disabled={busy || !historyUser.trim()}>
              查询流水
            </AdminButton>
            {isAdjustableAccountId(historyUser) ? (
              <button
                type="button"
                onClick={() => {
                  setAdjUser(historyUser.trim())
                  setActiveTab('settings')
                  requestAnimationFrame(() => {
                    adjUserRef.current?.focus()
                    adjustSectionRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                  })
                }}
                className="h-9 rounded-lg border border-[#d8dad0] px-3 text-sm text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
              >
                去调整
              </button>
            ) : null}
          </form>

          {detailStatus === 'idle' ? (
            <EmptyState icon={IconCoin} title="先选择一个登录账户" description="用户管理页的「查流水」会自动带入 user_id。" />
          ) : detailStatus === 'loading' ? (
            <EmptyState icon={IconCoin} title="正在读取账户流水…" />
          ) : detailStatus === 'error' ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{message || '账户流水读取失败'}</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="当前余额" value={accountDetail?.balance ?? 0} />
                <StatCard label="记录数" value={accountDetail?.ledgerCount ?? accountLedger.length} />
                <StatCard label="累计获得" value={`+${accountDetail?.earnedPoints ?? 0}`} tone="success" />
                <StatCard label="累计使用" value={`-${accountDetail?.spentPoints ?? 0}`} tone="danger" />
                <StatCard label="已解锁" value={accountDetail?.unlockCount ?? accountUnlocks.length} />
              </div>

              <div className="mb-3 text-xs text-[#67695d] dark:text-gray-400">
                当前账户：<UserIdCell userId={accountDetail?.user_id || historyUser} />
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-[#33352c] dark:text-gray-200">解锁页面和资源</h3>
                {accountUnlocks.length ? (
                  <DataTable
                    columns={[
                      {
                        key: 'title',
                        header: '内容',
                        render: (row) => (
                          <div className="min-w-0">
                            {row.href ? (
                              <a
                                href={row.href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#33352c] underline-offset-2 hover:underline dark:text-gray-200"
                              >
                                {row.title}
                              </a>
                            ) : (
                              <span className="font-medium text-[#33352c] dark:text-gray-200">{row.title}</span>
                            )}
                            <p className="mt-1 font-mono text-[11px] text-[#94a3b8] dark:text-gray-500">{row.resourceKey}</p>
                          </div>
                        ),
                      },
                      { key: 'typeLabel', header: '类型', tdClassName: 'whitespace-nowrap text-xs text-[#67695d] dark:text-gray-400' },
                      { key: 'costPoints', header: '额度', align: 'right' },
                      { key: 'unlockedAt', header: '解锁时间', render: (row) => formatTime(row.unlockedAt) },
                    ]}
                    rows={accountUnlocks}
                    rowKey={(row) => `${row.resourceKey}:${row.unlockedAt}`}
                  />
                ) : (
                  <EmptyState icon={IconCoin} title="这个账户还没有解锁记录" />
                )}
              </div>

              <h3 className="mb-2 text-sm font-semibold text-[#33352c] dark:text-gray-200">燃币流水</h3>
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
                    { key: 'ref', header: 'ref', tdClassName: 'font-mono text-xs text-[#67695d] dark:text-gray-400' },
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
                <EmptyState icon={IconCoin} title="这个账户还没有燃币流水" />
              )}
            </>
          )}
        </Section>
      )}

      {message && detailStatus !== 'error' ? <p className="mt-4 text-xs text-[#67695d] dark:text-gray-400">{message}</p> : null}
    </AdminPage>
  )
}

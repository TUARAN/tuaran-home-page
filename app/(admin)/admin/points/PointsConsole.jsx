'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconRefresh, IconCoin, IconTrash } from '@tabler/icons-react'

import { USER_ROLE_LABELS, VALID_USER_ROLES } from '../../../../lib/userRoles'
import { AdminPage, Section, StatCard, DataTable, EmptyState, AdminButton } from '../../components/ui'

const REASON_LABELS = {
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

const inputCls =
  'h-9 rounded-lg border border-[#caccc0] bg-white px-2.5 text-sm text-[#15140f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

export default function PointsConsole() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [rules, setRules] = useState(null)
  const [resources, setResources] = useState([])
  const [ledger, setLedger] = useState([])
  const [busy, setBusy] = useState(false)

  // 资源门槛表单
  const [resKey, setResKey] = useState('')
  const [resCost, setResCost] = useState('10')
  const [resRole, setResRole] = useState('member')

  // 手动调整表单
  const [adjUser, setAdjUser] = useState('')
  const [adjDelta, setAdjDelta] = useState('')
  const [adjNote, setAdjNote] = useState('')

  const refresh = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/points', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok') {
        setRules(data.rules || null)
        setResources(Array.isArray(data.resources) ? data.resources : [])
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
    const ok = await post(
      { action: 'adjust', userId: adjUser.trim(), delta: Number(adjDelta), note: adjNote.trim() },
      '燃币已调整'
    )
    if (ok) {
      setAdjDelta('')
      setAdjNote('')
    }
  }

  const actions = (
    <AdminButton variant="default" onClick={refresh} disabled={busy}>
      <IconRefresh size={16} /> 刷新
    </AdminButton>
  )

  return (
    <AdminPage
      title="燃币与门槛"
      description="燃币是站内虚拟激励：注册 / 签到 / 评论赚取，解锁资源消费。账本（point_ledger）为正本，余额（user_points）为物化缓存。"
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

      <Section
        title="资源门槛配置"
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
        title="手动加减燃币"
        description="user_id 形如 github:123 / google:abc / email:xxx；记一笔 reason=admin 的流水。"
        className="mb-5"
      >
        <form onSubmit={adjust} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-[#67695d] dark:text-gray-400">
            user_id
            <input className={`${inputCls} w-56`} value={adjUser} onChange={(e) => setAdjUser(e.target.value)} placeholder="github:123" />
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

      <Section title="最近燃币流水" description="point_ledger 最新 50 条（只增不改，扣燃币为负数）。">
        {ledger.length ? (
          <DataTable
            columns={[
              { key: 'created_at', header: '时间', render: (row) => formatTime(row.created_at) },
              { key: 'user_id', header: 'user_id' },
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
            ]}
            rows={ledger}
            rowKey={(row) => row.id}
          />
        ) : (
          <EmptyState icon={IconCoin} title="暂无流水" />
        )}
      </Section>

      {message ? <p className="mt-4 text-xs text-[#67695d] dark:text-gray-400">{message}</p> : null}
    </AdminPage>
  )
}

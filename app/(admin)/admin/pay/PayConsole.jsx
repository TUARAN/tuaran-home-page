'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconRefresh, IconReceipt2, IconCoin, IconBook2 } from '@tabler/icons-react'

import { displayNameForUserId } from '../../../../lib/auth/userDisplayName'
import {
  AdminButton,
  AdminPage,
  DataTable,
  EmptyState,
  Section,
  StatCard,
  StatusPill,
  Toolbar,
} from '../../components/ui'

const TABS = [
  { id: 'orders', label: '订单记录', icon: IconReceipt2 },
  { id: 'prices', label: '内容定价', icon: IconCoin },
  { id: 'guide', label: '接入说明', icon: IconBook2 },
]

const STATUS_META = {
  paid: { label: '已支付', tone: 'success' },
  pending: { label: '待支付', tone: 'warning' },
  closed: { label: '已关闭', tone: 'neutral' },
  failed: { label: '失败', tone: 'danger' },
}

const inputCls =
  'h-9 rounded-lg border border-[#caccc0] bg-white px-2.5 text-sm text-[#15140f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(Number(ts)).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

function fenToYuan(fen) {
  return `¥${(Number(fen || 0) / 100).toFixed(2)}`
}

function UserCell({ userId }) {
  const u = displayNameForUserId(userId)
  return (
    <span className="inline-flex items-center gap-1.5" title={u.full}>
      <span aria-hidden="true">{u.emoji}</span>
      <span className="font-medium text-[#33352c] dark:text-gray-200">{u.name}</span>
    </span>
  )
}

function StatusCell({ status }) {
  const meta = STATUS_META[status] || { label: status || '未知', tone: 'neutral' }
  return (
    <StatusPill tone={meta.tone} size="sm">
      {meta.label}
    </StatusPill>
  )
}

export default function PayConsole() {
  const [activeTab, setActiveTab] = useState('orders')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)
  const [busy, setBusy] = useState(false)

  const [prices, setPrices] = useState([])
  const [priceEdits, setPriceEdits] = useState({})
  const [priceDraftKey, setPriceDraftKey] = useState('')
  const [priceDraftFen, setPriceDraftFen] = useState('')
  const [priceBusyKey, setPriceBusyKey] = useState('')

  const refresh = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/pay/orders?limit=500', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
      setSummary(data.summary || null)
      setStatus('ok')
    } catch (error) {
      setStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  const loadPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/points', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.status === 'ok' && Array.isArray(data.resources)) {
        const next = data.resources
          .map((r) => ({
            resourceKey: r.resource_key,
            costPoints: Number(r.cost_points || 0),
            priceFen: Number(r.price_fen || 0),
          }))
          .sort((a, b) => b.priceFen - a.priceFen || a.resourceKey.localeCompare(b.resourceKey))
        setPrices(next)
        setPriceEdits({})
      } else {
        setMessage(`读取资源列表失败：${data?.error || `HTTP ${res.status}`}`)
      }
    } catch (error) {
      setMessage(`读取资源列表失败：${String(error?.message || error)}`)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (activeTab === 'prices') loadPrices()
  }, [activeTab, loadPrices])

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return orders.filter((o) => {
      if (filterStatus && o.status !== filterStatus) return false
      if (filterChannel && o.channel !== filterChannel) return false
      if (kw) {
        const hay = `${o.out_trade_no || ''} ${o.resource_key || ''} ${o.user_id || ''} ${
          o.transaction_id || ''
        } ${o.contact_email || ''}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [orders, filterStatus, filterChannel, keyword])

  async function postAction(body) {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/pay/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
      }
      return data
    } finally {
      setBusy(false)
    }
  }

  async function handleGrant(order) {
    const no = order.out_trade_no
    if (!window.confirm(`确认给订单 ${no} 手动补单？仅在确认已收款但回调丢失时执行。`)) return
    try {
      const data = await postAction({ action: 'grant', outTradeNo: no })
      setMessage(`补单成功：${data.resourceKey || no}`)
      setDetailOrder(null)
      await refresh()
    } catch (error) {
      setMessage(`补单失败：${String(error?.message || error)}`)
    }
  }

  async function savePrice(resourceKey, priceFenValue, isNew = false) {
    const key = String(resourceKey || '').trim()
    const fen = Math.max(0, Math.trunc(Number(priceFenValue || 0)))
    if (!key) {
      setMessage('请填写资源 key')
      return
    }
    setPriceBusyKey(key)
    setMessage('')
    try {
      const data = await postAction({ action: 'price', resourceKey: key, priceFen: fen })
      setMessage(`已保存 ${key} 的现金价为 ${fenToYuan(data.priceFen)}`)
      if (isNew) {
        setPriceDraftKey('')
        setPriceDraftFen('')
      }
      await loadPrices()
    } catch (error) {
      setMessage(`改价失败：${String(error?.message || error)}`)
    } finally {
      setPriceBusyKey('')
    }
  }

  const columns = [
    {
      key: 'order',
      header: '订单号 / 用户',
      width: '28%',
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-mono text-[12px] text-[#33352c] dark:text-gray-200">
            {row.out_trade_no}
          </div>
          <div className="mt-0.5 text-[12px] text-[#82847a] dark:text-gray-500">
            <UserCell userId={row.user_id} />
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: '联系邮箱',
      width: '18%',
      render: (row) => (
        <span className="break-all text-[12px] text-[#33352c] dark:text-gray-200">
          {row.contact_email || '—'}
        </span>
      ),
    },
    {
      key: 'resource',
      header: '内容',
      width: '20%',
      render: (row) => (
        <div className="min-w-0 break-all font-mono text-[12px]" title={row.resource_key}>
          {row.resource_key}
        </div>
      ),
    },
    {
      key: 'amount',
      header: '金额',
      align: 'right',
      render: (row) => <span className="whitespace-nowrap">{fenToYuan(row.amount_fen)}</span>,
    },
    { key: 'status', header: '状态', render: (row) => <StatusCell status={row.status} /> },
    {
      key: 'notify',
      header: '回调',
      render: (row) => (
        <span className="text-[12px] text-[#82847a] dark:text-gray-500">
          {Number(row.notify_count || 0)} 次
        </span>
      ),
    },
    {
      key: 'time',
      header: '支付时间',
      render: (row) => (
        <span className="text-[12px] text-[#82847a] dark:text-gray-500">
          {formatTime(row.paid_at || row.created_at)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '操作',
      render: (row) => (
        <div className="flex gap-2 whitespace-nowrap">
          <button
            type="button"
            className="text-[12px] text-blue-700 hover:underline dark:text-blue-400"
            onClick={() => setDetailOrder(row)}
          >
            详情
          </button>
          <button
            type="button"
            disabled={busy || row.status === 'paid'}
            title={row.status === 'paid' ? '已支付订单无需补单' : '回调丢失时手动发放权益'}
            className="text-[12px] text-[#7a7c70] hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400"
            onClick={() => handleGrant(row)}
          >
            补单
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminPage
      title="支付订单"
      description="微信收款的订单记录、联系邮箱、补单与内容现金定价。仅站长本人可见。"
      actions={
        <AdminButton onClick={refresh} disabled={status === 'loading'}>
          <IconRefresh size={15} aria-hidden="true" />
          刷新
        </AdminButton>
      }
    >
      <div className="mb-5 flex flex-wrap gap-1 border-b border-[#eceee6] dark:border-[#1b2430]">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition ${
                active
                  ? 'border-[#15140f] font-medium text-[#15140f] dark:border-gray-200 dark:text-gray-100'
                  : 'border-transparent text-[#7a7c70] hover:text-[#15140f] dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {message ? (
        <p className="mb-4 rounded-lg border border-[#e2d9c4] bg-[#fbf7ee] px-3 py-2 text-[12.5px] leading-6 text-[#7a5b1e] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {message}
        </p>
      ) : null}

      {activeTab === 'orders' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="累计订单" value={summary?.total ?? '—'} tone="neutral" />
            <StatCard label="已支付" value={summary?.paid ?? '—'} tone="success" />
            <StatCard
              label="累计营收"
              value={summary ? fenToYuan(summary.revenueFen) : '—'}
              tone="success"
            />
            <StatCard
              label="待支付 / 异常"
              value={summary ? `${summary.pending} / ${summary.abnormal}` : '—'}
              tone={summary?.abnormal ? 'warning' : 'neutral'}
            />
          </div>

          <Section title="订单列表" description="数据来自 D1 paid_orders，按时间倒序。">
            <Toolbar
              left={
                <>
                  <select
                    className={inputCls}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    aria-label="按状态筛选"
                  >
                    <option value="">全部状态</option>
                    <option value="paid">已支付</option>
                    <option value="pending">待支付</option>
                    <option value="closed">已关闭</option>
                    <option value="failed">失败</option>
                  </select>
                  <select
                    className={inputCls}
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    aria-label="按渠道筛选"
                  >
                    <option value="">全部渠道</option>
                    <option value="xunhupay">虎皮椒</option>
                  </select>
                  <input
                    className={`${inputCls} w-52`}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="订单号 / 资源 key / 用户 / 邮箱"
                    aria-label="搜索订单"
                  />
                </>
              }
              right={<span className="text-[12px] text-[#82847a]">共 {filteredOrders.length} 条</span>}
            />

            <div className="mt-3">
              {status === 'loading' ? (
                <p className="py-8 text-center text-[13px] text-[#82847a]">加载中…</p>
              ) : (
                <DataTable
                  columns={columns}
                  rows={filteredOrders}
                  rowKey={(row) => row.out_trade_no}
                  tableClassName="min-w-[1020px]"
                  empty={
                    <EmptyState
                      title={orders.length ? '没有匹配的订单' : '还没有支付订单'}
                      description={
                        orders.length
                          ? '换个筛选条件试试。'
                          : '给内容配现金价后，用户付款的订单会显示在这里。'
                      }
                    />
                  }
                />
              )}
            </div>
          </Section>

          {detailOrder ? (
            <Section
              title="订单详情"
              description={`订单号 ${detailOrder.out_trade_no}`}
              actions={
                <AdminButton size="sm" onClick={() => setDetailOrder(null)}>
                  关闭
                </AdminButton>
              }
            >
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-[13px] md:grid-cols-2">
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">用户</dt>
                  <dd className="mt-0.5 break-all">
                    <UserCell userId={detailOrder.user_id} />
                    <span className="ml-1.5 font-mono text-[11px] text-[#9a9c8f]">
                      {detailOrder.user_id}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">联系邮箱</dt>
                  <dd className="mt-0.5 break-all text-[12px]">{detailOrder.contact_email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">资源 key</dt>
                  <dd className="mt-0.5 break-all font-mono text-[12px]">{detailOrder.resource_key}</dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">金额 / 渠道</dt>
                  <dd className="mt-0.5">
                    {fenToYuan(detailOrder.amount_fen)} · {detailOrder.channel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">状态</dt>
                  <dd className="mt-0.5"><StatusCell status={detailOrder.status} /></dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">微信交易号</dt>
                  <dd className="mt-0.5 break-all font-mono text-[12px]">
                    {detailOrder.transaction_id || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">网关订单号</dt>
                  <dd className="mt-0.5 break-all font-mono text-[12px]">
                    {detailOrder.gateway_order_id || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">下单 / 支付时间</dt>
                  <dd className="mt-0.5">
                    {formatTime(detailOrder.created_at)} → {formatTime(detailOrder.paid_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#82847a] dark:text-gray-500">回调次数</dt>
                  <dd className="mt-0.5">{Number(detailOrder.notify_count || 0)} 次</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-[#82847a] dark:text-gray-500">原始回调报文</dt>
                  <dd className="mt-0.5">
                    <pre className="max-h-56 overflow-auto rounded-lg bg-[#f6f7f2] p-3 text-[11px] leading-5 dark:bg-[#10161f]">
                      {detailOrder.raw_notify
                        ? (() => {
                            try {
                              return JSON.stringify(JSON.parse(detailOrder.raw_notify), null, 2)
                            } catch {
                              return String(detailOrder.raw_notify)
                            }
                          })()
                        : '—'}
                    </pre>
                  </dd>
                </div>
              </dl>
            </Section>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'prices' ? (
        <div className="space-y-5">
          <Section
            title="内容现金定价"
            description="现金与燃币互斥：price_fen > 0 只显示现金购买并自动挂「付费解锁」角标；为 0 时只走燃币。改价走 upsertResource，立即生效。"
          >
            {prices.length ? (
              <DataTable
                columns={[
                  {
                    key: 'resourceKey',
                    header: '资源 key',
                    render: (row) => (
                      <span className="break-all font-mono text-[12px]">{row.resourceKey}</span>
                    ),
                  },
                  {
                    key: 'accessMode',
                    header: '状态',
                    render: (row) => {
                      const label = row.priceFen > 0 ? '现金解锁' : row.costPoints > 0 ? '燃币解锁' : '免费'
                      const tone = row.priceFen > 0
                        ? 'border-[#d8bd86] bg-[#fbf3de] text-[#7a5b1e] dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200'
                        : row.costPoints > 0
                          ? 'border-[#d8d5ce] bg-transparent text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]'
                          : 'border-[var(--site-line)] bg-transparent text-[var(--site-faint)]'
                      return (
                        <span className={`inline-flex rounded-full border px-2 py-[2px] text-[11px] whitespace-nowrap ${tone}`}>
                          {label}
                        </span>
                      )
                    },
                  },
                  {
                    key: 'costPoints',
                    header: '燃币价',
                    align: 'right',
                    render: (row) => `${row.costPoints} 枚`,
                  },
                  {
                    key: 'priceFen',
                    header: '现金价',
                    align: 'right',
                    render: (row) => fenToYuan(row.priceFen),
                  },
                  {
                    key: 'edit',
                    header: '修改',
                    render: (row) => (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className={`${inputCls} w-24`}
                          value={priceEdits[row.resourceKey] ?? row.priceFen}
                          aria-label={`${row.resourceKey} 的现金价（分）`}
                          onChange={(e) =>
                            setPriceEdits((prev) => ({
                              ...prev,
                              [row.resourceKey]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              savePrice(row.resourceKey, e.currentTarget.value)
                            }
                          }}
                        />
                        <AdminButton
                          size="sm"
                          disabled={busy || priceBusyKey === row.resourceKey}
                          onClick={() =>
                            savePrice(row.resourceKey, priceEdits[row.resourceKey] ?? row.priceFen)
                          }
                        >
                          保存
                        </AdminButton>
                      </div>
                    ),
                  },
                ]}
                rows={prices}
                rowKey={(row) => row.resourceKey}
                tableClassName="min-w-[700px]"
              />
            ) : (
              <p className="py-6 text-center text-[13px] text-[#82847a]">加载中或暂无资源配置。</p>
            )}
          </Section>

          <Section
            title="新增现金价"
            description="只有写入 gated_resources 的 key 才有现金价。调研文章 key 形如 research:people:slug。"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1 basis-64">
                <span className="mb-1 block text-[12px] text-[#82847a]">资源 key</span>
                <input
                  className={`${inputCls} w-full`}
                  value={priceDraftKey}
                  onChange={(e) => setPriceDraftKey(e.target.value)}
                  placeholder="research:people:elon-musk"
                />
              </label>
              <label>
                <span className="mb-1 block text-[12px] text-[#82847a]">现金价（元）</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputCls} w-28`}
                  value={priceDraftFen}
                  onChange={(e) => setPriceDraftFen(e.target.value)}
                  placeholder="10.00"
                />
              </label>
              <AdminButton
                variant="primary"
                disabled={busy || !priceDraftKey.trim()}
                onClick={() => {
                  const yuan = Number(priceDraftFen || 0)
                  if (!Number.isFinite(yuan) || yuan < 0) {
                    setMessage('请输入有效的金额')
                    return
                  }
                  savePrice(priceDraftKey, Math.round(yuan * 100), true)
                }}
              >
                添加 / 更新
              </AdminButton>
            </div>
          </Section>
        </div>
      ) : null}

      {activeTab === 'guide' ? (
        <Section title="虎皮椒接入要点" description="本次真实收款验证过的配置，排查问题时按此顺序核对。">
          <ol className="list-decimal space-y-2.5 pl-5 text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">
            <li>
              应用需在虎皮椒后台完成微信签约，状态为「签约成功」；域名与站点一致（2aran.com）。
            </li>
            <li>
              生产环境配置 <code className="font-mono text-[12px]">XUNHUPAY_APPID</code> 与{' '}
              <code className="font-mono text-[12px]">XUNHUPAY_SECRET</code>；secret 是运行时绑定，无需重部署。
            </li>
            <li>
              签名用官方算法：参数按 key 字典序拼 <code className="font-mono text-[12px]">k=v&amp;...</code> 后直接加 AppSecret（空值参数也参与），form 表单 POST；用 JSON 或 <code className="font-mono text-[12px]">&amp;key=secret</code> 会报 40029。
            </li>
            <li>
              现金价必须写进 D1 <code className="font-mono text-[12px]">gated_resources.price_fen</code>。
              research/resource 系列是代码按前缀合成的默认价，不在表里，需要先插入一行才会显示购买按钮。
            </li>
            <li>
              现金与燃币互斥：配了现金价的内容只显示现金购买，不给燃币旁路（否则注册送的燃币会绕过定价）；
              文章列表与详情页会自动挂「付费解锁」角标，无需改文章标签。
            </li>
            <li>
              改价走本页「内容定价」，它调用 upsertResource 让 60 秒资源缓存立即失效；直接改数据库要等缓存过期。
            </li>
            <li>
              回调丢失时可在「订单记录」里补单。已支付订单会校验幂等，重复付款不会重复解锁或扣款。
            </li>
          </ol>
          <p className="mt-4 rounded-lg border border-[#e2d9c4] bg-[#fbf7ee] px-3 py-2 text-[12px] leading-6 text-[#7a5b1e] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            虎皮椒可能限制服务器 IP 白名单，Cloudflare Workers 出口为轮换海外 IP。出现 403 时先在后台核对白名单设置。
          </p>
        </Section>
      ) : null}
    </AdminPage>
  )
}

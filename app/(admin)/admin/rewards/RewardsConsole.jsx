'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconGift, IconRefresh } from '@tabler/icons-react'

import { AdminButton, AdminPage, DataTable, EmptyState, Section, StatCard } from '../../components/ui'

const STATUS_LABELS = { pending: '待确认', confirmed: '待发货', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const EMPTY_DRAFT = { title: '', description: '', emoji: '🎁', costPoints: 100, itemType: 'physical', stock: 0, perUserLimit: 1, active: false, sortOrder: 0 }
const inputCls = 'h-9 rounded-lg border border-[#caccc0] bg-white px-2.5 text-sm text-[#15140f] outline-none dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

export default function RewardsConsole() {
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rewards', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setItems(data.items || [])
      setOrders(data.orders || [])
    } catch (error) { setMessage(String(error?.message || error)) }
  }, [])

  useEffect(() => { load() }, [load])

  async function post(payload, success) {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setMessage(success)
      await load()
      return true
    } catch (error) { setMessage(String(error?.message || error)); return false }
    finally { setBusy(false) }
  }

  async function saveItem(event) {
    event.preventDefault()
    if (await post({ action: 'upsertReward', ...draft }, '礼物已保存')) setDraft(EMPTY_DRAFT)
  }

  async function saveOrder(order, changes) {
    await post({ action: 'updateRedemption', id: order.id, status: order.status, trackingNo: order.trackingNo, adminNote: order.adminNote, ...changes }, '兑换进度已更新')
  }

  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const activeCount = items.filter((item) => item.active).length

  return (
    <AdminPage
      title="签到礼物"
      description="上架燃币礼物，维护库存，并处理用户兑换。实物收货信息只用于履约。"
      actions={<AdminButton onClick={load} disabled={busy}><IconRefresh size={16} /> 刷新</AdminButton>}
    >
      {message ? <p className="mb-4 rounded-lg border border-[#e3dfd0] bg-[#fffaf0] px-3 py-2 text-sm text-[#765b25] dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{message}</p> : null}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="已上架礼物" value={activeCount} />
        <StatCard label="待确认兑换" value={pendingCount} tone={pendingCount ? 'warning' : 'default'} />
        <StatCard label="累计兑换" value={orders.length} />
      </div>

      <Section title={draft.id ? '编辑礼物' : '新增礼物'} description="库存填 -1 表示不限量；未勾选上架时只有后台可见。" className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={saveItem}>
          <label className="text-xs text-[#67695d]">名称<input className={`${inputCls} mt-1 w-full`} required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label className="text-xs text-[#67695d]">图标<input className={`${inputCls} mt-1 w-full`} value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} /></label>
          <label className="text-xs text-[#67695d]">所需燃币<input className={`${inputCls} mt-1 w-full`} type="number" min="1" required value={draft.costPoints} onChange={(e) => setDraft({ ...draft, costPoints: e.target.value })} /></label>
          <label className="text-xs text-[#67695d]">类型<select className={`${inputCls} mt-1 w-full`} value={draft.itemType} onChange={(e) => setDraft({ ...draft, itemType: e.target.value })}><option value="physical">实物</option><option value="digital">数字权益</option></select></label>
          <label className="text-xs text-[#67695d]">库存<input className={`${inputCls} mt-1 w-full`} type="number" min="-1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></label>
          <label className="text-xs text-[#67695d]">每人上限<input className={`${inputCls} mt-1 w-full`} type="number" min="0" value={draft.perUserLimit} onChange={(e) => setDraft({ ...draft, perUserLimit: e.target.value })} /></label>
          <label className="text-xs text-[#67695d]">排序<input className={`${inputCls} mt-1 w-full`} type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> 立即上架</label>
          <label className="text-xs text-[#67695d] md:col-span-4">说明<textarea className="mt-1 min-h-20 w-full rounded-lg border border-[#caccc0] bg-white p-2.5 text-sm dark:border-[#2d3744] dark:bg-[#10161f]" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
          <div className="flex gap-2 md:col-span-4"><AdminButton type="submit" disabled={busy}>{draft.id ? '保存修改' : '创建礼物'}</AdminButton>{draft.id ? <AdminButton type="button" variant="default" onClick={() => setDraft(EMPTY_DRAFT)}>取消编辑</AdminButton> : null}</div>
        </form>
      </Section>

      <Section title="礼物库存" className="mb-5">
        {items.length ? <DataTable columns={[
          { key: 'gift', header: '礼物', render: (row) => <span>{row.emoji} <strong>{row.title}</strong></span> },
          { key: 'costPoints', header: '燃币', align: 'right' },
          { key: 'stock', header: '库存', align: 'right', render: (row) => row.stock < 0 ? '不限' : row.stock },
          { key: 'active', header: '状态', render: (row) => row.active ? '已上架' : '未上架' },
          { key: 'action', header: '', align: 'right', render: (row) => <AdminButton variant="default" size="sm" onClick={() => setDraft(row)}>编辑</AdminButton> },
        ]} rows={items} rowKey={(row) => row.id} /> : <EmptyState icon={IconGift} title="还没有礼物" description="先创建一件礼物，确认库存后再上架。" />}
      </Section>

      <Section title="兑换履约" description="更新状态、快递单号和内部备注。取消订单不会自动退回燃币；如需退款，请到燃币后台手动调整并写明原因。">
        {orders.length ? <div className="space-y-3">{orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-[#e2e3da] p-3 dark:border-[#243041]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><strong className="text-sm">{order.rewardTitle}</strong><p className="mt-1 font-mono text-[10px] text-[#82847a]">{order.userId} · {order.costPoints} 燃币 · {new Date(order.createdAt).toLocaleString('zh-CN')}</p></div>
              <select className={inputCls} value={order.status} onChange={(e) => setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: e.target.value } : item))}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
            {order.itemType === 'physical' ? <div className="mt-3 rounded-lg bg-[#f7f8f3] p-3 text-xs leading-6 dark:bg-[#10161f]"><strong>{order.recipientName}</strong> · {order.contact}<br />{order.shippingAddress}</div> : null}
            {order.userNote ? <p className="mt-2 text-xs text-[#67695d]">用户留言：{order.userNote}</p> : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input className={inputCls} placeholder="快递单号" value={order.trackingNo} onChange={(e) => setOrders((current) => current.map((item) => item.id === order.id ? { ...item, trackingNo: e.target.value } : item))} />
              <input className={inputCls} placeholder="内部备注" value={order.adminNote} onChange={(e) => setOrders((current) => current.map((item) => item.id === order.id ? { ...item, adminNote: e.target.value } : item))} />
              <AdminButton onClick={() => saveOrder(order, {})} disabled={busy}>保存进度</AdminButton>
            </div>
          </div>
        ))}</div> : <EmptyState icon={IconGift} title="暂无兑换记录" />}
      </Section>
    </AdminPage>
  )
}

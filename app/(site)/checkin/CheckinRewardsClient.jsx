'use client'

import Link from 'next/link'
import {
  IconArrowRight,
  IconCheck,
  IconFlame,
  IconGift,
  IconMapPin,
  IconPackage,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionAccount } from '../components/SessionProvider'

const STATUS_LABELS = {
  pending: '待确认',
  confirmed: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

const ERROR_LABELS = {
  UNAUTHORIZED: '请先登录后再兑换',
  SHIPPING_INFO_REQUIRED: '请填写完整的收货信息',
  OUT_OF_STOCK: '这件礼物刚刚兑完了',
  USER_LIMIT_REACHED: '你已经达到这件礼物的兑换上限',
  INSUFFICIENT_BALANCE: '燃币余额不足',
  EMAIL_ACTIVATION_REQUIRED: '请先激活邮箱，再继续签到',
}

function dayLabel(day) {
  const date = new Date(`${day}T00:00:00+08:00`)
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)
}

export default function CheckinRewardsClient() {
  const account = useSessionAccount()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ recipientName: '', contact: '', shippingAddress: '', userNote: '' })

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/rewards', { cache: 'no-store', credentials: 'same-origin' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
      setData(payload)
    } catch (error) {
      setMessage(String(error?.message || error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function checkin() {
    if (!account.user) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/points/checkin', { method: 'POST', credentials: 'same-origin' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(ERROR_LABELS[payload?.error] || payload?.error || '签到失败')
      setMessage(payload.awarded
        ? `签到成功，获得 ${payload.gained} 燃币${payload.bonus ? `（含连续签到奖励 ${payload.bonus}）` : ''}`
        : '今天已经签到啦')
      await Promise.all([load(), account.refreshPoints()])
    } catch (error) {
      setMessage(String(error?.message || error))
    } finally {
      setBusy(false)
    }
  }

  async function redeem(event) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ rewardId: selected.id, ...form }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(ERROR_LABELS[payload?.error] || payload?.error || '兑换失败')
      setMessage(`已兑换「${selected.title}」，站长确认后会更新进度`)
      setSelected(null)
      setForm({ recipientName: '', contact: '', shippingAddress: '', userNote: '' })
      await Promise.all([load(), account.refreshPoints()])
    } catch (error) {
      setMessage(String(error?.message || error))
    } finally {
      setBusy(false)
    }
  }

  const status = data?.checkinStatus
  const authed = Boolean(account.user)
  const sessionLoading = account.loading || loading
  const balance = data?.balance ?? account.points?.balance ?? 0
  const week = status?.week || []
  const rewards = data?.rewards || []
  const orders = data?.redemptions || []
  const nextText = useMemo(() => {
    const next = status?.nextMilestone
    if (!next) return '连续签到还有额外燃币'
    return `再签到 ${next.remaining} 天，额外获得 ${next.bonus} 燃币`
  }, [status])

  return (
    <main className="checkin-page">
      <header className="checkin-hero">
        <div className="checkin-hero-glow" aria-hidden="true" />
        <div className="checkin-hero-copy">
          <p className="checkin-eyebrow"><IconSparkles size={14} /> DAILY REWARDS</p>
          <h1>签到有礼</h1>
          <p>每天来看看，领取燃币，兑换站长准备的礼物。</p>
          <div className="checkin-balance">
            <span><IconFlame size={18} fill="currentColor" /> 我的燃币</span>
            <strong>{sessionLoading ? '…' : authed ? balance : '—'}</strong>
          </div>
        </div>

        <section className="checkin-action-card" aria-label="今日签到">
          {!authed && !sessionLoading ? (
            <>
              <IconGift className="checkin-action-icon" size={36} />
              <strong>登录后开始每日签到</strong>
              <p>注册或绑定账号可获得燃币，签到记录也会长期保留。</p>
              <Link href="/login" className="checkin-main-button">登录 / 注册 <IconArrowRight size={17} /></Link>
            </>
          ) : (
            <>
              <span className="checkin-streak-number">{status?.streak || 0}</span>
              <span className="checkin-streak-label">连续签到天数</span>
              <button
                type="button"
                className={`checkin-main-button ${data?.checkedInToday ? 'is-done' : ''}`}
                disabled={busy || sessionLoading || data?.checkedInToday}
                onClick={checkin}
              >
                {data?.checkedInToday ? <><IconCheck size={18} /> 今日已签到</> : <>今日签到 · +{data?.checkinReward || 5} <IconFlame size={17} /></>}
              </button>
              <small>{nextText}</small>
            </>
          )}
        </section>
      </header>

      {message ? <div className="checkin-message" role="status">{message}</div> : null}

      <section className="checkin-week-panel" aria-labelledby="week-title">
        <div className="checkin-section-heading">
          <div><p className="checkin-eyebrow">THIS WEEK</p><h2 id="week-title">近七日签到</h2></div>
          <p>第 3 天额外 +5，第 7 天额外 +15；每七天开启新一轮。</p>
        </div>
        <div className="checkin-week-grid">
          {(week.length ? week : Array.from({ length: 7 }, (_, index) => ({ day: `day-${index}`, checked: false, today: index === 6 }))).map((item, index) => (
            <div key={item.day} className={`checkin-day ${item.checked ? 'is-checked' : ''} ${item.today ? 'is-today' : ''}`}>
              <span>{item.day.startsWith('day-') ? ['一', '二', '三', '四', '五', '六', '日'][index] : dayLabel(item.day)}</span>
              <strong>{item.checked ? <IconCheck size={18} /> : index + 1}</strong>
              <small>{index === 2 ? '+5' : index === 6 ? '+15' : '+5'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="checkin-shop" aria-labelledby="shop-title">
        <div className="checkin-section-heading">
          <div><p className="checkin-eyebrow">RANBI GIFT SHOP</p><h2 id="shop-title">燃币礼物铺</h2></div>
          <p>礼物由站长维护，数量有限；兑换后可在下方查看处理进度。</p>
        </div>

        {rewards.length ? (
          <div className="checkin-reward-grid">
            {rewards.map((reward) => {
              const soldOut = reward.stock === 0
              const limited = reward.perUserLimit > 0 && reward.redeemedCount >= reward.perUserLimit
              const insufficient = Boolean(authed && balance < reward.costPoints)
              return (
                <article key={reward.id} className="checkin-reward-card">
                  <div className="checkin-reward-art" aria-hidden="true"><span>{reward.emoji}</span></div>
                  <div className="checkin-reward-body">
                    <div className="checkin-reward-meta">
                      <span>{reward.itemType === 'physical' ? '实物礼物' : '数字权益'}</span>
                      <span>{reward.stock < 0 ? '不限量' : `剩余 ${reward.stock}`}</span>
                    </div>
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                    <div className="checkin-reward-footer">
                      <strong><IconFlame size={16} fill="currentColor" /> {reward.costPoints}</strong>
                      {!authed ? (
                        <Link href="/login" className="checkin-redeem-button">登录兑换</Link>
                      ) : (
                        <button type="button" className="checkin-redeem-button" disabled={soldOut || limited || insufficient} onClick={() => setSelected(reward)}>
                          {soldOut ? '已兑完' : limited ? '已达上限' : insufficient ? '燃币不足' : '立即兑换'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="checkin-empty-shop"><IconGift size={30} /><strong>礼物正在准备中</strong><p>站长上架礼物后会显示在这里，可以先签到攒燃币。</p></div>
        )}
      </section>

      {orders.length ? (
        <section className="checkin-orders" aria-labelledby="orders-title">
          <div className="checkin-section-heading"><div><p className="checkin-eyebrow">MY REDEMPTIONS</p><h2 id="orders-title">我的兑换</h2></div></div>
          <div className="checkin-order-list">
            {orders.map((order) => (
              <div key={order.id} className="checkin-order-row">
                <IconPackage size={20} />
                <div><strong>{order.rewardTitle}</strong><span>{new Date(order.createdAt).toLocaleDateString('zh-CN')} · {order.costPoints} 燃币</span></div>
                <span className={`checkin-order-status is-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                {order.trackingNo ? <small>单号：{order.trackingNo}</small> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="checkin-rules">
        <div><IconFlame size={20} /><strong>获得燃币</strong><p>每日签到、有效评论以及站内活动都可以获得燃币。</p></div>
        <div><IconGift size={20} /><strong>兑换礼物</strong><p>燃币用于站内权益和礼物兑换，不支持提现或兑换现金。</p></div>
        <div><IconMapPin size={20} /><strong>实物寄送</strong><p>收货信息只用于本次寄送，处理进度会在兑换记录中更新。</p></div>
      </section>

      {selected ? (
        <div className="checkin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <form className="checkin-dialog" onSubmit={redeem}>
            <button type="button" className="checkin-dialog-close" onClick={() => setSelected(null)} aria-label="关闭"><IconX size={19} /></button>
            <span className="checkin-dialog-emoji" aria-hidden="true">{selected.emoji}</span>
            <p className="checkin-eyebrow">CONFIRM REDEMPTION</p>
            <h2>兑换「{selected.title}」</h2>
            <p className="checkin-dialog-cost">将使用 <strong>{selected.costPoints} 燃币</strong>，当前余额 {balance}。</p>
            {selected.itemType === 'physical' ? (
              <div className="checkin-form-grid">
                <label>收件人<input required value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} maxLength={80} /></label>
                <label>手机号 / 联系方式<input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={120} /></label>
                <label className="is-wide">收货地址<textarea required value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} maxLength={500} rows={3} /></label>
              </div>
            ) : null}
            <label className="checkin-note-label">留言（选填）<textarea value={form.userNote} onChange={(e) => setForm({ ...form, userNote: e.target.value })} maxLength={300} rows={2} /></label>
            <p className="checkin-privacy-note">提交后生成兑换记录；实物收货信息仅供站长完成本次寄送。</p>
            <button type="submit" className="checkin-main-button" disabled={busy}>{busy ? '处理中…' : `确认兑换 · ${selected.costPoints} 燃币`}</button>
          </form>
        </div>
      ) : null}
    </main>
  )
}
